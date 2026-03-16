"""
Virens Webhooks Router
Handles payment gateway callbacks for:
- Paystack: charge.success, subscription.create, transfer.success/failed
- Stripe: payment_intent.succeeded, customer.subscription.updated/deleted
"""
import hashlib
import hmac
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
import structlog

from app.core.config import settings
from app.models.user import User
from app.models.subscription import Subscription
from app.models.payout import Payout
from app.services.notification_service import notify_payout

router = APIRouter()
logger = structlog.get_logger()


# ── Paystack Webhook ──────────────────────────────────────────

def verify_paystack_signature(body: bytes, signature: str) -> bool:
    """Verify HMAC-SHA512 Paystack webhook signature."""
    computed = hmac.new(
        settings.PAYSTACK_WEBHOOK_SECRET.encode(),
        body,
        digestmod=hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(computed, signature)


@router.post("/paystack")
async def paystack_webhook(
    request: Request,
    x_paystack_signature: Optional[str] = Header(None),
):
    body = await request.body()

    if settings.PAYSTACK_WEBHOOK_SECRET and x_paystack_signature:
        if not verify_paystack_signature(body, x_paystack_signature):
            raise HTTPException(400, "Invalid Paystack signature")

    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON body")

    event_type = event.get("event", "")
    data = event.get("data", {})
    logger.info("Paystack webhook received", event=event_type)

    if event_type == "charge.success":
        await _handle_paystack_charge_success(data)

    elif event_type == "subscription.create":
        await _handle_paystack_subscription_create(data)

    elif event_type == "subscription.disable":
        await _handle_paystack_subscription_disable(data)

    elif event_type in ("transfer.success", "transfer.failed"):
        await _handle_paystack_transfer(data, event_type)

    return {"status": "ok"}


async def _handle_paystack_charge_success(data: dict):
    """Activate subscription after successful Paystack charge."""
    meta = data.get("metadata", {})
    user_id = meta.get("user_id")
    tier = meta.get("tier")
    payment_type = meta.get("type")

    if not user_id or payment_type != "subscription" or not tier:
        return

    user = await User.get(user_id)
    if not user:
        logger.warning("Paystack charge: user not found", user_id=user_id)
        return

    await user.set({"subscription_tier": tier})

    # Upsert subscription record
    existing = await Subscription.find_one(Subscription.user_id == user_id)
    if existing:
        await existing.set({
            "tier": tier,
            "status": "active",
            "gateway_subscription_id": data.get("reference", ""),
        })
    else:
        sub = Subscription(
            user_id=user_id,
            tier=tier,
            status="active",
            payment_gateway="paystack",
            gateway_subscription_id=data.get("reference", ""),
        )
        await sub.insert()

    logger.info("Subscription activated via Paystack", user_id=user_id, tier=tier)


async def _handle_paystack_subscription_create(data: dict):
    """Log Paystack subscription creation."""
    logger.info("Paystack subscription created", data=data.get("subscription_code"))


async def _handle_paystack_subscription_disable(data: dict):
    """Deactivate subscription when Paystack disables it."""
    email = data.get("customer", {}).get("email")
    if not email:
        return
    user = await User.find_one(User.email == email)
    if not user:
        return
    sub = await Subscription.find_one(Subscription.user_id == str(user.id))
    if sub:
        await sub.set({"status": "cancelled"})
    await user.set({"subscription_tier": "none"})
    logger.info("Subscription cancelled via Paystack", user_id=str(user.id))


async def _handle_paystack_transfer(data: dict, event_type: str):
    """Update payout record status after Paystack Transfer result."""
    reference = data.get("reference", "")
    payout = await Payout.find_one(Payout.reference == reference)
    if not payout:
        return

    if event_type == "transfer.success":
        await payout.set({
            "status": "completed",
            "completed_at": datetime.now(timezone.utc),
            "gateway_response": data,
        })
        await notify_payout(payout.creator_id, payout.amount, "completed")
    else:
        await payout.set({"status": "failed", "gateway_response": data})
        await notify_payout(payout.creator_id, payout.amount, "failed")

    logger.info("Payout updated", reference=reference, event=event_type)


# ── Stripe Webhook ────────────────────────────────────────────

@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None),
):
    body = await request.body()

    try:
        from app.services.payment_service import stripe_verify_webhook
        event = stripe_verify_webhook(body, stripe_signature or "")
    except Exception as e:
        raise HTTPException(400, f"Invalid Stripe signature: {e}")

    event_type = event["type"]
    data = event["data"]["object"]
    logger.info("Stripe webhook received", event=event_type)

    if event_type == "payment_intent.succeeded":
        await _handle_stripe_payment_success(data)

    elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
        await _handle_stripe_subscription_update(data)

    elif event_type == "customer.subscription.deleted":
        await _handle_stripe_subscription_cancelled(data)

    return {"status": "ok"}


async def _handle_stripe_payment_success(data: dict):
    meta = data.get("metadata", {})
    user_id = meta.get("user_id")
    tier = meta.get("tier")
    if not user_id or not tier:
        return
    user = await User.get(user_id)
    if user:
        await user.set({"subscription_tier": tier})
    logger.info("Stripe subscription activated", user_id=user_id, tier=tier)


async def _handle_stripe_subscription_update(data: dict):
    stripe_sub_id = data.get("id", "")
    status = data.get("status", "")
    meta = data.get("metadata", {})
    user_id = meta.get("user_id")
    tier = meta.get("tier")

    if user_id and status == "active" and tier:
        user = await User.get(user_id)
        if user:
            await user.set({"subscription_tier": tier})

        sub = await Subscription.find_one(Subscription.user_id == user_id)
        if sub:
            await sub.set({"status": "active", "gateway_subscription_id": stripe_sub_id})


async def _handle_stripe_subscription_cancelled(data: dict):
    stripe_sub_id = data.get("id", "")
    sub = await Subscription.find_one(Subscription.gateway_subscription_id == stripe_sub_id)
    if sub:
        await sub.set({"status": "cancelled"})
        user = await User.get(sub.user_id)
        if user:
            await user.set({"subscription_tier": "none"})
