"""
Virens API Tests
Run with: pytest apps/api/tests/ -v
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.auth import hash_password, verify_password, create_access_token


# ── Unit tests ────────────────────────────────────────────────

class TestPasswordHashing:
    def test_hash_and_verify(self):
        pwd = "SecurePass123"
        hashed = hash_password(pwd)
        assert hashed != pwd
        assert verify_password(pwd, hashed)

    def test_wrong_password_fails(self):
        hashed = hash_password("correctpassword1")
        assert not verify_password("wrongpassword", hashed)


class TestJWT:
    def test_create_and_decode(self):
        from app.core.auth import decode_token
        token = create_access_token("user123")
        payload = decode_token(token)
        assert payload["sub"] == "user123"
        assert payload["type"] == "access"

    def test_invalid_token_raises(self):
        from app.core.auth import decode_token
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            decode_token("not.a.valid.token")


class TestReportPriority:
    def test_copyright_gets_high_priority(self):
        from app.algorithms.report_priority import compute_report_priority
        priority = compute_report_priority(
            reason="copyright",
            reporter_credibility=8.0,
            reporter_is_verified=True,
            existing_reports_on_target=2,
        )
        assert priority >= 9

    def test_spam_gets_low_priority(self):
        from app.algorithms.report_priority import compute_report_priority
        priority = compute_report_priority(
            reason="spam",
            reporter_credibility=3.0,
            reporter_is_verified=False,
            existing_reports_on_target=0,
        )
        assert priority <= 5

    def test_verified_reporter_increases_priority(self):
        from app.algorithms.report_priority import compute_report_priority
        p_verified = compute_report_priority("harassment", 5.0, True, 0)
        p_unverified = compute_report_priority("harassment", 5.0, False, 0)
        assert p_verified > p_unverified

    def test_auto_flag_threshold(self):
        from app.algorithms.report_priority import should_auto_flag
        assert should_auto_flag(8) is True
        assert should_auto_flag(7) is False


class TestFormatting:
    def test_paginate_helper(self):
        from app.utils.pagination import paginate
        result = paginate(total=100, page=2, page_size=10)
        assert result["hasNext"] is True
        assert result["hasPrev"] is True
        assert result["total"] == 100

    def test_slugify(self):
        from app.utils.slugify import slugify
        assert slugify("Hello World!") == "hello-world"
        assert slugify("  Spaces  &  Things  ") == "spaces-things"


# ── Integration tests (require running MongoDB) ───────────────

@pytest.mark.asyncio
@pytest.mark.integration
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
@pytest.mark.integration
async def test_register_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register
        reg = await client.post("/v1/auth/register", json={
            "username": "testuser99",
            "email": "test99@virens.app",
            "password": "TestPass123",
            "displayName": "Test User",
        })
        assert reg.status_code in (201, 400)  # 400 if already exists

        # Login
        login = await client.post("/v1/auth/login", json={
            "email": "test99@virens.app",
            "password": "TestPass123",
        })
        if login.status_code == 200:
            data = login.json()
            assert "access_token" in data
            assert "user" in data
            assert data["user"]["username"] == "testuser99"


@pytest.mark.asyncio
@pytest.mark.integration
async def test_unauthenticated_upload_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/v1/pins/upload")
    assert response.status_code in (401, 403, 422)


@pytest.mark.asyncio
@pytest.mark.integration
async def test_feed_returns_paginated():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/v1/feed?mode=latest&page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "hasNext" in data
