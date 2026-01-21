import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  MaxLength,
  Min,
  Max,
  IsUrl
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @ApiProperty({
    example: '系统管理员',
    description: '角色名称'
  })
  @IsString({ message: '角色名称必须是字符串' })
  @IsNotEmpty({ message: '角色名称不能为空' })
  @MaxLength(50, { message: '角色名称不能超过50个字符' })
  name: string;

  @ApiProperty({
    example: 'super_admin',
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
    description: '角色级别 (0:候选人, 1:社团管理员, 2:系统管理员)',
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
    example: '系统管理员',
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
    description: '角色级别 (0:候选人, 1:社团管理员, 2:系统管理员)',
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

export class UpdateUserRoleDto {
  @ApiProperty({
    example: 'club_admin',
    description: '要分配的角色代码: candidate, club_admin, system_admin',
    enum: ['candidate', 'club_admin', 'system_admin']
  })
  @IsString({ message: '角色代码必须是字符串' })
  @IsNotEmpty({ message: '角色代码不能为空' })
  roleCode: string;
}

export class UpdateUserInfoDto {
  @ApiProperty({
    example: 'club_admin',
    description: '要分配的角色代码: candidate, club_admin, system_admin',
    enum: ['candidate', 'club_admin', 'system_admin'],
    required: false
  })
  @IsOptional()
  @IsString({ message: '角色代码必须是字符串' })
  roleCode?: string;

  @ApiProperty({
    example: 'active',
    description: '用户状态: active, inactive, suspended',
    enum: ['active', 'inactive', 'suspended'],
    required: false
  })
  @IsOptional()
  @IsString({ message: '用户状态必须是字符串' })
  status?: 'active' | 'inactive' | 'suspended';

  @ApiProperty({
    example: '张三',
    description: '用户姓名',
    required: false
  })
  @IsOptional()
  @IsString({ message: '姓名必须是字符串' })
  @MaxLength(100, { message: '姓名不能超过100个字符' })
  name?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: '用户头像URL',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: '头像URL格式不正确' })
  avatar?: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: '用户档案字段数据，根据RegistrationField配置动态生成',
    example: {
      studentId: '2021001001',
      phone: '15706623209',
      college: '计算机学院',
      major: '计算机科学与技术',
      grade: '2021级',
      experience: '我的相关经验是...',
      motivation: '我加入的动机是...',
    }
  })
  @IsOptional()
  profileFields?: { [key: string]: string };

  @ApiProperty({
    example: '账号异常，暂时停用',
    description: '状态修改原因',
    required: false
  })
  @IsOptional()
  @IsString({ message: '状态修改原因必须是字符串' })
  statusReason?: string;
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
    example: 'super_admin',
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