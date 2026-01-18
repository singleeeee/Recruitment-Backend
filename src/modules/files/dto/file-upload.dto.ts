import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class FileUploadDto {
  @ApiProperty({ 
    description: '文件分类',
    example: 'resume',
    enum: ['resume', 'avatar', 'portfolio', 'certificate'],
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(['resume', 'avatar', 'portfolio', 'certificate'])
  category?: string;

  @ApiProperty({ 
    description: '文件描述',
    example: '个人简历',
    required: false 
  })
  @IsOptional()
  @IsString()
  description?: string;
}