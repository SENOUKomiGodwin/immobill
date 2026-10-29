import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto, QueryTenantDto } from './dto/tenant.dto';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto, userId: string) {
    return this.prisma.tenant.create({
      data: {
        ...dto,
        created_by_id: userId,
      },
    });
  }

  async findAll(query: QueryTenantDto, request: RequestWithOwnerFilter) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;
    const sort = query.sort || '-created_date';
    const ownerFilter = request.ownerFilter || {};

    // Build where clause
    const where: Record<string, unknown> = { ...ownerFilter };

    if (query.search) {
      where.OR = [
        { full_name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { id_number: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build order
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
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
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire non trouvé');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire non trouvé');
    }

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire non trouvé');
    }

    // Check if tenant has active lease
    const activeLease = await this.prisma.lease.findFirst({
      where: {
        tenant_id: id,
        status: 'ACTIF',
      },
    });

    if (activeLease) {
      throw new ForbiddenException('Impossible de supprimer un locataire avec un bail actif');
    }

    await this.prisma.tenant.delete({ where: { id } });
  }
}
