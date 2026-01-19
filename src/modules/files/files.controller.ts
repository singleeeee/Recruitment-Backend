import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
  BadRequestException,
  StreamableFile,
  Res,
  Req, // 导入 Req 装饰器
  UseGuards, // 导入 UseGuards 装饰器
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { FileUploadDto } from './dto/file-upload.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { ApiTags, ApiConsumes, ApiBody, ApiProduces, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 导入 JwtAuthGuard
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Response } from 'express';
import * as mime from 'mime-types';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '上传的文件',
        },
        category: {
          type: 'string',
          description: '文件分类 (resume, avatar, portfolio, certificate)',
          enum: ['resume', 'avatar', 'portfolio', 'certificate'],
        },
        description: {
          type: 'string',
          description: '文件描述',
        },
      },
      required: ['file'],
    },
  })
  @UseGuards(JwtAuthGuard) // 添加 JWT 认证守卫，确保用户已登录
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: any, // 使用 @Req() 注入请求对象，并从 request.user 获取 userId
    @Query() uploadDto?: FileUploadDto,
  ): Promise<{ data: FileResponseDto; message: string }> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    // ---- IMPORTANT: 添加 console.log 以调试 ----
    console.log("--- FilesController.uploadFile: Request Object ---");
    console.log("request.user:", request.user);
    // -------------------------------------------

    // 1. 确保 request.user 存在，并且包含 id 属性
    //    JwtStrategy 的 validate 方法返回的对象会赋给 request.user
    const user = request.user;
    if (!user || !user.id) {
      // 这通常意味着认证失败或请求未通过 JwtAuthGuard
      throw new BadRequestException('用户身份验证失败或无效的用户信息，请联系管理员。請確保您已登錄並擁有有效的Token。');
    }

    const userId = user.id; // 从 request.user 对象中直接获取 id

    const uploadedFile = await this.filesService.uploadFile(
      file,
      userId,
      uploadDto?.category || 'resume',
    );

    return {
      data: new FileResponseDto(uploadedFile),
      message: '文件上传成功',
    };
  }

  @Get()
  @ApiQuery({ name: 'category', required: false, description: '文件分类筛选' })
  async getUserFiles(
    @CurrentUser('sub') userId: string,
    @Query('category') category?: string,
  ): Promise<{ data: FileResponseDto[]; message: string }> {
    const files = await this.filesService.findFilesByUser(userId);
    
    let filteredFiles = files;
    if (category) {
      // 注意：这里需要修改service来支持按分类筛选，现在先返回所有文件
      filteredFiles = files;
    }

    return {
      data: filteredFiles.map(file => new FileResponseDto(file)),
      message: '获取文件列表成功',
    };
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiProduces('application/octet-stream')
  async downloadFile(
    @Param('id', ParseUUIDPipe) fileId: string,
    @CurrentUser('sub') userId: string,
    @Res({ passthrough: true }) response: Response,
    @Headers('range') range?: string,
  ): Promise<StreamableFile> {
    const file = await this.filesService.findFileById(fileId);
    
    if (!file) {
      throw new BadRequestException('文件不存在');
    }

    // 检查权限（确保用户只能访问自己上传的文件）
    if (file.uploadedBy !== userId) {
      throw new BadRequestException('无权访问此文件');
    }

    // 设置响应头
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', file.size.toString());
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    );

    // 支持范围请求（断点续传）
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Number(file.size) - 1;
      const chunksize = end - start + 1;

      response.setHeader('Content-Range', `bytes ${start}-${end}/${file.size}`);
      response.setHeader('Accept-Ranges', 'bytes');
      response.setHeader('Content-Length', chunksize);
      response.status(206);

      // 这里应该实现范围读取，为了简化，我们返回整个文件
    }

    const fileBuffer = this.filesService.getFileBuffer(file.storagePath);
    return new StreamableFile(fileBuffer);
  }

  @Get(':id/view')
  @Public()
  @ApiParam({ name: 'id', description: '文件ID' })
  @ApiProduces('application/pdf', 'image/*')  
  async viewFile(
    @Param('id', ParseUUIDPipe) fileId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.filesService.findFileById(fileId);
    
    if (!file) {
      throw new BadRequestException('文件不存在');
    }

    // 只允许预览特定类型的文件
    const previewableTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!previewableTypes.includes(file.mimeType)) {
      throw new BadRequestException('此文件类型不支持在线预览');
    }

    // 设置响应头用于在线预览
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.originalName)}"`,
    );

    const fileBuffer = this.filesService.getFileBuffer(file.storagePath);
    return new StreamableFile(fileBuffer);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: '文件ID' })
  async deleteFile(
    @Param('id', ParseUUIDPipe) fileId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<{ message: string }> {
    await this.filesService.deleteFile(fileId, userId);
    return { message: '文件删除成功' };
  }

  @Get('stats/summary')
  async getFileStats(
    @CurrentUser('sub') userId: string,
  ): Promise<{ 
    data: { 
      totalFiles: number; 
      totalSize: number; 
      totalSizeFormatted: string;
    }; 
    message: string 
  }> {
    const stats = await this.filesService.getFileStats();
    const userFiles = await this.filesService.findFilesByUser(userId);
    
    const userTotalSize = userFiles.reduce((sum, file) => sum + Number(file.size), 0);
    
    const formatSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
      data: {
        totalFiles: userFiles.length,
        totalSize: userTotalSize,
        totalSizeFormatted: formatSize(userTotalSize),
      },
      message: '获取文件统计成功',
    };
  }
}