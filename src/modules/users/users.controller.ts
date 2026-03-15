import {
  Controller,
  Get,
  UseGuards,
  Put,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { UsersService } from './users.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateBasicInfoDto, UpdateProfileFieldsDto } from './dto/user.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('profile')
  @ApiOperation({
    summary: '获取当前用户信息',
    description: '获取已登录用户的个人资料（包含动态档案字段）',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取用户信息',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: '张三',
        status: 'active',
        avatar: null,
        role: {
          id: 'role-id',
          name: '候选人',
          code: 'candidate',
        },
        // 动态档案字段
        studentId: '2021001001',
        college: '计算机学院',
        major: '计算机科学与技术',
        grade: '2021级',
        phone: '13800138000',
        experience: '我的相关经验是...',
        motivation: '我加入的动机是...',
        profileFields: {
          studentId: '2021001001',
          college: '计算机学院',
          major: '计算机科学与技术',
          grade: '2021级',
          phone: '13800138000',
          experience: '我的相关经验是...',
          motivation: '我加入的动机是...',
        },
        createdAt: '2026-01-17T07:14:27.788Z',
        updatedAt: '2026-01-17T07:14:27.788Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
  })
  getProfile(@CurrentUser() user: any) {
    console.log('=== 用户控制器接收到数据 ===');
    console.log('user对象完整结构:', JSON.stringify(user, null, 2));
    // 聚合动态档案字段
    const profileFieldMap: { [key: string]: string } = {};
    if (user.profileFields) {
      user.profileFields.forEach((field: any) => {
        profileFieldMap[field.field.fieldName] = field.fieldValue;
      });
    }

    // 提取角色权限信息
    const permissions = [];
    console.log('roleData对象:', user.roleData);
    console.log('roleCode:', user.roleCode);
    if (user.roleData && user.roleData.permissions) {
      console.log('发现权限数据');
      permissions.push(...user.roleData.permissions.map((rp: any) => rp.permission));
    } else {
      console.log('没有找到权限数据，roleData对象结构:', JSON.stringify(user.roleData));
    }

      // 构建返回的用户信息，将常用字段提取到顶层
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        avatar: user.avatar,
        role: user.roleCode || user.role?.code,
        // 加入权限信息
        permissions: permissions.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          module: p.module
        })),
        // 常用动态字段提取到顶层，便于前端使用
        studentId: profileFieldMap['studentId'],
        college: profileFieldMap['college'],
        major: profileFieldMap['major'],
        grade: profileFieldMap['grade'],
        phone: profileFieldMap['phone'],
        experience: profileFieldMap['experience'],
        motivation: profileFieldMap['motivation'],
        // 完整档案字段映射，便于前端灵活使用
        profileFields: profileFieldMap,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
  }

  @Put('profile/basic')
  @ApiOperation({
    summary: '更新用户基本信息',
    description: '更新用户的姓名和头像等基本信息',
  })
  @ApiResponse({
    status: 200,
    description: '成功更新用户基本信息',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: '张三',
        avatar: 'https://example.com/avatar.jpg',
        updatedAt: '2026-01-17T07:14:27.788Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '更新失败',
  })
  async updateBasicInfo(
    @CurrentUser() user: any,
    @Body() updateBasicInfoDto: UpdateBasicInfoDto,
  ) {
    const updatedUser = await this.usersService.updateBasicInfo(user.id, updateBasicInfoDto);
    
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatar: updatedUser.avatar,
      updatedAt: updatedUser.updatedAt,
    };
  }

  @Put('profile/fields')
  @ApiOperation({
    summary: '更新用户档案字段',
    description: '更新用户的动态档案字段信息',
  })
  @ApiResponse({
    status: 200,
    description: '成功更新用户档案字段',
    schema: {
      example: {
        message: '档案字段更新成功',
        updated: ['studentId', 'college', 'major'],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '更新失败',
  })
  async updateProfileFields(
    @CurrentUser() user: any,
    @Body() updateProfileFieldsDto: UpdateProfileFieldsDto,
  ) {
    const updatedUser = await this.usersService.updateProfileFields(
      user.id,
      updateProfileFieldsDto.profileFields,
    );

    // 聚合更新后的动态档案字段
    const profileFieldMap: { [key: string]: string } = {};
    if (updatedUser.profileFields) {
      updatedUser.profileFields.forEach((field: any) => {
        profileFieldMap[field.field.fieldName] = field.fieldValue;
      });
    }

    return {
      message: '档案字段更新成功',
      updatedFields: Object.keys(updateProfileFieldsDto.profileFields),
      profileFields: profileFieldMap,
    };
  }

  @Get('profile/fields-config')
  @ApiOperation({
    summary: '获取用户档案字段配置',
    description: '获取所有可用的档案字段配置及当前用户的字段值',
  })
  @ApiResponse({
    status: 200,
    description: '成功获取字段配置',
    schema: {
      example: {
        fields: [
          {
            id: 'field-id-1',
            fieldName: 'studentId',
            fieldLabel: '学号',
            fieldType: 'text',
            isRequired: true,
            placeholder: '请输入学号',
            helpText: '填写学校学号',
            currentValue: '2021001001',
          },
          {
            id: 'field-id-2',
            fieldName: 'college',
            fieldLabel: '学院',
            fieldType: 'select',
            isRequired: true,
            placeholder: '请选择学院',
            helpText: null,
            options: {
              options: [
                { label: '计算机学院', value: '计算机学院' },
                { label: '软件学院', value: '软件学院' }
              ]
            },
            currentValue: '计算机学院',
          }
        ]
      },
    },
  })
  async getProfileFieldsConfig(@CurrentUser() user: any) {
    const fieldConfigs = await this.usersService.getUserProfileFields(user.id);
    return { fields: fieldConfigs };
  }
}