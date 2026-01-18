import { ApiProperty } from '@nestjs/swagger';
import { File } from '@prisma/client';

export class FileResponseDto implements Partial<File> {
  @ApiProperty({ description: '文件ID' })
  id: string;

  @ApiProperty({ description: '文件名' })
  filename: string;

  @ApiProperty({ description: '原始文件名' })
  originalName: string;

  @ApiProperty({ description: 'MIME类型' })
  mimeType: string;

  @ApiProperty({ description: '文件大小（字节）' })
  size: bigint;

  @ApiProperty({ description: '上传用户ID' })
  uploadedBy: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '文件访问URL' })
  url?: string;

  constructor(file: Partial<File>, baseUrl?: string) {
    this.id = file.id;
    this.filename = file.filename;
    this.originalName = file.originalName;
    this.mimeType = file.mimeType;
    this.size = file.size;
    this.uploadedBy = file.uploadedBy;
    this.createdAt = file.createdAt;
    
    if (baseUrl) {
      this.url = `${baseUrl}/files/${file.id}`;
    }
  }
}