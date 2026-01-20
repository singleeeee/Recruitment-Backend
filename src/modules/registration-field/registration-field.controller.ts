import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationFieldService } from './registration-field.service';
import { CreateRegistrationFieldDto } from './dto/create-registration-field.dto';
import { UpdateRegistrationFieldDto } from './dto/update-registration-field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator'; // Assume roles decorator exists

@ApiTags('Registration Fields')
@Controller('registration-fields') // Plural for consistency
export class RegistrationFieldController {
  constructor(private readonly registrationFieldService: RegistrationFieldService) {}

  // --- 以下接口需要超级管理员权限 ---
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin') // 限制为超级管理员
  @ApiBearerAuth() // 指示这些端点需要 JWT 认证
  @Post()
  @ApiOperation({ summary: '(超级管理员) 创建新的注册字段' })
  create(@Body() createRegistrationFieldDto: CreateRegistrationFieldDto) {
    return this.registrationFieldService.create(createRegistrationFieldDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @Get('admin') // 区分公开的列表
  @ApiOperation({ summary: '(超级管理员) 获取所有注册字段 (包括未启用的)' })
  findAll() {
    return this.registrationFieldService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @Get('admin/:id')
  @ApiOperation({ summary: '(超级管理员) 获取特定注册字段详情' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationFieldService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: '(超级管理员) 更新注册字段' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateRegistrationFieldDto: UpdateRegistrationFieldDto) {
    return this.registrationFieldService.update(id, updateRegistrationFieldDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: '(超级管理员) 删除注册字段' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.registrationFieldService.remove(id);
  }

  // --- 公开 API，前端获取启用的注册字段配置 ---
  @Get('active') // /api/v1/registration-fields/active
  @ApiOperation({ summary: '获取所有启用的注册字段配置 (用于前端渲染注册表单)' })
  findAllActive() {
    return this.registrationFieldService.findAllActive();
  }
}
