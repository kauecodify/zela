import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  userType: string;
  consortiumId?: string;
  clientId?: string;
  municipalityId?: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'zela-secret-key-change-in-production'
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        consortiumId: true,
        clientId: true,
        municipalityId: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      sub: user.id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      consortiumId: user.consortiumId,
      clientId: user.clientId,
      municipalityId: user.municipalityId,
      permissions: payload.permissions
    };
  }
}
