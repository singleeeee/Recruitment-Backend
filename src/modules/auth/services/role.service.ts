import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateRoleDto, 
  UpdateRoleDto, 
  AssignPermissionsDto,
  RoleResponseDto 
} from '../dto/role.dto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有角色
   */
  async getAllRoles(includeInactive: boolean = false): Promise<RoleResponseDto[]> {
    const whereClause = includeInactive ? {} : { isActive: true };
    
    return this.prisma.role.findMany({
      where: whereClause,
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: {
        level: 'desc'
      }
    }).then(roles => 
      roles.map(role => this.transformRoleToDto(role))
    );
  }

  /**
   * 根据ID获取角色详情
   */
  async getRoleById(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return this.transformRoleToDto(role);
  }

  /**
   * 根据角色代码获取角色详情
   */
  async getRoleByCode(code: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { code },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return this.transformRoleToDto(role);
  }

  /**
   * 创建新角色
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const { permissionCodes, ...roleData } = createRoleDto;

    // 检查角色代码是否已存在
    const existingRole = await this.prisma.role.findUnique({
      where: { code: roleData.code }
    });

    if (existingRole) {
      throw new ConflictException('角色代码已存在');
    }

    // 验证权限代码是否存在
    if (permissionCodes && permissionCodes.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { code: { in: permissionCodes } }
      });

      if (permissions.length !== permissionCodes.length) {
        const foundCodes = permissions.map(p => p.code);
        const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
        throw new BadRequestException(`以下权限代码不存在: ${missingCodes.join(', ')}`);
      }
    }

    // 创建角色并分配权限
    const role = await this.prisma.role.create({
      data: {
        ...roleData,
        permissions: permissionCodes && permissionCodes.length > 0 ? {
          create: permissionCodes.map(permissionCode => ({
            permission: {
              connect: { code: permissionCode }
            }
          }))
        } : undefined
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return this.transformRoleToDto(role);
  }

  /**
   * 更新角色信息
   */
  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
    const { permissionCodes, ...roleData } = updateRoleDto;

    // 检查角色是否存在
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true
      }
    });

    if (!existingRole) {
      throw new NotFoundException('角色不存在');
    }

    // 验证权限代码是否存在
    if (permissionCodes && permissionCodes.length > 0) {
      const permissions = await this.prisma.permission.findMany({
        where: { code: { in: permissionCodes } }
      });

      if (permissions.length !== permissionCodes.length) {
        const foundCodes = permissions.map(p => p.code);
        const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
        throw new BadRequestException(`以下权限代码不存在: ${missingCodes.join(', ')}`);
      }
    }

    // 更新角色信息和权限
    const updateData: any = { ...roleData };
    
    if (permissionCodes) {
      updateData.permissions = {
        deleteMany: {}, // 删除所有现有权限关联
        create: permissionCodes.map(permissionCode => ({
          permission: {
            connect: { code: permissionCode }
          }
        }))
      };
    }

    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return this.transformRoleToDto(updatedRole);
  }

  /**
   * 删除角色
   */
  async deleteRole(id: string): Promise<{ message: string }> {
    // 检查角色是否存在
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: true
      }
    });

    if (!existingRole) {
      throw new NotFoundException('角色不存在');
    }

    // 检查是否有用户正在使用此角色
    if (existingRole.users && existingRole.users.length > 0) {
      throw new BadRequestException('无法删除正在被用户使用的角色');
    }

    // 系统默认角色不允许删除
    if (['system_admin', 'club_admin', 'candidate'].includes(existingRole.code)) {
      throw new ForbiddenException('系统默认角色不允许删除');
    }

    // 删除角色（级联删除会自动删除权限关联）
    await this.prisma.role.delete({
      where: { id }
    });

    return { message: '角色删除成功' };
  }

  /**
   * 为角色分配权限
   */
  async assignPermissions(id: string, assignPermissionsDto: AssignPermissionsDto): Promise<RoleResponseDto> {
    const { permissionCodes } = assignPermissionsDto;

    // 检查角色是否存在
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true
      }
    });

    if (!existingRole) {
      throw new NotFoundException('角色不存在');
    }

    // 验证权限代码是否存在
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } }
    });

    if (permissions.length !== permissionCodes.length) {
      const foundCodes = permissions.map(p => p.code);
      const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
      throw new BadRequestException(`以下权限代码不存在: ${missingCodes.join(', ')}`);
    }

    // 更新权限关联
    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        permissions: {
          deleteMany: {}, // 删除所有现有权限关联
          create: permissionCodes.map(permissionCode => ({
            permission: {
              connect: { code: permissionCode }
            }
          }))
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return this.transformRoleToDto(updatedRole);
  }

  /**
   * 从角色移除权限
   */
  async removePermissions(id: string, permissionCodes: string[]): Promise<RoleResponseDto> {
    // 检查角色是否存在
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true
      }
    });

    if (!existingRole) {
      throw new NotFoundException('角色不存在');
    }

    // 移除指定的权限关联
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: id,
        permission: {
          code: { in: permissionCodes }
        }
      }
    });

    // 返回更新后的角色信息
    return this.getRoleById(id);
  }

  /**
   * 添加权限到角色
   */
  async addPermissions(id: string, permissionCodes: string[]): Promise<RoleResponseDto> {
    // 检查角色是否存在
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true
      }
    });

    if (!existingRole) {
      throw new NotFoundException('角色不存在');
    }

    // 验证权限代码是否存在
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } }
    });

    if (permissions.length !== permissionCodes.length) {
      const foundCodes = permissions.map(p => p.code);
      const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
      throw new BadRequestException(`以下权限代码不存在: ${missingCodes.join(', ')}`);
    }

    // 获取当前角色已有权限，避免重复添加
    const currentPermissionIds = existingRole.permissions.map(rp => rp.permissionId);
    
    // 添加新的权限关联
    const newPermissions = permissions.filter(p => !currentPermissionIds.includes(p.id));
    
    if (newPermissions.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: newPermissions.map(permission => ({
          roleId: id,
          permissionId: permission.id
        }))
      });
    }

    // 返回更新后的角色信息
    return this.getRoleById(id);
  }

  /**
   * 获取角色的权限代码列表
   */
  async getRolePermissionCodes(id: string): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role.permissions.map(rp => rp.permission.code);
  }

  /**
   * 检查角色是否有指定权限
   */
  async roleHasPermission(roleId: string, permissionCode: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({
      where: {
        roleId,
        permission: {
          code: permissionCode
        }
      }
    });

    return count > 0;
  }

  /**
   * 将数据库角色对象转换为响应DTO
   */
  private transformRoleToDto(role: any): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      level: role.level,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions ? role.permissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        code: rp.permission.code,
        module: rp.permission.module
      })) : []
    };
  }
}