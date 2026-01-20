import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  MaxLength,
  Min,
  Max
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @ApiProperty({
    example: '超级管理员',
    description: '角色名称'
  })
  @IsString({ message: '角色名称必须是字符串' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @MaxLength(50, { message: '角色名称不能超过50个字符' })
  name: string;

  @ApiProperty({
    example: 'system_admin',
    description: '角色代码，唯一标识'
  })
  @IsString({ message: '角色代码必须是字符串' })
  @IsNotEmpty({ message: '角色代码不能为空' })
  @MaxLength(50, { message: '角色代码不能超过50个字符' })
  code: string;

  @ApiProperty({
    example: '系统最高权限管理员',
    description: '角色描述',
    required: false
  })
  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  @MaxLength(200, { message: '角色描述不能超过200个字符' })
  description?: string;

  @ApiProperty({
    example: 2,
    description: '角色级别 (0:候选人, 1:社团管理员, 2:超级管理员)',
    minimum: 0,
    maximum: 2
  })
  @IsInt({ message: '角色级别必须是整数' })
  @Min(0, { message: '角色级别不能小于0' })
  @Max(2, { message: '角色级别不能大于2' })
  level: number;

  @ApiProperty({
    example: ['user_manage', 'recruitment_manage'],
    description: '分配给角色的权限代码数组',
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: '权限代码必须是数组' })
  @IsString({ each: true, message: '每个权限代码必须是字符串' })
  permissionCodes?: string[];
}

export class UpdateRoleDto {
  @ApiProperty({
    example: '超级管理员',
    description: '角色名称',
    required: false
  })
  @IsOptional()
  @IsString({ message: '角色名称必须是字符串' })
  @MaxLength(50, { message: '角色名称不能超过50个字符' })
  name?: string;

  @ApiProperty({
    example: '系统最高权限管理员',
    description: '角色描述',
    required: false
  })
  @IsOptional()
  @IsString({ message: '角色描述必须是字符串' })
  @MaxLength(200, { message: '角色描述不能超过200个字符' })
  description?: string;

  @ApiProperty({
    example: 2,
    description: '角色级别 (0:候选人, 1:社团管理员, 2:超级管理员)',
    minimum: 0,
    maximum: 2,
    required: false
  })
  @IsOptional()
  @IsInt({ message: '角色级别必须是整数' })
  @Min(0, { message: '角色级别不能小于0' })
  @Max(2, { message: '角色级别不能大于2' })
  level?: number;

  @ApiProperty({
    example: true,
    description: '是否启用角色',
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: '角色启用状态必须是布尔值' })
  isActive?: boolean;

  @ApiProperty({
    example: ['user_manage', 'recruitment_manage'],
    description: '分配给角色的权限代码数组',
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: '权限代码必须是数组' })
  @IsString({ each: true, message: '每个权限代码必须是字符串' })
  permissionCodes?: string[];
}

export class AssignPermissionsDto {
  @ApiProperty({
    example: ['user_manage', 'recruitment_manage'],
    description: '要分配的权限代码数组',
    type: [String]
  })
  @IsArray({ message: '权限代码必须是数组' })
  @IsString({ each: true, message: '每个权限代码必须是字符串' })
  @IsNotEmpty({ each: true, message: '权限代码不能为空' })
  permissionCodes: string[];
}

export class RoleResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: '角色ID'
  })
  id: string;

  @ApiProperty({
    example: '超级管理员',
    description: '角色名称'
  })
  name: string;

  @ApiProperty({
    example: 'system_admin',
    description: '角色代码'
  })
  code: string;

  @ApiProperty({
    example: '系统最高权限管理员',
    description: '角色描述'
  })
  description?: string;

  @ApiProperty({
    example: 2,
    description: '角色级别'
  })
  level: number;

  @ApiProperty({
    example: true,
    description: '是否启用'
  })
  isActive: boolean;

  @ApiProperty({
    example: [
      {
        id: 'permission-id',
        name: '用户管理',
        code: 'user_manage',
        module: 'user'
      }
    ],
    description: '角色拥有的权限列表'
  })
  permissions?: {
    id: string;
    name: string;
    code: string;
    module: string;
  }[];

  @ApiProperty({
    example: '2026-01-17T07:14:27.788Z',
    description: '创建时间'
  })
  createdAt: Date;

  @ApiProperty({
    example: '2026-01-17T07:14:27.788Z',
    description: '更新时间'
  })
  updatedAt: Date;
}

export class RoleListResponseDto {
  @ApiProperty({
    example: true,
    description: '是否成功'
  })
  success: boolean;

  @ApiProperty({
    example: '获取角色列表成功',
    description: '消息'
  })
  message: string;

  @ApiProperty({
    type: [RoleResponseDto],
    description: '角色列表数据'
  })
  data: RoleResponseDto[];

  @ApiProperty({
    example: '2026-01-20T02:03:44.436Z',
    description: '时间戳'
  })
  timestamp: string;
}