"""Schemas para treinamento"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TrainingRequest(BaseModel):
    """Request para treinamento"""
    
    # Dados de treinamento
    data_path: Optional[str] = Field(None, description="Caminho para os dados de treinamento")
    data_url: Optional[str] = Field(None, description="URL para os dados de treinamento")
    
    # Parametros
    model_name: str = Field("match_model", description="Nome do modelo")
    epochs: int = Field(10, description="Numero de epochs", ge=1, le=100)
    batch_size: int = Field(32, description="Tamanho do batch", ge=1, le=256)
    learning_rate: float = Field(0.001, description="Taxa de aprendizado", ge=0.0001, le=0.1)
    
    # Validacao
    test_size: float = Field(0.2, description="Proporcao para teste", ge=0.1, le=0.5)
    
    # Callbacks
    save_model: bool = Field(True, description="Salvar modelo apos treinamento")
    save_path: Optional[str] = Field(None, description="Caminho para salvar o modelo")


class ModelInfo(BaseModel):
    """Informacoes do modelo"""
    
    name: str = Field(..., description="Nome do modelo")
    version: str = Field(..., description="Versao do modelo")
    path: str = Field(..., description="Caminho do modelo")
    size_mb: float = Field(..., description="Tamanho do modelo em MB")
    created_at: datetime = Field(..., description="Data de criacao")
    accuracy: Optional[float] = Field(None, description="Acuracia do modelo")
    f1_score: Optional[float] = Field(None, description="F1 score do modelo")


class TrainingResponse(BaseModel):
    """Response do treinamento"""
    
    status: str = Field(..., description="Status do treinamento")
    model_info: Optional[ModelInfo] = Field(None, description="Informacoes do modelo treinado")
    
    # Metricas
    training_time_seconds: float = Field(..., description="Tempo de treinamento em segundos")
    train_accuracy: Optional[float] = Field(None, description="Acuracia no conjunto de treinamento")
    test_accuracy: Optional[float] = Field(None, description="Acuracia no conjunto de teste")
    train_f1: Optional[float] = Field(None, description="F1 score no conjunto de treinamento")
    test_f1: Optional[float] = Field(None, description="F1 score no conjunto de teste")
    
    # Logs
    logs: List[str] = Field(default_factory=list, description="Logs do treinamento")
    errors: List[str] = Field(default_factory=list, description="Erros durante o treinamento")
