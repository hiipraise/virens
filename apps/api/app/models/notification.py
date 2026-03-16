from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime, timezone


class Notification(Document):
    user_id: Indexed(str)  # type: ignore
    type: str  # "like" | "save" | "follow" | "repost" | "comment" | "sale" | "payout" | "report"
    message: str
    actor_username: str = ""
    actor_avatar: str = ""
    pin_id: str = ""
    metadata: dict = {}
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "notifications"
        indexes = ["user_id", "is_read", [("created_at", -1)]]

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "type": self.type,
            "message": self.message,
            "actorUsername": self.actor_username,
            "actorAvatar": self.actor_avatar,
            "pinId": self.pin_id,
            "isRead": self.is_read,
            "createdAt": self.created_at.isoformat(),
        }
