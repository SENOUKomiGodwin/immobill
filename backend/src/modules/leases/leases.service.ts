import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLeaseDto, UpdateLeaseDto, QueryLeaseDto } from './dto/lease.dto';
import { RequestWithOwnerFilter } from '../../common/types/express.d';
import { generateRentDues } from '../../common/utils/lease-calculations';
import { UnitsService } from '../units/units.service';

@Injectable()
export class LeasesService {
  constructor(
    private prisma: PrismaService,
    private unitsService: UnitsService,
  ) {}

  async create(dto: CreateLeaseDto, userId: string) {
    // Verify unit exists and belongs to user
    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unit_id, created_by_id: userId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unité non trouvée');
    }

    // Verify tenant exists and belongs to user
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: dto.tenant_id, created_by_id: userId },
    });

    if (!tenant) {
      throw new NotFoundException('Locataire non trouvé');
    }

    // Check if unit already has an active lease (rule 4)
    const activeLease = await this.prisma.lease.findFirst({
      where: {
        unit_id: dto.unit_id,
        status: 'ACTIF',
      },
    });

    if (activeLease) {
      throw new ConflictException('Cette unité a déjà un bail actif');
    }

    // Create lease with denormalized fields
    const lease = await this.prisma.lease.create({
      data: {
        unit_id: dto.unit_id,
        tenant_id: dto.tenant_id,
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        rent_amount: dto.rent_amount,
        charges_amount: dto.charges_amount,
        deposit_amount: dto.deposit_amount || 0,
        due_day: dto.due_day,
        grace_days: dto.grace_days || 0,
        penalty_enabled: dto.penalty_enabled || false,
        status: 'ACTIF',
        notes: dto.notes,
        // Denormalized fields
        unit_label: unit.label,
        property_id: unit.property_id,
        property_name: unit.property?.name || null,
        tenant_name: tenant.full_name,
        tenant_phone: tenant.phone || null,
        created_by_id: userId,
      },
    });

    // Generate rent dues server-side (rule 5)
    await this.generateRentDuesForLease(lease.id, dto, userId);

    // Update unit status to Occupé
    await this.unitsService.updateStatusFromLease(dto.unit_id, 'OCCUPE');

    return lease;
  }

  async findAll(query: QueryLeaseDto, request: RequestWithOwnerFilter) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;
    const sort = query.sort || '-created_date';
    const ownerFilter = request.ownerFilter || {};

    // Build where clause
    const where: Record<string, unknown> = { ...ownerFilter };

    if (query.search) {
      where.OR = [
        { tenant_name: { contains: query.search, mode: 'insensitive' } },
        { unit_label: { contains: query.search, mode: 'insensitive' } },
        { property_name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.unit_id) {
      where.unit_id = query.unit_id;
    }

    if (query.tenant_id) {
      where.tenant_id = query.tenant_id;
    }

    // Build order
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.lease.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          unit: {
            select: {
              id: true,
              label: true,
              type: true,
              status: true,
            },
          },
          tenant: {
            select: {
              id: true,
              full_name: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.lease.count({ where }),
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
    const lease = await this.prisma.lease.findFirst({
      where: { id, ...ownerFilter },
      include: {
        unit: {
          select: {
            id: true,
            label: true,
            type: true,
            status: true,
            property: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            id_number: true,
          },
        },
      },
    });

    if (!lease) {
      throw new NotFoundException('Bail non trouvé');
    }

    return lease;
  }

  async update(id: string, dto: UpdateLeaseDto, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const lease = await this.prisma.lease.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!lease) {
      throw new NotFoundException('Bail non trouvé');
    }

    // Cannot update status or unit_id via update endpoint
    const updateData: Record<string, unknown> = { ...dto };

    // If end_date is being set and it's in the past, set status to Terminé
    if (dto.end_date) {
      const endDate = new Date(dto.end_date);
      if (endDate < new Date() && lease.status === 'ACTIF') {
        updateData.status = 'TERMINE';
        await this.handleLeaseTermination(lease.id, lease.unit_id);
      }
    }

    return this.prisma.lease.update({
      where: { id },
      data: updateData,
    });
  }

  async terminate(id: string, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const lease = await this.prisma.lease.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!lease) {
      throw new NotFoundException('Bail non trouvé');
    }

    if (lease.status === 'TERMINE') {
      throw new ConflictException('Ce bail est déjà terminé');
    }

    // Rule 3: Lease termination sets status to Terminé, unit to Libre, cancels future unpaid dues
    await this.handleLeaseTermination(lease.id, lease.unit_id);

    return this.prisma.lease.update({
      where: { id },
      data: {
        status: 'TERMINE',
        end_date: new Date(),
      },
    });
  }

  private async handleLeaseTermination(leaseId: string, unitId: string) {
    // Update unit status to Libre
    await this.unitsService.updateStatusFromLease(unitId, 'LIBRE');

    // Cancel future unpaid dues (rule 3)
    const today = new Date();
    await this.prisma.rentDue.updateMany({
      where: {
        lease_id: leaseId,
        due_date: { gt: today },
        status: { in: ['ATTENTE', 'RETARD'] }, // Only cancel unpaid dues
      },
      data: {
        status: 'ANNULE',
      },
    });
  }

  private async generateRentDuesForLease(leaseId: string, dto: CreateLeaseDto, userId: string) {
    const dues = generateRentDues({
      start_date: new Date(dto.start_date),
      end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      due_day: dto.due_day,
      rent_amount: dto.rent_amount,
      charges_amount: dto.charges_amount,
    });

    // Insert dues with unique constraint (lease_id, period) - rule 5
    for (const due of dues) {
      try {
        await this.prisma.rentDue.create({
          data: {
            lease_id: leaseId,
            period: due.period,
            due_date: due.due_date,
            amount_due: due.amount_due,
            amount_paid: 0,
            status: 'ATTENTE',
            created_by_id: userId,
          },
        });
      } catch (error) {
        // Ignore duplicate errors (idempotent)
        if ((error as { code?: string }).code !== 'P2002') {
          throw error;
        }
      }
    }
  }
}
