import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RecruitmentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ONGOING = 'ongoing',
  FINISHED = 'finished',
  ARCHIVED = 'archived'
}

export class UpdateRecruitmentStatusDto {
  @ApiProperty({ 
    enum: RecruitmentStatus,
    example: 'published',
    description: '招新状态：draft(草稿), published(已发布), ongoing(进行中), finished(已结束), archived(已归档)'
  })
  @IsEnum(RecruitmentStatus)
  status: RecruitmentStatus;
}