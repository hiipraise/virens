from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime, timezone


class Follow(Document):
    follower_id: Indexed(str)  # type: ignore
    following_id: Indexed(str)  # type: ignore
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "follows"
        indexes = [("follower_id", "following_id")]
