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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RecruitmentService } from '../services/recruitment.service';
import { CreateRecruitmentDto } from '../dto/create-recruitment.dto';
import { UpdateRecruitmentDto } from '../dto/update-recruitment.dto';
import { UpdateRecruitmentStatusDto } from '../dto/recruitment-status.dto';
import { RecruitmentQueryDto } from '../dto/recruitment-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@ApiTags('recruitment')
@ApiBearerAuth('JWT-auth')
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取招新列表 (需要认证)' })
  @ApiResponse({ status: 200, description: '获取招新列表成功' })
  async findAll(@Query() query: RecruitmentQueryDto, @Request() req: { user: AuthenticatedUser }) {
    return this.recruitmentService.findAll(query, req.user.id, req.user.role, req.user.clubId);
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: '公开获取招新列表 (无需认证)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'clubId', required: false, type: String, description: '社团ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取公开招新列表成功' })
  async findAllPublished(@Query() query: RecruitmentQueryDto) {
    return this.recruitmentService.findAllPublished(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取招新详情 (需要认证)' })
  @ApiResponse({ status: 200, description: '获取招新详情成功' })
  @ApiResponse({ status: 404, description: '招新不存在' })
  async findOne(@Param('id') id: string, @Request() req: { user: AuthenticatedUser }) {
    return this.recruitmentService.findOne(id, req.user.id, req.user.role, req.user.clubId);
  }

  @Get('public/:id')
  @Public()
  @ApiOperation({ summary: '公开获取招新详情 (无需认证)' })
  @ApiResponse({ status: 200, description: '获取公开招新详情成功' })
  @ApiResponse({ status: 404, description: '招新不存在或尚未发布' })
  async findOnePublished(@Param('id') id: string) {
    return this.recruitmentService.findOnePublished(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建招新' })
  @ApiResponse({ status: 201, description: '创建招新成功' })
  @ApiResponse({ status: 403, description: '没有权限创建招新' })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  async create(
    @Body() createRecruitmentDto: CreateRecruitmentDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.recruitmentService.create(createRecruitmentDto, req.user.id, req.user.role, req.user.clubId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新招新' })
  @ApiResponse({ status: 200, description: '更新招新成功' })
  @ApiResponse({ status: 403, description: '没有权限修改招新' })
  @ApiResponse({ status: 404, description: '招新不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateRecruitmentDto: UpdateRecruitmentDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.recruitmentService.update(id, updateRecruitmentDto, req.user.id, req.user.role, req.user.clubId);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新招新状态' })
  @ApiResponse({ status: 200, description: '更新状态成功' })
  @ApiResponse({ status: 403, description: '没有权限修改招新状态' })
  @ApiResponse({ status: 404, description: '招新不存在' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateRecruitmentStatusDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.recruitmentService.updateStatus(id, updateStatusDto, req.user.id, req.user.role, req.user.clubId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除招新' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 403, description: '没有权限删除招新' })
  @ApiResponse({ status: 404, description: '招新不存在' })
  @ApiResponse({ status: 400, description: '该招新已有申请，无法删除' })
  async remove(
    @Param('id') id: string,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.recruitmentService.remove(id, req.user.id, req.user.role, req.user.clubId);
  }
}
