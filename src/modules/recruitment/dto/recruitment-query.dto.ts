import { IsOptional, IsString, IsEnum, IsDate, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RecruitmentStatus } from './recruitment-status.dto';

export class RecruitmentQueryDto {
  @ApiProperty({ 
    enum: RecruitmentStatus,
    example: 'published',
    description: '按状态筛选',
    required: false 
  })
  @IsOptional()
  @IsEnum(RecruitmentStatus)
  status?: RecruitmentStatus;

  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: '按社团ID筛选',
    required: false 
  })
  @IsOptional()
  @IsString()
  clubId?: string;

  @ApiProperty({ 
    example: '前端开发',
    description: '搜索关键词',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

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