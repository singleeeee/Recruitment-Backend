import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecruitmentDto } from '../dto/create-recruitment.dto';
import { UpdateRecruitmentDto } from '../dto/update-recruitment.dto';
import { UpdateRecruitmentStatusDto, RecruitmentStatus } from '../dto/recruitment-status.dto';
import { RecruitmentQueryDto } from '../dto/recruitment-query.dto';

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);

  constructor(private prisma: PrismaService) {}

  async create(createRecruitmentDto: CreateRecruitmentDto, userId: string, userRole: string, adminClubId: string | null) {
    // 验证时间
    if (createRecruitmentDto.startTime >= createRecruitmentDto.endTime) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    const isAdmin = userRole === 'super_admin' || userRole === 'club_admin';
    if (!isAdmin) {
      throw new ForbiddenException('没有权限创建招新');
    }

    // club_admin 只能为自己的社团创建招新（直接用 req.user.clubId，无需查库）
    if (userRole === 'club_admin') {
      this.assertClubAdminOwnership(adminClubId, createRecruitmentDto.clubId, null);
    }

    const recruitment = await this.prisma.recruitmentBatch.create({
      data: {
        title: createRecruitmentDto.title,
        clubId: createRecruitmentDto.clubId,
        description: createRecruitmentDto.description,
        startTime: createRecruitmentDto.startTime,
        endTime: createRecruitmentDto.endTime,
        status: RecruitmentStatus.DRAFT,
        maxApplicants: createRecruitmentDto.maxApplicants,
        requiredFields: createRecruitmentDto.requiredFields || [],
        customQuestions: createRecruitmentDto.customQuestions || [],
        adminId: userId,
      },
    });

    return recruitment;
  }

  async findAll(query: RecruitmentQueryDto, userId?: string, userRole?: string, adminClubId?: string | null) {
    const { status, clubId, search, page = 1, limit = 10 } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (clubId) {
      where.clubId = clubId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // club_admin 强制限定为自己的社团（直接用 req.user.clubId，无需查库）
    if (userRole === 'club_admin') {
      where.clubId = adminClubId ?? '__no_club__';
    }

    const [recruitments, total] = await Promise.all([
      this.prisma.recruitmentBatch.findMany({
        where,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.recruitmentBatch.count({ where }),
    ]);

    return {
      data: recruitments.map((recruitment) => ({
        ...recruitment,
        applicationCount: recruitment._count.applications,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string, userRole?: string, adminClubId?: string | null) {
    const recruitment = await this.prisma.recruitmentBatch.findUnique({
      where: { id },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        applications: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            applicant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!recruitment) {
      throw new NotFoundException('招新不存在');
    }

    // club_admin 只能查看自己社团的招新详情（直接用 req.user.clubId，无需查库）
    if (userRole === 'club_admin') {
      this.assertClubAdminOwnership(adminClubId, recruitment.clubId, id);
    }

    return {
      ...recruitment,
      applicationCount: recruitment._count.applications,
    };
  }

  async update(id: string, updateRecruitmentDto: UpdateRecruitmentDto, userId: string, userRole: string, adminClubId: string | null) {
    const existingRecruitment = await this.prisma.recruitmentBatch.findUnique({
      where: { id },
    });

    if (!existingRecruitment) {
      throw new NotFoundException('招新不存在');
    }

    const isAdmin = userRole === 'super_admin' || userRole === 'club_admin';
    if (!isAdmin) {
      throw new ForbiddenException('没有权限修改招新');
    }

    // club_admin 只能修改自己社团的招新（直接用 req.user.clubId，无需查库）
    if (userRole === 'club_admin') {
      this.assertClubAdminOwnership(adminClubId, existingRecruitment.clubId, id);
    }

    // 验证时间
    const startTime = updateRecruitmentDto.startTime || existingRecruitment.startTime;
    const endTime = updateRecruitmentDto.endTime || existingRecruitment.endTime;

    if (startTime >= endTime) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    const updatedData: any = { ...updateRecruitmentDto };

    return await this.prisma.recruitmentBatch.update({
      where: { id },
      data: updatedData,
    });
  }

  async updateStatus(id: string, updateStatusDto: UpdateRecruitmentStatusDto, userId: string, userRole: string, adminClubId: string | null) {
    const existingRecruitment = await this.prisma.recruitmentBatch.findUnique({
      where: { id },
    });

    if (!existingRecruitment) {
      throw new NotFoundException('招新不存在');
    }

    const isAdmin = userRole === 'super_admin' || userRole === 'club_admin';
    if (!isAdmin) {
      throw new ForbiddenException('没有权限修改招新状态');
    }

    // club_admin 只能修改自己社团的招新状态（直接用 req.user.clubId，无需查库）
    if (userRole === 'club_admin') {
      this.assertClubAdminOwnership(adminClubId, existingRecruitment.clubId, id);
    }

    return await this.prisma.recruitmentBatch.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
    });
  }

  async remove(id: string, userId: string, userRole: string, adminClubId: string | null) {
    const existingRecruitment = await this.prisma.recruitmentBatch.findUnique({
      where: { id },
      include: {
        applications: true,
      },
    });

    if (!existingRecruitment) {
      throw new NotFoundException('招新不存在');
    }

    const isAdmin = userRole === 'super_admin' || userRole === 'club_admin';
    if (!isAdmin) {
      throw new ForbiddenException('没有权限删除招新');
    }

    // club_admin 只能删除自己社团的招新（直接用 req.user.clubId，无需查库）
    if (userRole === 'club_admin') {
      this.assertClubAdminOwnership(adminClubId, existingRecruitment.clubId, id);
    }

    // 如果有申请，不能删除
    if (existingRecruitment.applications.length > 0) {
      throw new BadRequestException('该招新已有申请，无法删除');
    }

    return await this.prisma.recruitmentBatch.delete({
      where: { id },
    });
  }

  async findAllPublished(query: RecruitmentQueryDto) {
    const { status, clubId, search, page = 1, limit = 10 } = query;

    const where: any = {
      status: RecruitmentStatus.PUBLISHED,
    };

    if (status) {
      where.status = status;
    }

    if (clubId) {
      where.clubId = clubId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    where.startTime = {
      lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const [recruitments, total] = await Promise.all([
      this.prisma.recruitmentBatch.findMany({
        where,
        include: {
          club: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: [
          { startTime: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.recruitmentBatch.count({ where }),
    ]);

    return {
      data: recruitments.map((recruitment) => ({
        ...recruitment,
        applicationCount: recruitment._count.applications,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOnePublished(id: string) {
    const recruitment = await this.prisma.recruitmentBatch.findUnique({
      where: {
        id,
        status: RecruitmentStatus.PUBLISHED,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!recruitment) {
      throw new NotFoundException('招新不存在或尚未发布');
    }

    const now = new Date();
    if (recruitment.startTime > now) {
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (recruitment.startTime > sevenDaysFromNow) {
        throw new NotFoundException('招新尚未开放');
      }
    }

    return {
      ...recruitment,
      applicationCount: recruitment._count.applications,
    };
  }

  /**
   * 校验 club_admin 是否有权操作指定社团的招新
   * 直接使用 req.user.clubId，无需查库
   *
   * @param adminClubId   管理员关联的社团 ID（来自 req.user.clubId）
   * @param targetClubId  招新所属社团 ID
   * @param recruitmentId 招新 ID（仅用于错误日志，create 时传 null）
   */
  private assertClubAdminOwnership(
    adminClubId: string | null,
    targetClubId: string,
    recruitmentId: string | null,
  ): void {
    if (!adminClubId) {
      this.logger.warn(
        `club_admin 未关联任何社团，拒绝访问招新 ${recruitmentId ?? '(新建)'}`,
      );
      throw new ForbiddenException('您尚未关联任何社团，无法操作该招新');
    }

    if (adminClubId !== targetClubId) {
      this.logger.warn(
        `club_admin (clubId=${adminClubId}) 尝试访问其他社团招新 ${recruitmentId ?? '(新建)'} (clubId=${targetClubId})`,
      );
      throw new ForbiddenException('您只能管理自己社团的招新');
    }
  }
}
