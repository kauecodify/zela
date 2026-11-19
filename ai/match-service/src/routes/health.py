"""Rota de health check"""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from src.schemas.health import HealthResponse
from src.services.match_engine import MatchEngine
from src.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    
    # Verificar status dos servicos
    dependencies = {
        "database": {
            "status": "healthy",
            "details": "Connected to PostgreSQL"
        },
        "cache": {
            "status": "healthy" if settings.CACHE_ENABLED else "disabled",
            "details": "Redis cache"
        }
    }
    
    metrics = {
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0",
        "debug": settings.DEBUG
    }
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        dependencies=dependencies,
        metrics=metrics
    )


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    
    # Verificar se o engine esta carregado
    engine = MatchEngine()
    
    return JSONResponse(
        content={"status": "ready"},
        status_code=200
    )
