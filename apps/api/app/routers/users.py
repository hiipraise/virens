from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel

from app.core.auth import get_current_user, get_optional_user
from app.models.user import User
from app.models.pin import Pin
from app.models.collection import Collection
from app.models.engagement import Like, Repost
from app.models.follow import Follow
from app.services.cloudinary_service import upload_media
from app.services.notification_service import notify_follow

router = APIRouter()


@router.get("/{username}")
async def get_profile(username: str, current_user: Optional[User] = Depends(get_optional_user)):
    user = await User.find_one(User.username == username.lower())
    if not user:
        raise HTTPException(404, "User not found")
    return user.to_public_dict()


@router.get("/{username}/pins")
async def get_user_pins(
    username: str,
    tab: str = Query("pins", pattern="^(pins|liked|reposts|collections)$"),
    page: int = 1,
    page_size: int = 24,
    current_user: Optional[User] = Depends(get_optional_user),
):
    profile = await User.find_one(User.username == username.lower())
    if not profile:
        raise HTTPException(404, "User not found")

    is_owner = current_user and str(current_user.id) == str(profile.id)
    if profile.is_private and not is_owner:
        return {"items": [], "total": 0, "page": 1, "pageSize": page_size, "hasNext": False, "hasPrev": False}

    skip = (page - 1) * page_size

    if tab == "pins":
        query = {"creator_id": str(profile.id), "status": "published"}
        total = await Pin.find(query).count()
        pins = await Pin.find(query).sort([("created_at", -1)]).skip(skip).limit(page_size).to_list()

    elif tab == "liked":
        likes = await Like.find(Like.user_id == str(profile.id)).sort([("created_at", -1)]).skip(skip).limit(page_size).to_list()
        pin_ids = [ObjectId(l.pin_id) for l in likes if ObjectId.is_valid(l.pin_id)]
        pin_map = {str(pin.id): pin for pin in await Pin.find({"_id": {"$in": pin_ids}, "status": "published"}).to_list()}
        pins = [pin_map[l.pin_id] for l in likes if l.pin_id in pin_map]
        total = await Like.find(Like.user_id == str(profile.id)).count()

    elif tab == "reposts":
        reposts = await Repost.find(Repost.user_id == str(profile.id)).sort([("created_at", -1)]).skip(skip).limit(page_size).to_list()
        pin_ids = [ObjectId(r.pin_id) for r in reposts if ObjectId.is_valid(r.pin_id)]
        pin_map = {str(pin.id): pin for pin in await Pin.find({"_id": {"$in": pin_ids}, "status": "published"}).to_list()}
        pins = [pin_map[r.pin_id] for r in reposts if r.pin_id in pin_map]
        total = await Repost.find(Repost.user_id == str(profile.id)).count()

    else:
        pins = []
        total = 0

    return {
        "items": [p.to_dict() for p in pins],
        "total": total,
        "page": page,
        "pageSize": page_size,
        "hasNext": (skip + page_size) < total,
        "hasPrev": page > 1,
    }


@router.get("/{username}/collections")
async def get_user_collections(username: str, current_user: Optional[User] = Depends(get_optional_user)):
    profile = await User.find_one(User.username == username.lower())
    if not profile:
        raise HTTPException(404, "User not found")
    is_owner = current_user and str(current_user.id) == str(profile.id)
    query = {"owner_id": str(profile.id)}
    if not is_owner:
        query["is_private"] = False
    collections = await Collection.find(query).sort([("created_at", -1)]).to_list()
    return [c.to_dict() for c in collections]


@router.post("/{username}/follow")
async def follow_user(username: str, user: User = Depends(get_current_user)):
    target = await User.find_one(User.username == username.lower())
    if not target:
        raise HTTPException(404, "User not found")
    if str(target.id) == str(user.id):
        raise HTTPException(400, "Cannot follow yourself")

    existing = await Follow.find_one(Follow.follower_id == str(user.id), Follow.following_id == str(target.id))
    if existing:
        await existing.delete()
        await User.find_one(User.id == target.id).update({"$inc": {"followers_count": -1}})
        await User.find_one(User.id == user.id).update({"$inc": {"following_count": -1}})
        return {"following": False}

    await Follow(follower_id=str(user.id), following_id=str(target.id)).insert()
    await User.find_one(User.id == target.id).update({"$inc": {"followers_count": 1}})
    await User.find_one(User.id == user.id).update({"$inc": {"following_count": 1}})
    await notify_follow(user.username, user.avatar or "", str(target.id))
    return {"following": True}


class UpdateProfileRequest(BaseModel):
    displayName: Optional[str] = None
    bio: Optional[str] = None
    websiteUrl: Optional[str] = None
    isPrivate: Optional[bool] = None


@router.patch("/me")
async def update_profile(data: UpdateProfileRequest, user: User = Depends(get_current_user)):
    updates = {}
    if data.displayName is not None:
        updates["display_name"] = data.displayName
    if data.bio is not None:
        updates["bio"] = data.bio
    if data.websiteUrl is not None:
        updates["website_url"] = data.websiteUrl
    if data.isPrivate is not None:
        updates["is_private"] = data.isPrivate
    if updates:
        await user.set(updates)
    return user.to_public_dict()


@router.post("/me/avatar")
async def update_avatar(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    content = await file.read()
    if not content:
        raise HTTPException(400, "No file uploaded")
    upload_result = await upload_media(content, file.content_type or "image/jpeg", file.filename or "avatar")
    await user.set({"avatar": upload_result["secure_url"]})
    return user.to_public_dict()
