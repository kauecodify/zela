import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

export interface MatchInput {
  type: string;
  subType: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  municipalityId: string | null;
  consortiumId: string;
  description: string | null;
  riskLevel: string | null;
  municipalityPopulation?: number;
  municipalityArea?: number;
}

export interface MatchResult {
  consortiumId: string;
  clientId: string;
  confidence: number;
  explanation: string;
  reincidenceScore: number;
  currentLoad: number;
}

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  private readonly MATCH_API_URL: string;
  private readonly ENABLE_EXTERNAL_MATCH: boolean;

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.MATCH_API_URL = this.configService.get<string>('MATCH_API_URL') || 
      'http://match-service:3003/api/match';
    this.ENABLE_EXTERNAL_MATCH = this.configService.get<string>('ENABLE_EXTERNAL_MATCH') === 'true';
  }

  async match(input: MatchInput): Promise<MatchResult> {
    // Primeiro, tentar usar o modelo externo se estiver configurado
    if (this.ENABLE_EXTERNAL_MATCH) {
      try {
        const result = await this.callExternalMatch(input);
        if (result && result.confidence >= 0.7) {
          this.logger.log(`External MATCH returned with confidence ${result.confidence}`);
          return result;
        }
      } catch (error) {
        this.logger.error(`External MATCH failed: ${error.message}`);
      }
    }

    // Se o modelo externo nao estiver disponivel ou confianca baixa, usar logica local
    return this.matchLocal(input);
  }

  private async callExternalMatch(input: MatchInput): Promise<MatchResult | null> {
    try {
      const response = await this.httpService.post<MatchResult>(this.MATCH_API_URL, input).toPromise();
      return response.data;
    } catch (error) {
      this.logger.error(`Error calling external MATCH: ${error.message}`);
      return null;
    }
  }

  private async matchLocal(input: MatchInput): Promise<MatchResult> {
    this.logger.log(`Running local MATCH for consortium ${input.consortiumId}`);

    // Obter matriz de competencias para o consortium
    const competenceMatrix = await this.prisma.competenceMatrix.findMany({
      where: {
        consortiumId: input.consortiumId
      },
      include: {
        category: true,
        subcategory: true,
        client: true
      }
    });

    // Obter clients do consortium
    const clients = await this.prisma.client.findMany({
      where: {
        consortiumId: input.consortiumId,
        isActive: true
      },
      include: {
        competenceMatrix: {
          include: {
            category: true,
            subcategory: true
          }
        }
      }
    });

    // Obter carga atual dos clients (numero de ocorrencias pendentes)
    const workload = await this.getClientWorkload(input.consortiumId);

    // Obter historico de reincidencia para o local
    const reincidenceScore = await this.calculateReincidenceScore(
      input.municipalityId,
      input.latitude,
      input.longitude,
      input.type
    );

    // Filtrar clients que podem tratar a categoria
    const eligibleClients = clients.filter((client) => {
      const hasCompetence = client.competenceMatrix.some((cm) => {
        if (cm.categoryId === input.type) {
          if (input.subType && cm.subcategoryId) {
            return cm.subcategoryId === input.subType;
          }
          return true;
        }
        return false;
      });
      return hasCompetence;
    });

    if (eligibleClients.length === 0) {
      // Se nenhum client for elegivel, usar o client padrao do consortium
      const defaultClient = await this.prisma.client.findFirst({
        where: {
          consortiumId: input.consortiumId,
          isActive: true
        }
      });

      if (!defaultClient) {
        throw new Error('No eligible client found for this consortium and category');
      }

      return {
        consortiumId: input.consortiumId,
        clientId: defaultClient.id,
        confidence: 0.5,
        explanation: `No specific client for category ${input.type}, routing to default client`,
        reincidenceScore,
        currentLoad: workload[defaultClient.id] || 0
      };
    }

    // Calcular score para cada client elegivel
    const clientScores = eligibleClients.map((client) => {
      const competence = client.competenceMatrix.find((cm) => {
        if (cm.categoryId === input.type) {
          if (input.subType && cm.subcategoryId) {
            return cm.subcategoryId === input.subType;
          }
          return true;
        }
        return false;
      });

      const competenceScore = competence?.priorityScore || 50;
      const workloadScore = 100 - Math.min((workload[client.id] || 0) * 5, 100);
      const reincidenceFactor = reincidenceScore > 0.5 ? 20 : 0;
      const riskFactor = this.getRiskFactor(input.riskLevel);

      // Score total: competencia (40%) + carga (30%) + reincidencia (10%) + risco (20%)
      const totalScore = 
        (competenceScore * 0.4) +
        (workloadScore * 0.3) +
        (reincidenceFactor * 0.1) +
        (riskFactor * 0.2);

      return {
        clientId: client.id,
        score: totalScore,
        competenceScore,
        workloadScore,
        reincidenceFactor,
        riskFactor
      };
    });

    // Ordenar por score e selecionar o melhor
    clientScores.sort((a, b) => b.score - a.score);
    const bestClient = clientScores[0];

    // Calcular confianca
    const confidence = this.calculateConfidence(
      bestClient.score,
      clientScores,
      reincidenceScore
    );

    // Gerar explicacao
    const explanation = this.generateExplanation(
      input,
      bestClient,
      clientScores,
      reincidenceScore
    );

    return {
      consortiumId: input.consortiumId,
      clientId: bestClient.clientId,
      confidence,
      explanation,
      reincidenceScore,
      currentLoad: workload[bestClient.clientId] || 0
    };
  }

  private async getClientWorkload(consortiumId: string): Promise<Record<string, number>> {
    const workload: Record<string, number> = {};

    const clients = await this.prisma.client.findMany({
      where: {
        consortiumId,
        isActive: true
      }
    });

    for (const client of clients) {
      const pendingCount = await this.prisma.occurrence.count({
        where: {
          clientId: client.id,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });
      workload[client.id] = pendingCount;
    }

    return workload;
  }

  private async calculateReincidenceScore(
    municipalityId: string | null,
    latitude: number | null,
    longitude: number | null,
    category: string
  ): Promise<number> {
    if (!municipalityId) {
      return 0;
    }

    // Contar ocorrencias recentemente resolvidas para a mesma categoria no municipio
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentOccurrences = await this.prisma.occurrence.count({
      where: {
        municipalityId,
        categoryId: category,
        status: 'RESOLVED',
        resolvedAt: { gte: thirtyDaysAgo }
      }
    });

    // Contar ocorrencias totais para a categoria no municipio
    const totalOccurrences = await this.prisma.occurrence.count({
      where: {
        municipalityId,
        categoryId: category
      }
    });

    if (totalOccurrences === 0) {
      return 0;
    }

    // Score de reincidencia: 0-1
    return Math.min(recentOccurrences / totalOccurrences, 1);
  }

  private getRiskFactor(riskLevel: string | null): number {
    if (!riskLevel) return 50;
    
    const riskMap: Record<string, number> = {
      'CRITICAL': 100,
      'HIGH': 80,
      'MEDIUM': 50,
      'LOW': 20
    };

    return riskMap[riskLevel] || 50;
  }

  private calculateConfidence(
    bestScore: number,
    clientScores: any[],
    reincidenceScore: number
  ): number {
    if (clientScores.length === 1) {
      return 0.9;
    }

    const secondBest = clientScores[1]?.score || 0;
    const scoreDifference = bestScore - secondBest;
    const normalizedDifference = Math.min(scoreDifference / 50, 1);

    // Confianca baseada na diferenca de score e reincidencia
    const baseConfidence = 0.5 + (normalizedDifference * 0.3);
    const reincidenceFactor = reincidenceScore > 0.7 ? 0.1 : 0;

    return Math.min(baseConfidence + reincidenceFactor, 0.95);
  }

  private generateExplanation(
    input: MatchInput,
    bestClient: any,
    clientScores: any[],
    reincidenceScore: number
  ): string {
    const parts: string[] = [];

    // Categoria
    parts.push(`Category: ${input.type}${input.subType ? ` (${input.subType})` : ''}`);

    // Local
    if (input.address) {
      parts.push(`Location: ${input.address}`);
    } else if (input.latitude && input.longitude) {
      parts.push(`Location: Lat ${input.latitude.toFixed(4)}, Long ${input.longitude.toFixed(4)}`);
    }

    // Client selecionado
    parts.push(`Selected client: ${bestClient.clientId} (score: ${bestClient.score.toFixed(2)})`);

    // Competencia
    parts.push(`Competence score: ${bestClient.competenceScore}`);

    // Carga de trabalho
    parts.push(`Workload score: ${bestClient.workloadScore.toFixed(2)}`);

    // Reincidencia
    if (reincidenceScore > 0.5) {
      parts.push(`High reincidence area (score: ${reincidenceScore.toFixed(2)})`);
    }

    // Risco
    if (input.riskLevel) {
      parts.push(`Risk level: ${input.riskLevel}`);
    }

    // Comparacao com outros clients
    if (clientScores.length > 1) {
      const secondBest = clientScores[1];
      const difference = (bestClient.score - secondBest.score).toFixed(2);
      parts.push(`Better than next best by ${difference} points`);
    }

    return parts.join(' | ');
  }
}
