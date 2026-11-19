"""Rotas do MATCH Service"""

from .match import router as match_router
from .health import router as health_router
from .training import router as training_router

__all__ = ["match_router", "health_router", "training_router"]
