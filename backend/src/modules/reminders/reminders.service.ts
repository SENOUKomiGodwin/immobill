import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReminderDto, QueryReminderDto } from './dto/reminder.dto';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReminderDto, userId: string) {
    // Verify rent due exists and belongs to user
    const rentDue = await this.prisma.rentDue.findFirst({
      where: {
        id: dto.due_id,
        created_by_id: userId,
      },
      include: {
        lease: true,
      },
    });

    if (!rentDue) {
      throw new NotFoundException('Échéance non trouvée');
    }

    // Check if reminder already exists for this tier
    const existing = await this.prisma.reminder.findUnique({
      where: {
        due_id_tier: {
          due_id: dto.due_id,
          tier: dto.tier,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Une relance de ce palier a déjà été envoyée');
    }

    // Create reminder
    const reminder = await this.prisma.reminder.create({
      data: {
        due_id: dto.due_id,
        tier: dto.tier,
        method: dto.method,
        message: dto.message,
        created_by_id: userId,
      },
    });

    return reminder;
  }

  async findAll(query: QueryReminderDto, request: RequestWithOwnerFilter) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;
    const sort = query.sort || '-sent_at';
    const ownerFilter = request.ownerFilter || {};

    // Build where clause
    const where: Record<string, unknown> = {
      rent_due: {
        ...ownerFilter,
      },
    };

    if (query.due_id) {
      where.due_id = query.due_id;
    }

    if (query.tier) {
      where.tier = query.tier;
    }

    if (query.method) {
      where.method = query.method;
    }

    // Build order
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sort.startsWith('-')) {
      orderBy[sort.substring(1)] = 'desc';
    } else {
      orderBy[sort] = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.reminder.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          rent_due: {
            select: {
              id: true,
              period: true,
              due_date: true,
              amount_due: true,
              amount_paid: true,
              tenant_name: true,
              unit_label: true,
              property_name: true,
            },
          },
        },
      }),
      this.prisma.reminder.count({ where }),
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

  async findByDueId(dueId: string, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};

    const reminders = await this.prisma.reminder.findMany({
      where: {
        due_id: dueId,
        rent_due: {
          ...ownerFilter,
        },
      },
      orderBy: {
        sent_at: 'asc',
      },
      include: {
        rent_due: {
          select: {
            id: true,
            period: true,
            tenant_name: true,
            unit_label: true,
          },
        },
      },
    });

    return reminders;
  }
}
