from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import structlog

from app.core.config import settings
from app.models.user import User
from app.models.pin import Pin
from app.models.collection import Collection
from app.models.report import Report
from app.models.ad import Ad
from app.models.subscription import Subscription
from app.models.payout import Payout
from app.models.follow import Follow
from app.models.engagement import Like, Save, Repost
from app.models.notification import Notification
from app.models.comment import Comment

logger = structlog.get_logger()

_client: AsyncIOMotorClient | None = None


async def init_db():
    global _client
    logger.info("Connecting to MongoDB", url=settings.MONGODB_URL[:30] + "...")
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = _client[settings.MONGODB_DB]

    await init_beanie(
        database=db,
        document_models=[
            User, Pin, Collection, Report, Ad,
            Subscription, Payout, Follow,
            Like, Save, Repost,
            Notification, Comment,
        ],
    )
    logger.info("MongoDB connected and Beanie initialised")


async def get_db():
    if _client is None:
        raise RuntimeError("Database not initialised")
    return _client[settings.MONGODB_DB]
