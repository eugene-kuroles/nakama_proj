"""
Application configuration using Pydantic Settings
"""
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database (SQLite for local dev, PostgreSQL for production)
    database_url: str = Field(
        default="sqlite+aiosqlite:///./spellit.db",
        alias="DATABASE_URL"
    )
    
    # JWT Configuration
    jwt_secret_key: str = Field(default="your-secret-key-change-in-production", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=240, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=7, alias="REFRESH_TOKEN_EXPIRE_DAYS")
    
    # nakama API
    nakama_api_url: str = Field(default="https://api.spellit.ai", alias="NAKAMA_API_URL")
    nakama_api_key: str = Field(default="", alias="NAKAMA_API_KEY")
    
    # Redis (for Celery)
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    
    # CORS
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    
    # Environment
    env: str = Field(default="development", alias="ENV")
    debug: bool = Field(default=True, alias="DEBUG")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
