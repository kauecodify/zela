"""Schemas para health check"""

from pydantic import BaseModel, Field
from typing import Dict, Any


class HealthResponse(BaseModel):
    """Response do health check"""
    
    status: str = Field(..., description="Status do servico")
    version: str = Field(..., description="Versao do servico")
    
    # Dependencias
    dependencies: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict,
        description="Status das dependencias"
    )
    
    # Metricas
    metrics: Dict[str, Any] = Field(
        default_factory=dict,
        description="Metricas do servico"
    )
