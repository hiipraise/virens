"""
Virens Cloudinary Service
Handles upload of images, videos, and GIFs with:
- Original resolution metadata extraction
- Thumbnail generation
- Perceptual hash computation for duplicate detection
- Transformation for protected content
"""
import asyncio
import io
from typing import Optional
import cloudinary
import cloudinary.uploader
import cloudinary.api
import imagehash
from PIL import Image
import structlog

from app.core.config import settings

logger = structlog.get_logger()

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def upload_media(
    content: bytes,
    content_type: str,
    filename: str,
    folder: str = "virens/pins",
) -> dict:
    """
    Upload media to Cloudinary and return metadata dict.
    Preserves original dimensions and generates thumbnails.
    """
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        _upload_sync,
        content,
        content_type,
        filename,
        folder,
    )
    return result


def _upload_sync(content: bytes, content_type: str, filename: str, folder: str) -> dict:
    is_video = "video" in content_type
    resource_type = "video" if is_video else "image"

    upload_result = cloudinary.uploader.upload(
        content,
        folder=folder,
        resource_type=resource_type,
        use_filename=True,
        unique_filename=True,
        overwrite=False,
        # Preserve original and generate thumbnail
        eager=[
            {"width": 400, "height": 400, "crop": "limit", "format": "webp", "quality": "auto"},
        ],
        eager_async=True,
    )

    width = upload_result.get("width", 0)
    height = upload_result.get("height", 0)
    secure_url = upload_result.get("secure_url", "")

    # Generate thumbnail URL via Cloudinary transformation
    public_id = upload_result.get("public_id", "")
    thumbnail_url = cloudinary.utils.cloudinary_url(
        public_id,
        width=600,
        height=600,
        crop="limit",
        format="webp",
        quality="auto:good",
        resource_type=resource_type,
    )[0]

    # Compute perceptual hash for images (for duplicate detection)
    perceptual_hash = None
    if not is_video:
        try:
            img = Image.open(io.BytesIO(content)).convert("RGB")
            perceptual_hash = str(imagehash.phash(img))
        except Exception as e:
            logger.warning("Could not compute perceptual hash", error=str(e))

    return {
        "secure_url": secure_url,
        "thumbnail_url": thumbnail_url,
        "public_id": public_id,
        "width": width,
        "height": height,
        "format": upload_result.get("format", ""),
        "resource_type": resource_type,
        "bytes": upload_result.get("bytes", 0),
        "duration": upload_result.get("duration"),  # for video
        "perceptual_hash": perceptual_hash,
    }


async def delete_media(public_id: str, resource_type: str = "image") -> bool:
    """Delete media from Cloudinary."""
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: cloudinary.uploader.destroy(public_id, resource_type=resource_type),
        )
        return result.get("result") == "ok"
    except Exception as e:
        logger.error("Failed to delete from Cloudinary", public_id=public_id, error=str(e))
        return False


async def generate_signed_url(public_id: str, expires_at: int) -> str:
    """Generate a signed, time-limited Cloudinary URL for paid downloads."""
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        sign_url=True,
        auth_token={"duration": expires_at},
        attachment=True,
    )
    return url
