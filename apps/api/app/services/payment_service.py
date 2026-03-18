"""
Virens Payment Service
Primary: Paystack (Naira NGN)
Secondary: Stripe (International)

Supports:
- Subscriptions
- Direct asset purchases
- Ad campaign payments
- Creator payouts (min ₦10,000)
"""
import httpx
import stripe
from typing import Optional, Literal
import structlog

from app.core.config import settings

logger = structlog.get_logger()

stripe.api_key = settings.STRIPE_SECRET_KEY

PAYSTACK_BASE = "https://api.paystack.co"
PAYSTACK_HEADERS = {
    "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
    "Content-Type": "application/json",
}

# Subscription plan codes (create these in Paystack dashboard)
PAYSTACK_PLAN_CODES = {
    "basic": "PLN_subscription_700",
    "pro": "PLN_pro_4500",
    "creator_support": "PLN_creator_9000",
}

STRIPE_PRICE_IDS = {
    "basic": "price_subscription_700",
    "pro": "price_pro",
    "creator_support": "price_creator",
}


# ── Paystack ─────────────────────────────────────────────────

async def paystack_initialize_transaction(
    email: str,
    amount_ngn: float,
    reference: str,
    metadata: Optional[dict] = None,
    callback_url: str = "https://virens.app/payments/callback",
) -> dict:
    """Initialize a Paystack transaction. Returns authorization_url."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYSTACK_BASE}/transaction/initialize",
            headers=PAYSTACK_HEADERS,
            json={
                "email": email,
                "amount": int(amount_ngn * 100),  # kobo
                "reference": reference,
                "metadata": metadata or {},
                "callback_url": callback_url,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["data"]


async def paystack_verify_transaction(reference: str) -> dict:
    """Verify a Paystack transaction by reference."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PAYSTACK_BASE}/transaction/verify/{reference}",
            headers=PAYSTACK_HEADERS,
        )
        resp.raise_for_status()
        return resp.json()["data"]


async def paystack_create_subscription(
    email: str,
    plan_code: str,
    authorization_code: str,
) -> dict:
    """Create a Paystack subscription after initial authorization."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYSTACK_BASE}/subscription",
            headers=PAYSTACK_HEADERS,
            json={
                "customer": email,
                "plan": plan_code,
                "authorization": authorization_code,
            },
        )
        resp.raise_for_status()
        return resp.json()["data"]


async def paystack_create_transfer_recipient(
    bank_code: str,
    account_number: str,
    account_name: str,
) -> str:
    """Create a transfer recipient for creator payouts."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYSTACK_BASE}/transferrecipient",
            headers=PAYSTACK_HEADERS,
            json={
                "type": "nuban",
                "name": account_name,
                "account_number": account_number,
                "bank_code": bank_code,
                "currency": "NGN",
            },
        )
        resp.raise_for_status()
        return resp.json()["data"]["recipient_code"]


async def paystack_initiate_payout(
    recipient_code: str,
    amount_ngn: float,
    reference: str,
    reason: str = "Creator payout from Virens",
) -> dict:
    """Initiate a creator payout via Paystack Transfer."""
    if amount_ngn < settings.MINIMUM_PAYOUT_NGN:
        raise ValueError(f"Minimum payout is ₦{settings.MINIMUM_PAYOUT_NGN:,}")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYSTACK_BASE}/transfer",
            headers=PAYSTACK_HEADERS,
            json={
                "source": "balance",
                "amount": int(amount_ngn * 100),
                "recipient": recipient_code,
                "reference": reference,
                "reason": reason,
            },
        )
        resp.raise_for_status()
        return resp.json()["data"]


# ── Stripe ────────────────────────────────────────────────────

async def stripe_create_checkout_session(
    email: str,
    price_id: str,
    success_url: str,
    cancel_url: str,
    metadata: Optional[dict] = None,
) -> dict:
    """Create a Stripe Checkout session for subscription."""
    session = stripe.checkout.Session.create(
        customer_email=email,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata or {},
    )
    return {"session_id": session.id, "url": session.url}


async def stripe_create_payout(
    stripe_account_id: str,
    amount_usd_cents: int,
) -> dict:
    """Initiate Stripe Connect payout to international creator."""
    transfer = stripe.Transfer.create(
        amount=amount_usd_cents,
        currency="usd",
        destination=stripe_account_id,
    )
    return {"transfer_id": transfer.id, "status": transfer.object}


def stripe_verify_webhook(payload: bytes, sig_header: str) -> dict:
    """Verify and parse a Stripe webhook event."""
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
