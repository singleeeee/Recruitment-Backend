import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationStatusDto, ApplicationStatus, VALID_TRANSITIONS } from '../dto/update-application-status.dto';
import { ApplicationQueryDto } from '../dto/application-query.dto';
import { AiEvaluationService } from './ai-evaluation.service';
import { EmailService } from '../../email/services/email.service';

/** 可在线预览的 MIME 类型 */
const PREVIEWABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'application/pdf']);

@Injectable()
export class ApplicationService {
  private readonly baseUrl: string;
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private aiEvaluationService: AiEvaluationService,
    private emailService: EmailService,
  ) {
    const port = this.configService.get<number>('PORT') || 3001;
    this.baseUrl = `http://localhost:${port}/api/v1`;
  }

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
        // 关联已上传文件
        ...(createApplicationDto.fileLinks?.length
          ? {
              files: {
                create: createApplicationDto.fileLinks.map((fl) => ({
                  fileId: fl.fileId,
                  fileType: fl.fileType || 'resume',
                  description: fl.description,
                })),
              },
            }
          : {}),
      },
      include: {
        files: {
          include: {
            file: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    // 异步触发 AI 评估，不阻塞接口响应
    this.aiEvaluationService.triggerEvaluation(application.id).catch((err) => {
      this.logger.error(`触发 AI 评估失败 [applicationId=${application.id}]: ${err.message}`);
    });

    return application;
  }

  async findAll(query: ApplicationQueryDto, userId?: string, userRole?: string, adminClubId?: string | null) {
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

    // 候选人只能查看自己的申请
    if (userRole === 'candidate' && userId) {
      where.applicantId = userId;
    }

    // club_admin 强制限定为自己的社团（直接用 req.user.clubId，无需查库）
    if (userRole === 'club_admin') {
      where.recruitment = { clubId: adminClubId ?? '__no_club__' };
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
              avatar: true,
              profileFields: {
                include: {
                  field: {
                    select: { fieldName: true },
                  },
                },
              },
            },
          },
          files: {
            include: {
              file: {
                select: {
                  id: true,
                  originalName: true,
                  mimeType: true,
                  size: true,
                  createdAt: true,
                },
              },
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.application.count({ where }),
    ]);

    // 将 profileFields 展开为扁平对象，方便前端使用
    const enriched = applications.map((app) => {
      const { profileFields, ...applicantRest } = app.applicant as any;
      const profileMap: Record<string, string> = {};
      (profileFields || []).forEach((pf: any) => {
        profileMap[pf.field.fieldName] = pf.fieldValue;
      });
      return {
        ...app,
        applicant: {
          ...applicantRest,
          phone: profileMap['phone'] || null,
          studentId: profileMap['studentId'] || null,
          college: profileMap['college'] || null,
          major: profileMap['major'] || null,
          grade: profileMap['grade'] || null,
        },
        files: this.enrichFiles((app as any).files),
      };
    });

    return {
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string, userRole?: string, adminClubId?: string | null) {
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
            avatar: true,
            profileFields: {
              include: {
                field: {
                  select: { fieldName: true },
                },
              },
            },
          },
        },
        files: {
          include: {
            file: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    // 权限检查：候选人只能查看自己的申请
    if (userRole === 'candidate' && userId && application.applicantId !== userId) {
      throw new ForbiddenException('没有权限查看该申请');
    }

    // 权限检查：club_admin 只能查看自己社团的申请（直接用 req.user.clubId，无需查库）
    if (userRole === 'club_admin') {
      const recruitmentClubId = (application.recruitment as any)?.club?.id ?? null;
      this.assertClubAdminOwnership(adminClubId ?? null, recruitmentClubId, id);
    }

    // 展开 profileFields
    const { profileFields, ...applicantRest } = application.applicant as any;
    const profileMap: Record<string, string> = {};
    (profileFields || []).forEach((pf: any) => {
      profileMap[pf.field.fieldName] = pf.fieldValue;
    });

    return {
      ...application,
      applicant: {
        ...applicantRest,
        phone: profileMap['phone'] || null,
        studentId: profileMap['studentId'] || null,
        college: profileMap['college'] || null,
        major: profileMap['major'] || null,
        grade: profileMap['grade'] || null,
      },
      files: this.enrichFiles((application as any).files),
    };
  }

  /**
   * 为已有申请追加/更新关联文件（候选人本人或管理员可操作）
   * 同一 fileId 重复关联会被忽略（upsert）
   */
  async addFiles(
    id: string,
    fileLinks: { fileId: string; fileType?: string; description?: string }[],
    userId: string,
    userRole: string,
    adminClubId: string | null,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: { id: true, applicantId: true },
    });

    if (!application) {
      throw new NotFoundException('申请不存在');
    }

    const isAdmin = userRole === 'super_admin' || userRole === 'club_admin';
    if (!isAdmin && application.applicantId !== userId) {
      throw new ForbiddenException('没有权限操作该申请');
    }

    // club_admin 只能操作自己社团的申请（直接用 req.user.clubId，无需查库）
    if (userRole === 'club_admin') {
      const fullApp = await this.prisma.application.findUnique({
        where: { id },
        select: { recruitment: { select: { clubId: true } } },
      });
      this.assertClubAdminOwnership(adminClubId, fullApp?.recruitment?.clubId ?? null, id);
    }

    // 逐条 upsert，避免重复关联报错
    for (const fl of fileLinks) {
      await this.prisma.applicationFile.upsert({
        where: { applicationId_fileId: { applicationId: id, fileId: fl.fileId } },
        update: { fileType: fl.fileType || 'resume', description: fl.description },
        create: {
          applicationId: id,
          fileId: fl.fileId,
          fileType: fl.fileType || 'resume',
          description: fl.description,
        },
      });
    }

    // 返回带 URL 的完整文件列表
    const updatedFiles = await this.prisma.applicationFile.findMany({
      where: { applicationId: id },
      include: {
        file: {
          select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true },
        },
      },
    });

    return { files: this.enrichFiles(updatedFiles) };
  }

  async updateStatus(id: string, updateStatusDto: UpdateApplicationStatusDto, userId: string, userRole: string, adminClubId: string | null) {
    const existingApplication = await this.prisma.application.findUnique({
      where: { id },
      include: {
        applicant: { select: { id: true, name: true } },
        recruitment: { select: { clubId: true } },
      },
    });

    if (!existingApplication) {
      throw new NotFoundException('申请不存在');
    }

    const isAdmin = userRole === 'super_admin' || userRole === 'club_admin';
    const isApplicant = existingApplication.applicantId === userId;
    const targetStatus = updateStatusDto.status;
    const currentStatus = existingApplication.status as ApplicationStatus;

    // ── 权限校验 ──────────────────────────────────────────────────
    // 候选人只能在 offer_sent 时自主 decline
    if (!isAdmin) {
      if (
        isApplicant &&
        currentStatus === ApplicationStatus.OFFER_SENT &&
        targetStatus === ApplicationStatus.DECLINED
      ) {
        // 允许候选人自主婉拒 offer，跳过管理员校验
      } else {
        throw new ForbiddenException('没有权限修改申请状态');
      }
    }

    // club_admin 只能修改自己社团的申请状态
    if (isAdmin && userRole === 'club_admin') {
      const recruitmentClubId = (existingApplication.recruitment as any)?.clubId ?? null;
      this.assertClubAdminOwnership(adminClubId, recruitmentClubId, id);
    }

    // ── 状态流转合法性校验 ────────────────────────────────────────
    const allowedTargets = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowedTargets.includes(targetStatus)) {
      throw new BadRequestException(
        `不允许从 "${currentStatus}" 流转到 "${targetStatus}"，合法目标状态：[${allowedTargets.join(', ') || '无'}]`,
      );
    }

    // ── 更新状态，同时查出申请人和招新信息用于发邮件 ──────────────
    const application = await this.prisma.application.update({
      where: { id },
      data: { status: targetStatus },
      include: {
        applicant: { select: { id: true, name: true, email: true } },
        recruitment: { select: { title: true, club: { select: { name: true } } } },
      },
    });

    // 异步发送状态通知邮件，不阻塞响应
    this.sendStatusNotificationEmail(application).catch((err) =>
      this.logger.warn(`状态通知邮件发送失败 applicationId=${id}: ${err.message}`),
    );

    return application;
  }

  /**
   * 根据申请状态从数据库读取邮件模板，渲染变量后发送通知邮件给候选人。
   * 若数据库中无对应模板，则静默跳过（不报错）。
   */
  private async sendStatusNotificationEmail(application: any) {
    const { applicant, recruitment, status } = application;
    if (!applicant?.email) return;

    const senderEmail = process.env.QQ_EMAIL_USER;
    if (!senderEmail || !process.env.QQ_EMAIL_AUTH_CODE) return;

    // 从数据库按 statusKey 查找模板
    const template = await this.prisma.emailTemplate.findUnique({
      where: { statusKey: status },
    });

    // 无模板 = 该状态不需要发邮件（如 draft / submitted / declined / archived）
    if (!template) return;

    const clubName = recruitment?.club?.name ?? '社团';
    const recruitTitle = recruitment?.title ?? '招新活动';
    const displayName = applicant.name ?? '同学';

    // 渲染模板变量：将 {{姓名}} / {{社团名}} / {{招新标题}} 替换为实际值
    const renderTemplate = (tpl: string) =>
      tpl
        .replace(/\{\{姓名\}\}/g, displayName)
        .replace(/\{\{社团名\}\}/g, clubName)
        .replace(/\{\{招新标题\}\}/g, recruitTitle);

    const subject = renderTemplate(template.subject);
    const body = renderTemplate(template.body);
    const senderName = `${clubName}招新组`;

    try {
      const transporter = (this.emailService as any).transporter;
      await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: applicant.email,
        subject,
        html: body,
      });
      this.logger.log(`状态通知邮件已发送 to=${applicant.email} status=${status} template="${template.name}"`);
    } catch (err) {
      throw err;
    }
  }

  async remove(id: string, userId: string, userRole: string) {
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

    // 直接使用 req.user.role，无需查库
    const isAdmin = userRole === 'super_admin' || userRole === 'club_admin';
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

  /**
   * 仪表盘统计数据
   * - club_admin: 只统计自己社团的数据
   * - super_admin: 统计全局数据
   */
  async getDashboardStats(userId: string, userRole: string, adminClubId?: string | null) {
    // 确定过滤范围（直接用 req.user.clubId，无需查库）
    const clubFilter = this.buildClubFilter(userRole, adminClubId);
    const isSuperAdmin = userRole === 'super_admin';

    // 申请状态统计 + 系统级统计（super_admin 专用）
    const [
      totalApplicants,
      passedCount,
      pendingInterviewCount,
      rejectedCount,
      submittedCount,
      screeningCount,
      offerSentCount,
      acceptedCount,
      activeRecruitments,
      recentActivities,
      totalClubs,
      totalBatches,
      usersByRole,
    ] = await Promise.all([
      // 总候选人数（非草稿）
      this.prisma.application.count({
        where: { ...clubFilter, status: { not: 'draft' } },
      }),
      // 已通过（interview_scheduled + interview_completed + offer_sent + accepted）
      this.prisma.application.count({
        where: { ...clubFilter, status: { in: ['interview_scheduled', 'interview_completed', 'offer_sent', 'accepted'] } },
      }),
      // 待面试（interview_scheduled + interview_completed）
      this.prisma.application.count({
        where: { ...clubFilter, status: { in: ['interview_scheduled', 'interview_completed'] } },
      }),
      // 已拒绝
      this.prisma.application.count({
        where: { ...clubFilter, status: 'rejected' },
      }),
      // 待筛选（submitted）
      this.prisma.application.count({
        where: { ...clubFilter, status: 'submitted' },
      }),
      // 筛选中（screening）
      this.prisma.application.count({
        where: { ...clubFilter, status: 'screening' },
      }),
      // 已发 offer
      this.prisma.application.count({
        where: { ...clubFilter, status: 'offer_sent' },
      }),
      // 已接受 offer
      this.prisma.application.count({
        where: { ...clubFilter, status: 'accepted' },
      }),
      // 进行中的招新数量
      this.prisma.recruitmentBatch.count({
        where: {
          ...(clubFilter.recruitment?.clubId ? { clubId: clubFilter.recruitment.clubId } : {}),
          status: { in: ['published', 'ongoing'] },
        },
      }),
      // 最近活动（最新20条申请状态变更）
      this.prisma.application.findMany({
        where: { ...clubFilter, status: { not: 'draft' } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          status: true,
          updatedAt: true,
          createdAt: true,
          applicant: {
            select: { id: true, name: true },
          },
          recruitment: {
            select: {
              id: true,
              title: true,
              club: { select: { id: true, name: true } },
            },
          },
        },
      }),
      // super_admin 专用：活跃社团总数
      isSuperAdmin
        ? this.prisma.club.count({ where: { isActive: true } })
        : Promise.resolve(null),
      // super_admin 专用：招新批次总数
      isSuperAdmin
        ? this.prisma.recruitmentBatch.count()
        : Promise.resolve(null),
      // super_admin 专用：按角色分组的活跃用户数
      isSuperAdmin
        ? this.prisma.user
            .groupBy({
              by: ['roleId'],
              _count: { id: true },
              where: { status: 'active' },
            })
            .then(async (groups) => {
              const roles = await this.prisma.role.findMany({
                where: { id: { in: groups.map((g) => g.roleId) } },
                select: { id: true, code: true, name: true },
              });
              const roleMap = Object.fromEntries(roles.map((r) => [r.id, r]));
              return groups.map((g) => ({
                roleCode: roleMap[g.roleId]?.code ?? g.roleId,
                roleName: roleMap[g.roleId]?.name ?? g.roleId,
                count: g._count.id,
              }));
            })
        : Promise.resolve(null),
    ]);

    // 将申请记录转换为活动流格式
    const activities = recentActivities.map((app) => ({
      id: app.id,
      type: this.statusToActivityType(app.status),
      content: this.buildActivityContent(app.applicant?.name, app.status, app.recruitment?.title),
      applicantId: app.applicant?.id,
      applicantName: app.applicant?.name,
      recruitmentTitle: app.recruitment?.title,
      clubName: app.recruitment?.club?.name,
      status: app.status,
      time: app.updatedAt,
    }));

    return {
      stats: {
        totalApplicants,
        passedCount,
        pendingInterviewCount,
        rejectedCount,
        submittedCount,
        screeningCount,
        offerSentCount,
        acceptedCount,
        activeRecruitments,
        // super_admin 专用字段（非 super_admin 时为 null）
        totalClubs: totalClubs ?? null,
        totalBatches: totalBatches ?? null,
        usersByRole: usersByRole ?? null,
      },
      recentActivities: activities,
    };
  }

  /** 根据角色构建社团过滤条件（同步，直接使用 req.user.clubId，无需查库） */
  private buildClubFilter(userRole: string, adminClubId?: string | null) {
    if (userRole === 'super_admin') {
      return {}; // 全局数据，不过滤
    }

    // club_admin 只看自己社团的申请
    if (!adminClubId) {
      return { recruitment: { clubId: '__no_club__' } };
    }

    return { recruitment: { clubId: adminClubId } };
  }

  /** 申请状态映射为活动类型 */
  private statusToActivityType(status: string): string {
    const map: Record<string, string> = {
      submitted: 'application_submitted',
      screening: 'application_screening',
      rejected: 'application_rejected',
      interview_scheduled: 'interview_scheduled',
      interview_completed: 'interview_completed',
      offer_sent: 'offer_sent',
      accepted: 'offer_accepted',
      declined: 'offer_declined',
    };
    return map[status] || 'status_update';
  }

  /** 根据状态生成活动描述文本 */
  private buildActivityContent(name: string, status: string, recruitmentTitle: string): string {
    const titleShort = recruitmentTitle?.length > 12
      ? recruitmentTitle.substring(0, 12) + '...'
      : recruitmentTitle || '招新';

    const contentMap: Record<string, string> = {
      submitted: `${name} 提交了「${titleShort}」的申请`,
      screening: `${name} 的申请进入筛选阶段`,
      rejected: `${name} 的申请未能通过`,
      interview_scheduled: `${name} 的面试已安排`,
      interview_completed: `${name} 完成了面试`,
      offer_sent: `已向 ${name} 发送录用通知`,
      accepted: `${name} 已接受录用邀请`,
      declined: `${name} 婉拒了录用邀请`,
    };
    return contentMap[status] || `${name} 的申请状态已更新`;
  }

  /**
   * 校验 club_admin 是否有权操作指定社团的申请
   * 直接使用 req.user.clubId，无需查库
   *
   * @param adminClubId    管理员关联的社团 ID（来自 req.user.clubId）
   * @param targetClubId   申请所属社团 ID（可能为 null）
   * @param applicationId  申请 ID（仅用于错误日志）
   */
  private assertClubAdminOwnership(
    adminClubId: string | null,
    targetClubId: string | null,
    applicationId: string,
  ): void {
    if (!adminClubId) {
      this.logger.warn(`club_admin 未关联任何社团，拒绝访问申请 ${applicationId}`);
      throw new ForbiddenException('您尚未关联任何社团，无法操作该申请');
    }

    if (adminClubId !== targetClubId) {
      this.logger.warn(
        `club_admin (clubId=${adminClubId}) 尝试访问其他社团申请 ${applicationId} (clubId=${targetClubId})`,
      );
      throw new ForbiddenException('您只能管理自己社团的申请');
    }
  }

  /**
   * 为申请的 files 数组注入预览/下载 URL
   * ApplicationFile 关联结构：{ fileType, description, file: { id, originalName, mimeType, size, createdAt } }
   */
  private enrichFiles(files: any[]): any[] {
    if (!files?.length) return [];
    return files.map((af) => {
      const { file, ...afRest } = af;
      const previewable = PREVIEWABLE_TYPES.has(file.mimeType);
      return {
        ...afRest,
        fileId: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: Number(file.size),
        createdAt: file.createdAt,
        previewable,
        // 在线预览 URL（公开，无需 token，仅支持 jpg/png/gif/pdf）
        viewUrl: previewable ? `${this.baseUrl}/files/${file.id}/view` : null,
        // 下载 URL（需要携带 Authorization token）
        downloadUrl: `${this.baseUrl}/files/${file.id}`,
      };
    });
  }
}