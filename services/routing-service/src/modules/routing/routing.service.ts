import {
  Injectable,
  NotFoundException,
  ConflictException
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchService } from './match.service';
import { PriorityService } from './priority.service';
import { SlaService } from './sla.service';
import { RouteOccurrenceDto } from './dto/route-occurrence.dto';

export interface RoutingDecision {
  occurrenceId: string;
  consortiumId: string;
  clientId: string;
  priorityScore: number;
  slaHours: number;
  confidence: number;
  explanation: string;
  needsHumanReview: boolean;
  timestamp: Date;
}

@Injectable()
export class RoutingService {
  constructor(
    private prisma: PrismaService,
    private matchService: MatchService,
    private priorityService: PriorityService,
    private slaService: SlaService
  ) {}

  async routeOccurrence(routeOccurrenceDto: RouteOccurrenceDto): Promise<RoutingDecision & { occurrence: any }> {
    // Validar consortium
    const consortium = await this.prisma.consortium.findUnique({
      where: { id: routeOccurrenceDto.consortiumId }
    });

    if (!consortium) {
      throw new NotFoundException('Consortium not found');
    }

    // Validar municipality
    const municipality = routeOccurrenceDto.municipalityId
      ? await this.prisma.municipality.findUnique({
          where: { id: routeOccurrenceDto.municipalityId }
        })
      : null;

    if (routeOccurrenceDto.municipalityId && !municipality) {
      throw new NotFoundException('Municipality not found');
    }

    // Validar category
    const category = await this.prisma.category.findUnique({
      where: { id: routeOccurrenceDto.categoryId }
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Obter dados para o MATCH
    const matchData = {
      type: category.code,
      subType: routeOccurrenceDto.subcategoryId || null,
      latitude: routeOccurrenceDto.latitude,
      longitude: routeOccurrenceDto.longitude,
      address: routeOccurrenceDto.address,
      municipalityId: routeOccurrenceDto.municipalityId,
      consortiumId: routeOccurrenceDto.consortiumId,
      description: routeOccurrenceDto.description,
      riskLevel: routeOccurrenceDto.riskLevel,
      // Dados adicionais para contexto
      municipalityPopulation: municipality?.population,
      municipalityArea: municipality?.areaKm2
    };

    // Executar MATCH
    const matchResult = await this.matchService.match(matchData);

    // Calcular prioridade
    const priorityScore = await this.priorityService.calculatePriority({
      categoryCode: category.code,
      riskLevel: routeOccurrenceDto.riskLevel,
      consortiumId: routeOccurrenceDto.consortiumId,
      municipalityId: routeOccurrenceDto.municipalityId,
      historicalReincidence: matchResult.reincidenceScore,
      currentLoad: matchResult.currentLoad
    });

    // Calcular SLA
    const slaHours = await this.slaService.calculateSla({
      categoryCode: category.code,
      riskLevel: routeOccurrenceDto.riskLevel,
      clientId: matchResult.clientId,
      consortiumId: routeOccurrenceDto.consortiumId
    });

    // Criar ou atualizar ocorrencia
    let occurrence;
    if (routeOccurrenceDto.occurrenceId) {
      occurrence = await this.prisma.occurrence.update({
        where: { id: routeOccurrenceDto.occurrenceId },
        data: {
          consortiumId: routeOccurrenceDto.consortiumId,
          clientId: matchResult.clientId,
          categoryId: routeOccurrenceDto.categoryId,
          subcategoryId: routeOccurrenceDto.subcategoryId,
          latitude: routeOccurrenceDto.latitude,
          longitude: routeOccurrenceDto.longitude,
          address: routeOccurrenceDto.address,
          municipalityId: routeOccurrenceDto.municipalityId,
          priority: this.priorityService.mapScoreToPriority(priorityScore),
          riskLevel: routeOccurrenceDto.riskLevel,
          routedBy: matchResult.confidence >= 0.7 ? 'AUTO' : 'MANUAL',
          confidenceScore: matchResult.confidence,
          explanation: matchResult.explanation,
          slaHours,
          slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000)
        },
        include: {
          consortium: true,
          client: true,
          category: true,
          municipality: true
        }
      });
    } else {
      // Gerar protocolo
      const protocol = this.generateProtocol(routeOccurrenceDto.consortiumId);

      occurrence = await this.prisma.occurrence.create({
        data: {
          protocol,
          title: routeOccurrenceDto.title,
          description: routeOccurrenceDto.description,
          consortiumId: routeOccurrenceDto.consortiumId,
          clientId: matchResult.clientId,
          categoryId: routeOccurrenceDto.categoryId,
          subcategoryId: routeOccurrenceDto.subcategoryId,
          latitude: routeOccurrenceDto.latitude,
          longitude: routeOccurrenceDto.longitude,
          address: routeOccurrenceDto.address,
          municipalityId: routeOccurrenceDto.municipalityId,
          priority: this.priorityService.mapScoreToPriority(priorityScore),
          riskLevel: routeOccurrenceDto.riskLevel,
          status: matchResult.confidence >= 0.7 ? 'PENDING' : 'DRAFT',
          routedBy: matchResult.confidence >= 0.7 ? 'AUTO' : 'MANUAL',
          confidenceScore: matchResult.confidence,
          explanation: matchResult.explanation,
          slaHours,
          slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000),
          createdBy: routeOccurrenceDto.createdBy
        },
        include: {
          consortium: true,
          client: true,
          category: true,
          municipality: true
        }
      });
    }

    // Registrar decisao no audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'ROUTE_OCCURRENCE',
        resource: 'occurrence',
        resourceId: occurrence.id,
        userId: routeOccurrenceDto.createdBy,
        consortiumId: routeOccurrenceDto.consortiumId,
        oldValue: null,
        newValue: {
          consortiumId: matchResult.consortiumId,
          clientId: matchResult.clientId,
          priorityScore,
          slaHours,
          confidence: matchResult.confidence
        },
        metadata: {
          aiModel: 'MATCH-v1',
          aiVersion: '1.0',
          explanation: matchResult.explanation
        },
        aiModel: 'MATCH-v1',
        aiVersion: '1.0',
        confidence: matchResult.confidence,
        explanation: matchResult.explanation
      }
    });

    const decision: RoutingDecision = {
      occurrenceId: occurrence.id,
      consortiumId: matchResult.consortiumId,
      clientId: matchResult.clientId,
      priorityScore,
      slaHours,
      confidence: matchResult.confidence,
      explanation: matchResult.explanation,
      needsHumanReview: matchResult.confidence < 0.7,
      timestamp: new Date()
    };

    return {
      ...decision,
      occurrence
    };
  }

  async routeBatch(occurrences: RouteOccurrenceDto[]): Promise<RoutingDecision[]> {
    const decisions: RoutingDecision[] = [];

    for (const occurrence of occurrences) {
      try {
        const result = await this.routeOccurrence(occurrence);
        decisions.push({
          occurrenceId: result.occurrence.id,
          consortiumId: result.consortiumId,
          clientId: result.clientId,
          priorityScore: result.priorityScore,
          slaHours: result.slaHours,
          confidence: result.confidence,
          explanation: result.explanation,
          needsHumanReview: result.needsHumanReview,
          timestamp: result.timestamp
        });
      } catch (error) {
        // Log error mas continuar com o batch
        console.error(`Error routing occurrence: ${error.message}`);
      }
    }

    return decisions;
  }

  async getRoutingDecision(occurrenceId: string): Promise<RoutingDecision | null> {
    const occurrence = await this.prisma.occurrence.findUnique({
      where: { id: occurrenceId },
      include: {
        consortium: true,
        client: true
      }
    });

    if (!occurrence) {
      return null;
    }

    return {
      occurrenceId: occurrence.id,
      consortiumId: occurrence.consortiumId,
      clientId: occurrence.clientId || '',
      priorityScore: this.priorityService.priorityToScore(occurrence.priority),
      slaHours: occurrence.slaHours || 24,
      confidence: occurrence.confidenceScore || 0,
      explanation: occurrence.explanation || '',
      needsHumanReview: (occurrence.confidenceScore || 0) < 0.7,
      timestamp: occurrence.updatedAt
    };
  }

  async getRoutingHistory(occurrenceId: string): Promise<any[]> {
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        resource: 'occurrence',
        resourceId: occurrenceId,
        action: { contains: 'ROUTE' }
      },
      orderBy: { timestamp: 'desc' }
    });

    return auditLogs.map((log) => ({
      timestamp: log.timestamp,
      action: log.action,
      decision: log.newValue,
      confidence: log.confidence,
      explanation: log.explanation,
      userId: log.userId
    }));
  }

  async getStats(
    consortiumId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    const where: any = {
      action: { contains: 'ROUTE' },
      resource: 'occurrence'
    };

    if (consortiumId) {
      where.consortiumId = consortiumId;
    }

    if (startDate) {
      where.timestamp = {
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      if (!where.timestamp) {
        where.timestamp = {};
      }
      where.timestamp.lte = new Date(endDate);
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });

    const stats = {
      totalRouted: logs.length,
      autoRouted: logs.filter((log) => log.action === 'ROUTE_OCCURRENCE').length,
      manualRouted: logs.filter((log) => log.action === 'MANUAL_ROUTE').length,
      avgConfidence: logs.reduce((sum, log) => sum + (log.confidence || 0), 0) / logs.length || 0,
      humanReviews: logs.filter((log) => (log.confidence || 0) < 0.7).length
    };

    return stats;
  }

  async reassignOccurrence(
    occurrenceId: string,
    consortiumId?: string,
    clientId?: string,
    reason?: string
  ): Promise<any> {
    const occurrence = await this.prisma.occurrence.findUnique({
      where: { id: occurrenceId }
    });

    if (!occurrence) {
      throw new NotFoundException('Occurrence not found');
    }

    // Validar novo consortium
    if (consortiumId) {
      const consortium = await this.prisma.consortium.findUnique({
        where: { id: consortiumId }
      });
      if (!consortium) {
        throw new NotFoundException('Consortium not found');
      }
    }

    // Validar novo client
    if (clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId }
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }
    }

    // Atualizar ocorrencia
    const updatedOccurrence = await this.prisma.occurrence.update({
      where: { id: occurrenceId },
      data: {
        consortiumId: consortiumId || occurrence.consortiumId,
        clientId: clientId || occurrence.clientId,
        routedBy: 'MANUAL',
        status: 'PENDING',
        explanation: reason || occurrence.explanation
      },
      include: {
        consortium: true,
        client: true
      }
    });

    // Registrar no audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'MANUAL_ROUTE',
        resource: 'occurrence',
        resourceId: occurrenceId,
        userId: 'system', // Seria o usuario que fez a reatribuicao
        consortiumId: updatedOccurrence.consortiumId,
        oldValue: {
          consortiumId: occurrence.consortiumId,
          clientId: occurrence.clientId
        },
        newValue: {
          consortiumId: updatedOccurrence.consortiumId,
          clientId: updatedOccurrence.clientId
        },
        metadata: { reason },
        confidence: 1.0,
        explanation: reason || 'Manual reassignment'
      }
    });

    return {
      message: 'Occurrence reassigned successfully',
      occurrence: updatedOccurrence
    };
  }

  private generateProtocol(consortiumId: string): string {
    const shortName = consortiumId.split('-')[0].toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${shortName}-${timestamp}-${random}`;
  }
}
