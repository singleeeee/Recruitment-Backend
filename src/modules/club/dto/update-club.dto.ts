import { PartialType } from '@nestjs/mapped-types';
import { CreateClubDto } from './create-club.dto';
import { IsArray, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClubDto extends PartialType(CreateClubDto) {
  @ApiProperty({ example: true, description: '是否活跃', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateClubAdminsDto {
  @ApiProperty({ 
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'], 
    description: '社团管理员ID数组（用于完全替换现有管理员）',
    required: true,
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  adminIds?: string[];
}

export class AddClubAdminDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: '要添加的社团管理员ID',
    required: true
  })
  @IsUUID('4')
  adminId: string;
}

export class RemoveClubAdminDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: '要移除的社团管理员ID',
    required: true
  })
  @IsUUID('4')
  adminId: string;
}
