from beanie import Document, Indexed
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime, timezone


class Payout(Document):
    creator_id: Indexed(str)  # type: ignore
    amount: float
    currency: str = "NGN"
    status: Literal["pending", "processing", "completed", "failed"] = "pending"
    payment_method: Literal["bank_transfer", "stripe"] = "bank_transfer"
    reference: str = ""
    gateway_response: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    class Settings:
        name = "payouts"
        indexes = ["creator_id", "status"]

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "creatorId": self.creator_id,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "paymentMethod": self.payment_method,
            "reference": self.reference,
            "createdAt": self.created_at.isoformat(),
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
        }
