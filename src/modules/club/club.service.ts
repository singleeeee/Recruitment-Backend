import { Injectable, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubService {
  constructor(private prisma: PrismaService) {}

  /**
   * 分页获取社团列表，支持搜索
   */
  async findAll({ page = 1, limit = 10, search }: { page?: number, limit?: number, search?: string }) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const [clubs, total] = await Promise.all([
      this.prisma.club.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              admins: true,
              recruitments: true,
            },
          },
        },
      }),
      this.prisma.club.count({ where }),
    ]);

    return {
      data: (clubs as any[]).map((club: any) => ({
        ...club,
        adminCount: club._count.admins,
        recruitmentCount: club._count.recruitments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 根据 ID 获取社团详情
   */
  async findOne(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        admins: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
        recruitments: {
          select: {
            id: true,
            title: true,
            status: true,
            startTime: true,
            endTime: true,
            createdAt: true,
          },
        },
      },
    });

    if (!club) {
      throw new BadRequestException('社团不存在');
    }

    return club;
  }

  /**
   * 创建新社团
   */
  async create(createClubDto: CreateClubDto) { // 使用 DTO
    // 检查社团名称是否已存在
    const existingClub = await this.prisma.club.findUnique({
      where: { name: createClubDto.name },
    });

    if (existingClub) {
      throw new ConflictException('社团名称已存在');
    }

    return this.prisma.club.create({
      data: createClubDto,
    });
  }

  /**
   * 更新社团信息
   */
  async update(id: string, updateClubDto: UpdateClubDto) {
    // 检查社团是否存在
    const existingClub = await this.prisma.club.findUnique({
      where: { id },
    });
    if (!existingClub) {
      throw new BadRequestException('社团不存在');
    }

    // 如果更新名称，检查新名称是否与其他社团重复
    if (updateClubDto.name && updateClubDto.name !== existingClub.name) {
      const duplicateClub = await this.prisma.club.findUnique({
        where: { name: updateClubDto.name },
      });
      if (duplicateClub) {
        throw new ConflictException('社团名称已存在');
      }
    }

    return this.prisma.club.update({
      where: { id },
      data: updateClubDto,
    });
  }

  /**
   * 删除社团 (软删除)
   */
  async remove(id: string) {
    // 检查社团是否存在
    const existingClub = await this.prisma.club.findUnique({
      where: { id },
    });

    if (!existingClub) {
      throw new BadRequestException('社团不存在');
    }

    // 执行软删除
    return this.prisma.club.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}