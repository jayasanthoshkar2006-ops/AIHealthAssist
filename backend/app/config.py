import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Personal Health & Wellness Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./healthassist.db")

    # Email security notifications (Gmail API over HTTPS)
    GMAIL_CLIENT_ID: str = os.getenv("GMAIL_CLIENT_ID", "")
    GMAIL_CLIENT_SECRET: str = os.getenv("GMAIL_CLIENT_SECRET", "")
    GMAIL_REFRESH_TOKEN: str = os.getenv("GMAIL_REFRESH_TOKEN", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://jayasanthoshkar2006-ops.github.io/AIHealthAssist/")

    # Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-in-production-32bytes-min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # AI Config
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "groq")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    SEARCH_API_KEY: str = os.getenv("SEARCH_API_KEY", "")

    # App Settings
    DEFAULT_LANGUAGE: str = "en"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
