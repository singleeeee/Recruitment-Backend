import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClubDto {
  @ApiProperty({ example: '计算机协会', description: '社团名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '这是一个专注于计算机技术的社团', description: '社团描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '科技', description: '社团类别', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', description: '社团 Logo URL', required: false })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174000'], 
    description: '社团管理员ID数组（可选，创建社团时不指定管理员）',
    required: false,
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  adminIds?: string[];
}
