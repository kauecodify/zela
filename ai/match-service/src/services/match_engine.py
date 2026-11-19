"""
MATCH Engine - Inteligencia de Roteamento

Este modulo implementa o algoritmo de roteamento inteligente para o Zela Nacional.
Usa uma combinacao de regras, heurísticas e modelos de ML para determinar:
- Qual consorcio deve tratar a ocorrencia
- Qual client (prefeitura ou concessionaria) deve tratar
- Qual a prioridade
- Qual o SLA
"""

import time
import json
import asyncio
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from dataclasses import dataclass

from src.config import settings
from src.services.logger import get_logger
from src.services.database import get_database
from src.services.cache import get_cache
from src.schemas.match import MatchRequest, MatchResponse

logger = get_logger(__name__)


@dataclass
class MatchContext:
    """Contexto para o MATCH"""
    
    # Dados de entrada
    request: MatchRequest
    
    # Dados do consortium
    consortium: Optional[Dict[str, Any]] = None
    
    # Dados do municipio
    municipality: Optional[Dict[str, Any]] = None
    
    # Dados da categoria
    category: Optional[Dict[str, Any]] = None
    subcategory: Optional[Dict[str, Any]] = None
    
    # Clients elegiveis
    eligible_clients: List[Dict[str, Any]] = None
    
    # Matriz de competencias
    competence_matrix: List[Dict[str, Any]] = None
    
    # Carga de trabalho
    workload: Dict[str, int] = None
    
    # Historico de reincidencia
    reincidence_score: float = 0.0
    
    # Dados de geolocalizacao
    geolocation_data: Optional[Dict[str, Any]] = None


