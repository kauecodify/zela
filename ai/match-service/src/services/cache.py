"""Servico de cache Redis"""

import json
import asyncio
from typing import Optional, Any, Dict
from src.config import settings
from src.services.logger import get_logger

logger = get_logger(__name__)


class CacheService:
    """Servico de cache Redis"""
    
    def __init__(self):
        self._redis: Optional[Any] = None
        self._connected = False
    
    async def connect(self) -> None:
        """Conecta ao Redis"""
        if self._connected or not settings.CACHE_ENABLED:
            return
        
        try:
            import aioredis
            
            self._redis = await aioredis.from_url(
                "redis://localhost:6379",
                encoding="utf-8",
                decode_responses=True
            )
            self._connected = True
            logger.info("Connected to Redis cache")
        except Exception as e:
            logger.warning(f"Could not connect to Redis: {e}")
            self._connected = False
    
    async def disconnect(self) -> None:
        """Desconecta do Redis"""
        if not self._connected:
            return
        
        try:
            await self._redis.close()
            self._connected = False
            logger.info("Disconnected from Redis cache")
        except Exception as e:
            logger.error(f"Error disconnecting from Redis: {e}")
            raise
    
    async def get(self, key: str) -> Optional[Any]:
        """Obtem um valor do cache"""
        if not self._connected or not settings.CACHE_ENABLED:
            return None
        
        try:
            value = await self._redis.get(key)
            if value is None:
                return None
            return json.loads(value)
        except Exception as e:
            logger.error(f"Error getting from cache: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Seta um valor no cache"""
        if not self._connected or not settings.CACHE_ENABLED:
            return False
        
        try:
            ttl = ttl or settings.CACHE_TTL
            await self._redis.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Error setting cache: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Remove um valor do cache"""
        if not self._connected or not settings.CACHE_ENABLED:
            return False
        
        try:
            await self._redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error deleting from cache: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Verifica se uma chave existe no cache"""
        if not self._connected or not settings.CACHE_ENABLED:
            return False
        
        try:
            return await self._redis.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking cache: {e}")
            return False


# Instancia global
_cache_service: Optional[CacheService] = None


def get_cache() -> CacheService:
    """Retorna a instancia do CacheService"""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
