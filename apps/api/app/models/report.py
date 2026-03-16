from beanie import Document, Indexed
from pydantic import Field
from typing import Optional, Literal
from datetime import datetime, timezone

ReportReason = Literal["copyright", "plagiarism", "sensitive_content", "harassment", "spam", "misinformation", "other"]
ReportStatus = Literal["pending", "reviewing", "resolved", "dismissed"]


class Report(Document):
    reporter_id: Indexed(str)  # type: ignore
    reporter_username: str
    reporter_credibility: float = 5.0
    reporter_is_verified: bool = False
    target_type: Literal["pin", "user", "comment"]
    target_id: Indexed(str)  # type: ignore
    reason: ReportReason
    description: Optional[str] = None
    status: ReportStatus = "pending"
    priority: int = 5
    resolved_by_id: Optional[str] = None
    resolution_note: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

    class Settings:
        name = "reports"
        indexes = ["status", "priority", "target_id", "reporter_id"]

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "reporter": {
                "id": self.reporter_id,
                "username": self.reporter_username,
                "isVerified": self.reporter_is_verified,
            },
            "targetType": self.target_type,
            "targetId": self.target_id,
            "reason": self.reason,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "createdAt": self.created_at.isoformat(),
            "resolvedAt": self.resolved_at.isoformat() if self.resolved_at else None,
        }
