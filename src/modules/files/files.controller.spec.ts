import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';

const mockFilesService = {
  uploadFile: jest.fn(),
  findFilesByUser: jest.fn(),
  findFileById: jest.fn(),
  deleteFile: jest.fn(),
  getFileStats: jest.fn(),
  getFileBuffer: jest.fn(),
};

const mockFile = {
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
  storagePath: './uploads/user-id/resume/test_1234567890_abc123.pdf',
  uploadedBy: 'user-id',
  createdAt: new Date(),
};

describe('FilesController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('应该被正确实例化', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('应该成功上传文件', async () => {
      mockFilesService.uploadFile.mockResolvedValue(mockFileRecord);
      
      const mockUser = { sub: 'user-id' };
      const result = await controller.uploadFile(
        mockFile,
        mockUser as any,
        { category: 'resume' },
      );
      
      expect(result).toEqual({
        data: expect.any(Object),
        message: '文件上传成功',
      });
      expect(mockFilesService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'user-id',
        'resume',
      );
    });

    it('当没有文件时应该抛出异常', async () => {
      const mockUser = { sub: 'user-id' };
      
      await expect(
        controller.uploadFile(null as any, mockUser as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserFiles', () => {
    it('应该返回用户文件列表', async () => {
      const mockFiles = [mockFileRecord];
      mockFilesService.findFilesByUser.mockResolvedValue(mockFiles);
      
      const mockUser = { sub: 'user-id' };
      const result = await controller.getUserFiles(mockUser as any);
      
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ id: mockFileRecord.id }),
        ]),
        message: '获取文件列表成功',
      });
      expect(mockFilesService.findFilesByUser).toHaveBeenCalledWith('user-id');
    });
  });

  describe('downloadFile', () => {
    it('应该成功下载文件', async () => {
      mockFilesService.findFileById.mockResolvedValue(mockFileRecord);
      mockFilesService.getFileBuffer.mockReturnValue(Buffer.from('test content'));
      
      const mockResponse = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;
      
      const mockUser = { sub: 'user-id' };
      const result = await controller.downloadFile(
        mockFileRecord.id,
        mockUser as any,
        mockResponse,
      );
      
      expect(result).toBeDefined();
      expect(mockFilesService.findFileById).toHaveBeenCalledWith(mockFileRecord.id);
      expect(mockFilesService.getFileBuffer).toHaveBeenCalledWith(mockFileRecord.storagePath);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    });

    it('当文件不属于用户时应该抛出异常', async () => {
      const otherUserFile = { ...mockFileRecord, uploadedBy: 'other-user' };
      mockFilesService.findFileById.mockResolvedValue(otherUserFile);
      
      const mockResponse = {
        setHeader: jest.fn(),
      } as unknown as Response;
      
      const mockUser = { sub: 'user-id' };
      
      await expect(
        controller.downloadFile(mockFileRecord.id, mockUser as any, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFile', () => {
    it('应该成功删除文件', async () => {
      mockFilesService.deleteFile.mockResolvedValue(mockFileRecord);
      
      const mockUser = { sub: 'user-id' };
      const result = await controller.deleteFile(mockFileRecord.id, mockUser as any);
      
      expect(result).toEqual({
        message: '文件删除成功',
      });
      expect(mockFilesService.deleteFile).toHaveBeenCalledWith(
        mockFileRecord.id,
        'user-id',
      );
    });
  });

  describe('getFileStats', () => {
    it('应该返回文件统计信息', async () => {
      const mockStats = { totalFiles: 5, totalSize: 1024 };
      const mockUserFiles = [mockFileRecord];
      mockFilesService.getFileStats.mockResolvedValue(mockStats);
      mockFilesService.findFilesByUser.mockResolvedValue(mockUserFiles);
      
      const mockUser = { sub: 'user-id' };
      const result = await controller.getFileStats(mockUser as any);
      
      expect(result).toEqual({
        data: expect.objectContaining({
          totalFiles: 1,
          totalSize: 12,
          totalSizeFormatted: expect.any(String),
        }),
        message: '获取文件统计成功',
      });
      expect(mockFilesService.getFileStats).toHaveBeenCalled();
      expect(mockFilesService.findFilesByUser).toHaveBeenCalledWith('user-id');
    });
  });
});