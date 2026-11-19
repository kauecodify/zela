"""Servico de banco de dados"""

import asyncio
import aioredis
from typing import Optional, Any
from src.config import settings
from src.services.logger import get_logger

logger = get_logger(__name__)


class DatabaseService:
    """Servico de conexao com o banco de dados PostgreSQL"""
    
    def __init__(self):
        self._pool = None
        self._connected = False
    
    async def connect(self) -> None:
        """Conecta ao banco de dados"""
        if self._connected:
            return
        
        try:
            # Importar asyncpg
            import asyncpg
            
            self._pool = await asyncpg.create_pool(
                dsn=settings.DATABASE_URL,
                min_size=5,
                max_size=20,
                max_queries=50000,
                max_inactive_connection_lifetime=300
            )
            self._connected = True
            logger.info("Connected to PostgreSQL database")
        except Exception as e:
            logger.error(f"Error connecting to database: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Desconecta do banco de dados"""
        if not self._connected:
            return
        
        try:
            await self._pool.close()
            self._connected = False
            logger.info("Disconnected from PostgreSQL database")
        except Exception as e:
            logger.error(f"Error disconnecting from database: {e}")
            raise
    
    async def execute(self, query: str, *args: Any) -> Any:
        """Executa uma query"""
        if not self._connected:
            await self.connect()
        
        async with self._pool.acquire() as connection:
            return await connection.execute(query, *args)
    
    async def fetch(self, query: str, *args: Any) -> list:
        """Busca resultados de uma query"""
        if not self._connected:
            await self.connect()
        
        async with self._pool.acquire() as connection:
            return await connection.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args: Any) -> Optional[dict]:
        """Busca uma linha de uma query"""
        if not self._connected:
            await self.connect()
        
        async with self._pool.acquire() as connection:
            return await connection.fetchrow(query, *args)
    
    async def fetchval(self, query: str, *args: Any) -> Any:
        """Busca um valor de uma query"""
        if not self._connected:
            await self.connect()
        
        async with self._pool.acquire() as connection:
            return await connection.fetchval(query, *args)


# Instancia global
_db_service: Optional[DatabaseService] = None


def get_database() -> DatabaseService:
    """Retorna a instancia do DatabaseService"""
    global _db_service
    if _db_service is None:
        _db_service = DatabaseService()
    return _db_service
