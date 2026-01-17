import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '用户邮箱',
  })
  @IsEmail({}, { message: '邮箱格式无效' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: '登录密码',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6位' })
  @MaxLength(50, { message: '密码不能超过50位' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '用户邮箱',
  })
  @IsEmail({}, { message: '邮箱格式无效' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: '登录密码',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码至少6位' })
  @MaxLength(50, { message: '密码不能超过50位' })
  password: string;

  @ApiProperty({
    example: '张三',
    description: '用户姓名',
    required: false,
  })
  @MaxLength(100, { message: '姓名不能超过100位' })
  name?: string;

  @ApiProperty({
    example: '2021001001',
    description: '学号',
    required: false,
  })
  studentId?: string;

  @ApiProperty({
    example: '计算机学院',
    description: '学院',
    required: false,
  })
  college?: string;

  @ApiProperty({
    example: '计算机科学与技术',
    description: '专业',
    required: false,
  })
  major?: string;

  @ApiProperty({
    example: '2021级',
    description: '年级',
    required: false,
  })
  grade?: string;

  @ApiProperty({
    example: '13800138000',
    description: '手机号码',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    example: '一年项目经验',
    description: '相关经验',
    required: false,
  })
  experience?: string;

  @ApiProperty({
    example: '热爱技术，希望加入团队提升自己',
    description: '申请动机',
    required: false,
  })
  motivation?: string;
}

export class LoginResponseData {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT访问令牌',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT刷新令牌',
  })
  refreshToken: string;

  @ApiProperty({
    description: '用户信息',
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    studentId?: string;
    college?: string;
    major?: string;
    grade?: string;
    avatar?: string;
    experience?: string;
    motivation?: string;
  };
}