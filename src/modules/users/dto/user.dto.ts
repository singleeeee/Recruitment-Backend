import { IsString, IsOptional, IsEmail, MaxLength, IsUrl, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBasicInfoDto {
  @ApiProperty({
    example: '张三',
    description: '用户姓名',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '姓名必须是字符串' })
  @MaxLength(100, { message: '姓名不能超过100个字符' })
  name?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: '用户头像URL',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: '头像URL格式不正确' })
  avatar?: string;
}

export class UpdateProfileFieldsDto {
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
  @IsObject({ message: 'profileFields必须是一个对象' })
  profileFields: { [key: string]: string };
}

export class UserProfileFieldDto {
  @ApiProperty({
    example: 'studentId',
    description: '字段名称',
  })
  @IsString()
  fieldName: string;

  @ApiProperty({
    example: '2021001001',
    description: '字段值',
  })
  @IsString()
  fieldValue: string;
}