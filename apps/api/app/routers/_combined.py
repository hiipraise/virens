"""
Virens — combined stub routers for:
search, tags, ads, payments, admin, analytics
Each is a standalone FastAPI APIRouter.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.core.auth import get_current_user, get_optional_user, require_admin
from app.models.user import User
from app.models.pin import Pin
from app.models.ad import Ad
from app.models.subscription import Subscription
from app.models.payout import Payout
from app.services.payment_service import (
    paystack_initialize_transaction,
    paystack_verify_transaction,
    paystack_initiate_payout,
    stripe_create_checkout_session,
)
from app.core.config import settings


# ── Search ────────────────────────────────────────────────────
search_router = APIRouter()

@search_router.get("")
async def search(
    q: str = Query(..., min_length=1),
    type: str = Query("all", pattern="^(all|pin|tag|user)$"),
    page: int = 1,
    page_size: int = 24,
    current_user: Optional[User] = Depends(get_optional_user),
):
    skip = (page - 1) * page_size
    if type in ("all", "pin"):
        query = {
            "status": "published",
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"tags": {"$regex": q, "$options": "i"}},
                {"creator_username": {"$regex": q, "$options": "i"}},
            ],
        }
        pins = await Pin.find(query).sort([("likes_count", -1)]).skip(skip).limit(page_size).to_list()
        total = await Pin.find(query).count()
        return {"items": [p.to_dict() for p in pins], "total": total, "page": page, "pageSize": page_size, "hasNext": (skip + page_size) < total, "hasPrev": page > 1}
    return {"items": [], "total": 0, "page": 1, "pageSize": page_size, "hasNext": False, "hasPrev": False}


# ── Tags ──────────────────────────────────────────────────────
tags_router = APIRouter()

@tags_router.get("/trending")
async def trending_tags():
    """Return the top 30 trending tags by pin count."""
    pipeline = [
        {"$match": {"status": "published"}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 30},
    ]
    from app.core.database import get_db
    db = await get_db()
    cursor = db["pins"].aggregate(pipeline)
    results = await cursor.to_list(length=30)
    return [r["_id"] for r in results]


# ── Ads ───────────────────────────────────────────────────────
ads_router = APIRouter()

class CreateAdRequest(BaseModel):
    targetType: str
    targetId: str
    headline: str
    description: Optional[str] = None
    ctaText: str = "Learn More"
    ctaUrl: str
    budget: float
    startDate: Optional[str] = None
    endDate: Optional[str] = None

@ads_router.get("/my")
async def get_my_ads(user: User = Depends(get_current_user)):
    ads = await Ad.find(Ad.advertiser_id == str(user.id)).sort([("created_at", -1)]).to_list()
    return [a.to_dict() for a in ads]

@ads_router.post("", status_code=201)
async def create_ad(data: CreateAdRequest, user: User = Depends(get_current_user)):
    # Admins run ads for free
    requires_payment = user.role not in ("superadmin", "admin", "staff")
    if requires_payment and data.budget < settings.AD_MIN_BUDGET_NGN:
        raise HTTPException(400, f"Minimum ad budget is ₦{settings.AD_MIN_BUDGET_NGN:,}")
    ad = Ad(
        advertiser_id=str(user.id),
        advertiser_username=user.username,
        target_type=data.targetType,
        target_id=data.targetId,
        headline=data.headline,
        description=data.description,
        cta_text=data.ctaText,
        cta_url=data.ctaUrl,
        budget=data.budget if requires_payment else 0,
        status="active" if not requires_payment else "pending_review",
    )
    await ad.insert()
    return ad.to_dict()

@ads_router.get("/served")
async def get_served_ad(current_user: Optional[User] = Depends(get_optional_user)):
    """Return one active ad for feed injection."""
    ad = await Ad.find_one({"status": "active"})
    if not ad:
        return None
    await Ad.find_one(Ad.id == ad.id).update({"$inc": {"impressions": 1}})
    return ad.to_dict()


# ── Payments ──────────────────────────────────────────────────
payments_router = APIRouter()

class InitiatePaymentRequest(BaseModel):
    gateway: str  # "paystack" | "stripe"
    type: str  # "subscription" | "purchase" | "ad_payment"
    tier: Optional[str] = None
    amount: Optional[float] = None
    pin_id: Optional[str] = None

@payments_router.post("/initiate")
async def initiate_payment(data: InitiatePaymentRequest, user: User = Depends(get_current_user)):
    reference = f"VRN-{uuid.uuid4().hex[:12].upper()}"

    if data.gateway == "paystack":
        tier_prices = {
            "basic": settings.SUBSCRIPTION_BASIC_NGN,
            "pro": settings.SUBSCRIPTION_PRO_NGN,
            "creator_support": settings.SUBSCRIPTION_CREATOR_SUPPORT_NGN,
        }
        amount = data.amount or (tier_prices.get(data.tier or "", 0))
        result = await paystack_initialize_transaction(
            email=user.email,
            amount_ngn=amount,
            reference=reference,
            metadata={"user_id": str(user.id), "type": data.type, "tier": data.tier},
        )
        return {"authorization_url": result["authorization_url"], "reference": reference, "gateway": "paystack"}

    elif data.gateway == "stripe":
        price_ids = {
            "basic": settings.STRIPE_PRICE_IDS.get("basic", ""),
            "pro": settings.STRIPE_PRICE_IDS.get("pro", ""),
            "creator_support": settings.STRIPE_PRICE_IDS.get("creator_support", ""),
        }
        price_id = price_ids.get(data.tier or "", "")
        if not price_id:
            raise HTTPException(400, "Invalid tier for Stripe")
        result = await stripe_create_checkout_session(
            email=user.email,
            price_id=price_id,
            success_url="https://virens.app/subscribe?success=1",
            cancel_url="https://virens.app/subscribe?cancelled=1",
            metadata={"user_id": str(user.id), "tier": data.tier},
        )
        return result

    raise HTTPException(400, "Invalid gateway")


@payments_router.get("/verify/{reference}")
async def verify_payment(reference: str, user: User = Depends(get_current_user)):
    data = await paystack_verify_transaction(reference)
    if data.get("status") == "success":
        meta = data.get("metadata", {})
        tier = meta.get("tier")
        if tier:
            await user.set({"subscription_tier": tier})
            existing_sub = await Subscription.find_one(Subscription.user_id == str(user.id))
            if existing_sub:
                await existing_sub.set({
                    "tier": tier,
                    "status": "active",
                    "payment_gateway": "paystack",
                    "gateway_subscription_id": reference,
                })
            else:
                sub = Subscription(
                    user_id=str(user.id),
                    tier=tier,
                    payment_gateway="paystack",
                    gateway_subscription_id=reference,
                )
                await sub.insert()
    return {"status": data.get("status"), "amount": data.get("amount", 0) / 100}


class SaveBankDetailsRequest(BaseModel):
    bankCode: str = Field(min_length=3, max_length=10)
    accountNumber: str = Field(min_length=10, max_length=10)
    accountName: str = Field(min_length=2, max_length=120)


@payments_router.post("/bank-details")
async def save_bank_details(data: SaveBankDetailsRequest, user: User = Depends(get_current_user)):
    await user.set({
        "payout_bank_code": data.bankCode.strip(),
        "payout_account_number": data.accountNumber.strip(),
        "payout_account_name": data.accountName.strip(),
    })
    return {
        "bankCode": data.bankCode.strip(),
        "accountNumber": data.accountNumber.strip(),
        "accountName": data.accountName.strip(),
    }


class RequestPayoutRequest(BaseModel):
    amount: float
    method: str  # "bank_transfer" | "stripe"

@payments_router.post("/payout")
async def request_payout(data: RequestPayoutRequest, user: User = Depends(get_current_user)):
    if data.amount < settings.MINIMUM_PAYOUT_NGN:
        raise HTTPException(400, f"Minimum payout is ₦{settings.MINIMUM_PAYOUT_NGN:,}")
    reference = f"PAY-{uuid.uuid4().hex[:12].upper()}"
    payout = Payout(
        creator_id=str(user.id),
        amount=data.amount,
        currency="NGN",
        payment_method=data.method,
        reference=reference,
    )
    await payout.insert()
    return {"payout_id": str(payout.id), "reference": reference, "status": "pending"}


# ── Admin ─────────────────────────────────────────────────────
admin_router = APIRouter()

@admin_router.get("/stats")
async def admin_stats(admin: User = Depends(require_admin)):
    from app.models.report import Report
    total_users = await User.count()
    total_pins = await Pin.find({"status": "published"}).count()
    pending_reports = await Report.find({"status": "pending"}).count()
    removed_content = await Pin.find({"status": "removed"}).count()
    return {
        "totalUsers": total_users,
        "totalPins": total_pins,
        "pendingReports": pending_reports,
        "totalRevenue": float(sum(ad.spent for ad in await Ad.find({}).to_list())),
        "activeAds": await Ad.find({"status": "active"}).count(),
        "removedContent": removed_content,
        "appealSuccessRate": 34,
        "revenueChart": [],
    }

@admin_router.get("/users")
async def admin_list_users(
    search: str = "",
    role: str = "",
    page: int = 1,
    page_size: int = 30,
    admin: User = Depends(require_admin),
):
    query: dict = {}
    if search:
        query["$or"] = [
            {"username": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"display_name": {"$regex": search, "$options": "i"}},
        ]
    if role:
        query["role"] = role
    skip = (page - 1) * page_size
    users = await User.find(query).skip(skip).limit(page_size).to_list()
    total = await User.find(query).count()
    return {"items": [u.to_public_dict() for u in users], "total": total}

@admin_router.post("/users/{user_id}/ban")
async def ban_user(user_id: str, admin: User = Depends(require_admin)):
    target = await User.get(user_id)
    if not target:
        raise HTTPException(404, "User not found")
    await target.set({"is_banned": True})
    return {"detail": "Banned"}

@admin_router.post("/users/{user_id}/unban")
async def unban_user(user_id: str, admin: User = Depends(require_admin)):
    target = await User.get(user_id)
    if not target:
        raise HTTPException(404, "User not found")
    await target.set({"is_banned": False, "infringement_strikes": 0})
    return {"detail": "Unbanned"}

@admin_router.post("/users/{user_id}/verify")
async def verify_user(user_id: str, admin: User = Depends(require_admin)):
    target = await User.get(user_id)
    if not target:
        raise HTTPException(404, "User not found")
    await target.set({"is_verified": True})
    return {"detail": "Verified"}

@admin_router.get("/reports")
async def admin_reports_proxy(
    status: str = "pending",
    page: int = 1,
    admin: User = Depends(require_admin),
):
    from app.models.report import Report
    query = {"status": status}
    skip = (page - 1) * 30
    reports = await Report.find(query).sort([("priority", -1)]).skip(skip).limit(30).to_list()
    total = await Report.find(query).count()
    return {
        "items": [r.to_dict() for r in reports],
        "total": total,
        "page": page,
        "pageSize": 30,
        "hasNext": skip + 30 < total,
        "hasPrev": page > 1,
    }


# ── Analytics ─────────────────────────────────────────────────
analytics_router = APIRouter()

@analytics_router.get("/creator")
async def creator_analytics(user: User = Depends(get_current_user)):
    pins = await Pin.find({"creator_id": str(user.id), "status": "published"}).to_list()
    total_views = sum(p.views_count for p in pins)
    total_likes = sum(p.likes_count for p in pins)
    total_saves = sum(p.saves_count for p in pins)
    total_downloads = sum(p.downloads_count for p in pins)
    return {
        "totalPins": len(pins),
        "totalViews": total_views,
        "totalLikes": total_likes,
        "totalSaves": total_saves,
        "totalDownloads": total_downloads,
        "followers": user.followers_count,
    }
