from beanie import Document, Indexed
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class Comment(Document):
    pin_id: Indexed(str)  # type: ignore
    author_id: Indexed(str)  # type: ignore
    author_username: str
    author_avatar: Optional[str] = None
    author_is_verified: bool = False
    content: str
    parent_id: Optional[str] = None   # for nested replies
    likes_count: int = 0
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "comments"
        indexes = ["pin_id", "author_id", [("created_at", -1)]]

    def to_dict(self, viewer_liked: bool = False) -> dict:
        return {
            "id": str(self.id),
            "pinId": self.pin_id,
            "author": {
                "id": self.author_id,
                "username": self.author_username,
                "avatar": self.author_avatar,
                "isVerified": self.author_is_verified,
            },
            "content": self.content if not self.is_deleted else "[deleted]",
            "parentId": self.parent_id,
            "likesCount": self.likes_count,
            "isDeleted": self.is_deleted,
            "isLiked": viewer_liked,
            "createdAt": self.created_at.isoformat(),
        }
