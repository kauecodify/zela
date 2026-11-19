"""
Zela Nacional - MATCH Service
Servico de roteamento inteligente de ocorrencias usando IA
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from src.routes import match, health, training
from src.config import settings
from src.services.logger import get_logger

logger = get_logger(__name__)

# Criar aplicacao FastAPI
app = FastAPI(
    title="Zela Nacional - MATCH Service",
    description="MATCH Engine - Inteligencia de Roteamento para Zela Nacional",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware GZip
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Incluir rotas
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(match.router, prefix="/api/match", tags=["match"])
app.include_router(training.router, prefix="/api/training", tags=["training"])


@app.on_event("startup")
async def startup_event():
    """Evento de startup"""
    logger.info("MATCH Service starting up...")
    
    # Inicializar modelos
    from src.services.match_engine import MatchEngine
    engine = MatchEngine()
    
    # Carregar modelos treinados
    try:
        await engine.load_models()
        logger.info("Models loaded successfully")
    except Exception as e:
        logger.error(f"Error loading models: {e}")
    
    logger.info(f"MATCH Service running on port {settings.PORT}")


@app.on_event("shutdown")
async def shutdown_event():
    """Evento de shutdown"""
    logger.info("MATCH Service shutting down...")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        workers=settings.WORKERS
    )
