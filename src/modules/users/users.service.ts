import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileFieldDataDto } from '../auth/dto/auth.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
  async updateProfileFields(userId: string, profileFields: { [key: string]: string }) {
    try {
      // 开始事务处理所有档案字段更新
      const updates = [];
      
      for (const [fieldName, fieldValue] of Object.entries(profileFields)) {
        if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
          // 查找注册字段配置
          const registrationField = await this.prisma.registrationField.findFirst({
            where: { 
              fieldName: fieldName,
              isActive: true
            },
          });

          if (!registrationField) {
            console.warn(`注册字段配置中未找到 fieldName: ${fieldName}，跳过更新。`);
            continue;
          }

          // 检查字段唯一性约束（如学号）
          if (fieldName === 'studentId' && fieldValue) {
            const existingProfile = await this.prisma.userProfileField.findFirst({
              where: {
                fieldValue: fieldValue,
                fieldId: registrationField.id,
                userId: { not: userId }, // 排除当前用户
              },
            });
            
            if (existingProfile) {
              throw new ConflictException('学号已被其他用户使用');
            }
          }

          // 创建或更新用户档案字段
          updates.push(
            this.prisma.userProfileField.upsert({
              where: {
                userId_fieldId: {
                  userId: userId,
                  fieldId: registrationField.id,
                },
              },
              create: {
                userId: userId,
                fieldId: registrationField.id,
                fieldValue: fieldValue,
              },
              update: {
                fieldValue: fieldValue,
              },
            })
          );
        }
      }

      // 并行执行所有更新
      await Promise.all(updates);

      // 返回更新后的用户信息
      return this.getUserById(userId);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('更新档案字段失败:', error);
      throw new BadRequestException('更新档案字段失败');
    }
  }

  /**
   * 获取用户的档案字段配置和当前值
   */
  async getUserProfileFields(userId: string) {
    const activeFields = await this.prisma.registrationField.findMany({
      where: { isActive: true },
      orderBy: { fieldOrder: 'asc' },
    });

    const userProfileFields = await this.prisma.userProfileField.findMany({
      where: { 
        userId: userId,
        field: { isActive: true }
      },
      include: {
        field: true,
      },
    });

    // 构建字段映射
    const userFieldsMap = userProfileFields.reduce((map, userField) => {
      map[userField.field.fieldName] = {
        value: userField.fieldValue,
        fileId: userField.fileId,
      };
      return map;
    }, {});

    // 返回所有活跃字段配置，包含用户当前值
    return activeFields.map(field => ({
      id: field.id,
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      placeholder: field.placeholder,
      helpText: field.helpText,
      options: field.options,
      validationRules: field.validationRules,
      currentValue: userFieldsMap[field.fieldName]?.value || '',
      fileId: userFieldsMap[field.fieldName]?.fileId || null,
    }));
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