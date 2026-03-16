from beanie import Document, Indexed
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class Collection(Document):
    name: str
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    owner_id: Indexed(str)  # type: ignore
    owner_username: str
    pins_count: int = 0
    is_private: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "collections"
        indexes = ["owner_id", "is_private"]

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "coverImageUrl": self.cover_image_url,
            "owner": {"id": self.owner_id, "username": self.owner_username},
            "pinsCount": self.pins_count,
            "isPrivate": self.is_private,
            "createdAt": self.created_at.isoformat(),
        }
