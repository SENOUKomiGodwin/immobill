import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto, CancelExpenseDto, QueryExpenseDto } from './dto/expense.dto';
import { RequestWithOwnerFilter } from '../../common/types/express.d';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$on' | '$connect' | '$disconnect' | '$use' | '$transaction' | '$extends'
>;

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private mapCategory(category?: string): any {
    if (!category) return 'AUTRE';
    const map: Record<string, any> = {
      'Plomberie': 'PLOMBERIE',
      'Peinture': 'PEINTURE',
      'Électricité': 'ELECTRICITE',
      'Taxes': 'TAXES',
      'Assurance': 'ASSURANCE',
      'Gardiennage': 'GARDIENNAGE',
      'Réparation': 'REPARATION',
      'Autre': 'AUTRE',
    };
    return map[category] || 'AUTRE';
  }

  async create(dto: CreateExpenseDto, userId: string) {
    // Verify property exists and belongs to user
    const property = await this.prisma.property.findFirst({
      where: { id: dto.property_id, created_by_id: userId },
    });

    if (!property) {
      throw new NotFoundException('Bien non trouvé');
    }

    return this.prisma.expense.create({
      data: {
        ...dto,
        property_name: property.name,
        category: this.mapCategory(dto.category),
        expense_date: new Date(dto.expense_date),
        created_by_id: userId,
      },
    });
  }

  async findAll(query: QueryExpenseDto, request: RequestWithOwnerFilter) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;
    const sort = query.sort || '-created_date';
    const ownerFilter = request.ownerFilter || {};

    // Build where clause
    const where: Record<string, unknown> = { ...ownerFilter };

    if (query.property_id) {
      where.property_id = query.property_id;
    }

    if (query.category) {
      where.category = this.mapCategory(query.category);
    }

    if (query.search) {
      where.OR = [
        { label: { contains: query.search, mode: 'insensitive' } },
        { vendor: { contains: query.search, mode: 'insensitive' } },
        { note: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.paid !== undefined) {
      where.paid = query.paid === 'true';
    }

    if (query.refacture !== undefined) {
      where.refacture = query.refacture === 'true';
    }

    if (query.from_date || query.to_date) {
      where.expense_date = {};
      if (query.from_date) {
        (where.expense_date as Record<string, Date>).gte = new Date(query.from_date);
      }
      if (query.to_date) {
        (where.expense_date as Record<string, Date>).lte = new Date(query.to_date);
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
      this.prisma.expense.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
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
    const expense = await this.prisma.expense.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!expense) {
      throw new NotFoundException('Dépense non trouvée');
    }

    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};
    const expense = await this.prisma.expense.findFirst({
      where: { id, ...ownerFilter },
    });

    if (!expense) {
      throw new NotFoundException('Dépense non trouvée');
    }

    // If property_id is being changed, verify new property exists
    if (dto.property_id) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.property_id, created_by_id: expense.created_by_id },
      });

      if (!property) {
        throw new NotFoundException('Bien non trouvé');
      }
    }

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.category) {
      updateData.category = this.mapCategory(dto.category);
    }
    if (dto.expense_date) {
      updateData.expense_date = new Date(dto.expense_date);
    }
    if (dto.property_id) {
      const property = await this.prisma.property.findFirst({
        where: { id: dto.property_id },
      });
      updateData.property_name = property?.name || null;
    }

    return this.prisma.expense.update({
      where: { id },
      data: updateData,
    });
  }

  async cancel(id: string, dto: CancelExpenseDto, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};

    // Cancellation with reason and audit log in a transaction
    return this.prisma.$transaction(async (tx: PrismaTransaction) => {
      const expense = await tx.expense.findFirst({
        where: { id, ...ownerFilter },
      });

      if (!expense) {
        throw new NotFoundException('Dépense non trouvée');
      }

      if (expense.cancelled) {
        throw new BadRequestException('Cette dépense est déjà annulée');
      }

      // Cancel expense
      await tx.expense.update({
        where: { id },
        data: {
          cancelled: true,
          cancellation_reason: dto.reason,
        },
      });

      // Create audit log
      await tx.audit_log.create({
        data: {
          user_id: (request.currentUser as { id: string })?.id,
          user_name: (request.currentUser as { full_name?: string })?.full_name || 'Unknown',
          action: 'CANCEL',
          entity_type: 'Expense',
          entity_id: id,
          before: JSON.stringify({
            amount: expense.amount,
            cancelled: false,
          }),
          after: JSON.stringify({
            amount: expense.amount,
            cancelled: true,
            reason: dto.reason,
          }),
        },
      });

      return expense;
    });
  }
}
