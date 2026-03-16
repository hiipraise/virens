"""
Virens Email Service
Sends transactional emails for:
- Welcome / account verification
- Password reset
- Payout confirmation
- Copyright violation notices
- Moderation decisions
"""
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import structlog

from app.core.config import settings

logger = structlog.get_logger()

# Add to Settings if you add email support:
# SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM

VIRENS_BRAND_COLOR = "#1DB954"
VIRENS_BG = "#191414"


def _build_html(title: str, body: str, cta_text: Optional[str] = None, cta_url: Optional[str] = None) -> str:
    cta_html = ""
    if cta_text and cta_url:
        cta_html = f"""
        <tr><td align="center" style="padding:24px 0">
          <a href="{cta_url}" style="
            display:inline-block;background:{VIRENS_BRAND_COLOR};color:{VIRENS_BG};
            font-weight:700;font-family:sans-serif;font-size:14px;
            padding:12px 28px;border-radius:100px;text-decoration:none;letter-spacing:0.3px
          ">{cta_text}</a>
        </td></tr>"""
    return f"""
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:{VIRENS_BG};font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px">
      <table width="560" cellpadding="0" cellspacing="0" style="
        background:#242020;border-radius:16px;overflow:hidden;
        border:1px solid rgba(255,255,255,0.07)
      ">
        <!-- Header -->
        <tr><td style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06)">
          <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">
            <span style="color:{VIRENS_BRAND_COLOR}">Virens</span>
          </span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <h1 style="font-size:20px;font-weight:700;color:#fff;margin:0 0 12px">{title}</h1>
          <div style="font-size:14px;color:#a8a0a0;line-height:1.7">{body}</div>
        </td></tr>
        {cta_html}
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06)">
          <p style="font-size:12px;color:#524848;margin:0">
            © Virens. You received this because you have an account.
            <a href="#" style="color:{VIRENS_BRAND_COLOR};text-decoration:none">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
) -> bool:
    """Send an email. Returns True on success, False on failure."""
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _send_sync, to, subject, html, text)
    except Exception as e:
        logger.error("Email send failed", to=to, subject=subject, error=str(e))
        return False


def _send_sync(to: str, subject: str, html: str, text: Optional[str]) -> bool:
    smtp_host = getattr(settings, "SMTP_HOST", "")
    smtp_port = int(getattr(settings, "SMTP_PORT", 587))
    smtp_user = getattr(settings, "SMTP_USER", "")
    smtp_pass = getattr(settings, "SMTP_PASSWORD", "")
    email_from = getattr(settings, "EMAIL_FROM", "noreply@virens.app")

    if not smtp_host or not smtp_user:
        logger.info("Email skipped (SMTP not configured)", to=to, subject=subject)
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Virens <{email_from}>"
    msg["To"] = to

    if text:
        msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(email_from, to, msg.as_string())
    return True


# ── Transactional templates ───────────────────────────────────

async def send_welcome_email(to: str, display_name: str) -> bool:
    return await send_email(
        to=to,
        subject="Welcome to Virens",
        html=_build_html(
            title=f"Welcome, {display_name}",
            body="Your account is ready. Start uploading your work, set your download permissions, and connect with creators worldwide.",
            cta_text="Go to Virens",
            cta_url="https://virens.app",
        ),
    )


async def send_payout_confirmation(to: str, amount: float, reference: str) -> bool:
    return await send_email(
        to=to,
        subject=f"Payout of ₦{amount:,.0f} initiated",
        html=_build_html(
            title="Your payout is on the way",
            body=f"We've initiated a payout of <strong style='color:#1DB954'>₦{amount:,.0f}</strong> to your linked bank account.<br><br>Reference: <code>{reference}</code><br>Allow 1–3 business days for processing.",
        ),
    )


async def send_copyright_notice(to: str, pin_title: str, reason: str) -> bool:
    return await send_email(
        to=to,
        subject="Your pin has been removed",
        html=_build_html(
            title="Content Removal Notice",
            body=f"Your pin <strong>\"{pin_title}\"</strong> has been removed following a copyright report.<br><br>Reason: {reason}<br><br>If you believe this was a mistake, you can submit an appeal from your dashboard.",
            cta_text="Submit Appeal",
            cta_url="https://virens.app/settings",
        ),
    )


async def send_password_reset(to: str, reset_token: str) -> bool:
    return await send_email(
        to=to,
        subject="Reset your Virens password",
        html=_build_html(
            title="Password Reset Request",
            body="We received a request to reset your password. Click the button below to continue. This link expires in 1 hour.",
            cta_text="Reset Password",
            cta_url=f"https://virens.app/reset-password?token={reset_token}",
        ),
    )
