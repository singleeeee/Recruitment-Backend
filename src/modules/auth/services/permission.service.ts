import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreatePermissionDto, 
  UpdatePermissionDto, 
  PermissionResponseDto,
  ModulePermissionsDto 
} from '../dto/permission.dto';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有权限
   */
  async getAllPermissions(): Promise<PermissionResponseDto[]> {
    return this.prisma.permission.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    }).then(permissions => 
      permissions.map(permission => this.transformPermissionToDto(permission))
    );
  }

  /**
   * 按模块获取权限列表
   */
  async getPermissionsByModule(): Promise<ModulePermissionsDto[]> {
    const permissions = await this.prisma.permission.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    });

    // 按模块分组权限
    const moduleGroups = permissions.reduce((acc, permission) => {
      const module = permission.module;
      
      if (!acc[module]) {
        acc[module] = {
          module,
          permissions: []
        };
      }
      
      acc[module].permissions.push(this.transformPermissionToDto(permission));
      return acc;
    }, {} as { [key: string]: ModulePermissionsDto });

    return Object.values(moduleGroups);
  }

  /**
   * 根据模块名称获取权限
   */
  async getPermissionsByModuleName(module: string): Promise<PermissionResponseDto[]> {
    return this.prisma.permission.findMany({
      where: { module },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    }).then(permissions => 
      permissions.map(permission => this.transformPermissionToDto(permission))
    );
  }

  /**
   * 根据ID获取权限详情
   */
  async getPermissionById(id: string): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    return this.transformPermissionToDto(permission);
  }

  /**
   * 根据代码获取权限详情
   */
  async getPermissionByCode(code: string): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { code },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    return this.transformPermissionToDto(permission);
  }

  /**
   * 创建新权限
   */
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const { name, code, module, description } = createPermissionDto;

    // 检查权限代码是否已存在
    const existingPermission = await this.prisma.permission.findUnique({
      where: { code }
    });

    if (existingPermission) {
      throw new ConflictException('权限代码已存在');
    }

    // 验证模块名称
    const validModules = ['auth', 'user', 'recruitment', 'application', 'file', 'system'];
    if (!validModules.includes(module)) {
      throw new BadRequestException(`无效的权限模块。支持的模块: ${validModules.join(', ')}`);
    }

    // 创建权限
    const permission = await this.prisma.permission.create({
      data: {
        name,
        code,
        module,
        description
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return this.transformPermissionToDto(permission);
  }

  /**
   * 更新权限信息
   */
  async updatePermission(id: string, updatePermissionDto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    const { name, description } = updatePermissionDto;

    // 检查权限是否存在
    const existingPermission = await this.prisma.permission.findUnique({
      where: { id }
    });

    if (!existingPermission) {
      throw new NotFoundException('权限不存在');
    }

    // 更新权限
    const updatedPermission = await this.prisma.permission.update({
      where: { id },
      data: {
        name,
        description
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return this.transformPermissionToDto(updatedPermission);
  }

  /**
   * 删除权限
   */
  async deletePermission(id: string): Promise<{ message: string }> {
    // 检查权限是否存在
    const existingPermission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!existingPermission) {
      throw new NotFoundException('权限不存在');
    }

    // 检查是否有角色正在使用此权限
    if (existingPermission.roles && existingPermission.roles.length > 0) {
      const roleNames = existingPermission.roles.map(rp => rp.role.name);
      throw new BadRequestException(`无法删除正在被角色使用的权限。使用中的角色: ${roleNames.join(', ')}`);
    }

    // 删除权限
    await this.prisma.permission.delete({
      where: { id }
    });

    return { message: '权限删除成功' };
  }

  /**
   * 获取所有权限模块列表
   */
  async getAllModules(): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({
      distinct: ['module'],
      select: {
        module: true
      },
      orderBy: {
        module: 'asc'
      }
    });

    return permissions.map(p => p.module);
  }

  /**
   * 检查权限是否存在
   */
  async permissionExists(code: string): Promise<boolean> {
    const count = await this.prisma.permission.count({
      where: { code }
    });

    return count > 0;
  }

  /**
   * 批量创建权限
   */
  async createPermissions(createPermissionDtos: CreatePermissionDto[]): Promise<PermissionResponseDto[]> {
    const results: PermissionResponseDto[] = [];
    
    for (const dto of createPermissionDtos) {
      try {
        const permission = await this.createPermission(dto);
        results.push(permission);
      } catch (error) {
        // 如果权限已存在，跳过继续处理其他的
        if (error instanceof ConflictException) {
          continue;
        }
        throw error;
      }
    }

    return results;
  }

  /**
   * 搜索权限
   */
  async searchPermissions(
    keyword?: string, 
    module?: string
  ): Promise<PermissionResponseDto[]> {
    const whereClause: any = {};

    if (keyword) {
      whereClause.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { code: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    if (module) {
      whereClause.module = module;
    }

    return this.prisma.permission.findMany({
      where: whereClause,
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: [
        { module: 'asc' },
        { name: 'asc' }
      ]
    }).then(permissions => 
      permissions.map(permission => this.transformPermissionToDto(permission))
    );
  }

  /**
   * 验证权限代码列表
   */
  async validatePermissionCodes(codes: string[]): Promise<{
    valid: string[];
    invalid: string[];
  }> {
    if (!codes || codes.length === 0) {
      return { valid: [], invalid: [] };
    }

    const permissions = await this.prisma.permission.findMany({
      where: {
        code: { in: codes }
      },
      select: {
        code: true
      }
    });

    const validCodes = permissions.map(p => p.code);
    const invalidCodes = codes.filter(code => !validCodes.includes(code));

    return {
      valid: validCodes,
      invalid: invalidCodes
    };
  }

  /**
   * 获取权限统计信息
   */
  async getPermissionStats(): Promise<{
    totalPermissions: number;
    modules: { [key: string]: number };
    roleAssignments: number;
  }> {
    const [totalCount, moduleStats, roleAssignmentCount] = await Promise.all([
      this.prisma.permission.count(),
      this.prisma.permission.groupBy({
        by: ['module'],
        _count: { _all: true }
      }),
      this.prisma.rolePermission.count()
    ]);

    const modulesObject = moduleStats.reduce((acc, stat) => {
      acc[stat.module] = stat._count._all;
      return acc;
    }, {} as { [key: string]: number });

    return {
      totalPermissions: totalCount,
      modules: modulesObject,
      roleAssignments: roleAssignmentCount
    };
  }

  /**
   * 将数据库权限对象转换为响应DTO
   */
  private transformPermissionToDto(permission: any): PermissionResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      code: permission.code,
      module: permission.module,
      description: permission.description,
      createdAt: permission.createdAt,
      roles: permission.roles ? permission.roles.map(rp => ({
        id: rp.role.id,
        name: rp.role.name,
        code: rp.role.code
      })) : []
    };
  }
}