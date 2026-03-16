from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from app.core.auth import get_current_user, get_optional_user
from app.models.user import User
from app.models.collection import Collection
from app.models.pin import Pin

router = APIRouter()


class CreateCollectionRequest(BaseModel):
    name: str
    description: Optional[str] = None
    isPrivate: bool = False


@router.post("", status_code=201)
async def create_collection(data: CreateCollectionRequest, user: User = Depends(get_current_user)):
    col = Collection(
        name=data.name,
        description=data.description,
        owner_id=str(user.id),
        owner_username=user.username,
        is_private=data.isPrivate,
    )
    await col.insert()
    return col.to_dict()


@router.get("/{collection_id}")
async def get_collection(collection_id: str, current_user: Optional[User] = Depends(get_optional_user)):
    col = await Collection.get(collection_id)
    if not col:
        raise HTTPException(404, "Collection not found")
    is_owner = current_user and str(current_user.id) == col.owner_id
    if col.is_private and not is_owner:
        raise HTTPException(403, "This collection is private")
    return col.to_dict()


@router.get("/{collection_id}/pins")
async def get_collection_pins(collection_id: str, page: int = 1, page_size: int = 24):
    col = await Collection.get(collection_id)
    if not col:
        raise HTTPException(404, "Collection not found")
    skip = (page - 1) * page_size
    pins = await Pin.find({"collection_id": collection_id, "status": "published"}).skip(skip).limit(page_size).to_list()
    total = await Pin.find({"collection_id": collection_id}).count()
    return {
        "items": [p.to_dict() for p in pins],
        "total": total,
        "page": page,
        "pageSize": page_size,
        "hasNext": (skip + page_size) < total,
        "hasPrev": page > 1,
    }


@router.post("/{collection_id}/pins/{pin_id}")
async def add_pin_to_collection(collection_id: str, pin_id: str, user: User = Depends(get_current_user)):
    col = await Collection.get(collection_id)
    if not col or col.owner_id != str(user.id):
        raise HTTPException(403, "Not authorised")
    await Pin.find_one(Pin.id == pin_id).update({"$set": {"collection_id": collection_id}})
    await col.set({"pins_count": col.pins_count + 1})
    return {"detail": "Added"}


@router.delete("/{collection_id}", status_code=204)
async def delete_collection(collection_id: str, user: User = Depends(get_current_user)):
    col = await Collection.get(collection_id)
    if not col or col.owner_id != str(user.id):
        raise HTTPException(403, "Not authorised")
    await col.delete()
