"""
Virens AI Services
- Auto tag suggestion via Groq (free tier)
- Duplicate image detection via perceptual hash
- Copyright similarity scanning
"""
import json
import asyncio
from typing import List, Optional
import structlog

from app.core.config import settings

logger = structlog.get_logger()


async def suggest_tags(image_url: str, title: str, description: str = "") -> List[str]:
    """
    Use Groq API (llama-3.1-8b-instant - free) to suggest relevant tags
    for a pin based on its title, description, and image URL.
    """
    if not settings.GROQ_API_KEY:
        return []

    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)

        prompt = f"""You are a tag suggestion system for a visual content platform.
Given the following pin details, suggest 8–15 relevant, specific tags.
Return ONLY a JSON array of lowercase strings, no explanation.

Title: {title}
Description: {description}
Image URL: {image_url}

Rules:
- Tags must be 1-3 words, lowercase, no # symbol
- Be specific (e.g. "digital illustration" not just "art")
- Include style, medium, subject matter, mood
- No duplicate concepts
- Return valid JSON only"""

        response = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=256,
            temperature=0.4,
        )

        raw = response.choices[0].message.content or "[]"
        # Strip markdown fences if present
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        tags = json.loads(raw)
        if isinstance(tags, list):
            return [str(t).lower().strip() for t in tags if t][:20]
        return []

    except Exception as e:
        logger.warning("Tag suggestion failed", error=str(e))
        return []


async def check_duplicate_hash(
    perceptual_hash: str,
    threshold: int = 8,
) -> Optional[dict]:
    """
    Check if a perceptual hash matches any existing pin (duplicate detection).
    threshold: Hamming distance (lower = more strict, 0 = identical)
    """
    import imagehash
    from app.models.pin import Pin

    try:
        source_hash = imagehash.hex_to_hash(perceptual_hash)
        # Scan recent pins (in production, use a vector index or Redis cache)
        candidates = await Pin.find({"perceptual_hash": {"$exists": True, "$ne": None}}).limit(5000).to_list()

        for pin in candidates:
            if not pin.perceptual_hash:
                continue
            try:
                candidate_hash = imagehash.hex_to_hash(pin.perceptual_hash)
                distance = source_hash - candidate_hash
                if distance <= threshold:
                    return {
                        "match": True,
                        "pin_id": str(pin.id),
                        "creator_username": pin.creator_username,
                        "distance": distance,
                    }
            except Exception:
                continue
        return None
    except Exception as e:
        logger.warning("Duplicate detection failed", error=str(e))
        return None


async def scan_copyright_similarity(perceptual_hash: str) -> dict:
    """
    Scan for potential copyright violations.
    Returns risk level: low / medium / high
    """
    result = await check_duplicate_hash(perceptual_hash, threshold=12)
    if not result:
        return {"risk": "low", "match": False}
    distance = result.get("distance", 64)
    risk = "high" if distance <= 4 else "medium" if distance <= 8 else "low"
    return {"risk": risk, "match": True, "details": result}
