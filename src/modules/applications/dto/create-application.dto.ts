import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '招新批次ID' })
  @IsUUID()
  @IsNotEmpty()
  recruitmentId: string;

  @ApiProperty({ example: '这是我的简历...', description: '简历文本内容' })
  @IsString()
  @IsOptional()
  resumeText?: string;

  @ApiProperty({ 
    example: {
      name: '张三',
      studentId: '2021001001',
      phone: '15706623209',
      college: '计算机学院',
      major: '计算机科学与技术',
      experience: '我的相关经验是...',
      motivation: '我加入的动机是...'
    },
    description: '申请表单数据'
  })
  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;

  // 文件上传将在单独的API中处理
  // fileIds field removed as it requires schema changes
}