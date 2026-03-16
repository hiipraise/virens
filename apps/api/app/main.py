"""
Virens API — Creator-centric visual discovery platform
FastAPI + MongoDB (Beanie ODM) backend
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog

from app.core.config import settings
from app.core.database import init_db
from app.core.logging import configure_logging
from app.core.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)
from app.middleware.auth import AuthMiddleware
from app.routers import (
    auth, users, pins, feed, collections, search,
    ads, payments, reports, admin, tags, analytics,
)
from app.routers.comments import router as comments_router
from app.routers.notifications import router as notifications_router
from app.routers.webhooks import router as webhooks_router

configure_logging()
logger = structlog.get_logger()

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Virens API", version=settings.APP_VERSION)
    await init_db()
    yield
    logger.info("Shutting down Virens API")


app = FastAPI(
    title="Virens API",
    description="Creator-centric visual discovery platform API",
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Custom exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(AuthMiddleware)

# Routers
API_PREFIX = "/v1"
app.include_router(auth.router,                   prefix=f"{API_PREFIX}/auth",          tags=["auth"])
app.include_router(users.router,                  prefix=f"{API_PREFIX}/users",         tags=["users"])
app.include_router(pins.router,                   prefix=f"{API_PREFIX}/pins",          tags=["pins"])
app.include_router(feed.router,                   prefix=f"{API_PREFIX}/feed",          tags=["feed"])
app.include_router(collections.router,            prefix=f"{API_PREFIX}/collections",   tags=["collections"])
app.include_router(search.router,                 prefix=f"{API_PREFIX}/search",        tags=["search"])
app.include_router(ads.router,                    prefix=f"{API_PREFIX}/ads",           tags=["ads"])
app.include_router(payments.router,               prefix=f"{API_PREFIX}/payments",      tags=["payments"])
app.include_router(reports.router,                prefix=f"{API_PREFIX}/reports",       tags=["reports"])
app.include_router(admin.router,                  prefix=f"{API_PREFIX}/admin",         tags=["admin"])
app.include_router(tags.router,                   prefix=f"{API_PREFIX}/tags",          tags=["tags"])
app.include_router(analytics.router,              prefix=f"{API_PREFIX}/analytics",     tags=["analytics"])
app.include_router(comments_router,               prefix=f"{API_PREFIX}/comments",      tags=["comments"])
app.include_router(notifications_router,          prefix=f"{API_PREFIX}/notifications", tags=["notifications"])
app.include_router(webhooks_router,               prefix=f"{API_PREFIX}/webhooks",       tags=["webhooks"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
