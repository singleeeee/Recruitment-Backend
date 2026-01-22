import { IsString, IsNotEmpty, IsOptional, IsDate, IsEnum, IsNumber, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRecruitmentDto {
  @ApiProperty({ example: '2024年春季招新', description: '招新标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '社团ID' })
  @IsString()
  @IsNotEmpty()
  clubId: string;

  @ApiProperty({ example: '我们社团致力于...', description: '招新描述' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2024-02-01T00:00:00.000Z', description: '招新开始时间' })
  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ApiProperty({ example: '2024-03-01T00:00:00.000Z', description: '招新结束时间' })
  @IsDate()
  @Type(() => Date)
  endTime: Date;

  @ApiProperty({ example: 50, description: '最大申请人数', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxApplicants?: number;

  @ApiProperty({ 
    example: ['name', 'studentId', 'phone'], 
    description: '必填字段列表',
    required: false 
  })
  @IsOptional()
  @IsString({ each: true })
  requiredFields?: string[];

  @ApiProperty({ 
    example: [
      {
        id: 'q1',
        question: '为什么想加入我们社团？',
        type: 'text',
        required: true
      }
    ], 
    description: '自定义问题列表',
    required: false 
  })
  @IsOptional()
  @IsObject({ each: true })
  customQuestions?: Array<{
    id: string;
    question: string;
    type: 'text' | 'choice' | 'file';
    required: boolean;
    options?: string[];
  }>;
}