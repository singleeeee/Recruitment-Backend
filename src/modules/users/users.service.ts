import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileFieldDataDto } from '../auth/dto/auth.dto';
import { ProfileFieldValue } from './dto/user.dto';

@Injectable()
export class UsersService {
  private readonly baseUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const port = this.configService.get<number>('PORT') || 3001;
    this.baseUrl = `http://localhost:${port}/api/v1`;
  }

  /**
   * 将头像 URL 写入 user.avatar（由 controller 在上传文件后调用）
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
  }

  /**
   * 获取用户详细信息
   */
  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        profileFields: {
          include: {
            field: true,
          },
        },
      },
    });
  }

  /**
   * 更新用户基本信息
   */
  async updateBasicInfo(userId: string, updateData: { name?: string; avatar?: string }) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (error) {
      throw new BadRequestException('更新用户信息失败');
    }
  }

  /**
   * 更新用户档案字段
   */
  async updateProfileFields(userId: string, profileFields: { [key: string]: ProfileFieldValue }) {
    try {
      const updates = [];

      for (const [fieldName, rawValue] of Object.entries(profileFields)) {
        // 空字符串跳过，但 { fileId } 对象不跳过
        const isEmpty = typeof rawValue === 'string' && rawValue.trim() === '';
        if (rawValue === null || rawValue === undefined || isEmpty) continue;

        // 查找注册字段配置
        const registrationField = await this.prisma.registrationField.findFirst({
          where: { fieldName, isActive: true },
        });

        if (!registrationField) {
          console.warn(`注册字段配置中未找到 fieldName: ${fieldName}，跳过更新。`);
          continue;
        }

        const isFileType = registrationField.fieldType === 'file';

        if (isFileType) {
          // file 类型字段：必须传入 { fileId } 格式
          if (typeof rawValue !== 'object' || !('fileId' in rawValue)) {
            throw new BadRequestException(
              `字段 "${fieldName}" 是文件类型，请传入 { fileId: "uuid" } 格式（先调用 POST /files/upload 上传文件）`,
            );
          }
          const { fileId } = rawValue as { fileId: string };

          // 验证 fileId 对应的文件属于该用户
          const file = await this.prisma.file.findFirst({
            where: { id: fileId, uploadedBy: userId },
          });
          if (!file) {
            throw new BadRequestException(`文件 ${fileId} 不存在或无权操作`);
          }

          updates.push(
            this.prisma.userProfileField.upsert({
              where: { userId_fieldId: { userId, fieldId: registrationField.id } },
              create: { userId, fieldId: registrationField.id, fileId },
              update: { fileId, fieldValue: null },
            }),
          );
        } else {
          // 普通文本字段
          const fieldValue = rawValue as string;

          // 学号唯一性检查
          if (fieldName === 'studentId') {
            const existing = await this.prisma.userProfileField.findFirst({
              where: { fieldValue, fieldId: registrationField.id, userId: { not: userId } },
            });
            if (existing) throw new ConflictException('学号已被其他用户使用');
          }

          updates.push(
            this.prisma.userProfileField.upsert({
              where: { userId_fieldId: { userId, fieldId: registrationField.id } },
              create: { userId, fieldId: registrationField.id, fieldValue },
              update: { fieldValue, fileId: null },
            }),
          );
        }
      }

      await Promise.all(updates);
      return this.getUserById(userId);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
      console.error('更新档案字段失败:', error);
      throw new BadRequestException('更新档案字段失败');
    }
  }

  /**
   * 获取用户的档案字段配置和当前值
   */
  async getUserProfileFields(userId: string) {
    // 只查询用户实际已填写的档案字段
    const userProfileFields = await this.prisma.userProfileField.findMany({
      where: { 
        userId: userId,
        field: { isActive: true },
      },
      include: {
        field: true,
      },
      orderBy: { field: { fieldOrder: 'asc' } },
    });

    // 只返回用户有数据的字段
    return userProfileFields.map(userField => {
      const field = userField.field;
      const fileId = userField.fileId || null;

      // file 类型字段：附带预览和下载 URL
      let fileInfo: Record<string, any> | null = null;
      if (field.fieldType === 'file' && fileId) {
        fileInfo = {
          fileId,
          viewUrl: `${this.baseUrl}/files/${fileId}/view`,
          downloadUrl: `${this.baseUrl}/files/${fileId}`,
        };
      }

      return {
        id: field.id,
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType,
        isRequired: field.isRequired,
        placeholder: field.placeholder,
        helpText: field.helpText,
        options: field.options,
        validationRules: field.validationRules,
        currentValue: userField.fieldValue || '',
        // file 类型字段返回完整的文件信息（含 URL）
        fileId,
        fileInfo,
      };
    });
  }

  /**
   * 删除用户的特定档案字段值
   */
  async deleteProfileField(userId: string, fieldId: string) {
    try {
      await this.prisma.userProfileField.delete({
        where: {
          userId_fieldId: {
            userId: userId,
            fieldId: fieldId,
          },
        },
      });
      return { success: true, message: '字段值已删除' };
    } catch (error) {
      throw new BadRequestException('删除字段值失败');
    }
  }

  /**
   * 检查用户是否有权访问特定档案字段
   */
  async validateFieldAccess(userId: string, fieldId: string) {
    const userProfileField = await this.prisma.userProfileField.findUnique({
      where: {
        userId_fieldId: {
          userId: userId,
          fieldId: fieldId,
        },
      },
    });

    return !!userProfileField;
  }
}