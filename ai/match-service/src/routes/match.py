"""Rota de MATCH"""

import time
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.responses import JSONResponse
from typing import List

from src.schemas.match import MatchRequest, MatchResponse, MatchBatchRequest, MatchBatchResponse
from src.services.match_engine import MatchEngine
from src.services.logger import get_logger
from src.config import settings

logger = get_logger(__name__)

router = APIRouter()

# Instancia do engine (sera inicializado no startup)
_engine: MatchEngine = None


def get_engine() -> MatchEngine:
    """Retorna a instancia do MatchEngine"""
    global _engine
    if _engine is None:
        _engine = MatchEngine()
    return _engine


@router.post("/", response_model=MatchResponse)
async def match_occurrence(
    request: MatchRequest,
    engine: MatchEngine = Depends(get_engine)
) -> MatchResponse:
    """
    MATCH - Roteamento Inteligente de Ocorrencias
    
    Este endpoint recebe os dados de uma ocorrencia e determina:
    - Qual consorcio deve tratar
    - Qual client (prefeitura ou concessionaria) deve tratar
    - Qual a prioridade
    - Qual o SLA
    - Confianca da decisao
    
    Args:
        request: MatchRequest com os dados da ocorrencia
        
    Returns:
        MatchResponse com a decisao de roteamento
        
    Raises:
        HTTPException: Se a requisicao for invalida
    """
    
    try:
        start_time = time.time()
        
        logger.info(f"Processing MATCH request for consortium {request.consortium_id}")
        
        # Executar MATCH
        response = await engine.match(request)
        
        processing_time = (time.time() - start_time) * 1000
        logger.info(f"MATCH completed in {processing_time:.2f}ms | Confidence: {response.confidence:.2f}")
        
        return response
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing MATCH request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/batch", response_model=MatchBatchResponse)
async def match_batch(
    request: MatchBatchRequest,
    engine: MatchEngine = Depends(get_engine)
) -> MatchBatchResponse:
    """
    MATCH Batch - Processamento em lote
    
    Processa multiplas ocorrencias em lote para melhor performance.
    
    Args:
        request: MatchBatchRequest com lista de ocorrencias
        
    Returns:
        MatchBatchResponse com resultados do processamento
        
    Raises:
        HTTPException: Se a requisicao for invalida
    """
    
    try:
        start_time = time.time()
        
        logger.info(f"Processing MATCH batch with {len(request.occurrences)} occurrences")
        
        # Executar MATCH em batch
        responses, errors = await engine.match_batch(request.occurrences)
        
        processing_time = (time.time() - start_time) * 1000
        logger.info(
            f"MATCH batch completed in {processing_time:.2f}ms | "
            f"Success: {len(responses)}, Failed: {len(errors)}"
        )
        
        return MatchBatchResponse(
            results=responses,
            total_processed=len(request.occurrences),
            total_success=len(responses),
            total_failed=len(errors),
            errors=errors
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing MATCH batch: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/validate")
async def validate_match(
    request: MatchRequest,
    engine: MatchEngine = Depends(get_engine)
):
    """
    Valida uma decisao de MATCH
    
    Este endpoint valida se uma decisao de roteamento e valida.
    
    Args:
        request: MatchRequest com os dados da ocorrencia
        
    Returns:
        Dict com status da validacao
    """
    
    try:
        # Por enquanto, apenas verifica se a decisao pode ser tomada
        response = await engine.match(request)
        
        return JSONResponse(
            content={
                "valid": True,
                "consortium_id": response.consortium_id,
                "client_id": response.client_id,
                "confidence": response.confidence
            },
            status_code=200
        )
        
    except Exception as e:
        logger.error(f"Error validating MATCH: {e}")
        return JSONResponse(
            content={"valid": False, "error": str(e)},
            status_code=400
        )
