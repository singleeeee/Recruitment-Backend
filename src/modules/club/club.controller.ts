import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto, UpdateClubAdminsDto, AddClubAdminDto, RemoveClubAdminDto } from './dto/update-club.dto';

@ApiTags('clubs')
@ApiBearerAuth('JWT-auth')
@Controller('clubs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Get()
  @ApiOperation({
    summary: '获取所有社团列表',
    description: '超级管理员查看所有社团信息',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词（社团名称）',
  })
  async getAllClubs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.clubService.findAll({ page, limit, search });
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取社团详情',
    description: '超级管理员查看指定社团的详细信息',
  })
  @ApiParam({
    name: 'id',
    description: '社团ID',
  })
  async getClubDetail(@Param('id', ParseUUIDPipe) clubId: string) {
    return this.clubService.findOne(clubId);
  }

  @Post()
  @ApiOperation({
    summary: '创建社团',
    description: '超级管理员创建新社团',
  })
  async createClub(
    @Body() createClubDto: CreateClubDto, // 使用 DTO
  ) {
    return this.clubService.create(createClubDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: '更新社团信息',
    description: '超级管理员修改社团信息',
  })
  @ApiParam({
    name: 'id',
    description: '社团ID',
  })
  async updateClub(
    @Param('id', ParseUUIDPipe) clubId: string,
    @Body() updateClubDto: UpdateClubDto,
  ) {
    return this.clubService.update(clubId, updateClubDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '删除社团',
    description: '超级管理员删除社团（软删除，设置isActive为false）',
  })
  async deleteClub(@Param('id', ParseUUIDPipe) clubId: string) {
    return this.clubService.remove(clubId);
  }

  @Put(':id/admins')
  @ApiOperation({
    summary: '更新社团管理员',
    description: '超级管理员替换社团的所有管理员',
  })
  @ApiParam({
    name: 'id',
    description: '社团ID',
  })
  async updateClubAdmins(
    @Param('id', ParseUUIDPipe) clubId: string,
    @Body() updateClubAdminsDto: UpdateClubAdminsDto,
  ) {
    return this.clubService.updateClubAdmins(clubId, updateClubAdminsDto);
  }

  @Post(':id/admins')
  @ApiOperation({
    summary: '添加社团管理员',
    description: '超级管理员为社团添加新的管理员',
  })
  @ApiParam({
    name: 'id',
    description: '社团ID',
  })
  async addClubAdmin(
    @Param('id', ParseUUIDPipe) clubId: string,
    @Body() addClubAdminDto: AddClubAdminDto,
  ) {
    return this.clubService.addClubAdmin(clubId, addClubAdminDto);
  }

  @Delete(':id/admins/:adminId')
  @ApiOperation({
    summary: '移除社团管理员',
    description: '超级管理员从社团移除指定的管理员',
  })
  @ApiParam({
    name: 'id',
    description: '社团ID',
  })
  @ApiParam({
    name: 'adminId',
    description: '要移除的管理员ID',
  })
  async removeClubAdmin(
    @Param('id', ParseUUIDPipe) clubId: string,
    @Param('adminId', ParseUUIDPipe) adminId: string,
  ) {
    return this.clubService.removeClubAdmin(clubId, { adminId });
  }
}