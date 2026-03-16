"""
Virens Pydantic Schemas
Clean request/response models for API layer.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Literal
import re


# ── Auth ─────────────────────────────────────────────────────
class RegisterSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-z0-9_]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    displayName: str = Field(..., min_length=1, max_length=60)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must contain letters and numbers")
        return v


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


# ── User ─────────────────────────────────────────────────────
class UpdateProfileSchema(BaseModel):
    displayName: Optional[str] = Field(None, min_length=1, max_length=60)
    bio: Optional[str] = Field(None, max_length=500)
    websiteUrl: Optional[str] = Field(None, max_length=200)
    isPrivate: Optional[bool] = None


class UpdatePayoutSchema(BaseModel):
    bankCode: str = Field(..., min_length=3)
    accountNumber: str = Field(..., min_length=10, max_length=10)
    accountName: str = Field(..., min_length=2)


# ── Pin ──────────────────────────────────────────────────────
class PinUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=2000)
    tags: Optional[List[str]] = Field(None, max_length=20)
    downloadPermission: Optional[Literal["free", "subscribers_only", "paid", "none"]] = None
    isForSale: Optional[bool] = None
    originalPrice: Optional[float] = Field(None, ge=0)
    salePrice: Optional[float] = Field(None, ge=0)
    isProtected: Optional[bool] = None
    hasVisibleWatermark: Optional[bool] = None
    hasInvisibleWatermark: Optional[bool] = None
    screenshotProtection: Optional[bool] = None
    isSensitive: Optional[bool] = None
    collectionId: Optional[str] = None


# ── Collection ────────────────────────────────────────────────
class CreateCollectionSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    isPrivate: bool = False


# ── Report ────────────────────────────────────────────────────
class CreateReportSchema(BaseModel):
    targetType: Literal["pin", "user", "comment"]
    targetId: str
    reason: Literal["copyright", "plagiarism", "sensitive_content", "harassment", "spam", "misinformation", "other"]
    description: Optional[str] = Field(None, max_length=1000)


# ── Ad ────────────────────────────────────────────────────────
class CreateAdSchema(BaseModel):
    targetType: Literal["pin", "product", "profile"]
    targetId: str
    headline: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=300)
    ctaText: str = Field("Learn More", max_length=30)
    ctaUrl: str = Field(..., max_length=500)
    budget: float = Field(..., ge=0)
    startDate: Optional[str] = None
    endDate: Optional[str] = None


# ── Payment ───────────────────────────────────────────────────
class InitiatePaymentSchema(BaseModel):
    gateway: Literal["paystack", "stripe"]
    type: Literal["subscription", "purchase", "ad_payment"]
    tier: Optional[Literal["basic", "pro", "creator_support"]] = None
    amount: Optional[float] = Field(None, ge=0)
    pinId: Optional[str] = None


class RequestPayoutSchema(BaseModel):
    amount: float = Field(..., ge=10000)
    method: Literal["bank_transfer", "stripe"]
