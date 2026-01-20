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
import { PermissionService } from '../services/permission.service';
import { 
  CreatePermissionDto, 
  UpdatePermissionDto,
  PermissionResponseDto,
  PermissionListResponseDto,
  GroupedPermissionsResponseDto
} from '../dto/permission.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';

@ApiTags('权限管理 - Permissions')
@ApiBearerAuth('JWT-auth')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('system_admin')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({
    summary: '获取权限列表',
    description: '获取所有权限，支持按模块筛选和关键词搜索'
  })
  @ApiQuery({
    name: 'module',
    required: false,
    type: String,
    description: '权限模块筛选，如 user, recruitment, application 等',
    example: 'user'
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    type: String,
    description: '搜索关键词，支持权限名称、代码、描述搜索',
    example: '用户'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取权限列表',
    type: PermissionListResponseDto,
    schema: {
      example: {
        success: true,
        message: '获取权限列表成功',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: '用户管理',
            code: 'user_manage',
            module: 'user',
            description: '管理用户相关功能',
            createdAt: '2026-01-17T07:14:27.788Z',
            roles: [
              {
                id: 'role-id',
                name: '超级管理员',
                code: 'system_admin'
              }
            ]
          }
        ],
        timestamp: '2026-01-20T02:03:44.436Z'
      }
    }
  })
  async getPermissions(
    @Query('module') module?: string,
    @Query('keyword') keyword?: string
  ): Promise<PermissionListResponseDto> {
    let permissions: PermissionResponseDto[];
    
    if (module) {
      permissions = await this.permissionService.getPermissionsByModuleName(module);
    } else if (keyword) {
      permissions = await this.permissionService.searchPermissions(keyword);
    } else {
      permissions = await this.permissionService.getAllPermissions();
    }
    
    return {
      success: true,
      message: '获取权限列表成功',
      data: permissions,
      timestamp: new Date().toISOString()
    };
  }

  @Get('grouped')
  @ApiOperation({
    summary: '获取按模块分组的权限列表',
    description: '获取所有权限，并按模块分组返回'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取分组权限列表',
    type: GroupedPermissionsResponseDto,
    schema: {
      example: {
        success: true,
        message: '获取分组权限列表成功',
        data: [
          {
            module: 'user',
            permissions: [
              {
                id: 'permission-id',
                name: '用户管理',
                code: 'user_manage',
                module: 'user',
                description: '管理用户相关功能',
                createdAt: '2026-01-17T07:14:27.788Z'
              }
            ]
          }
        ],
        timestamp: '2026-01-20T02:03:44.436Z'
      }
    }
  })
  async getGroupedPermissions(): Promise<GroupedPermissionsResponseDto> {
    const groupedPermissions = await this.permissionService.getPermissionsByModule();
    
    return {
      success: true,
      message: '获取分组权限列表成功',
      data: groupedPermissions,
      timestamp: new Date().toISOString()
    };
  }

  @Get('modules')
  @ApiOperation({
    summary: '获取所有权限模块列表',
    description: '获取系统中所有可用的权限模块'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取模块列表',
    schema: {
      example: {
        success: true,
        message: '获取模块列表成功',
        data: ['auth', 'user', 'recruitment', 'application', 'file', 'system'],
        timestamp: '2026-01-20T02:03:44.436Z'
      }
    }
  })
  async getModules(): Promise<{ success: boolean; message: string; data: string[]; timestamp: string }> {
    const modules = await this.permissionService.getAllModules();
    
    return {
      success: true,
      message: '获取模块列表成功',
      data: modules,
      timestamp: new Date().toISOString()
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: '获取权限统计信息',
    description: '获取权限相关的统计数据'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取统计信息',
    schema: {
      example: {
        success: true,
        message: '获取统计信息成功',
        data: {
          totalPermissions: 25,
          modules: {
            'user': 5,
            'recruitment': 8,
            'application': 6,
            'file': 3,
            'system': 3
          },
          roleAssignments: 45
        },
        timestamp: '2026-01-20T02:03:44.436Z'
      }
    }
  })
  async getPermissionStats(): Promise<{
    success: boolean;
    message: string;
    data: any;
    timestamp: string;
  }> {
    const stats = await this.permissionService.getPermissionStats();
    
    return {
      success: true,
      message: '获取统计信息成功',
      data: stats,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取权限详情',
    description: '根据权限ID获取权限详细信息'
  })
  @ApiParam({
    name: 'id',
    description: '权限ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取权限详情',
    type: PermissionResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '权限不存在'
  })
  async getPermissionById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<PermissionResponseDto> {
    return this.permissionService.getPermissionById(id);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: '根据权限代码获取权限',
    description: '根据权限代码获取权限详细信息'
  })
  @ApiParam({
    name: 'code',
    description: '权限代码',
    example: 'user_manage'
  })
  @ApiResponse({
    status: 200,
    description: '成功获取权限详情',
    type: PermissionResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '权限不存在'
  })
  async getPermissionByCode(
    @Param('code') code: string
  ): Promise<PermissionResponseDto> {
    return this.permissionService.getPermissionByCode(code);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建权限',
    description: '创建新权限'
  })
  @ApiBody({
    type: CreatePermissionDto,
    description: '权限创建信息',
    examples: {
      example1: {
        summary: '创建权限示例',
        value: {
          name: '用户查看',
          code: 'user_read',
          module: 'user',
          description: '查看用户信息'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '权限创建成功',
    type: PermissionResponseDto
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误'
  })
  @ApiResponse({
    status: 409,
    description: '权限代码已存在'
  })
  async createPermission(
    @Body() createPermissionDto: CreatePermissionDto
  ): Promise<PermissionResponseDto> {
    return this.permissionService.createPermission(createPermissionDto);
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '批量创建权限',
    description: '批量创建多个权限，会自动跳过已存在的权限'
  })
  @ApiBody({
    type: [CreatePermissionDto],
    description: '权限创建信息数组',
    examples: {
      example1: {
        summary: '批量创建权限示例',
        value: [
          {
            name: '用户查看',
            code: 'user_read',
            module: 'user',
            description: '查看用户信息'
          },
          {
            name: '用户创建',
            code: 'user_create',
            module: 'user',
            description: '创建用户'
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '权限批量创建完成',
    type: [PermissionResponseDto]
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误'
  })
  async createPermissions(
    @Body() createPermissionDtos: CreatePermissionDto[]
  ): Promise<PermissionResponseDto[]> {
    return this.permissionService.createPermissions(createPermissionDtos);
  }

  @Put(':id')
  @ApiOperation({
    summary: '更新权限',
    description: '更新权限信息'
  })
  @ApiParam({
    name: 'id',
    description: '权限ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    type: UpdatePermissionDto,
    description: '权限更新信息'
  })
  @ApiResponse({
    status: 200,
    description: '权限更新成功',
    type: PermissionResponseDto
  })
  @ApiResponse({
    status: 404,
    description: '权限不存在'
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误'
  })
  async updatePermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto
  ): Promise<PermissionResponseDto> {
    return this.permissionService.updatePermission(id, updatePermissionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '删除权限',
    description: '删除指定权限'
  })
  @ApiParam({
    name: 'id',
    description: '权限ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: '权限删除成功',
    schema: {
      example: {
        message: '权限删除成功'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '无法删除正在使用的权限'
  })
  @ApiResponse({
    status: 404,
    description: '权限不存在'
  })
  async deletePermission(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ message: string }> {
    return this.permissionService.deletePermission(id);
  }

  @Post('validate')
  @ApiOperation({
    summary: '验证权限代码',
    description: '验证一组权限代码的有效性'
  })
  @ApiBody({
    description: '要验证的权限代码数组',
    schema: {
      type: 'object',
      properties: {
        codes: {
          type: 'array',
          items: { type: 'string' },
          example: ['user_read', 'user_create', 'invalid_permission']
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '权限代码验证结果',
    schema: {
      example: {
        success: true,
        message: '权限代码验证完成',
        data: {
          valid: ['user_read', 'user_create'],
          invalid: ['invalid_permission']
        },
        timestamp: '2026-01-20T02:03:44.436Z'
      }
    }
  })
  async validatePermissionCodes(
    @Body('codes') codes: string[]
  ): Promise<{
    success: boolean;
    message: string;
    data: { valid: string[]; invalid: string[] };
    timestamp: string;
  }> {
    const result = await this.permissionService.validatePermissionCodes(codes);
    
    return {
      success: true,
      message: '权限代码验证完成',
      data: result,
      timestamp: new Date().toISOString()
    };
  }
}