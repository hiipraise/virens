from beanie import Document, Indexed
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime, timezone

AdStatus = Literal["draft", "pending_review", "active", "paused", "ended", "rejected"]
AdTarget = Literal["pin", "product", "profile"]


class Ad(Document):
    advertiser_id: Indexed(str)  # type: ignore
    advertiser_username: str
    target_type: AdTarget
    target_id: str
    headline: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: str = "Learn More"
    cta_url: str
    status: AdStatus = "pending_review"
    budget: float = 0
    spent: float = 0
    reach: int = 0
    clicks: int = 0
    impressions: int = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "ads"
        indexes = ["advertiser_id", "status", [("created_at", -1)]]

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "advertiser": {"id": self.advertiser_id, "username": self.advertiser_username},
            "targetType": self.target_type,
            "targetId": self.target_id,
            "headline": self.headline,
            "description": self.description,
            "imageUrl": self.image_url,
            "ctaText": self.cta_text,
            "ctaUrl": self.cta_url,
            "status": self.status,
            "budget": self.budget,
            "spent": self.spent,
            "reach": self.reach,
            "clicks": self.clicks,
            "impressions": self.impressions,
            "startDate": self.start_date.isoformat() if self.start_date else None,
            "endDate": self.end_date.isoformat() if self.end_date else None,
            "createdAt": self.created_at.isoformat(),
        }
