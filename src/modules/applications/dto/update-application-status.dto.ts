import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  SCREENING = 'screening',
  PASSED = 'passed',
  REJECTED = 'rejected',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_COMPLETED = 'interview_completed',
  OFFER_SENT = 'offer_sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  ARCHIVED = 'archived'
}

export class UpdateApplicationStatusDto {
  @ApiProperty({ 
    enum: ApplicationStatus,
    example: 'screening',
    description: '申请状态：draft(草稿), submitted(已提交), screening(筛选中), passed(通过筛选), rejected(未通过), interview_scheduled(已安排面试), interview_completed(面试完成), offer_sent(已发offer), accepted(已接受), declined(已拒绝), archived(已归档)'
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiProperty({ 
    example: '通过初步筛选，进入面试环节',
    description: '状态变更说明',
    required: false 
  })
  @IsOptional()
  @IsString()
  comment?: string;
}