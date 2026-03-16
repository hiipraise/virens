from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.core.auth import get_optional_user
from app.models.user import User
from app.models.pin import Pin
from app.models.engagement import Like, Save
from app.models.follow import Follow
from app.algorithms.recommendation import PersonalisedFeed

router = APIRouter()


@router.get("")
async def get_feed(
    mode: str = Query("personalized", pattern="^(personalized|trending|latest)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, le=50),
    tag: Optional[str] = None,
    show_sensitive: bool = False,
    show_ai: bool = True,
    current_user: Optional[User] = Depends(get_optional_user),
):
    skip = (page - 1) * page_size
    query: dict = {"status": "published"}

    if not show_sensitive:
        query["is_sensitive"] = False
    if not show_ai:
        query["content_type"] = "human"
    if tag:
        query["tags"] = tag

    if mode == "latest" or not current_user:
        pins = (
            await Pin.find(query)
            .sort([("created_at", -1)])
            .skip(skip)
            .limit(page_size)
            .to_list()
        )
        total = await Pin.find(query).count()

    elif mode == "trending":
        # Score = likes*2 + saves*3 + reposts*2 + views*0.1 in last 7 days
        pins = (
            await Pin.find(query)
            .sort([("likes_count", -1), ("saves_count", -1), ("views_count", -1)])
            .skip(skip)
            .limit(page_size)
            .to_list()
        )
        total = await Pin.find(query).count()

    else:  # personalized
        engine = PersonalisedFeed(current_user)
        pins, total = await engine.get_feed(query, skip, page_size)

    # Annotate with engagement state
    pin_dicts = []
    for p in pins:
        d = p.to_dict()
        if current_user:
            uid = str(current_user.id)
            pid = str(p.id)
            d["isLiked"] = bool(await Like.find_one(Like.user_id == uid, Like.pin_id == pid))
            d["isSaved"] = bool(await Save.find_one(Save.user_id == uid, Save.pin_id == pid))
        pin_dicts.append(d)

    return {
        "items": pin_dicts,
        "total": total,
        "page": page,
        "pageSize": page_size,
        "hasNext": (skip + page_size) < total,
        "hasPrev": page > 1,
    }
