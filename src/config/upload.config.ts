import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

// 文件上传配置
export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      const uploadPath = process.env.UPLOAD_DIR || './uploads';
      
      // 根据文件类型设置不同的上传目录
      let subPath = 'others';
      if (file.mimetype.startsWith('image/')) {
        subPath = 'images';
      } else if (file.mimetype === 'application/pdf') {
        subPath = 'documents';
      } else if (file.mimetype.includes('word')) {
        subPath = 'documents';
      } else if (file.mimetype.includes('zip')) {
        subPath = 'archives';
      }

      const fullPath = `${uploadPath}/${subPath}`;
      require('fs').mkdirSync(fullPath, { recursive: true });
      
      callback(null, fullPath);
    },
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req, file, callback) => {
    // 允许的文件类型
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(`不支持的文件类型: ${file.mimetype}. 支持的类型: PDF, DOC, DOCX, ZIP, JPG, PNG, GIF`),
        false,
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1, // 每次只能上传一个文件
  },
};

// 内存存储配置（适合小文件）
export const memoryStorageConfig = {
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new BadRequestException(`不支持的文件类型: ${file.mimetype}. 支持的类型: PDF, DOC, DOCX, ZIP, JPG, PNG, GIF`),
        false,
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
};

// 字节大小格式化工具
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 生成安全的文件名
export const generateSecureFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = extname(originalName);
  const basename = originalName.replace(ext, '').replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${basename}_${timestamp}_${randomString}${ext}`;
};