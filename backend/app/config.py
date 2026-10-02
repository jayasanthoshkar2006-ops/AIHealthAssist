import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Personal Health & Wellness Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./healthassist.db")
    
    # Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-in-production-32bytes-min")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # AI Config
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto") # auto, gemini, local
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    SEARCH_API_KEY: str = os.getenv("SEARCH_API_KEY", "")
    
    # App Settings
    DEFAULT_LANGUAGE: str = "en" # en, ta
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
