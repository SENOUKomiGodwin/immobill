import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto, QueryUnitDto } from './dto/unit.dto';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUnitDto, userId: string) {
    // Verify property exists and belongs to user
    const property = await this.prisma.property.findFirst({
      where: { id: dto.property_id, created_by_id: userId },
    });

    if (!property) {
      throw new NotFoundException('Bien non trouvé');
    }

    return this.prisma.unit.create({
      data: {
        ...dto,
        created_by_id: userId,
        status: 'LIBRE', // Always start as Libre
      },
    });
  }

  async findAll(query: QueryUnitDto, request: RequestWithOwnerFilter) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;
    const sort = query.sort || '-created_date';
    const ownerFilter = request.ownerFilter || {};

    // Build where clause
    const where: Record<string, unknown> = { ...ownerFilter };

    if (query.search) {
      where.OR = [{ label: { contains: query.search, mode: 'insensitive' } }];
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.property_id) {
      where.property_id = query.property_id;
    }

    if (query.status) {
      where.status = query.status;
    }

    // Build order
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.unit.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const unit = await this.prisma.unit.findFirst({
      where: { id, ...ownerFilter },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unité non trouvée');
    }

    return unit;
  }

  async update(id: string, dto: UpdateUnitDto, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const unit = await this.prisma.unit.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!unit) {
      throw new NotFoundException('Unité non trouvée');
    }

    // If property_id is being changed, verify new property exists
    if (dto.property_id) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.property_id, created_by_id: unit.created_by_id },
      });

      if (!property) {
        throw new NotFoundException('Bien non trouvé');
      }
    }

    return this.prisma.unit.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const unit = await this.prisma.unit.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!unit) {
      throw new NotFoundException('Unité non trouvée');
    }

    // Check if unit has active lease
    const activeLease = await this.prisma.lease.findFirst({
      where: {
        unit_id: id,
        status: 'ACTIF',
      },
    });

    if (activeLease) {
      throw new ForbiddenException('Impossible de supprimer une unité avec un bail actif');
    }

    await this.prisma.unit.delete({ where: { id } });
  }

  /**
   * Update unit status based on lease
   * This is called by lease service, not directly by API
   */
  async updateStatusFromLease(unitId: string, status: 'LIBRE' | 'OCCUPE') {
    return this.prisma.unit.update({
      where: { id: unitId },
      data: { status },
    });
  }
}