class MatchEngine:
    """MATCH Engine - Motor de roteamento inteligente"""
    
    def __init__(self):
        self._loaded = False
        self._models: Dict[str, Any] = {}
        self._db = get_database()
        self._cache = get_cache()
    
    async def load_models(self) -> None:
        """Carrega os modelos treinados"""
        logger.info("Loading MATCH models...")
        
        # Conectar ao banco de dados
        await self._db.connect()
        await self._cache.connect()
        
        # Carregar modelos (se existirem)
        # Por enquanto, usamos apenas logica baseada em regras
        # Futuramente, sera integrado com modelos de ML
        
        self._loaded = True
        logger.info("MATCH models loaded successfully")
    
    async def match(self, request: MatchRequest) -> MatchResponse:
        """
        Executa o MATCH para uma ocorrencia
        
        Args:
            request: MatchRequest com os dados da ocorrencia
            
        Returns:
            MatchResponse com a decisao de roteamento
        """
        start_time = time.time()
        
        if not self._loaded:
            await self.load_models()
        
        # Validar entrada
        self._validate_input(request)
        
        # Criar contexto
        context = await self._build_context(request)
        
        # Executar pipeline de decisao
        decision = await self._make_decision(context)
        
        # Calcular tempo de processamento
        processing_time = (time.time() - start_time) * 1000
        
        # Criar response
        response = MatchResponse(
            consortium_id=decision.consortium_id,
            client_id=decision.client_id,
            priority_score=decision.priority_score,
            sla_hours=decision.sla_hours,
            confidence=decision.confidence,
            needs_human_review=decision.needs_human_review,
            explanation=decision.explanation,
            model_version="1.0.0",
            processing_time_ms=round(processing_time, 2),
            reincidence_score=context.reincidence_score,
            current_load=context.workload.get(decision.client_id, 0),
            decision_timestamp=datetime.utcnow().isoformat() + "Z"
        )
        
        logger.info(f"MATCH completed in {processing_time:.2f}ms | Confidence: {decision.confidence:.2f}")
        
        return response
    
    async def match_batch(self, requests: List[MatchRequest]) -> Tuple[List[MatchResponse], List[str]]:
        """
        Executa MATCH para um batch de ocorrencias
        
        Args:
            requests: Lista de MatchRequest
            
        Returns:
            Tupla com (respostas, erros)
        """
        responses: List[MatchResponse] = []
        errors: List[str] = []
        
        for request in requests:
            try:
                response = await self.match(request)
                responses.append(response)
            except Exception as e:
                error_msg = f"Error processing occurrence {request.occurrence_id or 'unknown'}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        return responses, errors
    
    def _validate_input(self, request: MatchRequest) -> None:
        """Valida a entrada"""
        if not request.consortium_id:
            raise ValueError("consortium_id is required")
        
        if not request.category_code:
            raise ValueError("category_code is required")
        
        if request.latitude is not None and (request.latitude < -90 or request.latitude > 90):
            raise ValueError("Invalid latitude")
        
        if request.longitude is not None and (request.longitude < -180 or request.longitude > 180):
            raise ValueError("Invalid longitude")
        
        if request.description and len(request.description) > settings.MAX_INPUT_LENGTH:
            raise ValueError(f"description exceeds max length of {settings.MAX_INPUT_LENGTH}")
    
    async def _build_context(self, request: MatchRequest) -> MatchContext:
        """Constrói o contexto para o MATCH"""
        context = MatchContext(request=request)
        
        # Obter dados do consortium
        context.consortium = await self._get_consortium(request.consortium_id)
        
        # Obter dados do municipio
        if request.municipality_id:
            context.municipality = await self._get_municipality(request.municipality_id)
        
        # Obter dados da categoria
        context.category = await self._get_category(request.category_code)
        if request.subcategory_code:
            context.subcategory = await self._get_subcategory(request.subcategory_code)
        
        # Obter clients do consortium
        context.eligible_clients = await self._get_eligible_clients(
            request.consortium_id,
            request.category_code,
            request.subcategory_code
        )
        
        # Obter matriz de competencias
        context.competence_matrix = await self._get_competence_matrix(
            request.consortium_id,
            request.category_code,
            request.subcategory_code
        )
        
        # Obter carga de trabalho
        context.workload = await self._get_workload(request.consortium_id)
        
        # Calcular score de reincidencia
        context.reincidence_score = await self._calculate_reincidence_score(
            request.municipality_id,
            request.latitude,
            request.longitude,
            request.category_code
        )
        
        # Obter dados de geolocalizacao
        if request.latitude and request.longitude:
            context.geolocation_data = await self._get_geolocation_data(
                request.latitude,
                request.longitude
            )
        
        return context
    
    async def _make_decision(self, context: MatchContext) -> Dict[str, Any]:
        """
        Toma a decisao de roteamento
        
        Pipeline:
        1. Determinar consortium responsavel
        2. Determinar client responsavel
        3. Calcular prioridade
        4. Calcular SLA
        5. Calcular confianca
        """
        # Determinar consortium
        consortium_id = context.request.consortium_id
        
        # Determinar client
        client_id = await self._select_client(context)
        
        # Calcular prioridade
        priority_score = await self._calculate_priority(context, client_id)
        
        # Calcular SLA
        sla_hours = await self._calculate_sla(context, client_id)
        
        # Calcular confianca
        confidence, needs_human_review = self._calculate_confidence(context, client_id)
        
        # Gerar explicacao
        explanation = self._generate_explanation(context, client_id, priority_score, sla_hours, confidence)
        
        return {
            "consortium_id": consortium_id,
            "client_id": client_id,
            "priority_score": priority_score,
            "sla_hours": sla_hours,
            "confidence": round(confidence, 4),
            "needs_human_review": needs_human_review,
            "explanation": explanation
        }
    
    async def _select_client(self, context: MatchContext) -> str:
        """Seleciona o client mais adequado"""
        
        # Se nao houver clients elegiveis, usar o client padrao do consortium
        if not context.eligible_clients:
            default_client = await self._get_default_client(context.request.consortium_id)
            if default_client:
                return default_client["id"]
            raise ValueError("No eligible client found")
        
        # Se houver apenas um client elegivel, usar ele
        if len(context.eligible_clients) == 1:
            return context.eligible_clients[0]["id"]
        
        # Calcular scores para cada client
        client_scores = []
        for client in context.eligible_clients:
            score = await self._calculate_client_score(client, context)
            client_scores.append({
                "client_id": client["id"],
                "score": score,
                "client": client
            })
        
        # Ordenar por score e selecionar o melhor
        client_scores.sort(key=lambda x: x["score"], reverse=True)
        
        return client_scores[0]["client_id"]
    
    async def _calculate_client_score(self, client: Dict[str, Any], context: MatchContext) -> float:
        """Calcula o score para um client"""
        
        # Score de competencia (0-100)
        competence_score = await self._get_competence_score(client, context)
        
        # Score de carga (0-100, menos carga = melhor)
        workload_score = self._get_workload_score(client, context)
        
        # Score de reincidencia (0-20)
        reincidence_score = context.reincidence_score * 20
        
        # Score de risco (0-20)
        risk_score = self._get_risk_score(context.request.risk_level)
        
        # Score de proximidade (0-20)
        proximity_score = await self._get_proximity_score(client, context)
        
        # Score de SLA (0-20)
        sla_score = await self._get_sla_score(client, context)
        
        # Score total (peso: competencia 40%, carga 30%, outros 10% cada)
        total_score = (
            (competence_score * 0.4) +
            (workload_score * 0.3) +
            (reincidence_score * 0.1) +
            (risk_score * 0.1) +
            (proximity_score * 0.05) +
            (sla_score * 0.05)
        )
        
        return total_score
    
    async def _get_competence_score(self, client: Dict[str, Any], context: MatchContext) -> float:
        """Obtem o score de competencia do client para a categoria"""
        
        # Procurar na matriz de competencias
        for cm in context.competence_matrix:
            if cm["client_id"] == client["id"]:
                if cm["category_id"] == context.request.category_code:
                    if context.request.subcategory_code:
                        if cm["subcategory_id"] == context.request.subcategory_code:
                            return cm["priority_score"] or 50
                    else:
                        return cm["priority_score"] or 50
        
        # Se nao encontrado, usar score padrao
        return 50
    
    def _get_workload_score(self, client: Dict[str, Any], context: MatchContext) -> float:
        """Calcula o score de carga (menos carga = melhor)"""
        
        client_workload = context.workload.get(client["id"], 0)
        max_workload = max(context.workload.values()) if context.workload else 1
        
        # Normalizar para 0-100 (inverter: menos carga = maior score)
        if max_workload == 0:
            return 100
        
        normalized = (max_workload - client_workload) / max_workload
        return normalized * 100
    
    def _get_risk_score(self, risk_level: str) -> float:
        """Obtem o score de risco"""
        risk_map = {
            "CRITICAL": 20,
            "HIGH": 15,
            "MEDIUM": 10,
            "LOW": 5
        }
        return risk_map.get(risk_level, 0)
    
    async def _get_proximity_score(self, client: Dict[str, Any], context: MatchContext) -> float:
        """Calcula o score de proximidade"""
        
        # Se nao houver informacao de localizacao, nao considerar
        if not context.request.latitude or not context.request.longitude:
            return 10
        
        # Se o client tiver localizacao, calcular distancia
        if client.get("latitude") and client.get("longitude"):
            distance = self._haversine(
                context.request.latitude, context.request.longitude,
                client["latitude"], client["longitude"]
            )
            # Score inverso: menos distancia = melhor
            # Normalizar para 0-20
            if distance <= 1:
                return 20
            elif distance <= 5:
                return 15
            elif distance <= 10:
                return 10
            elif distance <= 50:
                return 5
            else:
                return 0
        
        return 10
    
    async def _get_sla_score(self, client: Dict[str, Any], context: MatchContext) -> float:
        """Calcula o score de SLA"""
        
        # Se o client tiver SLA definido, usar
        if client.get("sla_hours"):
            # Menor SLA = melhor (mais rapido)
            # Normalizar para 0-20
            if client["sla_hours"] <= 6:
                return 20
            elif client["sla_hours"] <= 12:
                return 15
            elif client["sla_hours"] <= 24:
                return 10
            else:
                return 5
        
        return 10
    
    async def _calculate_priority(self, context: MatchContext, client_id: str) -> int:
        """Calcula o score de prioridade (0-100)"""
        
        # Prioridade base
        base_priority = 50
        
        # Ajustar por categoria
        if context.category:
            urgent_categories = ["BURACO", "AGUA", "ESGOTO", "TRANSITO", "ILUMINACAO"]
            if context.category["code"] in urgent_categories:
                base_priority += 20
        
        # Ajustar por risk level
        risk_map = {
            "CRITICAL": 30,
            "HIGH": 20,
            "MEDIUM": 10,
            "LOW": 0
        }
        base_priority += risk_map.get(context.request.risk_level, 0)
        
        # Ajustar por reincidencia
        base_priority += int(context.reincidence_score * 15)
        
        # Ajustar por carga do client (menos carga = mais prioridade)
        client_workload = context.workload.get(client_id, 0)
        if client_workload <= 5:
            base_priority += 10
        elif client_workload <= 10:
            base_priority += 5
        
        # Limitar entre 0 e 100
        return min(max(base_priority, 0), 100)
    
    async def _calculate_sla(self, context: MatchContext, client_id: str) -> int:
        """Calcula o SLA em horas"""
        
        # Obter SLA do client
        client = next((c for c in context.eligible_clients if c["id"] == client_id), None)
        if client and client.get("sla_hours"):
            return client["sla_hours"]
        
        # Obter SLA da matriz de competencias
        for cm in context.competence_matrix:
            if cm["client_id"] == client_id:
                if cm.get("sla_override"):
                    return cm["sla_override"]
        
        # Obter SLA padrao do consortium
        if context.consortium and context.consortium.get("default_sla_hours"):
            return context.consortium["default_sla_hours"]
        
        # SLA padrao
        return 24
    
    def _calculate_confidence(self, context: MatchContext, client_id: str) -> Tuple[float, bool]:
        """Calcula a confianca e se precisa de revisao humana"""
        
        # Confianca base
        confidence = 0.5
        
        # Aumentar confianca se houver apenas um client elegivel
        if len(context.eligible_clients) == 1:
            confidence += 0.3
        
        # Aumentar confianca se o client tiver alta competencia
        client = next((c for c in context.eligible_clients if c["id"] == client_id), None)
        if client:
            competence_score = next(
                (cm["priority_score"] for cm in context.competence_matrix 
                 if cm["client_id"] == client_id),
                50
            )
            confidence += (competence_score / 100) * 0.2
        
        # Aumentar confianca se a carga estiver balanceada
        if context.workload:
            avg_workload = sum(context.workload.values()) / len(context.workload)
            client_workload = context.workload.get(client_id, 0)
            if client_workload <= avg_workload:
                confidence += 0.1
        
        # Diminuir confianca se houver alta reincidencia
        if context.reincidence_score > 0.7:
            confidence -= 0.1
        
        # Limitar entre 0 e 1
        confidence = min(max(confidence, 0), 1)
        
        # Precisa de revisao humana?
        needs_human_review = confidence < settings.CONFIDENCE_THRESHOLD
        
        return confidence, needs_human_review
    
    def _generate_explanation(self, context: MatchContext, client_id: str, 
                              priority_score: int, sla_hours: int, confidence: float) -> str:
        """Gera a explicacao da decisao"""
        
        parts = []
        
        # Categoria
        parts.append(f"Category: {context.request.category_code}")
        if context.request.subcategory_code:
            parts.append(f"Subcategory: {context.request.subcategory_code}")
        
        # Local
        if context.request.address:
            parts.append(f"Location: {context.request.address}")
        elif context.request.latitude and context.request.longitude:
            parts.append(f"Location: Lat {context.request.latitude:.4f}, Long {context.request.longitude:.4f}")
        
        # Client selecionado
        client = next((c for c in context.eligible_clients if c["id"] == client_id), None)
        if client:
            parts.append(f"Selected client: {client.get('name', client_id)}")
        
        # Prioridade
        parts.append(f"Priority score: {priority_score}")
        
        # SLA
        parts.append(f"SLA: {sla_hours}h")
        
        # Confianca
        parts.append(f"Confidence: {confidence:.2f}")
        
        # Reincidencia
        if context.reincidence_score > 0.5:
            parts.append(f"High reincidence area (score: {context.reincidence_score:.2f})")
        
        # Risco
        if context.request.risk_level:
            parts.append(f"Risk level: {context.request.risk_level}")
        
        # Carga
        if context.workload:
            client_workload = context.workload.get(client_id, 0)
            parts.append(f"Client workload: {client_workload} pending")
        
        return " | ".join(parts)
    
    async def _get_consortium(self, consortium_id: str) -> Optional[Dict[str, Any]]:
        """Obtem dados do consortium"""
        
        # Verificar cache
        cache_key = f"consortium:{consortium_id}"
        cached = await self._cache.get(cache_key)
        if cached:
            return cached
        
        # Buscar no banco
        query = """
            SELECT id, name, short_name, cnpj, state, region, 
                   default_sla_hours, max_priority_score, is_active, created_at
            FROM consortium
            WHERE id = $1
        """
        result = await self._db.fetchrow(query, consortium_id)
        
        if result:
            consortium = dict(result)
            await self._cache.set(cache_key, consortium, ttl=3600)
            return consortium
        
        return None
    
    async def _get_municipality(self, municipality_id: str) -> Optional[Dict[str, Any]]:
        """Obtem dados do municipio"""
        
        cache_key = f"municipality:{municipality_id}"
        cached = await self._cache.get(cache_key)
        if cached:
            return cached
        
        query = """
            SELECT id, ibge_code, name, state, region, population, area_km2, 
                   consortium_id, is_active, created_at
            FROM municipality
            WHERE id = $1
        """
        result = await self._db.fetchrow(query, municipality_id)
        
        if result:
            municipality = dict(result)
            await self._cache.set(cache_key, municipality, ttl=3600)
            return municipality
        
        return None
    
    async def _get_category(self, category_code: str) -> Optional[Dict[str, Any]]:
        """Obtem dados da categoria"""
        
        cache_key = f"category:{category_code}"
        cached = await self._cache.get(cache_key)
        if cached:
            return cached
        
        query = """
            SELECT id, name, code, description, icon, color, is_active, parent_id, created_at
            FROM category
            WHERE code = $1
        """
        result = await self._db.fetchrow(query, category_code)
        
        if result:
            category = dict(result)
            await self._cache.set(cache_key, category, ttl=3600)
            return category
        
        return None
    
    async def _get_subcategory(self, subcategory_code: str) -> Optional[Dict[str, Any]]:
        """Obtem dados da subcategoria"""
        
        cache_key = f"subcategory:{subcategory_code}"
        cached = await self._cache.get(cache_key)
        if cached:
            return cached
        
        query = """
            SELECT id, name, code, description, category_id, is_active, created_at
            FROM subcategory
            WHERE code = $1
        """
        result = await self._db.fetchrow(query, subcategory_code)
        
        if result:
            subcategory = dict(result)
            await self._cache.set(cache_key, subcategory, ttl=3600)
            return subcategory
        
        return None
    
    async def _get_eligible_clients(self, consortium_id: str, 
                                     category_code: str, 
                                     subcategory_code: Optional[str] = None) -> List[Dict[str, Any]]:
        """Obtem clients elegiveis para a categoria"""
        
        cache_key = f"eligible_clients:{consortium_id}:{category_code}:{subcategory_code or ''}"
        cached = await self._cache.get(cache_key)
        if cached:
            return cached
        
        query = """
            SELECT c.id, c.name, c.client_type, c.cnpj, c.consortium_id, 
                   c.municipality_id, c.sla_hours, c.priority_weight, c.is_active
            FROM client c
            JOIN competence_matrix cm ON c.id = cm.client_id
            WHERE c.consortium_id = $1
              AND c.is_active = true
              AND cm.category_id = $2
        """
        
        params = [consortium_id, category_code]
        
        if subcategory_code:
            query += " AND cm.subcategory_id = $3"
            params.append(subcategory_code)
        
        results = await self._db.fetch(query, *params)
        clients = [dict(r) for r in results]
        
        if clients:
            await self._cache.set(cache_key, clients, ttl=300)  # Cache de 5 minutos
        
        return clients
    
    async def _get_competence_matrix(self, consortium_id: str, 
                                      category_code: str, 
                                      subcategory_code: Optional[str] = None) -> List[Dict[str, Any]]:
        """Obtem matriz de competencias"""
        
        cache_key = f"competence_matrix:{consortium_id}:{category_code}:{subcategory_code or ''}"
        cached = await self._cache.get(cache_key)
        if cached:
            return cached
        
        query = """
            SELECT id, consortium_id, client_id, category_id, subcategory_id, 
                   is_responsible, priority_score, sla_override
            FROM competence_matrix
            WHERE consortium_id = $1
              AND category_id = $2
        """
        
        params = [consortium_id, category_code]
        
        if subcategory_code:
            query += " AND subcategory_id = $3"
            params.append(subcategory_code)
        
        results = await self._db.fetch(query, *params)
        matrix = [dict(r) for r in results]
        
        if matrix:
            await self._cache.set(cache_key, matrix, ttl=300)
        
        return matrix
    
    async def _get_workload(self, consortium_id: str) -> Dict[str, int]:
        """Obtem carga de trabalho dos clients"""
        
        cache_key = f"workload:{consortium_id}"
        cached = await self._cache.get(cache_key)
        if cached:
            return cached
        
        query = """
            SELECT client_id, COUNT(*) as count
            FROM occurrence
            WHERE consortium_id = $1
              AND status IN ('PENDING', 'IN_PROGRESS')
            GROUP BY client_id
        """
        
        results = await self._db.fetch(query, consortium_id)
        workload = {r["client_id"]: r["count"] for r in results}
        
        if workload:
            await self._cache.set(cache_key, workload, ttl=60)  # Cache de 1 minuto
        
        return workload
    
    async def _calculate_reincidence_score(self, municipality_id: Optional[str], 
                                           latitude: Optional[float], 
                                           longitude: Optional[float], 
                                           category_code: str) -> float:
        """Calcula score de reincidencia"""
        
        if not municipality_id:
            return 0.0
        
        cache_key = f"reincidence:{municipality_id}:{category_code}"
        cached = await self._cache.get(cache_key)
        if cached is not None:
            return cached
        
        # Contar ocorrencias recentemente resolvidas
        thirty_days_ago = datetime.utcnow().isoformat()
        
        query = """
            SELECT COUNT(*)
            FROM occurrence
            WHERE municipality_id = $1
              AND category_id = $2
              AND status = 'RESOLVED'
              AND resolved_at >= NOW() - INTERVAL '30 days'
        """
        
        recent_count = await self._db.fetchval(query, municipality_id, category_code)
        
        # Contar ocorrencias totais
        total_query = """
            SELECT COUNT(*)
            FROM occurrence
            WHERE municipality_id = $1
              AND category_id = $2
        """
        
        total_count = await self._db.fetchval(total_query, municipality_id, category_code)
        
        if total_count == 0:
            score = 0.0
        else:
            score = min(recent_count / total_count, 1.0)
        
        await self._cache.set(cache_key, score, ttl=3600)
        
        return score
    
    async def _get_geolocation_data(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Obtem dados de geolocalizacao"""
        
        # Por enquanto, retorna dados basicos
        # Futuramente, pode integrar com APIs externas
        return {
            "latitude": latitude,
            "longitude": longitude,
            "formatted_address": None,
            "neighborhood": None,
            "city": None,
            "state": None
        }
    
    async def _get_default_client(self, consortium_id: str) -> Optional[Dict[str, Any]]:
        """Obtem o client padrao do consortium"""
        
        query = """
            SELECT id, name, client_type, cnpj, consortium_id, 
                   municipality_id, sla_hours, priority_weight, is_active
            FROM client
            WHERE consortium_id = $1
              AND is_active = true
            ORDER BY priority_weight DESC
            LIMIT 1
        """
        
        result = await self._db.fetchrow(query, consortium_id)
        if result:
            return dict(result)
        return None
    
    def _haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calcula distancia entre dois pontos (Haversine formula)"""
        
        from math import radians, sin, cos, sqrt, atan2
        
        # Raio da Terra em km
        R = 6371.0
        
        # Converter para radianos
        lat1_rad = radians(lat1)
        lon1_rad = radians(lon1)
        lat2_rad = radians(lat2)
        lon2_rad = radians(lon2)
        
        # Diferenca
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        # Haversine formula
        a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        return R * c
