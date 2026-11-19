import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoutingService } from './routing.service';
import { RouteOccurrenceDto } from './dto/route-occurrence.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('routing')
@Controller('routing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post('route')
  @ApiOperation({ 
    summary: 'Route occurrence to appropriate consortium and client',
    description: 'Usa o MATCH Engine para determinar o consorcio e client responsavel' 
  })
  @ApiResponse({ status: 200, description: 'Occurrence routed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async routeOccurrence(@Body() routeOccurrenceDto: RouteOccurrenceDto) {
    return this.routingService.routeOccurrence(routeOccurrenceDto);
  }

  @Post('batch-route')
  @ApiOperation({ 
    summary: 'Route multiple occurrences in batch',
    description: 'Roteia multiplas ocorrencias em lote' 
  })
  @ApiResponse({ status: 200, description: 'Occurrences routed successfully' })
  async routeBatch(@Body() body: { occurrences: RouteOccurrenceDto[] }) {
    return this.routingService.routeBatch(body.occurrences);
  }

  @Get('decision/:occurrenceId')
  @ApiOperation({ 
    summary: 'Get routing decision for occurrence',
    description: 'Retorna a decisao de roteamento para uma ocorrencia' 
  })
  @ApiResponse({ status: 200, description: 'Routing decision' })
  @ApiResponse({ status: 404, description: 'Occurrence not found' })
  async getRoutingDecision(@Param('occurrenceId') occurrenceId: string) {
    return this.routingService.getRoutingDecision(occurrenceId);
  }

  @Get('history/:occurrenceId')
  @ApiOperation({ 
    summary: 'Get routing history for occurrence',
    description: 'Retorna o historico de roteamento para uma ocorrencia' 
  })
  @ApiResponse({ status: 200, description: 'Routing history' })
  async getRoutingHistory(@Param('occurrenceId') occurrenceId: string) {
    return this.routingService.getRoutingHistory(occurrenceId);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get routing statistics',
    description: 'Retorna estatisticas de roteamento' 
  })
  @ApiQuery({ name: 'consortiumId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Routing statistics' })
  async getStats(
    @Query('consortiumId') consortiumId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.routingService.getStats(consortiumId, startDate, endDate);
  }

  @Post('reassign/:occurrenceId')
  @ApiOperation({ 
    summary: 'Reassign occurrence',
    description: 'Reatribuir ocorrencia para outro client ou consortium' 
  })
  @ApiResponse({ status: 200, description: 'Occurrence reassigned successfully' })
  async reassignOccurrence(
    @Param('occurrenceId') occurrenceId: string,
    @Body() body: { consortiumId?: string; clientId?: string; reason?: string }
  ) {
    return this.routingService.reassignOccurrence(
      occurrenceId,
      body.consortiumId,
      body.clientId,
      body.reason
    );
  }
}
