import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { File } from '@prisma/client';
import * as mime from 'mime-types';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesService {
  private readonly uploadPath: string;
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.uploadPath = this.configService.get('UPLOAD_PATH') || 'uploads';
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // 验证文件大小
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`文件大小不能超过 ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // 验证文件类型
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`不支持的文件类型: ${file.mimetype}`);
    }

    // 验证文件内容类型
    const detectedMimeType = mime.lookup(file.originalname);
    if (detectedMimeType && detectedMimeType !== file.mimetype) {
      throw new BadRequestException('文件类型与扩展名不匹配');
    }

    // 验证buffer存在
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('文件内容为空');
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);
    
    return `${basename}_${timestamp}_${randomString}${extension}`;
  }

  async uploadFile(
    file: Express.Multer.File,
    uploadedBy: string,
    category: string = 'resume',
  ): Promise<File> {
    // 验证文件
    this.validateFile(file);

    // 生成唯一文件名
    const filename = this.generateUniqueFilename(file.originalname);
    
    // 创建用户专属目录
    const userUploadPath = path.join(this.uploadPath, uploadedBy, category);
    if (!fs.existsSync(userUploadPath)) {
      fs.mkdirSync(userUploadPath, { recursive: true });
    }

    // 保存文件
    const filePath = path.join(userUploadPath, filename);
    fs.writeFileSync(filePath, file.buffer);

    // 保存到数据库
    return this.prisma.file.create({
      data: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storagePath: filePath,
        uploadedBy,
      },
    });
  }

  async findFileById(id: string): Promise<File | null> {
    return this.prisma.file.findUnique({
      where: { id },
    });
  }

  async findFilesByUser(userId: string): Promise<File[]> {
    return this.prisma.file.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFile(id: string, userId: string): Promise<File> {
    const file = await this.prisma.file.findFirst({
      where: { id, uploadedBy: userId },
    });

    if (!file) {
      throw new BadRequestException('文件不存在或无权删除');
    }

    // 删除物理文件
    if (fs.existsSync(file.storagePath)) {
      fs.unlinkSync(file.storagePath);
    }

    // 删除空目录
    const fileDir = path.dirname(file.storagePath);
    if (fs.existsSync(fileDir)) {
      const files = fs.readdirSync(fileDir);
      if (files.length === 0) {
        fs.rmdirSync(fileDir);
      }
    }

    // 删除数据库记录
    return this.prisma.file.delete({
      where: { id },
    });
  }

  getFileBuffer(filePath: string): Buffer {
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('文件不存在');
    }
    return fs.readFileSync(filePath);
  }

  async getFileStats(): Promise<{ totalFiles: number; totalSize: number }> {
    const result = await this.prisma.file.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        size: true,
      },
    });

    return {
      totalFiles: result._count.id,
      totalSize: Number(result._sum.size || 0),
    };
  }
}