import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { SendEmailDto, PreviewRecipientsDto, CreateTemplateDto, UpdateTemplateDto, RecipientFilterType } from '../dto/email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.QQ_EMAIL_USER,
        pass: process.env.QQ_EMAIL_AUTH_CODE,
      },
    });
  }

  // ─── 收件人解析 ───────────────────────────────────────────────────

  /**
   * 根据筛选条件解析收件人列表
   */
  async resolveRecipients(
    filterType: RecipientFilterType,
    filterParams?: SendEmailDto['filterParams'],
  ): Promise<Array<{ email: string; name: string | null }>> {
    switch (filterType) {
      case RecipientFilterType.SPECIFIC: {
        const emails = filterParams?.emails ?? [];
        if (emails.length === 0) throw new BadRequestException('请至少指定一个收件人邮箱');
        // 尝试从数据库匹配姓名
        const users = await this.prisma.user.findMany({
          where: { email: { in: emails } },
          select: { email: true, name: true },
        });
        const userMap = new Map(users.map((u) => [u.email, u.name]));
        return emails.map((e) => ({ email: e, name: userMap.get(e) ?? null }));
      }

      case RecipientFilterType.BY_STATUS: {
        const status = filterParams?.status;
        if (!status) throw new BadRequestException('请指定申请状态');
        const apps = await this.prisma.application.findMany({
          where: { status },
          include: { applicant: { select: { email: true, name: true } } },
          distinct: ['applicantId'],
        });
        return apps
          .filter((a) => a.applicant?.email)
          .map((a) => ({ email: a.applicant.email, name: a.applicant.name }));
      }

      case RecipientFilterType.BY_RECRUITMENT: {
        const recruitmentId = filterParams?.recruitmentId;
        if (!recruitmentId) throw new BadRequestException('请指定招新批次');
        const apps = await this.prisma.application.findMany({
          where: { recruitmentId },
          include: { applicant: { select: { email: true, name: true } } },
          distinct: ['applicantId'],
        });
        return apps
          .filter((a) => a.applicant?.email)
          .map((a) => ({ email: a.applicant.email, name: a.applicant.name }));
      }

      case RecipientFilterType.BY_CLUB: {
        const clubId = filterParams?.clubId;
        if (!clubId) throw new BadRequestException('请指定社团');
        const apps = await this.prisma.application.findMany({
          where: { recruitment: { clubId } },
          include: { applicant: { select: { email: true, name: true } } },
          distinct: ['applicantId'],
        });
        return apps
          .filter((a) => a.applicant?.email)
          .map((a) => ({ email: a.applicant.email, name: a.applicant.name }));
      }

      case RecipientFilterType.ALL:
      default: {
        const users = await this.prisma.user.findMany({
          where: { email: { not: undefined }, status: 'active' },
          select: { email: true, name: true },
        });
        return users.map((u) => ({ email: u.email, name: u.name }));
      }
    }
  }

  /**
   * 预览收件人（不发送）
   */
  async previewRecipients(dto: PreviewRecipientsDto) {
    const recipients = await this.resolveRecipients(dto.filterType, dto.filterParams);
    return {
      count: recipients.length,
      preview: recipients.slice(0, 10), // 只返回前 10 条预览
      hasMore: recipients.length > 10,
    };
  }

  // ─── 发送邮件 ─────────────────────────────────────────────────────

  /**
   * 发送邮件（异步批量发送，立即返回 logId）
   */
  async sendEmail(dto: SendEmailDto, senderId: string): Promise<{ logId: string; recipientCount: number }> {
    const senderEmail = process.env.QQ_EMAIL_USER;
    if (!senderEmail || !process.env.QQ_EMAIL_AUTH_CODE) {
      throw new BadRequestException('邮件服务未配置，请在 .env 中设置 QQ_EMAIL_USER 和 QQ_EMAIL_AUTH_CODE');
    }

    const recipients = await this.resolveRecipients(dto.filterType, dto.filterParams);
    if (recipients.length === 0) {
      throw new BadRequestException('未找到符合条件的收件人');
    }

    // 创建发送记录
    const log = await this.prisma.emailLog.create({
      data: {
        subject: dto.subject,
        body: dto.body,
        senderEmail,
        senderName: dto.senderName,
        recipientCount: recipients.length,
        status: 'sending',
        filterType: dto.filterType,
        filterParams: dto.filterParams ?? {},
        sentBy: senderId,
        templateId: dto.templateId ?? null,
        recipients: {
          create: recipients.map((r) => ({
            email: r.email,
            name: r.name,
            status: 'pending',
          })),
        },
      },
    });

    // 异步发送，不阻塞响应
    this.sendBatch(log.id, recipients, dto.subject, dto.body, senderEmail, dto.senderName).catch(
      (err) => this.logger.error(`邮件批量发送失败 logId=${log.id}`, err),
    );

    return { logId: log.id, recipientCount: recipients.length };
  }

  /**
   * 批量发送（后台异步执行）
   */
  private async sendBatch(
    logId: string,
    recipients: Array<{ email: string; name: string | null }>,
    subject: string,
    body: string,
    senderEmail: string,
    senderName: string,
  ) {
    let successCount = 0;
    let failCount = 0;

    for (const recipient of recipients) {
      try {
        // 替换变量
        const personalizedBody = body
          .replace(/\{\{姓名\}\}/g, recipient.name ?? '同学')
          .replace(/\{\{邮箱\}\}/g, recipient.email);

        await this.transporter.sendMail({
          from: `"${senderName}" <${senderEmail}>`,
          to: recipient.email,
          subject,
          html: personalizedBody,
        });

        // 更新收件人状态
        await this.prisma.emailRecipient.updateMany({
          where: { logId, email: recipient.email },
          data: { status: 'sent', sentAt: new Date() },
        });
        successCount++;
      } catch (err) {
        this.logger.warn(`发送失败 to=${recipient.email}: ${err.message}`);
        await this.prisma.emailRecipient.updateMany({
          where: { logId, email: recipient.email },
          data: { status: 'failed', error: String(err.message).slice(0, 500) },
        });
        failCount++;
      }

      // 每封间隔 200ms，避免触发 QQ 限速
      await new Promise((r) => setTimeout(r, 200));
    }

    // 更新日志状态
    await this.prisma.emailLog.update({
      where: { id: logId },
      data: {
        status: failCount === recipients.length ? 'failed' : 'done',
        successCount,
        failCount,
      },
    });

    this.logger.log(`邮件发送完成 logId=${logId} 成功=${successCount} 失败=${failCount}`);
  }

  // ─── 发送记录 ─────────────────────────────────────────────────────

  async getLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      this.prisma.emailLog.count(),
      this.prisma.emailLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { name: true, email: true } },
          template: { select: { name: true } },
        },
      }),
    ]);
    return { total, page, limit, data: logs };
  }

  async getLogDetail(id: string) {
    const log = await this.prisma.emailLog.findUnique({
      where: { id },
      include: {
        sender: { select: { name: true, email: true } },
        template: { select: { name: true } },
        recipients: { orderBy: { status: 'asc' } },
      },
    });
    if (!log) throw new NotFoundException('发送记录不存在');
    return log;
  }

  // ─── 模板 CRUD ────────────────────────────────────────────────────

  async getTemplates() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: { creator: { select: { name: true } } },
    });
  }

  async getTemplate(id: string) {
    const tpl = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!tpl) throw new NotFoundException('模板不存在');
    return tpl;
  }

  async createTemplate(dto: CreateTemplateDto, creatorId: string) {
    return this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        description: dto.description,
        variables: dto.variables ?? [],
        createdBy: creatorId,
      },
    });
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    await this.getTemplate(id);
    return this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.variables !== undefined && { variables: dto.variables }),
      },
    });
  }

  async deleteTemplate(id: string) {
    await this.getTemplate(id);
    await this.prisma.emailTemplate.delete({ where: { id } });
    return { message: '模板已删除' };
  }
}
