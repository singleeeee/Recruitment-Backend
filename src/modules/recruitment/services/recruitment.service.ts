import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecruitmentDto } from '../dto/create-recruitment.dto';
import { UpdateRecruitmentDto } from '../dto/update-recruitment.dto';
import { UpdateRecruitmentStatusDto, RecruitmentStatus } from '../dto/recruitment-status.dto';
import { RecruitmentQueryDto } from '../dto/recruitment-query.dto';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  async create(createRecruitmentDto: CreateRecruitmentDto, userId: string) {
    // 验证时间
    if (createRecruitmentDto.startTime >= createRecruitmentDto.endTime) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    // 检查用户是否有权限为该社团创建招新
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    const isAdmin = user.role.code === 'super_admin' || user.role.code === 'club_admin';

    if (!isAdmin) {
      throw new ForbiddenException('没有权限创建招新');
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

  async findAll(query: RecruitmentQueryDto) {
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
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.recruitmentBatch.count({ where }),
    ]);

    return {
      data: recruitments.map(recruitment => ({
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

  async findOne(id: string) {
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

    return {
      ...recruitment,
      applicationCount: recruitment._count.applications,
    };
  }

  async update(id: string, updateRecruitmentDto: UpdateRecruitmentDto, userId: string) {
    const existingRecruitment = await this.prisma.recruitmentBatch.findUnique({
      where: { id },
    });

    if (!existingRecruitment) {
      throw new NotFoundException('招新不存在');
    }

    // 检查权限
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    const isAdmin = user.role.code === 'super_admin' || user.role.code === 'club_admin';

    if (!isAdmin) {
      throw new ForbiddenException('没有权限修改招新');
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

  async updateStatus(id: string, updateStatusDto: UpdateRecruitmentStatusDto, userId: string) {
    const existingRecruitment = await this.prisma.recruitmentBatch.findUnique({
      where: { id },
    });

    if (!existingRecruitment) {
      throw new NotFoundException('招新不存在');
    }

    // 检查权限
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    const isAdmin = user.role.code === 'super_admin' || user.role.code === 'club_admin';

    if (!isAdmin) {
      throw new ForbiddenException('没有权限修改招新状态');
    }

    return await this.prisma.recruitmentBatch.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
    });
  }

  async remove(id: string, userId: string) {
    const existingRecruitment = await this.prisma.recruitmentBatch.findUnique({
      where: { id },
      include: {
        applications: true,
      },
    });

    if (!existingRecruitment) {
      throw new NotFoundException('招新不存在');
    }

    // 检查权限
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    const isAdmin = user.role.code === 'super_admin' || user.role.code === 'club_admin';

    if (!isAdmin) {
      throw new ForbiddenException('没有权限删除招新');
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
      // 只显示已发布的招新
      status: RecruitmentStatus.PUBLISHED,
    };
    
    // 允许覆盖状态筛选，但要确保至少是已发布状态
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

    // 确保招新时间有效：已开始或即将开始
    where.startTime = {
      lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 未来7天内开始的也算
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
          { startTime: 'asc' }, // 按开始时间升序排列
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.recruitmentBatch.count({ where }),
    ]);

    return {
      data: recruitments.map(recruitment => ({
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
        status: RecruitmentStatus.PUBLISHED, // 只允许查看已发布的招新
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

    // 检查招新时间是否有效
    const now = new Date();
    if (recruitment.startTime > now) {
      // 如果招新还没开始，检查是否在未来7天内
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
}