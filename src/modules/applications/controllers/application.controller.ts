import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationService } from '../services/application.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationStatusDto } from '../dto/update-application-status.dto';
import { ApplicationQueryDto } from '../dto/application-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('applications')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取申请列表' })
  @ApiResponse({
    status: 200,
    description: '获取申请列表成功',
  })
  async findAll(@Query() query: ApplicationQueryDto, @Request() req) {
    return this.applicationService.findAll(
      query, 
      req.user.id, 
      req.user.role?.code
    );
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取我的申请' })
  @ApiResponse({
    status: 200,
    description: '获取我的申请成功',
  })
  async getMyApplications(@Request() req) {
    return this.applicationService.getMyApplications(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取申请详情' })
  @ApiResponse({
    status: 200,
    description: '获取申请详情成功'
  })
  @ApiResponse({
    status: 404,
    description: '申请不存在'
  })
  @ApiResponse({
    status: 403,
    description: '没有权限查看该申请'
  })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.applicationService.findOne(
      id, 
      req.user.id, 
      req.user.role?.code
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '提交申请' })
  @ApiResponse({
    status: 201,
    description: '提交申请成功'
  })
  @ApiResponse({
    status: 400,
    description: '参数验证失败或申请条件不满足'
  })
  @ApiResponse({
    status: 404,
    description: '招新不存在'
  })
  @ApiResponse({
    status: 409,
    description: '您已申请过该招新'
  })
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Request() req,
  ) {
    return this.applicationService.create(createApplicationDto, req.user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新申请状态' })
  @ApiResponse({
    status: 200,
    description: '更新状态成功'
  })
  @ApiResponse({
    status: 403,
    description: '没有权限修改申请状态'
  })
  @ApiResponse({
    status: 404,
    description: '申请不存在'
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateApplicationStatusDto,
    @Request() req,
  ) {
    return this.applicationService.updateStatus(id, updateStatusDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除申请' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: '删除成功'
  })
  @ApiResponse({
    status: 403,
    description: '没有权限删除该申请'
  })
  @ApiResponse({
    status: 404,
    description: '申请不存在'
  })
  @ApiResponse({
    status: 400,
    description: '只能删除草稿状态的申请'
  })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.applicationService.remove(id, req.user.id);
  }
}