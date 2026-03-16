from beanie import Document, Indexed
from pydantic import Field
from typing import Optional
from datetime import datetime, timezone


class Like(Document):
    user_id: Indexed(str)  # type: ignore
    pin_id: Indexed(str)  # type: ignore
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "likes"
        indexes = [("user_id", "pin_id")]


class Save(Document):
    user_id: Indexed(str)  # type: ignore
    pin_id: Indexed(str)  # type: ignore
    collection_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "saves"
        indexes = [("user_id", "pin_id")]


class Repost(Document):
    user_id: Indexed(str)  # type: ignore
    pin_id: Indexed(str)  # type: ignore
    original_creator_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "reposts"
        indexes = [("user_id", "pin_id")]
