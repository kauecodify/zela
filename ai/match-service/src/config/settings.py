"""Configuracoes do MATCH Service"""

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Configuracoes do MATCH Service"""
    
    # Ambiente
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Servidor
    HOST: str = "0.0.0.0"
    PORT: int = 3003
    WORKERS: int = 4
    LOG_LEVEL: str = "INFO"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
    
    # Banco de Dados
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/zela_nacional?schema=public"
    
    # Autenticacao
    API_KEY: str = "zela-match-secret-change-in-production"
    JWT_SECRET: str = "zela-secret-key-change-in-production"
    
    # Integracao com outros servicos
    ROUTING_SERVICE_URL: str = "http://routing-service:3002"
    ANALYTICS_SERVICE_URL: str = "http://analytics-service:3008"
    
    # Modelos
    MODEL_DIR: str = "./models"
    USE_GPU: bool = False
    
    # Limiares
    CONFIDENCE_THRESHOLD: float = 0.7
    HUMAN_REVIEW_THRESHOLD: float = 0.6
    
    # Cache
    CACHE_ENABLED: bool = True
    CACHE_TTL: int = 3600  # 1 hora
    
    # Rate Limiting
    RATE_LIMIT: int = 1000  # requests por minuto
    
    # Guardrails
    MAX_INPUT_LENGTH: int = 10000
    MAX_BATCH_SIZE: int = 100


@lru_cache()
def get_settings() -> Settings:
    """Retorna as configuracoes (cacheado)"""
    return Settings()


settings = get_settings()
