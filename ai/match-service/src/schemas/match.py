"""Schemas para o endpoint de MATCH"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum


class RiskLevel(str, Enum):
    """Niveis de risco"""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ClientType(str, Enum):
    """Tipos de client"""
    PREFEITURA = "PREFEITURA"
    CONCESSIONARIA = "CONCESSIONARIA"
    EMPRESA = "EMPRESA"
    OUTRO = "OUTRO"


class MatchRequest(BaseModel):
    """Request para o endpoint de MATCH"""
    
    # Identificacao
    consortium_id: str = Field(..., description="ID do consortium")
    occurrence_id: Optional[str] = Field(None, description="ID da ocorrencia (opcional)")
    
    # Categoria
    category_code: str = Field(..., description="Codigo da categoria")
    subcategory_code: Optional[str] = Field(None, description="Codigo da subcategoria")
    
    # Localizacao
    latitude: Optional[float] = Field(None, description="Latitude")
    longitude: Optional[float] = Field(None, description="Longitude")
    address: Optional[str] = Field(None, description="Endereco")
    municipality_id: Optional[str] = Field(None, description="ID do municipio")
    census_sector_id: Optional[str] = Field(None, description="ID do setor censitario")
    
    # Descricao
    title: Optional[str] = Field(None, description="Titulo da ocorrencia")
    description: Optional[str] = Field(None, description="Descricao da ocorrencia")
    
    # Risco
    risk_level: RiskLevel = Field(RiskLevel.LOW, description="Nivel de risco")
    
    # Contexto adicional
    municipality_population: Optional[int] = Field(None, description="Populacao do municipio")
    municipality_area: Optional[float] = Field(None, description="Area do municipio em km2")
    
    # Metadados
    created_by: Optional[str] = Field(None, description="ID do usuario que criou")
    
    @field_validator('latitude')
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -90 or v > 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v
    
    @field_validator('longitude')
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -180 or v > 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v
    
    @field_validator('municipality_population')
    @classmethod
    def validate_population(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError('Population must be positive')
        return v
    
    @field_validator('municipality_area')
    @classmethod
    def validate_area(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError('Area must be positive')
        return v


class MatchResponse(BaseModel):
    """Response do endpoint de MATCH"""
    
    # Decisao
    consortium_id: str = Field(..., description="ID do consortium responsavel")
    client_id: str = Field(..., description="ID do client responsavel")
    
    # Prioridade
    priority_score: int = Field(..., description="Score de prioridade (0-100)", ge=0, le=100)
    sla_hours: int = Field(..., description="Horas para SLA")
    
    # Confianca
    confidence: float = Field(..., description="Confianca da decisao (0-1)", ge=0, le=1)
    needs_human_review: bool = Field(..., description="Precisa de revisao humana")
    
    # Explicacao
    explanation: str = Field(..., description="Explicacao da decisao")
    
    # Metadados
    model_version: str = Field(..., description="Versao do modelo")
    processing_time_ms: float = Field(..., description="Tempo de processamento em ms")
    
    # Dados adicionais
    reincidence_score: float = Field(..., description="Score de reincidencia (0-1)")
    current_load: int = Field(..., description="Carga atual do client")
    
    # Audit
    decision_timestamp: str = Field(..., description="Timestamp da decisao")


class MatchBatchRequest(BaseModel):
    """Request para processamento em batch"""
    
    occurrences: List[MatchRequest] = Field(..., description="Lista de ocorrencias para rotear")
    
    @field_validator('occurrences')
    @classmethod
    def validate_batch_size(cls, v: List[MatchRequest]) -> List[MatchRequest]:
        from src.config import settings
        if len(v) > settings.MAX_BATCH_SIZE:
            raise ValueError(f'Batch size cannot exceed {settings.MAX_BATCH_SIZE}')
        return v


class MatchBatchResponse(BaseModel):
    """Response para processamento em batch"""
    
    results: List[MatchResponse] = Field(..., description="Resultados do roteamento")
    total_processed: int = Field(..., description="Total de ocorrencias processadas")
    total_success: int = Field(..., description="Total de ocorrencias processadas com sucesso")
    total_failed: int = Field(..., description="Total de ocorrencias com erro")
    errors: List[str] = Field(default_factory=list, description="Lista de erros")
