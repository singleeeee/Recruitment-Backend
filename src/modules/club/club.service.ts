import {
  Injectable,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import {
  UpdateClubDto,
  UpdateClubAdminsDto,
  AddClubAdminDto,
  RemoveClubAdminDto,
} from './dto/update-club.dto';

@Injectable()
export class ClubService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页获取社团列表，支持搜索
   */
  async findAll({
    page = 1,
    limit = 10,
    search,
    isActive,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const skip = (page - 1) * limit;
    const where: any = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    // Only add isActive filter if it's explicitly provided
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

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

    return {
      data: (clubs as any[]).map((club: any) => ({
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

  /**
   * 根据 ID 获取社团详情
   */
  async findOne(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
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
      throw new BadRequestException('社团不存在');
    }

    return club;
  }

  /**
   * 创建新社团
   */
  async create(createClubDto: CreateClubDto) {
    // 使用 DTO
    // 检查社团名称是否已存在
    const existingClub = await this.prisma.club.findUnique({
      where: { name: createClubDto.name },
    });

    if (existingClub) {
      throw new ConflictException('社团名称已存在');
    }

    // 如果指定了管理员，验证这些用户是否存在且是社团管理员角色
    if (createClubDto.adminIds && createClubDto.adminIds.length > 0) {
      await this.validateAndPrepareAdmins(createClubDto.adminIds);
    }

    return this.prisma.club.create({
      data: {
        name: createClubDto.name,
        description: createClubDto.description,
        category: createClubDto.category,
        logo: createClubDto.logo,
        admins:
          createClubDto.adminIds && createClubDto.adminIds.length > 0
            ? {
                connect: createClubDto.adminIds.map((id) => ({ id })),
              }
            : undefined,
      },
    });
  }

  /**
   * 更新社团信息
   */
  async update(id: string, updateClubDto: UpdateClubDto) {
    // 检查社团是否存在
    const existingClub = await this.prisma.club.findUnique({
      where: { id },
    });
    if (!existingClub) {
      throw new BadRequestException('社团不存在');
    }

    // 如果更新名称，检查新名称是否与其他社团重复
    if (updateClubDto.name && updateClubDto.name !== existingClub.name) {
      const duplicateClub = await this.prisma.club.findUnique({
        where: { name: updateClubDto.name },
      });
      if (duplicateClub) {
        throw new ConflictException('社团名称已存在');
      }
    }

    return this.prisma.club.update({
      where: { id },
      data: updateClubDto,
    });
  }

  /**
   * 删除社团 (软删除)
   */
  async remove(id: string) {
    // 检查社团是否存在
    const existingClub = await this.prisma.club.findUnique({
      where: { id },
    });

    if (!existingClub) {
      throw new BadRequestException('社团不存在');
    }

    // 执行软删除
    return this.prisma.club.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * 验证并准备管理员数据
   */
  private async validateAndPrepareAdmins(adminIds: string[]) {
    const clubAdminRole = await this.prisma.role.findUnique({
      where: { code: 'club_admin' },
    });

    if (!clubAdminRole) {
      throw new InternalServerErrorException('系统错误：未找到社团管理员角色');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: adminIds },
        roleId: clubAdminRole.id,
      },
    });

    if (users.length !== adminIds.length) {
      throw new BadRequestException('部分指定的用户不存在或不是社团管理员角色');
    }

    // 检查是否有管理员已经管理其他社团
    const conflictUsers = await this.prisma.user.findMany({
      where: {
        id: { in: adminIds },
        clubId: { not: null },
      },
    });

    if (conflictUsers.length > 0) {
      const conflictNames = conflictUsers
        .map((u) => u.name || u.email)
        .join(', ');
      throw new BadRequestException(
        `以下管理员已经管理其他社团: ${conflictNames}`,
      );
    }
  }

  /**
   * 更新社团管理员
   */
  async updateClubAdmins(
    clubId: string,
    updateClubAdminsDto: UpdateClubAdminsDto,
  ) {
    // 检查社团是否存在
    const existingClub = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existingClub) {
      throw new BadRequestException('社团不存在');
    }

    // 验证新的管理员列表
    if (
      updateClubAdminsDto.adminIds &&
      updateClubAdminsDto.adminIds.length > 0
    ) {
      await this.validateAndPrepareAdmins(updateClubAdminsDto.adminIds);
    }

    // 更新社团的管理员：先断开所有现有连接，然后连接到新的管理员
    const updateData: any = {};

    if (
      updateClubAdminsDto.adminIds &&
      updateClubAdminsDto.adminIds.length > 0
    ) {
      updateData.admins = {
        set: updateClubAdminsDto.adminIds.map((id) => ({ id })),
      };
    } else {
      // 如果没有管理员，清除所有现有管理员
      updateData.admins = {
        set: [],
      };
    }

    // 更新用户表中的clubId字段
    const updatedClub = await this.prisma.$transaction(async (prisma) => {
      // 清除原来管理员的clubId
      const currentAdmins = await prisma.user.findMany({
        where: { clubId: clubId },
      });

      for (const admin of currentAdmins) {
        await prisma.user.update({
          where: { id: admin.id },
          data: { clubId: null },
        });
      }

      // 设置新管理员的clubId
      if (
        updateClubAdminsDto.adminIds &&
        updateClubAdminsDto.adminIds.length > 0
      ) {
        for (const adminId of updateClubAdminsDto.adminIds) {
          await prisma.user.update({
            where: { id: adminId },
            data: { clubId: clubId },
          });
        }
      }

      // 更新社团关联
      return prisma.club.update({
        where: { id: clubId },
        data: updateData,
      });
    });

    return updatedClub;
  }

  /**
   * 添加社团管理员
   */
  async addClubAdmin(clubId: string, addClubAdminDto: AddClubAdminDto) {
    // 检查社团是否存在
    const existingClub = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existingClub) {
      throw new BadRequestException('社团不存在');
    }

    const { adminId } = addClubAdminDto;

    // 验证用户是否为社团管理员角色且是否已经管理其他社团
    const clubAdminRole = await this.prisma.role.findUnique({
      where: { code: 'club_admin' },
    });

    if (!clubAdminRole) {
      throw new InternalServerErrorException('系统错误：未找到社团管理员角色');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!user) {
      throw new BadRequestException('指定的用户不存在');
    }

    if (user.roleId !== clubAdminRole.id) {
      throw new BadRequestException('指定的用户不是社团管理员角色');
    }

    if (user.clubId && user.clubId !== clubId) {
      throw new BadRequestException('该管理员已经管理其他社团');
    }

    // 如果用户还没有clubId或者是其他社团的，更新clubId
    await this.prisma.$transaction(async (prisma) => {
      await prisma.user.update({
        where: { id: adminId },
        data: { clubId: clubId },
      });

      await prisma.club.update({
        where: { id: clubId },
        data: {
          admins: {
            connect: { id: adminId },
          },
        },
      });
    });

    return { message: '社团管理员添加成功' };
  }

  /**
   * 移除社团管理员
   */
  async removeClubAdmin(
    clubId: string,
    removeClubAdminDto: RemoveClubAdminDto,
  ) {
    // 检查社团是否存在
    const existingClub = await this.prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existingClub) {
      throw new BadRequestException('社团不存在');
    }

    const { adminId } = removeClubAdminDto;

    // 检查用户是否是该社团的管理员
    const admin = await this.prisma.user.findUnique({
      where: {
        id: adminId,
        clubId: clubId, // 同时属于该社团
      },
    });

    if (!admin) {
      throw new BadRequestException('指定的用户不是该社团的管理员');
    }

    // 移除管理员
    await this.prisma.$transaction(async (prisma) => {
      // 清除用户的clubId
      await prisma.user.update({
        where: { id: adminId },
        data: { clubId: null },
      });

      // 从社团的admins中移除
      await prisma.club.update({
        where: { id: clubId },
        data: {
          admins: {
            disconnect: { id: adminId },
          },
        },
      });
    });

    return { message: '社团管理员移除成功' };
  }
}
