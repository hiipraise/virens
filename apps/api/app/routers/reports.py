from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.core.auth import get_current_user, require_admin
from app.models.user import User
from app.models.report import Report
from app.models.pin import Pin
from app.algorithms.report_priority import (
    compute_report_priority,
    should_auto_flag,
    should_auto_remove,
)

router = APIRouter()


class CreateReportRequest(BaseModel):
    target_type: str  # "pin" | "user" | "comment"
    target_id: str
    reason: str
    description: Optional[str] = None


@router.post("", status_code=201)
async def create_report(data: CreateReportRequest, user: User = Depends(get_current_user)):
    # Count existing reports on this target
    existing_count = await Report.find(
        Report.target_id == data.target_id,
        Report.status == "pending",
    ).count()

    priority = compute_report_priority(
        reason=data.reason,
        reporter_credibility=user.credibility_score,
        reporter_is_verified=user.is_verified,
        existing_reports_on_target=existing_count,
    )

    report = Report(
        reporter_id=str(user.id),
        reporter_username=user.username,
        reporter_credibility=user.credibility_score,
        reporter_is_verified=user.is_verified,
        target_type=data.target_type,
        target_id=data.target_id,
        reason=data.reason,
        description=data.description,
        priority=priority,
    )
    await report.insert()

    # Auto-flag high-priority content
    if data.target_type == "pin" and should_auto_flag(priority):
        await Pin.find_one(Pin.id == data.target_id).update({"$set": {"status": "flagged"}})

    # Auto-remove if threshold exceeded (repeat verified reports of copyright)
    if data.target_type == "pin" and should_auto_remove(priority, existing_count + 1):
        await Pin.find_one(Pin.id == data.target_id).update({"$set": {"status": "removed"}})

    return {"report_id": str(report.id), "priority": priority}


@router.get("/my")
async def my_reports(user: User = Depends(get_current_user)):
    reports = await Report.find(Report.reporter_id == str(user.id)).sort([("created_at", -1)]).to_list()
    return [r.to_dict() for r in reports]


# ── Admin only ─────────────────────────────────────────────────

@router.get("")
async def list_reports(
    status: str = "pending",
    page: int = 1,
    page_size: int = 30,
    admin: User = Depends(require_admin),
):
    query = {"status": status}
    skip = (page - 1) * page_size
    reports = (
        await Report.find(query)
        .sort([("priority", -1), ("created_at", 1)])
        .skip(skip)
        .limit(page_size)
        .to_list()
    )
    total = await Report.find(query).count()
    return {
        "items": [r.to_dict() for r in reports],
        "total": total,
        "page": page,
        "pageSize": page_size,
    }


@router.post("/{report_id}/resolve")
async def resolve_report(report_id: str, admin: User = Depends(require_admin)):
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    await report.set({
        "status": "resolved",
        "resolved_by_id": str(admin.id),
        "resolved_at": datetime.now(timezone.utc),
    })
    return {"detail": "Resolved"}


@router.post("/{report_id}/dismiss")
async def dismiss_report(report_id: str, admin: User = Depends(require_admin)):
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    await report.set({
        "status": "dismissed",
        "resolved_by_id": str(admin.id),
        "resolved_at": datetime.now(timezone.utc),
    })
    return {"detail": "Dismissed"}


@router.post("/{report_id}/remove_content")
async def remove_reported_content(report_id: str, admin: User = Depends(require_admin)):
    report = await Report.get(report_id)
    if not report:
        raise HTTPException(404, "Report not found")

    if report.target_type == "pin":
        await Pin.find_one(Pin.id == report.target_id).update({"$set": {"status": "removed"}})

        # Check repeat infringer policy
        pin = await Pin.get(report.target_id)
        if pin:
            creator = await User.get(pin.creator_id)
            if creator:
                new_strikes = creator.infringement_strikes + 1
                await creator.set({"infringement_strikes": new_strikes})
                # Auto-ban after 5 strikes (repeat infringer policy)
                if new_strikes >= 5:
                    await creator.set({"is_banned": True})

    await report.set({
        "status": "resolved",
        "resolved_by_id": str(admin.id),
        "resolved_at": datetime.now(timezone.utc),
        "resolution_note": "Content removed",
    })
    return {"detail": "Content removed"}


# ── Appeal system ──────────────────────────────────────────────

@router.post("/appeal/{pin_id}")
async def appeal_removal(pin_id: str, reason: str, user: User = Depends(get_current_user)):
    """Allow creators to appeal a flagged or removed pin."""
    pin = await Pin.get(pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    if pin.creator_id != str(user.id):
        raise HTTPException(403, "Not your pin")
    if pin.status not in ("flagged", "removed"):
        raise HTTPException(400, "Pin is not flagged or removed")

    await pin.set({"status": "appealing"})
    return {"detail": "Appeal submitted. Your content will be reviewed within 48 hours."}
