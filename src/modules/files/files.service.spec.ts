import { Test, TestingModule } from '@nestjs/testing';
import { FilesService } from './files.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

// 模拟文件对象
const mockFile: Express.Multer.File = {
  fieldname: 'file',
  originalname: 'test.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  buffer: Buffer.from('test content'),
  size: 12,
} as Express.Multer.File;

const mockFileRecord = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  filename: 'test_1234567890_abc123.pdf',
  originalName: 'test.pdf',
  mimeType: 'application/pdf',
  size: BigInt(12),
  storagePath: './uploads/123e4567-e89b-12d3-a456-426614174000/resume/test_1234567890_abc123.pdf',
  uploadedBy: '123e4567-e89b-12d3-a456-426614174001',
  createdAt: new Date(),
};

describe('FilesService', () => {
  let service: FilesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    file: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('./uploads'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [
        FilesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('应该被正确实例化', () => {
    expect(service).toBeDefined();
  });

  describe('validateFile', () => {
    it('应该验证有效文件', () => {
      expect(() => service['validateFile'](mockFile)).not.toThrow();
    });

    it('应该拒绝过大的文件', () => {
      const largeFile = { ...mockFile, size: 11 * 1024 * 1024 }; // 11MB
      expect(() => service['validateFile'](largeFile)).toThrow(BadRequestException);
    });

    it('应该拒绝不支持的文件类型', () => {
      const invalidFile = { ...mockFile, mimetype: 'application/exe' };
      expect(() => service['validateFile'](invalidFile)).toThrow(BadRequestException);
    });
  });

  describe('uploadFile', () => {
    it('应该成功上传文件', async () => {
      mockPrismaService.file.create.mockResolvedValue(mockFileRecord);
      
      const result = await service.uploadFile(mockFile, 'user-id');
      
      expect(result).toBeDefined();
      expect(result.filename).toContain('test');
      expect(result.uploadedBy).toBe('user-id');
      expect(prismaService.file.create).toHaveBeenCalled();
    });

    it('应该生成唯一的文件名', () => {
      const filename1 = service['generateUniqueFilename']('test.pdf');
      const filename2 = service['generateUniqueFilename']('test.pdf');
      
      expect(filename1).not.toBe(filename2);
      expect(filename1).toContain('test');
      expect(filename1).toContain('.pdf');
    });
  });

  describe('findFileById', () => {
    it('应该返回找到的文件', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      
      const result = await service.findFileById('file-id');
      
      expect(result).toEqual(mockFileRecord);
      expect(prismaService.file.findUnique).toHaveBeenCalledWith({
        where: { id: 'file-id' },
      });
    });

    it('当文件不存在时应该返回null', async () => {
      mockPrismaService.file.findUnique.mockResolvedValue(null);
      
      const result = await service.findFileById('non-existent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('findFilesByUser', () => {
    it('应该返回用户的所有文件', async () => {
      const mockFiles = [mockFileRecord];
      mockPrismaService.file.findMany.mockResolvedValue(mockFiles);
      
      const result = await service.findFilesByUser('user-id');
      
      expect(result).toEqual(mockFiles);
      expect(prismaService.file.findMany).toHaveBeenCalledWith({
        where: { uploadedBy: 'user-id' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('deleteFile', () => {
    it('成功删除文件时应该返回被删除的文件', async () => {
      mockPrismaService.file.findFirst.mockResolvedValue(mockFileRecord);
      mockPrismaService.file.delete.mockResolvedValue(mockFileRecord);
      
      // 模拟文件系统操作
      jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
      jest.spyOn(require('fs'), 'unlinkSync').mockImplementation();
      jest.spyOn(require('fs'), 'readdirSync').mockReturnValue([]);
      jest.spyOn(require('fs'), 'rmdirSync').mockImplementation();
      
      const result = await service.deleteFile('file-id', 'user-id');
      
      expect(result).toEqual(mockFileRecord);
      expect(prismaService.file.delete).toHaveBeenCalledWith({
        where: { id: 'file-id' },
      });
    });

    it('当文件不存在时应该抛出异常', async () => {
      mockPrismaService.file.findFirst.mockResolvedValue(null);
      
      await expect(service.deleteFile('non-existent-id', 'user-id'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getFileStats', () => {
    it('应该返回文件统计信息', async () => {
      const mockAggregation = {
        _count: { id: 5 },
        _sum: { size: BigInt(1024 * 1024) },
      };
      mockPrismaService.file.aggregate.mockResolvedValue(mockAggregation);
      
      const result = await service.getFileStats();
      
      expect(result.totalFiles).toBe(5);
      expect(result.totalSize).toBe(1024 * 1024);
      expect(prismaService.file.aggregate).toHaveBeenCalled();
    });
  });
});