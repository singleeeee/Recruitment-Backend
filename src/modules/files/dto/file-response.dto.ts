import { ApiProperty } from '@nestjs/swagger';
import { File } from '@prisma/client'; // 重新引入，用于构造函数参数类型

export class FileResponseDto { // 移除 implements Partial<File>，以避免 TypeScript 类型冲突
  @ApiProperty({ description: '文件ID' })
  id: string;

  @ApiProperty({ description: '文件名' })
  filename: string;

  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @ApiProperty({ description: 'MIME类型' })
  mimeType: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: string; // 改为 string，以避免 JSON 序列化问题

  @ApiProperty({ description: '上传用户ID' })
  uploadedBy: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '文件访问URL' })
  url?: string;

  constructor(file: File, baseUrl?: string) { // 明确参数类型，以匹配 Prisma 返回的对象
    this.id = file.id;
    this.filename = file.filename;
    this.originalName = file.originalName;
    this.mimeType = file.mimeType;
    this.size = String(file.size); // 将 BigInt 转换为 String
    this.uploadedBy = file.uploadedBy;
    this.createdAt = file.createdAt;
    
    if (baseUrl) {
      this.url = `${baseUrl}/files/${file.id}`;
    }
  }
}