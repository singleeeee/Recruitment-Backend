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
import { AiEvaluationService } from '../services/ai-evaluation.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationStatusDto } from '../dto/update-application-status.dto';
import { ApplicationQueryDto } from '../dto/application-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('applications')
@ApiBearerAuth('JWT-auth')
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly aiEvaluationService: AiEvaluationService,
  ) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '仪表盘统计',
    description: '获取仪表盘统计数据（统计卡片 + 最近活动）。club_admin 只返回自己社团的数据，super_admin 返回全局数据。',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        stats: {
          totalApplicants: 156,
          passedCount: 42,
          pendingInterviewCount: 28,
          rejectedCount: 12,
          submittedCount: 30,
          screeningCount: 20,
          offerSentCount: 10,
          acceptedCount: 14,
          activeRecruitments: 3,
        },
        recentActivities: [
          {
            id: 'uuid',
            type: 'application_submitted',
            content: '王小明 提交了「计算机技术协会...」的申请',
            applicantId: 'uuid',
            applicantName: '王小明',
            recruitmentTitle: '计算机技术协会 2025 春季招新',
            clubName: '计算机技术协会',
            status: 'submitted',
            time: '2026-03-17T10:00:00.000Z',
          },
        ],
      },
    },
  })
  async getDashboard(@Request() req) {
    return this.applicationService.getDashboardStats(
      req.user.id,
      req.user.role?.code || req.user.role,
    );
  }

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

  @Put(':id/files')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '为申请追加/更新关联文件',
    description: '先调用 POST /files/upload 上传文件获取 fileId，再通过此接口关联到申请。候选人本人或管理员可操作。',
  })
  @ApiResponse({ status: 200, description: '文件关联成功，返回该申请最新的完整文件列表（含 viewUrl / downloadUrl）' })
  async addFiles(
    @Param('id') id: string,
    @Body() body: { fileLinks: { fileId: string; fileType?: string; description?: string }[] },
    @Request() req,
  ) {
    return this.applicationService.addFiles(
      id,
      body.fileLinks,
      req.user.id,
      req.user.role?.code || req.user.role,
    );
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

  @Post(':id/ai-evaluate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: '手动触发 AI 评估',
    description: '管理员手动触发对指定申请的 AI 重新评估，评估异步执行，立即返回 202 Accepted。',
  })
  @ApiResponse({ status: 202, description: 'AI 评估已触发，结果稍后写入 aiScore / aiAnalysis 字段' })
  @ApiResponse({ status: 404, description: '申请不存在' })
  async triggerAiEvaluate(@Param('id') id: string) {
    await this.aiEvaluationService.triggerEvaluation(id);
    return { message: 'AI 评估已触发，结果将在稍后写入' };
  }
}