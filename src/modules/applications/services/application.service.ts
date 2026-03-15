import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationStatusDto, ApplicationStatus } from '../dto/update-application-status.dto';
import { ApplicationQueryDto } from '../dto/application-query.dto';

@Injectable()
export class ApplicationService {
  constructor(private prisma: PrismaService) {}

  async create(createApplicationDto: CreateApplicationDto, userId: string) {
    // 检查招新是否存在且处于可申请状态
    const recruitment = await this.prisma.recruitmentBatch.findUnique({
      where: { id: createApplicationDto.recruitmentId },
      include: {
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

    if (recruitment.status !== 'published' && recruitment.status !== 'ongoing') {
      throw new BadRequestException('该招新暂时不接受申请');
    }

    // 检查是否已开始
    if (new Date() < recruitment.startTime) {
      throw new BadRequestException('招新尚未开始');
    }

    // 检查是否已结束
    if (new Date() > recruitment.endTime) {
      throw new BadRequestException('招新已结束');
    }

    // 检查人数限制
    if (recruitment.maxApplicants && recruitment._count.applications >= recruitment.maxApplicants) {
      throw new BadRequestException('申请人数已满');
    }

    // 检查用户是否已有申请
    const existingApplication = await this.prisma.application.findFirst({
      where: {
        recruitmentId: createApplicationDto.recruitmentId,
        applicantId: userId,
      },
    });

    if (existingApplication) {
      throw new ConflictException('您已申请过该招新');
    }

    // 创建申请
    const application = await this.prisma.application.create({
      data: {
        recruitmentId: createApplicationDto.recruitmentId,
        applicantId: userId,
        status: ApplicationStatus.SUBMITTED,
        resumeText: createApplicationDto.resumeText,
        education: createApplicationDto.formData,
        skills: createApplicationDto.skills,
        experiences: createApplicationDto.experiences,
        attachments: createApplicationDto.attachments,
      },
    });

    // 文件上传将在单独的API中处理

    return application;
  }

  async findAll(query: ApplicationQueryDto, userId?: string, userRole?: string) {
    const { status, recruitmentId, applicantId, clubId, page = 1, limit = 10 } = query;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (recruitmentId) {
      where.recruitmentId = recruitmentId;
    }
    
    if (applicantId) {
      where.applicantId = applicantId;
    }

    if (clubId) {
      where.recruitment = {
        clubId: clubId
      };
    }

    // 如果是普通用户，只能查看自己的申请
    if (userRole === 'candidate' && userId) {
      where.applicantId = userId;
    }

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        include: {
          recruitment: {
            select: {
              id: true,
              title: true,
              club: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          applicant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // files: {
          //   select: {
          //     id: true,
          //     filename: true,
          //     originalName: true,
          //     mimeType: true,
          //   },
          // },
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      data: applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string, userRole?: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        recruitment: {
          select: {
            id: true,
            title: true,
            description: true,
            club: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // files: {
        //   select: {
        //     id: true,
        //     filename: true,
        //     originalName: true,
        //     mimeType: true,
        //   },
        // },
      },
    });

    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    // 权限检查：普通用户只能查看自己的申请
    if (userRole === 'candidate' && userId && application.applicantId !== userId) {
      throw new ForbiddenException('没有权限查看该申请');
    }

    return application;
  }

  async updateStatus(id: string, updateStatusDto: UpdateApplicationStatusDto, userId: string) {
    const existingApplication = await this.prisma.application.findUnique({
      where: { id },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingApplication) {
      throw new NotFoundException('申请不存在');
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
      throw new ForbiddenException('没有权限修改申请状态');
    }

    // 更新申请状态
    const application = await this.prisma.application.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
    });

    return application;
  }

  async remove(id: string, userId: string) {
    const existingApplication = await this.prisma.application.findUnique({
      where: { id },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!existingApplication) {
      throw new NotFoundException('申请不存在');
    }

    // 只有申请人自己或管理员可以删除
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    const isAdmin = user.role.code === 'super_admin' || user.role.code === 'club_admin';

    const canDelete = isAdmin || existingApplication.applicantId === userId;

    if (!canDelete) {
      throw new ForbiddenException('没有权限删除该申请');
    }

    // 只能删除草稿状态的申请
    if (existingApplication.status !== ApplicationStatus.DRAFT && !isAdmin) {
      throw new BadRequestException('只能删除草稿状态的申请');
    }

    return await this.prisma.application.delete({
      where: { id },
    });
  }

  async getMyApplications(userId: string) {
    const applications = await this.prisma.application.findMany({
      where: {
        applicantId: userId,
      },
      include: {
        recruitment: {
          select: {
            id: true,
            title: true,
            club: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        // files: {
        //   select: {
        //     id: true,
        //     filename: true,
        //     originalName: true,
        //     mimeType: true,
        //   },
        // },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return applications;
  }
}