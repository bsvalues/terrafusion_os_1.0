import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Identity
    APP_NAME: str = "TerraFusion Bridge"
    ENV: str = "dev"
    
    # Security
    TF_BRIDGE_KEY: Optional[str] = None
    
    # PACS Connection (Legacy Iron)
    PACS_HOST: str = "jcharrispacs"
    PACS_DB: str = "pacs_training"
    PACS_USER: Optional[str] = None
    PACS_PASSWORD: Optional[str] = None
    PACS_DRIVER: str = "ODBC Driver 17 for SQL Server"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
