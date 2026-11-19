import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RoutingModule } from './modules/routing/routing.module';
import { ConsortiumModule } from './modules/consortium/consortium.module';
import { ClientModule } from './modules/client/client.module';
import { OccurrenceModule } from './modules/occurrence/occurrence.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    }),
    HttpModule,
    PrismaModule,
    RoutingModule,
    ConsortiumModule,
    ClientModule,
    OccurrenceModule
  ]
})
export class AppModule {}
