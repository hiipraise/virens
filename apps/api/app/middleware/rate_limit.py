"""
Virens Rate Limiting Configuration
Uses slowapi (Redis-backed in production) with per-endpoint limits.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Global limiter instance (imported by routers)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],
    storage_uri="memory://",  # Switch to Redis in production: "redis://localhost:6379"
)

# Endpoint-specific limit decorators — use as:
# @router.post("/login")
# @limiter.limit("10/minute")
AUTH_LIMIT = "10/minute"
UPLOAD_LIMIT = "30/hour"
REPORT_LIMIT = "20/hour"
SEARCH_LIMIT = "60/minute"
FEED_LIMIT = "120/minute"
API_LIMIT = "200/minute"
