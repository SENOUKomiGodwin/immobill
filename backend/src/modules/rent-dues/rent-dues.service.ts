import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueryRentDueDto } from './dto/rent-due.dto';
import { RequestWithOwnerFilter } from '../../common/types/express.d';
import { computeDueStatus } from '../../common/utils/lease-calculations';

interface RentDueWithComputed {
  due_date: Date;
  amount_paid: number;
  amount_due: number;
  status: string;
}

@Injectable()
export class RentDuesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryRentDueDto, request: RequestWithOwnerFilter) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;
    const sort = query.sort || '-due_date';
    const ownerFilter = request.ownerFilter || {};

    // Build where clause
    const where: Record<string, unknown> = { ...ownerFilter };

    if (query.lease_id) {
      where.lease_id = query.lease_id;
    }

    if (query.status) {
      // Map French status to Prisma enum
      const statusMap: Record<string, string> = {
        Attente: 'ATTENTE',
        Partiel: 'PARTIEL',
        Payé: 'PAYE',
        Retard: 'RETARD',
        Annulé: 'ANNULE',
      };
      where.status = statusMap[query.status] || query.status;
    }

    if (query.period) {
      where.period = query.period;
    }

    if (query.from_date || query.to_date) {
      where.due_date = {};
      if (query.from_date) {
        (where.due_date as Record<string, Date>).gte = new Date(query.from_date);
      }
      if (query.to_date) {
        (where.due_date as Record<string, Date>).lte = new Date(query.to_date);
      }
    }

    // Build order
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.rentDue.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.rentDue.count({ where }),
    ]);

    // Rule 6: Compute status server-side
    const dataWithComputedStatus = data.map((due: RentDueWithComputed) => {
      const { computed_status, days_late } = computeDueStatus(
        due.due_date,
        due.amount_paid,
        due.amount_due,
        0, // grace_days not available without relation
        due.status === 'ANNULE',
      );

      return {
        ...due,
        computed_status,
        days_late,
      };
    });

    return {
      data: dataWithComputedStatus,
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
    const due = await this.prisma.rentDue.findFirst({
      where: { id, ...ownerFilter },
      include: {
        payments: {
          where: { cancelled: false },
          orderBy: { payment_date: 'desc' },
        },
      },
    });

    if (!due) {
      throw new NotFoundException('Échéance non trouvée');
    }

    // Rule 6: Compute status server-side
    const { computed_status, days_late } = computeDueStatus(
      due.due_date,
      due.amount_paid,
      due.amount_due,
      0, // grace_days not available without relation
      due.status === 'ANNULE',
    );

    return {
      ...due,
      computed_status,
      days_late,
    };
  }
}
