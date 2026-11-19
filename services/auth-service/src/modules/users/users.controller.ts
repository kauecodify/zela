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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('user:create')
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createUserDto: CreateUserDto, @CurrentUser() currentUser: any) {
    return this.usersService.create(createUserDto, currentUser);
  }

  @Get()
  @Permissions('user:read')
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'consortiumId', required: false, type: String })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'userType', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('consortiumId') consortiumId?: string,
    @Query('clientId') clientId?: string,
    @Query('userType') userType?: string,
    @CurrentUser() currentUser?: any
  ) {
    return this.usersService.findAll(page, limit, consortiumId, clientId, userType);
  }

  @Get(':id')
  @Permissions('user:read')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser?: any) {
    return this.usersService.findOne(id, currentUser);
  }

  @Put(':id')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser?: any
  ) {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @Permissions('user:delete')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser?: any) {
    return this.usersService.remove(id, currentUser);
  }

  @Post(':id/permissions/:code')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Add permission to user' })
  @ApiResponse({ status: 200, description: 'Permission added successfully' })
  async addPermission(
    @Param('id') userId: string,
    @Param('code') permissionCode: string,
    @CurrentUser() currentUser?: any
  ) {
    return this.usersService.addPermissionToUser(userId, permissionCode);
  }

  @Delete(':id/permissions/:code')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Remove permission from user' })
  @ApiResponse({ status: 200, description: 'Permission removed successfully' })
  async removePermission(
    @Param('id') userId: string,
    @Param('code') permissionCode: string,
    @CurrentUser() currentUser?: any
  ) {
    return this.usersService.removePermissionFromUser(userId, permissionCode);
  }
}
