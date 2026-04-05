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
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from '../services/email.service';
import { SendEmailDto, PreviewRecipientsDto, CreateTemplateDto, UpdateTemplateDto } from '../dto/email.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('email')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // ─── 收件人预览 ───────────────────────────────────────────────────

  @Post('preview-recipients')
  @ApiOperation({ summary: '预览收件人列表（不发送）' })
  previewRecipients(@Body() dto: PreviewRecipientsDto) {
    return this.emailService.previewRecipients(dto);
  }

  // ─── 发送邮件 ─────────────────────────────────────────────────────

  @Post('send')
  @ApiOperation({ summary: '发送邮件' })
  sendEmail(@Body() dto: SendEmailDto, @Request() req: any) {
    return this.emailService.sendEmail(dto, req.user.id);
  }

  // ─── 发送记录 ─────────────────────────────────────────────────────

  @Get('logs')
  @ApiOperation({ summary: '获取发送记录列表' })
  getLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.emailService.getLogs(page, limit);
  }

  @Get('logs/:id')
  @ApiOperation({ summary: '获取发送记录详情（含收件人明细）' })
  getLogDetail(@Param('id') id: string) {
    return this.emailService.getLogDetail(id);
  }

  // ─── 模板管理 ─────────────────────────────────────────────────────

  @Get('templates')
  @ApiOperation({ summary: '获取所有邮件模板' })
  getTemplates() {
    return this.emailService.getTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '获取单个模板' })
  getTemplate(@Param('id') id: string) {
    return this.emailService.getTemplate(id);
  }

  @Post('templates')
  @ApiOperation({ summary: '创建邮件模板' })
  createTemplate(@Body() dto: CreateTemplateDto, @Request() req: any) {
    return this.emailService.createTemplate(dto, req.user.id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: '更新邮件模板' })
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.emailService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: '删除邮件模板' })
  deleteTemplate(@Param('id') id: string) {
    return this.emailService.deleteTemplate(id);
  }
}
