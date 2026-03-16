from beanie import Document, Indexed
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime, timezone


class Subscription(Document):
    user_id: Indexed(str, unique=True)  # type: ignore
    tier: Literal["basic", "pro", "creator_support"]
    status: Literal["active", "cancelled", "past_due", "trialing"] = "active"
    payment_gateway: Literal["paystack", "stripe"] = "paystack"
    gateway_subscription_id: str = ""
    current_period_start: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "subscriptions"
        indexes = ["user_id", "status"]

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "userId": self.user_id,
            "tier": self.tier,
            "status": self.status,
            "paymentGateway": self.payment_gateway,
            "currentPeriodStart": self.current_period_start.isoformat(),
            "currentPeriodEnd": self.current_period_end.isoformat() if self.current_period_end else None,
            "cancelAtPeriodEnd": self.cancel_at_period_end,
            "createdAt": self.created_at.isoformat(),
        }
