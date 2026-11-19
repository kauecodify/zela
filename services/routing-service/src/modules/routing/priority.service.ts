import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Priority, RiskLevel } from '@prisma/client';

export interface PriorityInput {
  categoryCode: string;
  riskLevel: string;
  consortiumId: string;
  municipalityId?: string;
  historicalReincidence: number;
  currentLoad: number;
}

@Injectable()
export class PriorityService {
  constructor(private prisma: PrismaService) {}

  async calculatePriority(input: PriorityInput): Promise<number> {
    // Obter peso da categoria
    const category = await this.prisma.category.findUnique({
      where: { code: input.categoryCode }
    });

    // Obter peso do risk level
    const riskWeight = this.getRiskWeight(input.riskLevel);

    // Obter peso do consortium
    const consortium = await this.prisma.consortium.findUnique({
      where: { id: input.consortiumId }
    });

    // Calcular score base
    let baseScore = 50;

    // Ajustar por categoria (algumas categorias sao mais urgentes)
    if (category) {
      const urgentCategories = ['BURACO', 'AGUA', 'ESGOTO', 'TRANSITO'];
      if (urgentCategories.includes(category.code)) {
        baseScore += 20;
      }
    }

    // Ajustar por risk level
    baseScore += riskWeight;

    // Ajustar por reincidencia
    baseScore += input.historicalReincidence * 15;

    // Ajustar por carga atual (menos carga = mais prioridade)
    baseScore += (100 - Math.min(input.currentLoad * 2, 100)) * 0.2;

    // Limitar entre 0 e 100
    return Math.min(Math.max(baseScore, 0), 100);
  }

  private getRiskWeight(riskLevel: string): number {
    const weights: Record<string, number> = {
      [RiskLevel.CRITICAL]: 30,
      [RiskLevel.HIGH]: 20,
      [RiskLevel.MEDIUM]: 10,
      [RiskLevel.LOW]: 0
    };

    return weights[riskLevel] || 0;
  }

  mapScoreToPriority(score: number): Priority {
    if (score >= 80) return Priority.CRITICAL;
    if (score >= 60) return Priority.HIGH;
    if (score >= 30) return Priority.NORMAL;
    return Priority.LOW;
  }

  priorityToScore(priority: Priority): number {
    const scores: Record<Priority, number> = {
      [Priority.CRITICAL]: 90,
      [Priority.HIGH]: 70,
      [Priority.NORMAL]: 50,
      [Priority.LOW]: 30
    };

    return scores[priority];
  }
}
