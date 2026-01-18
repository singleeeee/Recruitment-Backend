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
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRegistrationFieldDto,
  UpdateRegistrationFieldDto,
} from '../../registration-field/dto/registration-field.dto';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  // ========== 社团管理 ==========

  @Get('clubs')
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
    const skip = (page - 1) * limit;
    // 显式指定 where 的类型，帮助 TypeScript 理解 nested object
    const where: any = search /* PrismaClient.GeneratedTypes['ClubWhereInput'] */ // 此处手动指定 any
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const, // 使用 'as const' 来指定字面量类型
          },
        }
      : {};

    const [clubs, total] = await Promise.all([
      this.prisma.club.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              admins: true,
              recruitments: true,
            },
          },
        },
      }),
      this.prisma.club.count({ where }),
    ]);

    // 显式声明类型，确保 TypeScript 编译器知道 `club` 包含了 _count 属性
    type ClubWithCounts = Awaited<ReturnType<typeof this.prisma.club.findMany>>[number]; // findMany 返回的每个元素类型

    return {
      data: (clubs as any[]).map((club: any) => ({ // 使用 any 彻底忽略类型检查
        ...club,
        adminCount: club._count.admins,
        recruitmentCount: club._count.recruitments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get('clubs/:id')
  @ApiOperation({
    summary: '获取社团详情',
    description: '超级管理员查看指定社团的详细信息',
  })
  @ApiParam({
    name: 'id',
    description: '社团ID',
  })
  async getClubDetail(@Param('id', ParseUUIDPipe) clubId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        admins: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
        recruitments: {
          select: {
            id: true,
            title: true,
            status: true,
            startTime: true,
            endTime: true,
            createdAt: true,
          },
        },
      },
    });

    if (!club) {
      throw new Error('社团不存在');
    }

    return club;
  }

  @Post('clubs')
  @ApiOperation({
    summary: '创建社团',
    description: '超级管理员创建新社团',
  })
  async createClub(
    @Body()
    createClubDto: {
      name: string;
      description?: string;
      category?: string;
      logo?: string;
    },
  ) {
    return this.prisma.club.create({
      data: createClubDto,
    });
  }

  @Put('clubs/:id')
  @ApiOperation({
    summary: '更新社团信息',
    description: '超级管理员修改社团信息',
  })
  async updateClub(
    @Param('id', ParseUUIDPipe) clubId: string,
    @Body()
    updateClubDto: {
      name?: string;
      description?: string;
      category?: string;
      logo?: string;
      isActive?: boolean;
    },
  ) {
    return this.prisma.club.update({
      where: { id: clubId },
      data: updateClubDto,
    });
  }

  @Delete('clubs/:id')
  @ApiOperation({
    summary: '删除社团',
    description: '超级管理员删除社团（软删除，设置isActive为false）',
  })
  async deleteClub(@Param('id', ParseUUIDPipe) clubId: string) {
    // 软删除，设置isActive为false
    return this.prisma.club.update({
      where: { id: clubId },
      data: {
        isActive: false,
      },
    });
  }

  // ========== 用户管理 ==========

  @Get('users')
  @ApiOperation({
    summary: '获取所有用户列表',
    description: '超级管理员查看所有用户账号信息',
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
    name: 'role',
    required: false,
    type: String,
    description: '角色筛选：candidate, club_admin, system_admin',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: '状态筛选：active, inactive, suspended',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '搜索关键词（邮箱、姓名）',
  })
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const skip = (page - 1) * limit;
    
    const where: any = {}; // 显式指定为 any 以绕过复杂类型检查

    if (role) {
      where.role = {
        code: role,
      };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          email: {
            contains: search,
            mode: 'insensitive' as const, // 使用 'as const'
          },
        },
        {
          name: {
            contains: search,
            mode: 'insensitive' as const, // 使用 'as const'
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          profileFields: {
            include: {
              field: {
                select: {
                  fieldName: true,
                  fieldLabel: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 聚合用户档案字段
    const enrichedUsers = users.map((user) => {
      const profileFieldMap: { [key: string]: string } = {};
      user.profileFields.forEach((field) => {
        profileFieldMap[field.field.fieldName] = field.fieldValue;
      });

      return {
        ...user,
        role: user.role,
        studentId: profileFieldMap['studentId'],
        phone: profileFieldMap['phone'],
        college: profileFieldMap['college'],
        major: profileFieldMap['major'],
        grade: profileFieldMap['grade'],
        profileFields: profileFieldMap,
      };
    });

    return {
      data: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Get('users/:id')
  @ApiOperation({
    summary: '获取用户详情',
    description: '超级管理员查看指定用户的详细信息',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
  })
  async getUserDetail(@Param('id', ParseUUIDPipe) userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        club: true,
        profileFields: {
          include: {
            field: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 聚合档案字段
    const profileFieldMap: { [key: string]: string } = {};
    user.profileFields.forEach((field) => {
      profileFieldMap[field.field.fieldName] = field.fieldValue;
    });

    return {
      ...user,
      profileFields: profileFieldMap,
    };
  }

  @Put('users/:id/status')
  @ApiOperation({
    summary: '修改用户状态',
    description: '超级管理员修改用户账号状态',
  })
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body()
    statusDto: {
      status: 'active' | 'inactive' | 'suspended';
      reason?: string;
    },
  ) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 超级管理员不能修改其他超级管理员的状态
    if (existingUser.roleId) {
      const userRole = await this.prisma.role.findUnique({
        where: { id: existingUser.roleId },
      });
      if (userRole?.code === 'system_admin') {
        throw new Error('不能修改超级管理员的状态');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: statusDto.status,
      },
    });
  }

  @Delete('users/:id')
  @ApiOperation({
    summary: '删除用户账号',
    description: '超级管理员删除用户账号（软删除）',
  })
  async deleteUser(@Param('id', ParseUUIDPipe) userId: string) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 超级管理员不能被删除
    if (existingUser.roleId) {
      const userRole = await this.prisma.role.findUnique({
        where: { id: existingUser.roleId },
      });
      if (userRole?.code === 'system_admin') {
        throw new Error('不能删除超级管理员账号');
      }
    }

    // 软删除：设置状态为inactive
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'inactive',
      },
    });
  }

  // ========== 注册字段管理 ==========

  @Get('registration-fields')
  @ApiOperation({
    summary: '获取所有注册字段配置',
    description: '超级管理员查看所有注册字段设置',
  })
  async getAllRegistrationFields() {
    const fields = await this.prisma.registrationField.findMany({
      orderBy: {
        fieldOrder: 'asc',
      },
    });

    return fields;
  }

  @Get('registration-fields/active')
  @ApiOperation({
    summary: '获取启用的注册字段配置',
    description: '获取当前启用的注册字段（用于前端显示注册表单）',
  })
  async getActiveRegistrationFields() {
    const fields = await this.prisma.registrationField.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        fieldOrder: 'asc',
      },
    });

    return fields;
  }

  @Post('registration-fields')
  @ApiOperation({
    summary: '创建注册字段',
    description: '超级管理员添加新的注册字段',
  })
  async createRegistrationField(
    @Body() createDto: CreateRegistrationFieldDto,
  ) {
    return this.prisma.registrationField.create({
      data: createDto,
    });
  }

  @Put('registration-fields/:id')
  @ApiOperation({
    summary: '更新注册字段',
    description: '超级管理员修改注册字段配置',
  })
  async updateRegistrationField(
    @Param('id', ParseUUIDPipe) fieldId: string,
    @Body() updateDto: UpdateRegistrationFieldDto,
  ) {
    return this.prisma.registrationField.update({
      where: { id: fieldId },
      data: updateDto,
    });
  }

  @Delete('registration-fields/:id')
  @ApiOperation({
    summary: '删除注册字段',
    description: '超级管理员删除注册字段配置',
  })
  async deleteRegistrationField(@Param('id', ParseUUIDPipe) fieldId: string) {
    return this.prisma.registrationField.delete({
      where: { id: fieldId },
    });
  }

  // ========== 系统统计 ==========

  @Get('stats/overview')
  @ApiOperation({
    summary: '获取系统概览统计',
    description: '超级管理员查看系统整体数据统计',
  })
  async getSystemOverview() {
    const [
      totalUsers,
      totalClubs,
      totalRecruitments,
      activeUsers,
      activeRecruitments,
      usersByRole,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.club.count(),
      this.prisma.recruitmentBatch.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
      this.prisma.recruitmentBatch.count({
        where: {
          status: { in: ['published', 'ongoing'] },
        },
      }),
      this.prisma.user.groupBy({
        by: ['roleId'],
        _count: {
          id: true,
        },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          role: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      }),
    ]);

    // 处理角色统计
    const roleStats = await Promise.all(
      usersByRole.map(async (item) => {
        const role = await this.prisma.role.findUnique({
          where: { id: item.roleId },
        });
        return {
          roleName: role?.name || '未知',
          roleCode: role?.code || 'unknown',
          count: item._count.id,
        };
      }),
    );

    return {
      overview: {
        totalUsers,
        totalClubs,
        totalRecruitments,
        activeUsers,
        activeRecruitments,
      },
      usersByRole: roleStats,
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      })),
    };
  }
}

// DTOs
export class CreateClubDto {
  name: string;
  description?: string;
  category?: string;
  logo?: string;
}

export class UpdateClubDto {
  name?: string;
  description?: string;
  category?: string;
  logo?: string;
  isActive?: boolean;
}

export class UpdateUserStatusDto {
  status: 'active' | 'inactive' | 'suspended';
  reason?: string;
}