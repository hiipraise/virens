from beanie import Document, Indexed, Link
from pydantic import Field
from typing import Optional, Literal, List
from datetime import datetime, timezone
from bson import ObjectId


MediaType = Literal["image", "video", "gif"]
DownloadPermission = Literal["free", "subscribers_only", "paid", "none"]
ContentType = Literal["human", "ai_generated"]
PinStatus = Literal["draft", "published", "flagged", "removed", "appealing"]


class Pin(Document):
    title: str
    description: Optional[str] = None
    tags: List[str] = []

    # Media
    media_url: str
    media_type: MediaType
    thumbnail_url: str
    original_width: int
    original_height: int
    aspect_ratio: float
    file_size_bytes: int = 0
    cloudinary_public_id: str = ""

    # Creator
    creator_id: Indexed(str)  # type: ignore
    creator_username: str
    creator_display_name: str
    creator_avatar: Optional[str] = None
    creator_is_verified: bool = False

    # State
    status: PinStatus = "published"
    content_type: ContentType = "human"
    is_sensitive: bool = False

    # Commerce
    download_permission: DownloadPermission = "free"
    download_price: Optional[float] = None
    is_for_sale: bool = False
    original_price: Optional[float] = None
    sale_price: Optional[float] = None
    currency: str = "NGN"
    license_type: Optional[str] = None

    # Protection / DAM
    is_protected: bool = False
    has_visible_watermark: bool = False
    has_invisible_watermark: bool = True
    screenshot_protection: bool = False

    # Engagement counters
    likes_count: int = 0
    saves_count: int = 0
    shares_count: int = 0
    reposts_count: int = 0
    downloads_count: int = 0
    views_count: int = 0
    comments_count: int = 0

    # AI/ML vectors for recommendation
    embedding_vector: Optional[List[float]] = None
    perceptual_hash: Optional[str] = None  # for duplicate detection

    # Collection
    collection_id: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "pins"
        indexes = [
            "creator_id",
            "status",
            "tags",
            "media_type",
            "is_sensitive",
            "content_type",
            [("created_at", -1)],
            [("likes_count", -1)],
            [("views_count", -1)],
        ]

    def to_dict(self, current_user_id: Optional[str] = None) -> dict:
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "tags": self.tags,
            "mediaUrl": self.media_url,
            "mediaType": self.media_type,
            "thumbnailUrl": self.thumbnail_url,
            "originalWidth": self.original_width,
            "originalHeight": self.original_height,
            "aspectRatio": self.aspect_ratio,
            "creator": {
                "id": self.creator_id,
                "username": self.creator_username,
                "displayName": self.creator_display_name,
                "avatar": self.creator_avatar,
                "isVerified": self.creator_is_verified,
            },
            "status": self.status,
            "contentType": self.content_type,
            "isSensitive": self.is_sensitive,
            "downloadPermission": self.download_permission,
            "downloadPrice": self.download_price,
            "isForSale": self.is_for_sale,
            "originalPrice": self.original_price,
            "salePrice": self.sale_price,
            "currency": self.currency,
            "licenseType": self.license_type,
            "isProtected": self.is_protected,
            "hasVisibleWatermark": self.has_visible_watermark,
            "hasInvisibleWatermark": self.has_invisible_watermark,
            "screenshotProtection": self.screenshot_protection,
            "likesCount": self.likes_count,
            "savesCount": self.saves_count,
            "sharesCount": self.shares_count,
            "repostsCount": self.reposts_count,
            "downloadsCount": self.downloads_count,
            "viewsCount": self.views_count,
            "collectionId": self.collection_id,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }
