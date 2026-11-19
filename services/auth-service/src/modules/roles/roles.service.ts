import {
  Injectable,
  NotFoundException,
  ConflictException
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name }
    });

    if (existingRole) {
      throw new ConflictException('Role already exists');
    }

    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
        isSystem: createRoleDto.isSystem ?? false
      }
    });

    // Associar permissões
    if (createRoleDto.permissionCodes && createRoleDto.permissionCodes.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { code: { in: createRoleDto.permissionCodes } }
      });

      await this.prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            connect: permissions.map((p) => ({ id: p.id }))
          }
        }
      });
    }

    return role;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take: limit,
        include: {
          permissions: true,
          users: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.role.count()
    ]);

    return {
      data: roles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { id }
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    // Verificar se o nome ja existe para outro role
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const roleWithName = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name }
      });
      
      if (roleWithName) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: updateRoleDto.name,
        description: updateRoleDto.description,
        isSystem: updateRoleDto.isSystem
      }
    });

    // Atualizar permissões
    if (updateRoleDto.permissionCodes) {
      const permissions = await this.prisma.permission.findMany({
        where: { code: { in: updateRoleDto.permissionCodes } }
      });

      await this.prisma.role.update({
        where: { id },
        data: {
          permissions: {
            set: permissions.map((p) => ({ id: p.id }))
          }
        }
      });
    }

    return role;
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { users: true }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ConflictException('Cannot delete system role');
    }

    if (role.users && role.users.length > 0) {
      throw new ConflictException('Cannot delete role with assigned users');
    }

    await this.prisma.role.delete({
      where: { id }
    });

    return { message: 'Role deleted successfully' };
  }

  async addPermission(roleId: string, permissionCode: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode }
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permission.id }
        }
      }
    });

    return { message: 'Permission added to role successfully' };
  }

  async removePermission(roleId: string, permissionCode: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode }
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          disconnect: { id: permission.id }
        }
      }
    });

    return { message: 'Permission removed from role successfully' };
  }

  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' }
    });
  }

  async createPermission(code: string, name: string, description?: string, resource?: string, action?: string) {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { code }
    });

    if (existingPermission) {
      throw new ConflictException('Permission already exists');
    }

    return this.prisma.permission.create({
      data: {
        code,
        name,
        description,
        resource,
        action
      }
    });
  }
}
