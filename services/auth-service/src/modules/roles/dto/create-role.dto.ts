import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'TECNICO' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Técnico de campo' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiProperty({ type: [String], description: 'Permission codes to assign to role' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissionCodes?: string[];
}
