from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime, timezone
import json

from app.core.auth import get_current_user, get_optional_user
from app.models.user import User
from app.models.pin import Pin
from app.models.engagement import Like, Save, Repost
from app.services.cloudinary_service import upload_media
from app.services.watermark_service import embed_invisible_watermark
from app.services.recommendation_service import get_related_pins
from app.algorithms.recommendation import compute_pin_score
from app.services.notification_service import notify_like, notify_repost, notify

router = APIRouter()


@router.post("/upload", status_code=201)
async def upload_pin(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    tags: str = Form("[]"),
    download_permission: str = Form("free"),
    is_for_sale: bool = Form(False),
    original_price: Optional[float] = Form(None),
    sale_price: Optional[float] = Form(None),
    is_protected: bool = Form(False),
    has_visible_watermark: bool = Form(False),
    has_invisible_watermark: bool = Form(True),
    screenshot_protection: bool = Form(False),
    is_sensitive: bool = Form(False),
    content_type: str = Form("human"),
    user: User = Depends(get_current_user),
):
    # Read file
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 100MB)")

    # Apply invisible watermark before upload if requested
    if has_invisible_watermark and file.content_type and "image" in file.content_type:
        content = await embed_invisible_watermark(content, str(user.id), user.username)

    # Upload to Cloudinary
    upload_result = await upload_media(content, file.content_type or "image/jpeg", file.filename or "upload")

    # Determine media type
    ct = file.content_type or ""
    if "video" in ct:
        media_type = "video"
    elif "gif" in ct or (file.filename and file.filename.endswith(".gif")):
        media_type = "gif"
    else:
        media_type = "image"

    tag_list = json.loads(tags)

    pin = Pin(
        title=title,
        description=description,
        tags=tag_list,
        media_url=upload_result["secure_url"],
        media_type=media_type,
        thumbnail_url=upload_result.get("thumbnail_url", upload_result["secure_url"]),
        original_width=upload_result.get("width", 0),
        original_height=upload_result.get("height", 0),
        aspect_ratio=upload_result.get("width", 1) / max(upload_result.get("height", 1), 1),
        file_size_bytes=len(content),
        cloudinary_public_id=upload_result.get("public_id", ""),
        creator_id=str(user.id),
        creator_username=user.username,
        creator_display_name=user.display_name,
        creator_avatar=user.avatar,
        creator_is_verified=user.is_verified,
        download_permission=download_permission,
        is_for_sale=is_for_sale,
        original_price=original_price,
        sale_price=sale_price,
        is_protected=is_protected,
        has_visible_watermark=has_visible_watermark,
        has_invisible_watermark=has_invisible_watermark,
        screenshot_protection=screenshot_protection,
        is_sensitive=is_sensitive,
        content_type=content_type,
        status="published",
    )
    await pin.insert()

    # Update user pin count
    await User.find_one(User.id == user.id).update({"$inc": {"pins_count": 1}})

    return {"pin_id": str(pin.id)}


@router.get("/explore")
async def explore_pins(
    tag: Optional[str] = None,
    page: int = 1,
    page_size: int = 24,
    current_user: Optional[User] = Depends(get_optional_user),
):
    query = {"status": "published"}
    if tag:
        query["tags"] = tag
    skip = (page - 1) * page_size
    pins = await Pin.find(query).sort([("created_at", -1)]).skip(skip).limit(page_size).to_list()
    total = await Pin.find(query).count()
    return {
        "items": [p.to_dict() for p in pins],
        "total": total,
        "page": page,
        "pageSize": page_size,
        "hasNext": (skip + page_size) < total,
        "hasPrev": page > 1,
    }

@router.get("/{pin_id}")
async def get_pin(pin_id: str, current_user: Optional[User] = Depends(get_optional_user)):
    pin = await Pin.get(pin_id)
    if not pin or pin.status == "removed":
        raise HTTPException(404, "Pin not found")

    # Increment view
    await Pin.find_one(Pin.id == pin.id).update({"$inc": {"views_count": 1}})

    data = pin.to_dict()

    if current_user:
        uid = str(current_user.id)
        data["isLiked"] = bool(await Like.find_one(Like.user_id == uid, Like.pin_id == pin_id))
        data["isSaved"] = bool(await Save.find_one(Save.user_id == uid, Save.pin_id == pin_id))
        data["isReposted"] = bool(await Repost.find_one(Repost.user_id == uid, Repost.pin_id == pin_id))

    return data


