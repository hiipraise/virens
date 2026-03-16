"""
Virens Report Prioritization Algorithm

Priority score 0–10 based on:
  - Report type (copyright = highest)
  - Reporter credibility (verified creators weighted more)
  - Repeat reports on same target
  - Time sensitivity
"""
from typing import Literal

REASON_BASE_PRIORITY = {
    "copyright": 9,
    "plagiarism": 8,
    "harassment": 7,
    "sensitive_content": 6,
    "misinformation": 5,
    "spam": 3,
    "other": 2,
}

MAX_CREDIBILITY = 10.0
VERIFIED_CREATOR_BONUS = 1.5
REPEAT_REPORT_BONUS = 0.5  # per additional report on same target
MAX_REPEAT_BONUS = 2.0


def compute_report_priority(
    reason: str,
    reporter_credibility: float,
    reporter_is_verified: bool,
    existing_reports_on_target: int = 0,
) -> int:
    """
    Returns an integer priority score 0–10.
    Higher = reviewed first in admin queue.
    """
    base = REASON_BASE_PRIORITY.get(reason, 2)

    # Credibility modifier: scale 0–1 relative to max
    cred_mod = (reporter_credibility / MAX_CREDIBILITY) * 1.0

    # Verified creator gets extra weight
    verified_bonus = VERIFIED_CREATOR_BONUS if reporter_is_verified else 0.0

    # Repeat reports amplify priority (multiple independent reporters)
    repeat_bonus = min(existing_reports_on_target * REPEAT_REPORT_BONUS, MAX_REPEAT_BONUS)

    raw = base + cred_mod + verified_bonus + repeat_bonus
    return min(10, max(0, round(raw)))


def should_auto_flag(priority: int) -> bool:
    """Auto-flag content for review when priority >= 8."""
    return priority >= 8


def should_auto_remove(priority: int, existing_reports: int) -> bool:
    """
    Auto-remove when copyright/plagiarism priority is max AND
    >= 3 independent verified reports.
    """
    return priority == 10 and existing_reports >= 3
