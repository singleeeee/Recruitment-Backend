import { IsEmail, IsNotEmpty, MinLength, MaxLength, IsObject, IsOptional } from 'class-validator';
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

export class ProfileFieldDataDto {
  @ApiProperty({
    example: 'name',
    description: '字段名称',
  })
  @IsNotEmpty({ message: '字段名称不能为空' })
  fieldName: string;

  @ApiProperty({
    example: '张三',
    description: '字段值',
  })
  @IsNotEmpty({ message: '字段值不能为空' })
  fieldValue: string;
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
    example: 'test@example.com',
    description: '邀请人邮箱',
    required: false,
  })
  @IsEmail({}, { message: '邀请人邮箱格式无效' })
  inviterEmail?: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: '用户档案字段数据，根据RegistrationField配置动态生成',
    example: {
      studentId: '2021001001',
      phone: '15706623209',
      college: '计算机学院',
      major: '计算机科学与技术',
      grade: '大一',
      experience: '我的相关经验是...',
      motivation: '我加入的动机是...'
    }
  })
  @IsOptional()
  @IsObject({ message: '档案字段数据格式错误' })
  profileFields?: { [key: string]: string }; // 或者 Record<string, string>
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
    name?: string;
    role: {
      id: string;
      name: string;
      code: string;
    };
    studentId?: string;
    college?: string;
    major?: string;
    grade?: string;
    phone?: string;
    avatar?: string;
    status: string;
    experience?: string; // 动态字段
    motivation?: string; // 动态字段
    profileFields?: { [key: string]: string }; // 所有动态字段
  };
}