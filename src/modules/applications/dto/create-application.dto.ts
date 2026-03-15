import { IsString, IsNotEmpty, IsOptional, IsObject, IsUUID, IsArray } from 'class-validator';
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
    description: '申请表单数据 (存储在education字段)'
  })
  @IsOptional()
  @IsObject()
  formData?: Record<string, any>;

  @ApiProperty({
    example: {
      technical: [
        { name: 'Python', level: 'advanced', years: 3 },
        { name: 'JavaScript', level: 'intermediate', years: 2 }
      ],
      soft_skills: [
        { name: '团队合作', level: 'excellent' }
      ]
    },
    description: '技能信息 (可选)'
  })
  @IsOptional()
  @IsObject()
  skills?: Record<string, any>;

  @ApiProperty({
    example: [
      {
        type: 'project',
        title: '校园二手交易平台',
        description: '基于React和Node.js开发的全栈项目',
        startDate: '2023-06-01',
        endDate: '2023-08-31',
        skills: ['React', 'Node.js', 'MongoDB'],
        achievements: '获得校级创新项目二等奖'
      }
    ],
    description: '项目经验 (可选)'
  })
  @IsOptional()
  @IsArray()
  experiences?: any[];

  @ApiProperty({
    example: [
      {
        fileId: 'uuid-of-file',
        type: 'resume',
        filename: '张三_简历.pdf',
        originalName: '简历.pdf',
        description: '个人简历'
      }
    ],
    description: '附件文件列表 (可选)'
  })
  @IsOptional()
  @IsArray()
  attachments?: any[];

  // 文件上传将在单独的API中处理
  // fileIds field removed as it requires schema changes
}