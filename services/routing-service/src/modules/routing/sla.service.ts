import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SlaInput {
  categoryCode: string;
  riskLevel: string;
  clientId?: string;
  consortiumId: string;
}

@Injectable()
export class SlaService {
  constructor(private prisma: PrismaService) {}

  async calculateSla(input: SlaInput): Promise<number> {
    // Obter SLA padrao do consortium
    const consortium = await this.prisma.consortium.findUnique({
      where: { id: input.consortiumId }
    });

    const baseSla = consortium?.defaultSlaHours || 24;

    // Obter SLA do client se especificado
    if (input.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: input.clientId }
      });
      if (client?.slaHours) {
        return client.slaHours;
      }
    }

    // Obter SLA da matriz de competencias
    const competence = await this.prisma.competenceMatrix.findFirst({
      where: {
        consortiumId: input.consortiumId,
        clientId: input.clientId,
        categoryId: input.categoryCode
      }
    });

    if (competence?.slaOverride) {
      return competence.slaOverride;
    }

    // Ajustar por risk level
    const riskFactor = this.getRiskFactor(input.riskLevel);
    const adjustedSla = baseSla * riskFactor;

    // Arredondar para cima
    return Math.ceil(adjustedSla);
  }

  private getRiskFactor(riskLevel: string): number {
    const factors: Record<string, number> = {
      'CRITICAL': 0.5,  // 50% do tempo padrao
      'HIGH': 0.75,     // 75% do tempo padrao
      'MEDIUM': 1.0,    // 100% do tempo padrao
      'LOW': 1.5        // 150% do tempo padrao
    };

    return factors[riskLevel] || 1.0;
  }
}
