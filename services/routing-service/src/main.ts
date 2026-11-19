import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  const config = new DocumentBuilder()
    .setTitle('Zela Nacional - Routing Service (MATCH)')
    .setDescription('Servico de Roteamento Inteligente de Ocorrencias - MATCH Engine')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('routing', 'Roteamento de Ocorrencias')
    .addTag('consortium', 'Gestao de Consorcios')
    .addTag('client', 'Gestao de Clients')
    .addTag('occurrence', 'Gestao de Ocorrencias')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Routing Service (MATCH) running on port ${port}`);
}

bootstrap();
