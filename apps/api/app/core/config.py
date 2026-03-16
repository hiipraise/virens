from pydantic_settings import BaseSettings
from typing import List, Dict


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Virens"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production-min-32-chars"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "https://virens.app"]

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "virens"

    # JWT
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Paystack
    PAYSTACK_SECRET_KEY: str = ""
    PAYSTACK_PUBLIC_KEY: str = ""
    PAYSTACK_WEBHOOK_SECRET: str = ""

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Stripe Price IDs (set in Stripe dashboard)
    STRIPE_PRICE_ID_BASIC: str = "price_basic_1500"
    STRIPE_PRICE_ID_PRO: str = "price_pro_4500"
    STRIPE_PRICE_ID_CREATOR_SUPPORT: str = "price_creator_9000"

    # Groq AI
    GROQ_API_KEY: str = ""

    # OpenRouter
    OPENROUTER_API_KEY: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # File limits
    MAX_FILE_SIZE_MB: int = 100
    MAX_VIDEO_DURATION_SECONDS: int = 300

    # Payout limits
    MINIMUM_PAYOUT_NGN: int = 10000

    # Subscription prices (NGN)
    SUBSCRIPTION_BASIC_NGN: int = 1500
    SUBSCRIPTION_PRO_NGN: int = 4500
    SUBSCRIPTION_CREATOR_SUPPORT_NGN: int = 9000

    # Ad pricing (NGN)
    AD_MIN_BUDGET_NGN: int = 5000
    AD_MAX_BUDGET_NGN: int = 50000

    @property
    def STRIPE_PRICE_IDS(self) -> Dict[str, str]:
        return {
            "basic": self.STRIPE_PRICE_ID_BASIC,
            "pro": self.STRIPE_PRICE_ID_PRO,
            "creator_support": self.STRIPE_PRICE_ID_CREATOR_SUPPORT,
        }

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
