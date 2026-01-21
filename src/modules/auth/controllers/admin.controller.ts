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
  HttpCode,
  HttpStatus,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
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
  ApiBody,
} from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordUtils } from '../utils/password.utils'; // 引入 PasswordUtils
import {
  CreateRegistrationFieldDto,
  UpdateRegistrationFieldDto,
} from '../../registration-field/dto/registration-field.dto';
import { CreateClubAdminDto } from '../dto/create-club-admin.dto'; // 引入新的 DTO
import { UpdateUserRoleDto, UpdateUserInfoDto } from '../dto/role.dto'; // 引入更新用户角色和信息的 DTO
import { UsersService } from '../../users/users.service'; // 引入用户服务

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService
  ) {}






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
    description: '角色筛选：candidate, club_admin, super_admin',
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
      const searchConditions = [
        {
          email: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
      ];

      if (role || status) {
        // 如果已有其他条件，将搜索条件与其他条件结合
        where.AND = [
          { ...where }, // 保留现有条件
          { OR: searchConditions } // 添加搜索条件
        ];
        // 清理已经移动到AND中的条件
        delete where.role;
        delete where.status;
      } else {
        // 如果只有搜索条件
        where.OR = searchConditions;
      }
    }

    // 使用 Promise.all 并行执行多个查询以提高性能
    const [users, total, totalUsersCount, activeUsersCount, adminUsersCount, candidateUsersCount] = await Promise.all([
      this.prisma.user.findMany({ // 获取分页用户列表
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
      this.prisma.user.count({ where }), // 获取当前查询条件下的总用户数
      this.prisma.user.count(), // 获取数据库中的绝对总用户数
      this.prisma.user.count({ where: { status: 'active' } }), // 获取激活用户数
      this.prisma.user.count({ where: { role: { code: { in: ['super_admin', 'club_admin'] } } } }), // 获取管理员总数
      this.prisma.user.count({ where: { role: { code: 'candidate' } } }), // 获取候选人总数
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
       statistics: {
         totalUsers: totalUsersCount, // 使用直接从数据库获取的绝对总用户数
         activeUsers: activeUsersCount,
         adminUsers: adminUsersCount,
         candidateUsers: candidateUsersCount,
       },
    };
  }

  @Post('users/club-admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '创建社团管理员账号',
    description: '超级管理员手动创建社团管理员账号并指定其管理的社团',
  })
  @ApiBody({
    type: CreateClubAdminDto,
    description: '社团管理员账号创建信息',
    examples: {
      example1: {
        summary: '创建社团管理员示例',
        value: {
          email: 'clubadmin@example.com',
          password: 'password123',
          name: '张管理员',
          clubId: '123e4567-e89b-12d3-a456-426614174000'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '社团管理员账号创建成功',
    schema: {
      example: {
        message: '社团管理员账号创建成功',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'clubadmin@example.com',
          name: '张管理员',
          role: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: '社团管理员',
            code: 'club_admin'
          },
          club: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: '计算机协会'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误或社团不存在',
  })
  @ApiResponse({
    status: 409,
    description: '邮箱已被注册',
  })
  @ApiResponse({
    status: 500,
    description: '系统错误，如角色不存在',
  })
  async createClubAdmin(
    @Body() createClubAdminDto: CreateClubAdminDto, // 使用 DTO
  ) {
    const { email, password, name, clubId } = createClubAdminDto;

    // 1. 检查 email 是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 2. 从数据库获取 club_admin 角色 ID
    const clubAdminRole = await this.prisma.role.findUnique({
      where: { code: 'club_admin' },
    });
    if (!clubAdminRole) {
      throw new InternalServerErrorException('系统错误：未找到社团管理员角色');
    }

    // 3. 验证社团 ID 是否存在
    const clubToManage = await this.prisma.club.findUnique({
      where: { id: clubId },
    });
    if (!clubToManage) {
      throw new BadRequestException('指定的社团不存在');
    }

    // 4. 创建社团管理员账号
    const newClubAdmin = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await PasswordUtils.hashPassword(password),
        name,
        roleId: clubAdminRole.id,
        clubId: clubId, // 将用户与管理社团关联
      },
    });

    // 5. 为了返回信息的完整性，可以选择包含 role 和 club 信息
    const newClubAdminWithRelations = await this.prisma.user.findUnique({
      where: { id: newClubAdmin.id },
      include: {
        role: true,
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      message: '社团管理员账号创建成功',
      user: newClubAdminWithRelations,
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
      throw new NotFoundException('用户不存在');
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
      throw new NotFoundException('用户不存在');
    }

    // 超级管理员不能修改其他超级管理员的状态
    if (existingUser.roleId) {
      const userRole = await this.prisma.role.findUnique({
        where: { id: existingUser.roleId },
      });
      if (userRole?.code === 'system_admin') {
        throw new ForbiddenException('不能修改超级管理员的状态');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: statusDto.status,
      },
    });
  }

  @Put('users/:id/role')
  @ApiOperation({
    summary: '修改用户角色',
    description: '超级管理员修改用户账号的角色',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
  })
  @ApiBody({
    type: UpdateUserRoleDto,
    description: '角色更新信息',
  })
  @ApiResponse({
    status: 200,
    description: '用户角色更新成功',
    schema: {
      example: {
        message: '用户角色更新成功',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          name: '张三',
          role: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: '社团管理员',
            code: 'club_admin'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '用户或角色不存在',
  })
  @ApiResponse({
    status: 403,
    description: '不能修改超级管理员的角色',
  })
  async updateUserRole(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!existingUser) {
      throw new NotFoundException('用户不存在');
    }

    // 检查目标角色是否存在
    const targetRole = await this.prisma.role.findUnique({
      where: { code: updateUserRoleDto.roleCode },
    });

    if (!targetRole) {
      throw new NotFoundException('目标角色不存在');
    }

    // 超级管理员不能修改其他超级管理员的角色
    if (existingUser.role?.code === 'system_admin') {
      throw new ForbiddenException('不能修改超级管理员的角色');
    }

    // 如果从社团管理员改为其他角色，需要清除clubId
    let updateData: any = {
      roleId: targetRole.id,
    };

    if (existingUser.role?.code === 'club_admin' && updateUserRoleDto.roleCode !== 'club_admin') {
      updateData.clubId = null;
    }

    // 更新用户角色
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        role: true,
        club: true,
      },
    });

    return {
      message: '用户角色更新成功',
      user: updatedUser,
    };
  }

  @Put('users/:id')
  @ApiOperation({
    summary: '统一更新用户信息',
    description: '超级管理员统一更新用户信息，包括角色、状态、基本信息和档案字段',
  })
  @ApiParam({
    name: 'id',
    description: '用户ID',
  })
  @ApiBody({
    type: UpdateUserInfoDto,
    description: '用户信息更新数据',
  })
  @ApiResponse({
    status: 200,
    description: '用户信息更新成功',
    schema: {
      example: {
        message: '用户信息更新成功',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          name: '张三',
          status: 'active',
          role: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: '社团管理员',
            code: 'club_admin'
          },
          profileFields: {
            studentId: '2021001001',
            college: '计算机学院',
            major: '计算机科学与技术'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '用户或角色不存在',
  })
  @ApiResponse({
    status: 403,
    description: '不能修改超级管理员的信息',
  })
  @ApiResponse({
    status: 400,
    description: '请求参数错误',
  })
  async updateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() updateUserInfoDto: UpdateUserInfoDto,
  ) {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, club: true },
    });

    if (!existingUser) {
      throw new NotFoundException('用户不存在');
    }

    // 超级管理员不能修改其他超级管理员的信息
    if (existingUser.role?.code === 'system_admin') {
      throw new ForbiddenException('不能修改超级管理员的信息');
    }

    // 检查是否至少有一个更新字段
    const hasUpdates = updateUserInfoDto.roleCode || 
                      updateUserInfoDto.status || 
                      updateUserInfoDto.name !== undefined || 
                      updateUserInfoDto.avatar !== undefined || 
                      updateUserInfoDto.profileFields;

    if (!hasUpdates) {
      throw new BadRequestException('至少需要提供一个更新字段');
    }

    // 开始事务处理所有更新
    const updateResult = await this.prisma.$transaction(async (prisma) => {
      const updates: any = {};

      // 1. 处理角色更新
      if (updateUserInfoDto.roleCode) {
        const targetRole = await prisma.role.findUnique({
          where: { code: updateUserInfoDto.roleCode },
        });

        if (!targetRole) {
          throw new NotFoundException('目标角色不存在');
        }

        updates.roleId = targetRole.id;

        // 如果从社团管理员改为其他角色，需要清除clubId
        if (existingUser.role?.code === 'club_admin' && updateUserInfoDto.roleCode !== 'club_admin') {
          updates.clubId = null;
        }
      }

      // 2. 处理状态更新
      if (updateUserInfoDto.status) {
        updates.status = updateUserInfoDto.status;
      }

      // 3. 处理基本信息更新
      if (updateUserInfoDto.name !== undefined) {
        updates.name = updateUserInfoDto.name;
      }

      if (updateUserInfoDto.avatar !== undefined) {
        updates.avatar = updateUserInfoDto.avatar;
      }

      // 更新用户基本信息
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates,
        include: {
          role: true,
          club: true,
        },
      });

      // 4. 处理档案字段更新
      let updatedProfileFields = null;
      if (updateUserInfoDto.profileFields) {
        // 使用UsersService中的方法来处理档案字段更新
        try {
          const userWithUpdatedProfile = await this.usersService.updateProfileFields(
            userId,
            updateUserInfoDto.profileFields
          );

          // 聚合档案字段为映射
          const profileFieldMap: { [key: string]: string } = {};
          if (userWithUpdatedProfile.profileFields) {
            userWithUpdatedProfile.profileFields.forEach((field: any) => {
              profileFieldMap[field.field.fieldName] = field.fieldValue;
            });
          }
          updatedProfileFields = profileFieldMap;
        } catch (error) {
          // 如果档案字段更新失败，回滚整个事务
          throw new BadRequestException(`档案字段更新失败: ${error.message}`);
        }
      }

      return {
        user: updatedUser,
        profileFields: updatedProfileFields,
      };
    });

    // 获取最新的用户信息，包含档案字段
    const finalUser = await this.prisma.user.findUnique({
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

    // 聚合档案字段
    const profileFieldMap: { [key: string]: string } = {};
    if (finalUser.profileFields) {
      finalUser.profileFields.forEach((field: any) => {
        profileFieldMap[field.field.fieldName] = field.fieldValue;
      });
    }

    return {
      message: '用户信息更新成功',
      user: {
        ...finalUser,
        profileFields: profileFieldMap,
      },
      updatedFields: [
        updateUserInfoDto.roleCode && 'role',
        updateUserInfoDto.status && 'status',
        updateUserInfoDto.name !== undefined && 'name',
        updateUserInfoDto.avatar !== undefined && 'avatar',
        updateUserInfoDto.profileFields && 'profileFields',
      ].filter(Boolean),
    };
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