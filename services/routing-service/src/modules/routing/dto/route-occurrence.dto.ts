import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsLatitude, IsLongitude } from 'class-validator';
import { RiskLevel } from '@prisma/client';

export class RouteOccurrenceDto {
  @ApiProperty({ description: 'ID da ocorrencia (opcional para atualizacao)' })
  @IsString()
  @IsOptional()
  occurrenceId?: string;

  @ApiProperty({ description: 'ID do consortium' })
  @IsString()
  consortiumId: string;

  @ApiProperty({ description: 'ID da categoria' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'ID da subcategoria' })
  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @ApiProperty({ description: 'Titulo da ocorrencia' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Descricao da ocorrencia' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Latitude' })
  @IsNumber()
  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNumber()
  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ description: 'Endereco' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'ID do municipio' })
  @IsString()
  @IsOptional()
  municipalityId?: string;

  @ApiProperty({ enum: RiskLevel, default: RiskLevel.LOW })
  @IsEnum(RiskLevel)
  @IsOptional()
  riskLevel?: RiskLevel;

  @ApiProperty({ description: 'ID do usuario que criou' })
  @IsString()
  @IsOptional()
  createdBy?: string;
}
