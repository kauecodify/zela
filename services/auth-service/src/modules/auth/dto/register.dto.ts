import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';
import { UserType } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({ enum: UserType, default: UserType.CIDADAO })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ example: 'cio-sp' })
  @IsString()
  @IsOptional()
  consortiumId?: string;

  @ApiProperty({ example: 'prefeitura-pp' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ example: '3509502-cio-sp' })
  @IsString()
  @IsOptional()
  municipalityId?: string;

  @ApiProperty({ type: [String], description: 'Role IDs to assign to user' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];
}
