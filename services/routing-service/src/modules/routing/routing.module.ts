import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RoutingService } from './routing.service';
import { RoutingController } from './routing.controller';
import { MatchService } from './match.service';
import { PriorityService } from './priority.service';
import { SlaService } from './sla.service';

@Module({
  imports: [HttpModule],
  controllers: [RoutingController],
  providers: [RoutingService, MatchService, PriorityService, SlaService],
  exports: [RoutingService, MatchService]
})
export class RoutingModule {}
