import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  SCREENING = 'screening',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEW_COMPLETED = 'interview_completed',
  OFFER_SENT = 'offer_sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  REJECTED = 'rejected',
  ARCHIVED = 'archived'
}

/**
 * 状态流转规则（与前端保持一致）
 * key: 当前状态  value: 允许流转到的目标状态列表
 *
 * 管理员可操作的流转：
 *   submitted → screening / rejected / archived
 *   screening → interview_scheduled / rejected / archived
 *   interview_scheduled → interview_completed / rejected / archived
 *   interview_completed → offer_sent / rejected / archived
 *   offer_sent → accepted / archived
 *   accepted / declined / rejected → archived
 *
 * 候选人可操作的流转：
 *   offer_sent → declined（候选人自主婉拒 offer）
 */
export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.DRAFT]: [],
  [ApplicationStatus.SUBMITTED]: [
    ApplicationStatus.SCREENING,
    ApplicationStatus.REJECTED,
    ApplicationStatus.ARCHIVED,
  ],
  [ApplicationStatus.SCREENING]: [
    ApplicationStatus.INTERVIEW_SCHEDULED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.ARCHIVED,
  ],
  [ApplicationStatus.INTERVIEW_SCHEDULED]: [
    ApplicationStatus.INTERVIEW_COMPLETED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.ARCHIVED,
  ],
  [ApplicationStatus.INTERVIEW_COMPLETED]: [
    ApplicationStatus.OFFER_SENT,
    ApplicationStatus.REJECTED,
    ApplicationStatus.ARCHIVED,
  ],
  [ApplicationStatus.OFFER_SENT]: [
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.DECLINED,
    ApplicationStatus.ARCHIVED,
  ],
  [ApplicationStatus.ACCEPTED]: [ApplicationStatus.ARCHIVED],
  [ApplicationStatus.DECLINED]: [ApplicationStatus.ARCHIVED],
  [ApplicationStatus.REJECTED]: [ApplicationStatus.ARCHIVED],
  [ApplicationStatus.ARCHIVED]: [],
};

export class UpdateApplicationStatusDto {
  @ApiProperty({
    enum: ApplicationStatus,
    example: 'screening',
    description: '申请状态：draft(草稿), submitted(已提交), screening(筛选中), interview_scheduled(已安排面试), interview_completed(面试完成), offer_sent(已发offer), accepted(已接受), declined(已婉拒), rejected(未通过), archived(已归档)',
  })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @ApiProperty({
    example: '通过初步筛选，进入面试环节',
    description: '状态变更说明',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
