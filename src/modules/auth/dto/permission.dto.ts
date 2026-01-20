import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  MaxLength
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    example: '用户管理',
    description: '权限名称'
  })
  @IsString({ message: '权限名称必须是字符串' })
  @IsNotEmpty({ message: '权限名称不能为空' })
  @MaxLength(100, { message: '权限名称不能超过100个字符' })
  name: string;

  @ApiProperty({
    example: 'user_manage',
    description: '权限代码，唯一标识'
  })
  @IsString({ message: '权限代码必须是字符串' })
  @IsNotEmpty({ message: '权限代码不能为空' })
  @MaxLength(100, { message: '权限代码不能超过100个字符' })
  code: string;

  @ApiProperty({
    example: 'user',
    description: '权限所属模块 (auth, user, recruitment, application, file, system)'
  })
  @IsString({ message: '模块名称必须是字符串' })
  @IsNotEmpty({ message: '模块名称不能为空' })
  @MaxLength(50, { message: '模块名称不能超过50个字符' })
  module: string;

  @ApiProperty({
    example: '管理用户相关功能',
    description: '权限描述',
    required: false
  })
  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  @MaxLength(200, { message: '权限描述不能超过200个字符' })
  description?: string;
}

export class UpdatePermissionDto {
  @ApiProperty({
    example: '用户管理',
    description: '权限名称',
    required: false
  })
  @IsOptional()
  @IsString({ message: '权限名称必须是字符串' })
  @MaxLength(100, { message: '权限名称不能超过100个字符' })
  name?: string;

  @ApiProperty({
    example: '管理用户相关功能',
    description: '权限描述',
    required: false
  })
  @IsOptional()
  @IsString({ message: '权限描述必须是字符串' })
  @MaxLength(200, { message: '权限描述不能超过200个字符' })
  description?: string;
}

export class PermissionResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: '权限ID'
  })
  id: string;

  @ApiProperty({
    example: '用户管理',
    description: '权限名称'
  })
  name: string;

  @ApiProperty({
    example: 'user_manage',
    description: '权限代码'
  })
  code: string;

  @ApiProperty({
    example: 'user',
    description: '权限所属模块'
  })
  module: string;

  @ApiProperty({
    example: '管理用户相关功能',
    description: '权限描述'
  })
  description?: string;

  @ApiProperty({
    example: '2026-01-17T07:14:27.788Z',
    description: '创建时间'
  })
  createdAt: Date;

  @ApiProperty({
    example: [
      {
        id: 'role-id',
        name: '超级管理员',
        code: 'system_admin'
      }
    ],
    description: '拥有此权限的角色列表'
  })
  roles?: {
    id: string;
    name: string;
    code: string;
  }[];
}

export class PermissionListResponseDto {
  @ApiProperty({
    example: true,
    description: '是否成功'
  })
  success: boolean;

  @ApiProperty({
    example: '获取权限列表成功',
    description: '消息'
  })
  message: string;

  @ApiProperty({
    type: [PermissionResponseDto],
    description: '权限列表数据'
  })
  data: PermissionResponseDto[];

  @ApiProperty({
    example: '2026-01-20T02:03:44.436Z',
    description: '时间戳'
  })
  timestamp: string;
}

export class ModulePermissionsDto {
  @ApiProperty({
    example: 'user',
    description: '模块名称'
  })
  module: string;

  @ApiProperty({
    type: [PermissionResponseDto],
    description: '该模块下的权限列表'
  })
  permissions: PermissionResponseDto[];
}

export class GroupedPermissionsResponseDto {
  @ApiProperty({
    example: true,
    description: '是否成功'
  })
  success: boolean;

  @ApiProperty({
    example: '获取分组权限列表成功',
    description: '消息'
  })
  message: string;

  @ApiProperty({
    type: [ModulePermissionsDto],
    description: '按模块分组的权限列表数据'
  })
  data: ModulePermissionsDto[];

  @ApiProperty({
    example: '2026-01-20T02:03:44.436Z',
    description: '时间戳'
  })
  timestamp: string;
}