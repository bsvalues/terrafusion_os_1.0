"""
TerraFusion AI Engine Configuration
Environment-based configuration with validation
"""

import os
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0", env="AI_HOST")
    PORT: int = Field(default=8001, env="AI_PORT")
    DEBUG: bool = Field(default=False, env="AI_DEBUG")
    
    # Database Configuration
    DATABASE_URL: str = Field(env="DATABASE_URL", default="postgresql://localhost/terrafusion")
    DB_POOL_SIZE: int = Field(default=20, env="DB_POOL_SIZE")
    DB_POOL_OVERFLOW: int = Field(default=10, env="DB_POOL_OVERFLOW")
    
    # Security Configuration
    SECRET_KEY: str = Field(env="SECRET_KEY")
    JWT_SECRET: str = Field(env="JWT_SECRET")
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000"], env="CORS_ORIGINS")
    ENABLE_DOCS: bool = Field(default=True, env="ENABLE_DOCS")
    ACCESS_LOG: bool = Field(default=True, env="ACCESS_LOG")
    
    # Quantum Computing Configuration
    QUANTUM_ENABLED: bool = Field(default=True, env="QUANTUM_ENABLED")
    QUANTUM_BACKEND: str = Field(default="aer_simulator", env="QUANTUM_BACKEND")
    QUANTUM_SHOTS: int = Field(default=1024, env="QUANTUM_SHOTS")
    QUANTUM_MAX_QUBITS: int = Field(default=20, env="QUANTUM_MAX_QUBITS")
    
    # Machine Learning Configuration
    ML_MODEL_PATH: str = Field(default="./models", env="ML_MODEL_PATH")
    PRELOAD_MODELS: bool = Field(default=True, env="PRELOAD_MODELS")
    GPU_ENABLED: bool = Field(default=False, env="GPU_ENABLED")
    BATCH_SIZE: int = Field(default=32, env="BATCH_SIZE")
    MAX_WORKERS: int = Field(default=4, env="MAX_WORKERS")
    
    # Performance Configuration
    REQUEST_TIMEOUT: int = Field(default=30, env="REQUEST_TIMEOUT")
    CACHE_TTL: int = Field(default=300, env="CACHE_TTL")  # 5 minutes
    MAX_CONCURRENT_REQUESTS: int = Field(default=100, env="MAX_CONCURRENT_REQUESTS")
    
    # Monitoring and Telemetry
    TELEMETRY_ENDPOINT: Optional[str] = Field(default=None, env="TELEMETRY_ENDPOINT")
    METRICS_PORT: int = Field(default=9090, env="METRICS_PORT")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    ENABLE_TRACING: bool = Field(default=True, env="ENABLE_TRACING")
    
    # Redis Configuration (for caching and task queues)
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    REDIS_POOL_SIZE: int = Field(default=10, env="REDIS_POOL_SIZE")
    
    # Feature Flags
    ENABLE_QUANTUM_SIMULATION: bool = Field(default=True, env="ENABLE_QUANTUM_SIMULATION")
    ENABLE_ML_PREDICTIONS: bool = Field(default=True, env="ENABLE_ML_PREDICTIONS")
    ENABLE_REAL_TIME_PROCESSING: bool = Field(default=True, env="ENABLE_REAL_TIME_PROCESSING")
    ENABLE_BATCH_PROCESSING: bool = Field(default=True, env="ENABLE_BATCH_PROCESSING")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()

# Validation
if not settings.SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")

if not settings.JWT_SECRET:
    raise ValueError("JWT_SECRET environment variable must be set")

# Export for easy importing
__all__ = ["settings"]
