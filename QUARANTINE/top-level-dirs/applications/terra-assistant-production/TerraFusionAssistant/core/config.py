import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class SystemConfig:
    app_name: str = "TerraFusionPlatform ICSF"
    version: str = "2.0.0"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 5000
    
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    database_url: Optional[str] = None
    
    session_timeout: int = 3600
    max_concurrent_tasks: int = 10
    
    def __post_init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.database_url = os.getenv("DATABASE_URL")
        self.debug = os.getenv("DEBUG", "false").lower() == "true"

config = SystemConfig()