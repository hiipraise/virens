from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.models.user import User
from app.services.notification_service import get_user_notifications, mark_all_read

router = APIRouter()


@router.get("")
async def list_notifications(page: int = 1, page_size: int = 30, user: User = Depends(get_current_user)):
    return await get_user_notifications(str(user.id), page=page, page_size=page_size)


@router.post("/read-all", status_code=204)
async def read_all(user: User = Depends(get_current_user)):
    await mark_all_read(str(user.id))