@router.get("/{pin_id}/related")
async def related_pins(pin_id: str, current_user: Optional[User] = Depends(get_optional_user)):
    pin = await Pin.get(pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    pins = await get_related_pins(pin, limit=24)
    return [p.to_dict() for p in pins]


@router.post("/{pin_id}/like", status_code=200)
async def toggle_like(pin_id: str, user: User = Depends(get_current_user)):
    existing = await Like.find_one(Like.user_id == str(user.id), Like.pin_id == pin_id)
    if existing:
        await existing.delete()
        await Pin.find_one(Pin.id == pin_id).update({"$inc": {"likes_count": -1}})
        return {"liked": False}
    pin = await Pin.get(pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    await Like(user_id=str(user.id), pin_id=pin_id).insert()
    await Pin.find_one(Pin.id == pin_id).update({"$inc": {"likes_count": 1}})
    if pin.creator_id != str(user.id):
        await notify_like(user.username, user.avatar or "", pin.creator_id, pin_id, pin.title)
    return {"liked": True}


@router.post("/{pin_id}/save", status_code=200)
async def toggle_save(pin_id: str, user: User = Depends(get_current_user)):
    existing = await Save.find_one(Save.user_id == str(user.id), Save.pin_id == pin_id)
    if existing:
        await existing.delete()
        await Pin.find_one(Pin.id == pin_id).update({"$inc": {"saves_count": -1}})
        return {"saved": False}
    pin = await Pin.get(pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    await Save(user_id=str(user.id), pin_id=pin_id).insert()
    await Pin.find_one(Pin.id == pin_id).update({"$inc": {"saves_count": 1}})
    if pin.creator_id != str(user.id):
        await notify(
            pin.creator_id,
            "save",
            f"@{user.username} saved your pin \"{pin.title}\"",
            user.username,
            user.avatar or "",
            pin_id,
        )
    return {"saved": True}


@router.post("/{pin_id}/repost", status_code=200)
async def toggle_repost(pin_id: str, user: User = Depends(get_current_user)):
    existing = await Repost.find_one(Repost.user_id == str(user.id), Repost.pin_id == pin_id)
    if existing:
        await existing.delete()
        await Pin.find_one(Pin.id == pin_id).update({"$inc": {"reposts_count": -1}})
        return {"reposted": False}
    pin = await Pin.get(pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    await Repost(user_id=str(user.id), pin_id=pin_id, original_creator_id=pin.creator_id).insert()
    await Pin.find_one(Pin.id == pin_id).update({"$inc": {"reposts_count": 1}})
    if pin.creator_id != str(user.id):
        await notify_repost(user.username, user.avatar or "", pin.creator_id, pin_id, pin.title)
    return {"reposted": True}


@router.post("/{pin_id}/download")
async def request_download(pin_id: str, user: User = Depends(get_current_user)):
    pin = await Pin.get(pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")

    perm = pin.download_permission
    if perm == "none":
        raise HTTPException(403, "Downloads disabled by creator")
    if perm == "subscribers_only" and user.subscription_tier == "none":
        raise HTTPException(402, "Subscription required")
    if perm == "paid":
        # In production: verify payment record exists
        pass

    await Pin.find_one(Pin.id == pin_id).update({"$inc": {"downloads_count": 1}})
    return {"download_url": f"/api/v1/pins/{pin_id}/download/file"}


@router.get("/{pin_id}/download/file")
async def download_pin_file(pin_id: str, user: User = Depends(get_current_user)):
    import httpx

    pin = await Pin.get(pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        upstream = await client.get(pin.media_url)

    if upstream.status_code >= 400:
        raise HTTPException(502, "Could not fetch asset")

    extension = "jpg" if pin.media_type == "image" else pin.media_type
    safe_title = (pin.title or "download").replace('"', "")
    filename = f"{safe_title}.{extension}"
    return StreamingResponse(
        iter([upstream.content]),
        media_type=upstream.headers.get("content-type", "application/octet-stream"),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{pin_id}/share")
async def share_pin(pin_id: str, user: User = Depends(get_current_user)):
    pin = await Pin.get(pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    await Pin.find_one(Pin.id == pin_id).update({"$inc": {"shares_count": 1}})
    return {"shared": True, "shareUrl": f"/pin/{pin_id}"}



@router.delete("/{pin_id}", status_code=204)
async def delete_pin(pin_id: str, user: User = Depends(get_current_user)):
    pin = await Pin.get(pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    is_admin = user.role in ("superadmin", "admin", "staff")
    if pin.creator_id != str(user.id) and not is_admin:
        raise HTTPException(403, "Not authorised")
    await pin.set({"status": "removed"})
