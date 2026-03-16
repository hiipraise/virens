"""
Virens Notification Service
Creates in-app notifications for user actions:
like, save, follow, repost, comment, sale, payout, report_resolved
"""
from datetime import datetime, timezone
import structlog

from app.models.notification import Notification

logger = structlog.get_logger()


async def notify(
    user_id: str,
    type: str,
    message: str,
    actor_username: str = "",
    actor_avatar: str = "",
    pin_id: str = "",
    metadata: dict | None = None,
) -> None:
    """Create a notification record for a user."""
    try:
        notif = Notification(
            user_id=user_id,
            type=type,
            message=message,
            actor_username=actor_username,
            actor_avatar=actor_avatar or "",
            pin_id=pin_id,
            metadata=metadata or {},
        )
        await notif.insert()
    except Exception as e:
        logger.warning("Failed to create notification", error=str(e))


async def notify_like(actor_username: str, actor_avatar: str, pin_owner_id: str, pin_id: str, pin_title: str) -> None:
    await notify(
        user_id=pin_owner_id,
        type="like",
        message=f"@{actor_username} liked your pin \"{pin_title}\"",
        actor_username=actor_username,
        actor_avatar=actor_avatar,
        pin_id=pin_id,
    )


async def notify_follow(actor_username: str, actor_avatar: str, target_user_id: str) -> None:
    await notify(
        user_id=target_user_id,
        type="follow",
        message=f"@{actor_username} started following you",
        actor_username=actor_username,
        actor_avatar=actor_avatar,
    )


async def notify_repost(actor_username: str, actor_avatar: str, pin_owner_id: str, pin_id: str, pin_title: str) -> None:
    await notify(
        user_id=pin_owner_id,
        type="repost",
        message=f"@{actor_username} reposted your pin \"{pin_title}\"",
        actor_username=actor_username,
        actor_avatar=actor_avatar,
        pin_id=pin_id,
    )


async def notify_comment(actor_username: str, actor_avatar: str, pin_owner_id: str, pin_id: str) -> None:
    await notify(
        user_id=pin_owner_id,
        type="comment",
        message=f"@{actor_username} commented on your pin",
        actor_username=actor_username,
        actor_avatar=actor_avatar,
        pin_id=pin_id,
    )


async def notify_sale(buyer_username: str, creator_id: str, pin_title: str, amount: float, currency: str = "₦") -> None:
    await notify(
        user_id=creator_id,
        type="sale",
        message=f"@{buyer_username} purchased \"{pin_title}\" for {currency}{amount:,.0f}",
        actor_username=buyer_username,
        metadata={"amount": amount, "currency": currency},
    )


async def notify_payout(creator_id: str, amount: float, status: str, currency: str = "₦") -> None:
    msg = f"Payout of {currency}{amount:,.0f} {status}"
    await notify(
        user_id=creator_id,
        type="payout",
        message=msg,
        metadata={"amount": amount, "status": status},
    )


async def notify_report_resolved(reporter_id: str, action: str, reason: str) -> None:
    await notify(
        user_id=reporter_id,
        type="report_resolved",
        message=f"Your report has been reviewed. Action taken: {action}",
        metadata={"action": action, "reason": reason},
    )


async def get_user_notifications(user_id: str, page: int = 1, page_size: int = 30) -> dict:
    skip = (page - 1) * page_size
    notifications = (
        await Notification.find(Notification.user_id == user_id)
        .sort([("created_at", -1)])
        .skip(skip)
        .limit(page_size)
        .to_list()
    )
    total = await Notification.find(Notification.user_id == user_id).count()
    unread = await Notification.find(Notification.user_id == user_id, Notification.is_read == False).count()
    return {
        "items": [n.to_dict() for n in notifications],
        "total": total,
        "unread": unread,
        "page": page,
        "pageSize": page_size,
    }


async def mark_all_read(user_id: str) -> None:
    await Notification.find(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).update({"$set": {"is_read": True}})
