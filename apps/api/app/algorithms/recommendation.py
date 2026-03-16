"""
Virens Recommendation Engine
"More Like This" algorithm based on:
  1. Visual similarity (perceptual hash distance)
  2. Tag overlap (Jaccard similarity)
  3. User behaviour (interaction history)
  4. Engagement signals (likes, saves, shares)
  5. Creator similarity (followed creators)
"""
import asyncio
from typing import Optional, List, Tuple
import imagehash
from PIL import Image
import io
import httpx
import structlog

from app.models.user import User
from app.models.pin import Pin
from app.models.engagement import Like, Save, Repost
from app.models.follow import Follow

logger = structlog.get_logger()

# Weights for scoring
W_TAG_OVERLAP = 0.35
W_ENGAGEMENT  = 0.30
W_VISUAL_SIM  = 0.20
W_CREATOR_SIM = 0.15

DECAY_FACTOR = 0.95  # time decay per day


def jaccard_similarity(set_a: set, set_b: set) -> float:
    if not set_a and not set_b:
        return 0.0
    inter = len(set_a & set_b)
    union = len(set_a | set_b)
    return inter / union if union else 0.0


def compute_pin_score(pin: Pin) -> float:
    """Engagement-based hot score for trending."""
    return (
        pin.likes_count * 2.0
        + pin.saves_count * 3.0
        + pin.reposts_count * 2.0
        + pin.views_count * 0.05
        + pin.downloads_count * 4.0
    )


def hash_distance(hash_a: Optional[str], hash_b: Optional[str]) -> float:
    """0.0 = identical, 1.0 = completely different."""
    if not hash_a or not hash_b:
        return 1.0
    try:
        h_a = imagehash.hex_to_hash(hash_a)
        h_b = imagehash.hex_to_hash(hash_b)
        dist = (h_a - h_b) / 64.0
        return min(1.0, dist)
    except Exception:
        return 1.0


async def score_related_pin(
    source: Pin,
    candidate: Pin,
    followed_creator_ids: set,
) -> float:
    """Compute a 0–1 relatedness score between source and candidate."""
    # 1. Tag overlap
    tag_sim = jaccard_similarity(set(source.tags), set(candidate.tags))

    # 2. Engagement normalised
    max_eng = 10000.0
    eng_score = min(compute_pin_score(candidate) / max_eng, 1.0)

    # 3. Visual similarity via perceptual hash
    visual_sim = 1.0 - hash_distance(source.perceptual_hash, candidate.perceptual_hash)

    # 4. Creator similarity
    creator_sim = 1.0 if candidate.creator_id in followed_creator_ids else 0.0

    total = (
        W_TAG_OVERLAP * tag_sim
        + W_ENGAGEMENT * eng_score
        + W_VISUAL_SIM * visual_sim
        + W_CREATOR_SIM * creator_sim
    )
    return total


async def get_related_pins(source: Pin, limit: int = 24) -> List[Pin]:
    """Fetch and rank pins related to `source`."""
    # Find candidates by tag overlap first
    if source.tags:
        candidates = await Pin.find(
            {"tags": {"$in": source.tags}, "status": "published", "_id": {"$ne": source.id}}
        ).limit(limit * 4).to_list()
    else:
        candidates = await Pin.find(
            {"status": "published", "_id": {"$ne": source.id}}
        ).sort([("likes_count", -1)]).limit(limit * 4).to_list()

    if not candidates:
        return []

    scored = [(c, await score_related_pin(source, c, set())) for c in candidates]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [c for c, _ in scored[:limit]]


class PersonalisedFeed:
    """Personalised feed generator for authenticated users."""

    def __init__(self, user: User):
        self.user = user

    async def _get_followed_creator_ids(self) -> set:
        follows = await Follow.find(Follow.follower_id == str(self.user.id)).to_list()
        return {f.following_id for f in follows}

    async def _get_interacted_tag_weights(self) -> dict:
        """Count how many times user has engaged with each tag."""
        liked = await Like.find(Like.user_id == str(self.user.id)).limit(200).to_list()
        pin_ids = [l.pin_id for l in liked]
        if not pin_ids:
            return {}

        pins = await Pin.find({"_id": {"$in": pin_ids}}).to_list()
        tag_weights: dict = {}
        for p in pins:
            for tag in p.tags:
                tag_weights[tag] = tag_weights.get(tag, 0) + 1
        return tag_weights

    async def get_feed(
        self,
        base_query: dict,
        skip: int,
        limit: int,
    ) -> Tuple[List[Pin], int]:
        followed_ids = await self._get_followed_creator_ids()
        tag_weights = await self._get_interacted_tag_weights()
        top_tags = sorted(tag_weights, key=tag_weights.get, reverse=True)[:10]  # type: ignore

        # Build personalised query
        if followed_ids or top_tags:
            personalised_query = {
                **base_query,
                "$or": [
                    {"creator_id": {"$in": list(followed_ids)}},
                    {"tags": {"$in": top_tags}},
                ],
            }
        else:
            personalised_query = base_query

        total = await Pin.find(personalised_query).count()
        pins = (
            await Pin.find(personalised_query)
            .sort([("created_at", -1)])
            .skip(skip)
            .limit(limit)
            .to_list()
        )

        # If not enough personalised, backfill with trending
        if len(pins) < limit:
            existing_ids = {str(p.id) for p in pins}
            backfill = (
                await Pin.find({**base_query, "_id": {"$nin": list(existing_ids)}})
                .sort([("likes_count", -1)])
                .limit(limit - len(pins))
                .to_list()
            )
            pins.extend(backfill)
            total += len(backfill)

        return pins, total
