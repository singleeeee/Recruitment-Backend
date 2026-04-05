import { IsString, IsOptional, IsArray, IsEnum, IsEmail, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── 收件人筛选类型 ───────────────────────────────────────────────
export enum RecipientFilterType {
  ALL = 'all',                         // 所有有邮箱的用户
  SPECIFIC = 'specific',               // 手动指定邮箱
  BY_STATUS = 'by_status',             // 按申请状态
  BY_RECRUITMENT = 'by_recruitment',   // 按招新批次
  BY_CLUB = 'by_club',                 // 按社团
}

// ─── 发送邮件 DTO ─────────────────────────────────────────────────
export class SendEmailDto {
  @ApiProperty({ description: '邮件主题' })
  @IsString()
  subject: string;

  @ApiProperty({ description: '邮件正文（HTML）' })
  @IsString()
  body: string;

  @ApiProperty({ description: '发件人显示名称' })
  @IsString()
  senderName: string;

  @ApiProperty({ enum: RecipientFilterType, description: '收件人筛选类型' })
  @IsEnum(RecipientFilterType)
  filterType: RecipientFilterType;

  @ApiPropertyOptional({ description: '筛选参数（根据 filterType 不同而不同）' })
  @IsOptional()
  @IsObject()
  filterParams?: {
    emails?: string[];          // SPECIFIC 时使用
    status?: string;            // BY_STATUS 时使用
    recruitmentId?: string;     // BY_RECRUITMENT 时使用
    clubId?: string;            // BY_CLUB 时使用
  };

  @ApiPropertyOptional({ description: '使用的模板 ID' })
  @IsOptional()
  @IsString()
  templateId?: string;
}

// ─── 预览收件人 DTO ───────────────────────────────────────────────
export class PreviewRecipientsDto {
  @ApiProperty({ enum: RecipientFilterType })
  @IsEnum(RecipientFilterType)
  filterType: RecipientFilterType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  filterParams?: {
    emails?: string[];
    status?: string;
    recruitmentId?: string;
    clubId?: string;
  };
}

// ─── 创建模板 DTO ─────────────────────────────────────────────────
export class CreateTemplateDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '邮件主题' })
  @IsString()
  subject: string;

  @ApiProperty({ description: '邮件正文（HTML）' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: '模板说明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '变量列表', type: [String] })
  @IsOptional()
  @IsArray()
  variables?: string[];
}

// ─── 更新模板 DTO ─────────────────────────────────────────────────
export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  variables?: string[];
}
