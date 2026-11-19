import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'Create new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'List all roles' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.rolesService.findAll(page, limit);
  }

  @Get(':id')
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put(':id')
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions/:code')
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'Add permission to role' })
  @ApiResponse({ status: 200, description: 'Permission added successfully' })
  async addPermission(
    @Param('id') roleId: string,
    @Param('code') permissionCode: string
  ) {
    return this.rolesService.addPermission(roleId, permissionCode);
  }

  @Delete(':id/permissions/:code')
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'Remove permission from role' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  async removePermission(
    @Param('id') roleId: string,
    @Param('code') permissionCode: string
  ) {
    return this.rolesService.removePermission(roleId, permissionCode);
  }

  @Get('permissions')
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'List all permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Post('permissions')
  @Permissions('settings:manage')
  @ApiOperation({ summary: 'Create new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  async createPermission(
    @Body() body: { code: string; name: string; description?: string; resource?: string; action?: string }
  ) {
    return this.rolesService.createPermission(
      body.code,
      body.name,
      body.description,
      body.resource,
      body.action
    );
  }
}
