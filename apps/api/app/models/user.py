from beanie import Document, Indexed
from pydantic import EmailStr, Field
from typing import Optional, Literal
from datetime import datetime, timezone


UserRole = Literal["superadmin", "admin", "staff", "creator", "user"]
SubscriptionTier = Literal["none", "basic", "pro", "creator_support"]


class User(Document):
    username: Indexed(str, unique=True)  # type: ignore
    email: Indexed(EmailStr, unique=True)  # type: ignore
    display_name: str
    hashed_password: str
    role: UserRole = "user"
    subscription_tier: SubscriptionTier = "none"

    avatar: Optional[str] = None
    bio: Optional[str] = None
    website_url: Optional[str] = None
    pinned_media_url: Optional[str] = None
    pinned_media_type: Optional[str] = None

    is_verified: bool = False
    is_private: bool = False
    is_banned: bool = False
    is_active: bool = True

    followers_count: int = 0
    following_count: int = 0
    pins_count: int = 0
    credibility_score: float = 5.0  # 0-10, used for report priority

    # Payout info
    payout_bank_code: Optional[str] = None
    payout_account_number: Optional[str] = None
    payout_account_name: Optional[str] = None
    stripe_account_id: Optional[str] = None
    paystack_recipient_code: Optional[str] = None

    # Counts for repeat infringer policy
    infringement_strikes: int = 0

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [
            "username",
            "email",
            "role",
            "is_banned",
        ]

    def to_public_dict(self) -> dict:
        return {
            "id": str(self.id),
            "username": self.username,
            "displayName": self.display_name,
            "avatar": self.avatar,
            "bio": self.bio,
            "websiteUrl": self.website_url,
            "role": self.role,
            "subscriptionTier": self.subscription_tier,
            "isVerified": self.is_verified,
            "isPrivate": self.is_private,
            "pinnedMediaUrl": self.pinned_media_url,
            "pinnedMediaType": self.pinned_media_type,
            "followersCount": self.followers_count,
            "followingCount": self.following_count,
            "pinsCount": self.pins_count,
            "credibilityScore": self.credibility_score,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }
