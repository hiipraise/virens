"""
Virens Duplicate & Copyright Detection
Uses perceptual hashing (pHash) to:
1. Detect near-duplicate uploads before they go live
2. Identify potential copyright violations
3. Power the copyright similarity scan in moderation
"""
from typing import Optional
import structlog

logger = structlog.get_logger()

# Hamming distance thresholds
IDENTICAL_THRESHOLD = 2       # Essentially same image
NEAR_DUPLICATE_THRESHOLD = 8  # Probably same image, minor edits
SIMILAR_THRESHOLD = 16        # Visually similar, possible inspiration


async def compute_perceptual_hash(image_bytes: bytes) -> Optional[str]:
    """Compute pHash string from raw image bytes."""
    try:
        import io
        import imagehash
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        h = imagehash.phash(img)
        return str(h)
    except Exception as e:
        logger.warning("pHash computation failed", error=str(e))
        return None


async def find_duplicate(
    perceptual_hash: str,
    exclude_pin_id: Optional[str] = None,
    threshold: int = NEAR_DUPLICATE_THRESHOLD,
) -> Optional[dict]:
    """
    Scan all published pins for a duplicate.
    Returns match dict or None.
    """
    import imagehash
    from app.models.pin import Pin

    try:
        source = imagehash.hex_to_hash(perceptual_hash)
    except Exception:
        return None

    query: dict = {"perceptual_hash": {"$exists": True, "$ne": None}, "status": "published"}
    if exclude_pin_id:
        query["_id"] = {"$ne": exclude_pin_id}

    # Stream in batches for memory efficiency
    batch_size = 500
    page = 0
    while True:
        pins = await Pin.find(query).skip(page * batch_size).limit(batch_size).to_list()
        if not pins:
            break
        for pin in pins:
            if not pin.perceptual_hash:
                continue
            try:
                candidate = imagehash.hex_to_hash(pin.perceptual_hash)
                distance = source - candidate
                if distance <= threshold:
                    risk = (
                        "identical" if distance <= IDENTICAL_THRESHOLD
                        else "near_duplicate" if distance <= NEAR_DUPLICATE_THRESHOLD
                        else "similar"
                    )
                    return {
                        "match": True,
                        "pin_id": str(pin.id),
                        "pin_title": pin.title,
                        "creator_id": pin.creator_id,
                        "creator_username": pin.creator_username,
                        "distance": distance,
                        "risk": risk,
                    }
            except Exception:
                continue
        page += 1
        if len(pins) < batch_size:
            break

    return None


async def check_upload_originality(
    image_bytes: bytes,
    uploader_id: str,
    exclude_pin_id: Optional[str] = None,
) -> dict:
    """
    Full originality check pipeline run at upload time.
    Returns a summary dict for the upload router to decide on.
    """
    phash = await compute_perceptual_hash(image_bytes)
    if not phash:
        return {"status": "unknown", "hash": None}

    match = await find_duplicate(phash, exclude_pin_id=exclude_pin_id)

    if not match:
        return {"status": "original", "hash": phash}

    # If match is from the same creator → likely re-upload, not violation
    if match["creator_id"] == uploader_id:
        return {"status": "self_duplicate", "hash": phash, "match": match}

    return {
        "status": "potential_duplicate",
        "hash": phash,
        "match": match,
        "action": "flag_for_review" if match["risk"] == "identical" else "warn",
    }
