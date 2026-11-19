import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  userType: string;
  consortiumId?: string;
  clientId?: string;
  municipalityId?: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            permissions: true
          }
        },
        permissions: true
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthTokens> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const consortium = registerDto.consortiumId
      ? await this.prisma.consortium.findUnique({
          where: { id: registerDto.consortiumId }
        })
      : null;

    if (registerDto.consortiumId && !consortium) {
      throw new NotFoundException('Consortium not found');
    }

    const client = registerDto.clientId
      ? await this.prisma.client.findUnique({
          where: { id: registerDto.clientId }
        })
      : null;

    if (registerDto.clientId && !client) {
      throw new NotFoundException('Client not found');
    }

    const municipality = registerDto.municipalityId
      ? await this.prisma.municipality.findUnique({
          where: { id: registerDto.municipalityId }
        })
      : null;

    if (registerDto.municipalityId && !municipality) {
      throw new NotFoundException('Municipality not found');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        phone: registerDto.phone,
        passwordHash: hashedPassword,
        userType: registerDto.userType,
        consortiumId: consortium?.id,
        clientId: client?.id,
        municipalityId: municipality?.id,
        isActive: true
      }
    });

    if (registerDto.roleIds && registerDto.roleIds.length > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          roles: {
            connect: registerDto.roleIds.map((roleId) => ({ id: roleId }))
          }
        }
      });
    }

    return user;
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'zela-refresh-secret-change-in-production'
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: {
            include: {
              permissions: true
            }
          },
          permissions: true
        }
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateTokens(user: any): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      consortiumId: user.consortiumId,
      clientId: user.clientId,
      municipalityId: user.municipalityId,
      permissions: this.getUserPermissions(user)
    };

    const accessToken = this.jwtService.sign(payload);
    
    const refreshTokenPayload = {
      sub: user.id,
      email: user.email
    };
    
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'zela-refresh-secret-change-in-production',
      expiresIn: '7d'
    });

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        ipAddress: user.lastLoginIp || 'unknown',
        userAgent: user.lastLoginAgent || 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      accessToken,
      refreshToken
    };
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token: refreshToken
      }
    });

    return { message: 'Logged out successfully' };
  }

  async invalidateSessions(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId }
    });

    return { message: 'All sessions invalidated' };
  }

  private getUserPermissions(user: any): string[] {
    const permissions: Set<string> = new Set();

    if (user.permissions) {
      user.permissions.forEach((p: any) => permissions.add(p.code));
    }

    if (user.roles) {
      user.roles.forEach((role: any) => {
        if (role.permissions) {
          role.permissions.forEach((p: any) => permissions.add(p.code));
        }
      });
    }

    return Array.from(permissions);
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
