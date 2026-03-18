from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.core.auth import get_current_user, get_optional_user
from app.models.user import User
from app.models.comment import Comment
from app.models.pin import Pin
from app.services.notification_service import notify_comment

router = APIRouter()


class CreateCommentRequest(BaseModel):
    content: str
    parent_id: Optional[str] = None


@router.get("/pin/{pin_id}")
async def get_pin_comments(
    pin_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, le=50),
    current_user: Optional[User] = Depends(get_optional_user),
):
    skip = (page - 1) * page_size
    viewer_id = str(current_user.id) if current_user else None
    comments = (
        await Comment.find(
            Comment.pin_id == pin_id,
            Comment.is_deleted == False,
            Comment.parent_id == None,
        )
        .sort([("created_at", -1)])
        .skip(skip)
        .limit(page_size)
        .to_list()
    )
    parent_ids = [str(comment.id) for comment in comments]
    replies = (
        await Comment.find(
            Comment.pin_id == pin_id,
            Comment.is_deleted == False,
            {"parent_id": {"$in": parent_ids}},
        )
        .sort([("created_at", 1)])
        .to_list()
        if parent_ids
        else []
    )

    replies_by_parent: dict[str, list] = {}
    for reply in replies:
        replies_by_parent.setdefault(reply.parent_id or "", []).append(
            reply.to_dict(viewer_liked=bool(viewer_id and viewer_id in reply.liked_by))
        )

    total = await Comment.find(Comment.pin_id == pin_id, Comment.is_deleted == False).count()
    return {
        "items": [
            comment.to_dict(
                viewer_liked=bool(viewer_id and viewer_id in comment.liked_by),
                replies=replies_by_parent.get(str(comment.id), []),
            )
            for comment in comments
        ],
        "total": total,
        "page": page,
        "pageSize": page_size,
        "hasNext": (skip + page_size) < total,
        "hasPrev": page > 1,
    }


@router.post("/pin/{pin_id}", status_code=201)
async def create_comment(
    pin_id: str,
    data: CreateCommentRequest,
    user: User = Depends(get_current_user),
):
    if not data.content.strip():
        raise HTTPException(400, "Comment cannot be empty")
    if len(data.content) > 2000:
        raise HTTPException(400, "Comment too long (max 2000 chars)")

    pin = await Pin.get(pin_id)
    if not pin or pin.status == "removed":
        raise HTTPException(404, "Pin not found")

    parent = None
    if data.parent_id:
        parent = await Comment.get(data.parent_id)
        if not parent or parent.pin_id != pin_id:
            raise HTTPException(404, "Parent comment not found")

    comment = Comment(
        pin_id=pin_id,
        author_id=str(user.id),
        author_username=user.username,
        author_avatar=user.avatar,
        author_is_verified=user.is_verified,
        content=data.content.strip(),
        parent_id=data.parent_id,
    )
    await comment.insert()
    await Pin.find_one(Pin.id == pin.id).update({"$inc": {"comments_count": 1}})

    recipient_id = pin.creator_id
    if parent and parent.author_id != str(user.id):
        recipient_id = parent.author_id
    if recipient_id != str(user.id):
        await notify_comment(user.username, user.avatar or "", recipient_id, pin_id)

    return comment.to_dict()


@router.delete("/{comment_id}", status_code=204)
async def delete_comment(comment_id: str, user: User = Depends(get_current_user)):
    comment = await Comment.get(comment_id)
    if not comment:
        raise HTTPException(404, "Comment not found")
    is_admin = user.role in ("superadmin", "admin", "staff")
    if comment.author_id != str(user.id) and not is_admin:
        raise HTTPException(403, "Not authorised")
    await comment.set({"is_deleted": True})
    await Pin.find_one(Pin.id == comment.pin_id).update({"$inc": {"comments_count": -1}})


@router.post("/{comment_id}/like")
async def toggle_comment_like(comment_id: str, user: User = Depends(get_current_user)):
    comment = await Comment.get(comment_id)
    if not comment:
        raise HTTPException(404, "Comment not found")

    user_id = str(user.id)
    if user_id in comment.liked_by:
        await comment.set(
            {
                "liked_by": [liked for liked in comment.liked_by if liked != user_id],
                "likes_count": max(0, comment.likes_count - 1),
            }
        )
        return {"liked": False}

    await comment.set(
        {
            "liked_by": [*comment.liked_by, user_id],
            "likes_count": comment.likes_count + 1,
        }
    )
    return {"liked": True}
