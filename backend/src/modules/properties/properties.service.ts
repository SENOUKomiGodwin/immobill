import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  QueryPropertyDto,
  PropertyType,
} from './dto/property.dto';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  private mapPropertyType(type: PropertyType): string {
    const map: Record<PropertyType, string> = {
      [PropertyType.IMMEUBLE]: 'IMMEUBLE',
      [PropertyType.MAISON]: 'MAISON',
      [PropertyType.RESIDENCE]: 'RESIDENCE',
      [PropertyType.BOUTIQUE]: 'BOUTIQUE',
      [PropertyType.TERRAIN]: 'TERRAIN',
    };
    return map[type];
  }

  async create(dto: CreatePropertyDto, userId: string) {
    return this.prisma.property.create({
      data: {
        ...dto,
        created_by_id: userId,
      },
    });
  }

  async findAll(query: QueryPropertyDto, request: RequestWithOwnerFilter) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;
    const sort = query.sort || '-created_date';
    const ownerFilter = request.ownerFilter || {};

    // Build where clause
    const where: Record<string, unknown> = { ...ownerFilter };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    // Build order
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where }),
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
    const property = await this.prisma.property.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!property) {
      throw new NotFoundException('Bien non trouvé');
    }

    return property;
  }

  async update(id: string, dto: UpdatePropertyDto, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const property = await this.prisma.property.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!property) {
      throw new NotFoundException('Bien non trouvé');
    }

    return this.prisma.property.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const property = await this.prisma.property.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!property) {
      throw new NotFoundException('Bien non trouvé');
    }

    // Check if property has units
    const unitsCount = await this.prisma.unit.count({
      where: { property_id: id },
    });

    if (unitsCount > 0) {
      throw new ForbiddenException('Impossible de supprimer un bien avec des unités');
    }

    await this.prisma.property.delete({ where: { id } });
  }
}
