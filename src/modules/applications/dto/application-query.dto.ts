import { IsOptional, IsString, IsEnum, IsDate, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ApplicationStatus } from './update-application-status.dto';

export class ApplicationQueryDto {
  @ApiProperty({ 
    enum: ApplicationStatus,
    example: 'submitted',
    description: '按状态筛选',
    required: false 
  })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: '按招新ID筛选',
    required: false 
  })
  @IsOptional()
  @IsString()
  recruitmentId?: string;

  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: '按申请人ID筛选',
    required: false 
  })
  @IsOptional()
  @IsString()
  applicantId?: string;

  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174002',
    description: '按社团ID筛选',
    required: false 
  })
  @IsOptional()
  @IsString()
  clubId?: string;

  @ApiProperty({ 
    example: 1,
    description: '页码',
    required: false 
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ 
    example: 10,
    description: '每页数量',
    required: false 
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;
}