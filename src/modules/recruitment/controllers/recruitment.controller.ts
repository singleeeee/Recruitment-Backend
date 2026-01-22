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
import { RecruitmentService } from '../services/recruitment.service';
import { CreateRecruitmentDto } from '../dto/create-recruitment.dto';
import { UpdateRecruitmentDto } from '../dto/update-recruitment.dto';
import { UpdateRecruitmentStatusDto } from '../dto/recruitment-status.dto';
import { RecruitmentQueryDto } from '../dto/recruitment-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('recruitment')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取招新列表' })
  @ApiResponse({
    status: 200,
    description: '获取招新列表成功',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: '2024年春季招新',
            clubId: '123e4567-e89b-12d3-a456-426614174001',
            description: '我们社团致力于...',
            startTime: '2024-02-01T00:00:00.000Z',
            endTime: '2024-03-01T00:00:00.000Z',
            status: 'published',
            club: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: '技术社团',
              description: '一个专注于技术创新的社团'
            },
            applicationCount: 25
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      }
    }
  })
  async findAll(@Query() query: RecruitmentQueryDto) {
    return this.recruitmentService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取招新详情' })
  @ApiResponse({
    status: 200,
    description: '获取招新详情成功'
  })
  @ApiResponse({
    status: 404,
    description: '招新不存在'
  })
  async findOne(@Param('id') id: string) {
    return this.recruitmentService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建招新' })
  @ApiResponse({
    status: 201,
    description: '创建招新成功'
  })
  @ApiResponse({
    status: 403,
    description: '没有权限创建招新'
  })
  @ApiResponse({
    status: 400,
    description: '参数验证失败'
  })
  async create(
    @Body() createRecruitmentDto: CreateRecruitmentDto,
    @Request() req,
  ) {
    return this.recruitmentService.create(createRecruitmentDto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新招新' })
  @ApiResponse({
    status: 200,
    description: '更新招新成功'
  })
  @ApiResponse({
    status: 403,
    description: '没有权限修改招新'
  })
  @ApiResponse({
    status: 404,
    description: '招新不存在'
  })
  async update(
    @Param('id') id: string,
    @Body() updateRecruitmentDto: UpdateRecruitmentDto,
    @Request() req,
  ) {
    return this.recruitmentService.update(id, updateRecruitmentDto, req.user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新招新状态' })
  @ApiResponse({
    status: 200,
    description: '更新状态成功'
  })
  @ApiResponse({
    status: 403,
    description: '没有权限修改招新状态'
  })
  @ApiResponse({
    status: 404,
    description: '招新不存在'
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateRecruitmentStatusDto,
    @Request() req,
  ) {
    return this.recruitmentService.updateStatus(id, updateStatusDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除招新' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: '删除成功'
  })
  @ApiResponse({
    status: 403,
    description: '没有权限删除招新'
  })
  @ApiResponse({
    status: 404,
    description: '招新不存在'
  })
  @ApiResponse({
    status: 400,
    description: '该招新已有申请，无法删除'
  })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.recruitmentService.remove(id, req.user.id);
  }
}