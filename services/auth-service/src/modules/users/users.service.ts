import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentUser?: any) {
    // Validar se o usuario atual tem permissao para criar usuarios
    if (currentUser && currentUser.userType !== 'ADMIN_NACIONAL') {
      // Verificar se o usuario atual pertence ao mesmo consortium
      if (createUserDto.consortiumId && currentUser.consortiumId !== createUserDto.consortiumId) {
        throw new ForbiddenException('Cannot create user for different consortium');
      }
      
      // Verificar se o usuario atual pertence ao mesmo client
      if (createUserDto.clientId && currentUser.clientId !== createUserDto.clientId) {
        throw new ForbiddenException('Cannot create user for different client');
      }
    }

    // Verificar se o email ja existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validar consortium
    let consortiumId = createUserDto.consortiumId;
    if (consortiumId) {
      const consortium = await this.prisma.consortium.findUnique({
        where: { id: consortiumId }
      });
      if (!consortium) {
        throw new NotFoundException('Consortium not found');
      }
    }

    // Validar client
    let clientId = createUserDto.clientId;
    if (clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId }
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }
      
      // Se o client pertence a um consortium, garantir que o usuario tambem pertence
      if (client.consortiumId && !consortiumId) {
        consortiumId = client.consortiumId;
      }
    }

    // Validar municipality
    let municipalityId = createUserDto.municipalityId;
    if (municipalityId) {
      const municipality = await this.prisma.municipality.findUnique({
        where: { id: municipalityId }
      });
      if (!municipality) {
        throw new NotFoundException('Municipality not found');
      }
    }

    // Hash da senha
    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : null;

    // Criar usuario
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        phone: createUserDto.phone,
        passwordHash: hashedPassword,
        userType: createUserDto.userType,
        consortiumId,
        clientId,
        municipalityId,
        isActive: createUserDto.isActive ?? true
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        consortiumId: true,
        clientId: true,
        municipalityId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Associar roles
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          roles: {
            connect: createUserDto.roleIds.map((roleId) => ({ id: roleId }))
          }
        }
      });
    }

    return user;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    consortiumId?: string,
    clientId?: string,
    userType?: string
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (consortiumId) {
      where.consortiumId = consortiumId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (userType) {
      where.userType = userType;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          userType: true,
          consortiumId: true,
          clientId: true,
          municipalityId: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: {
              id: true,
              name: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string, currentUser?: any) {
    // Validar acesso
    if (currentUser && currentUser.userType !== 'ADMIN_NACIONAL') {
      const user = await this.prisma.user.findUnique({
        where: { id }
      });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verificar se o usuario atual pode acessar este usuario
      if (user.consortiumId !== currentUser.consortiumId && 
          user.clientId !== currentUser.clientId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        consortiumId: true,
        clientId: true,
        municipalityId: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        permissions: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: any) {
    // Validar acesso
    if (currentUser && currentUser.userType !== 'ADMIN_NACIONAL') {
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });
      
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Verificar se o usuario atual pode atualizar este usuario
      if (existingUser.consortiumId !== currentUser.consortiumId && 
          existingUser.clientId !== currentUser.clientId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Verificar se o email ja existe para outro usuario
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          id: { not: id }
        }
      });
      
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Hash da nova senha se fornecida
    let passwordHash: string | undefined;
    if (updateUserDto.password) {
      passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Atualizar usuario
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: updateUserDto.email,
        name: updateUserDto.name,
        phone: updateUserDto.phone,
        passwordHash,
        userType: updateUserDto.userType,
        isActive: updateUserDto.isActive
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
        consortiumId: true,
        clientId: true,
        municipalityId: true,
        isActive: true,
        updatedAt: true
      }
    });

    // Atualizar roles
    if (updateUserDto.roleIds) {
      await this.prisma.user.update({
        where: { id },
        data: {
          roles: {
            set: updateUserDto.roleIds.map((roleId) => ({ id: roleId }))
          }
        }
      });
    }

    return user;
  }

  async remove(id: string, currentUser?: any) {
    // Validar acesso
    if (currentUser && currentUser.userType !== 'ADMIN_NACIONAL') {
      const existingUser = await this.prisma.user.findUnique({
        where: { id }
      });
      
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Verificar se o usuario atual pode deletar este usuario
      if (existingUser.consortiumId !== currentUser.consortiumId && 
          existingUser.clientId !== currentUser.clientId) {
        throw new ForbiddenException('Access denied');
      }
    }

    await this.prisma.user.delete({
      where: { id }
    });

    return { message: 'User deleted successfully' };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
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
  }

  async addPermissionToUser(userId: string, permissionCode: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode }
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: {
          connect: { id: permission.id }
        }
      }
    });

    return { message: 'Permission added successfully' };
  }

  async removePermissionFromUser(userId: string, permissionCode: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode }
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: {
          disconnect: { id: permission.id }
        }
      }
    });

    return { message: 'Permission removed successfully' };
  }
}
