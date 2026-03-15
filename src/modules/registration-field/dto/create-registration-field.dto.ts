import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsJSON } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegistrationFieldDto {
  @ApiProperty({ example: 'new_field', description: '字段名称 (唯一标识，如: studentId)' })
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @ApiProperty({ example: '新字段', description: '显示标签 (如: 学号)' })
  @IsString()
  @IsNotEmpty()
  fieldLabel: string;

  @ApiProperty({ example: 'text', description: '字段类型 (text, email, select, textarea, file, date)' })
  @IsString()
  @IsNotEmpty()
  fieldType: string;

  @ApiProperty({ example: 1, description: '字段排序' })
  @IsInt()
  @IsNotEmpty()
  fieldOrder: number;

  @ApiProperty({ example: true, description: '是否必填', default: false })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = false;

  @ApiProperty({ example: true, description: '是否启用', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ example: false, description: '是否用于招新批次', default: false })
  @IsBoolean()
  @IsOptional()
  isForRecruitment?: boolean = false;

  @ApiProperty({ example: true, description: '是否用于注册', default: true })
  @IsBoolean()
  @IsOptional()
  isForRegister?: boolean = true;

  @ApiProperty({ example: '{"options": [{"label": "男", "value": "male"}, {"label": "女", "value": "female"}]}', description: '选项配置 (JSON 字符串)', required: false })
  @IsOptional()
  @IsJSON() // Validate as JSON string
  options?: string;

  @ApiProperty({ example: '{"minLength": 10}', description: '验证规则 (JSON 字符串)', required: false })
  @IsOptional()
  @IsJSON() // Validate as JSON string
  validationRules?: string;

  @ApiProperty({ example: '请输入您的学号', description: '占位符文本', required: false })
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiProperty({ example: '请填写学校教务系统中的学号', description: '帮助文本', required: false })
  @IsString()
  @IsOptional()
  helpText?: string;
}
