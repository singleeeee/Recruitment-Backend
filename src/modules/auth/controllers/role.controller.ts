import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { RoleService } from '../services/role.service';
import { 
  CreateRoleDto, 
  UpdateRoleDto, 
  AssignPermissionsDto,
  RoleResponseDto,
  RoleListResponseDto
} from '../dto/role.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';

@ApiTags('角色权限 - Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({
    summary: '获取角色列表',
    description: '获取所有角色，支持筛选活跃/非活跃状态'
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: '是否包含非活跃角色，默认false',
    example: false
  })
  @ApiResponse({
    status: 200,
    description: '成功获取角色列表',
    type: RoleListResponseDto,
    schema: {
      example: {
        success: true,
        message: '获取角色列表成功',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: '系统管理员',
            code: 'super_admin',
            description: '系统最高权限管理员',
            level: 2,
            isActive: true,
            permissions: [
              {
                id: 'permission-id',
                name: '用户管理',
                code: 'user_manage',
                module: 'user'
              }
            ],
            createdAt: '2026-01-17T07:14:27.788Z',
            updatedAt: '2026-01-17T07:14:27.788Z'
          }
        ],
        timestamp: '2026-01-20T02:03:44.436Z'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问'
  })
  @ApiResponse({
    status: 403,
    description: '权限不足'
  })
  async getAllRoles(
    @Query('includeInactive') includeInactive: string = 'false'
  ): Promise<RoleListResponseDto> {
    const includeInactiveBool = includeInactive === 'true';
    const roles = await this.roleService.getAllRoles(includeInactiveBool);
    
    return {
      success: true,
      message: '获取角色列表成功',
      data: roles,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取角色详情',
    description: '根据角色ID获取角色详细信息'
  })
  @ApiParam({
    name: 'id',
    description: '角色ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取角色详情',
    type: RoleResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async getRoleById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<RoleResponseDto> {
    return this.roleService.getRoleById(id);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: '根据角色代码获取角色',
    description: '根据角色代码获取角色详细信息'
  })
  @ApiParam({
    name: 'code',
    description: '角色代码',
    example: 'super_admin'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取角色详情',
    type: RoleResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async getRoleByCode(
    @Param('code') code: string
  ): Promise<RoleResponseDto> {
    return this.roleService.getRoleByCode(code);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建角色',
    description: '创建新角色并可选分配权限'
  })
  @ApiBody({
    type: CreateRoleDto,
    description: '角色创建信息',
    examples: {
      example1: {
        summary: '创建角色示例',
        value: {
          name: '测试管理员',
          code: 'test_admin',
          description: '测试用管理员角色',
          level: 1,
          permissionCodes: ['user_read', 'recruitment_read']
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '角色创建成功',
    type: RoleResponseDto
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误'
  })
  @ApiResponse({
    status: 409,
    description: '角色代码已存在'
  })
  async createRole(
    @Body() createRoleDto: CreateRoleDto
  ): Promise<RoleResponseDto> {
    return this.roleService.createRole(createRoleDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: '更新角色',
    description: '更新角色信息，可选更新权限'
  })
  @ApiParam({
    name: 'id',
    description: '角色ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    type: UpdateRoleDto,
    description: '角色更新信息'
  })
  @ApiResponse({
    status: 200,
    description: '角色更新成功',
    type: RoleResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误'
  })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto
  ): Promise<RoleResponseDto> {
    return this.roleService.updateRole(id, updateRoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除角色',
    description: '删除指定角色'
  })
  @ApiParam({
    name: 'id',
    description: '角色ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: '角色删除成功',
    schema: {
      example: {
        message: '角色删除成功'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '无法删除正在使用的角色'
  })
  @ApiResponse({
    status: 403,
    description: '系统默认角色不允许删除'
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async deleteRole(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ message: string }> {
    return this.roleService.deleteRole(id);
  }

  @Post(':id/permissions')
  @ApiOperation({
    summary: '分配权限给角色',
    description: '为角色分配一组权限，会替换角色原有的所有权限'
  })
  @ApiParam({
    name: 'id',
    description: '角色ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    type: AssignPermissionsDto,
    description: '要分配的权限代码数组',
    examples: {
      example1: {
        summary: '分配权限示例',
        value: {
          permissionCodes: ['user_read', 'user_create', 'recruitment_manage']
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '权限分配成功',
    type: RoleResponseDto
  })
  @ApiResponse({
    status: 400,
    description: '权限代码不存在'
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async assignPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto
  ): Promise<RoleResponseDto> {
    return this.roleService.assignPermissions(id, assignPermissionsDto);
  }

  @Post(':id/permissions/add')
  @ApiOperation({
    summary: '添加权限到角色',
    description: '向角色添加一组权限，不会替换原有权限'
  })
  @ApiParam({
    name: 'id',
    description: '角色ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    description: '要添加的权限代码数组',
    schema: {
      type: 'object',
      properties: {
        permissionCodes: {
          type: 'array',
          items: { type: 'string' },
          example: ['user_read', 'user_create']
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '权限添加成功',
    type: RoleResponseDto
  })
  @ApiResponse({
    status: 400,
    description: '权限代码不存在'
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async addPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('permissionCodes') permissionCodes: string[]
  ): Promise<RoleResponseDto> {
    return this.roleService.addPermissions(id, permissionCodes);
  }

  @Delete(':id/permissions/remove')
  @ApiOperation({
    summary: '从角色移除权限',
    description: '从角色中移除指定的权限'
  })
  @ApiParam({
    name: 'id',
    description: '角色ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    description: '要移除的权限代码数组',
    schema: {
      type: 'object',
      properties: {
        permissionCodes: {
          type: 'array',
          items: { type: 'string' },
          example: ['user_read', 'user_create']
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '权限移除成功',
    type: RoleResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async removePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('permissionCodes') permissionCodes: string[]
  ): Promise<RoleResponseDto> {
    return this.roleService.removePermissions(id, permissionCodes);
  }

  @Get(':id/permissions')
  @ApiOperation({
    summary: '获取角色的权限代码',
    description: '获取角色的所有权限代码列表'
  })
  @ApiParam({
    name: 'id',
    description: '角色ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取角色权限代码',
    schema: {
      example: {
        success: true,
        message: '获取角色权限代码成功',
        data: ['user_read', 'user_create', 'recruitment_manage'],
        timestamp: '2026-01-20T02:03:44.436Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async getRolePermissionCodes(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ success: boolean; message: string; data: string[]; timestamp: string }> {
    const permissionCodes = await this.roleService.getRolePermissionCodes(id);
    
    return {
      success: true,
      message: '获取角色权限代码成功',
      data: permissionCodes,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id/has-permission/:permissionCode')
  @ApiOperation({
    summary: '检查角色是否有指定权限',
    description: '检查角色是否拥有指定的权限'
  })
  @ApiParam({
    name: 'id',
    description: '角色ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiParam({
    name: 'permissionCode',
    description: '权限代码',
    example: 'user_manage'
  })
  @ApiResponse({
    status: 200,
    description: '检查完成',
    schema: {
      example: {
        success: true,
        message: '权限检查完成',
        data: { hasPermission: true },
        timestamp: '2026-01-20T02:03:44.436Z'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '角色不存在'
  })
  async checkRolePermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('permissionCode') permissionCode: string
  ): Promise<{ success: boolean; message: string; data: { hasPermission: boolean }; timestamp: string }> {
    const hasPermission = await this.roleService.roleHasPermission(id, permissionCode);
    
    return {
      success: true,
      message: '权限检查完成',
      data: { hasPermission },
      timestamp: new Date().toISOString()
    };
  }
}