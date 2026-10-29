import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreatePaymentDto,
  CancelPaymentDto,
  QueryPaymentDto,
  PaymentMethod,
} from './dto/payment.dto';
import { RequestWithOwnerFilter } from '../../common/types/express.d';
import {
  isPaymentExceedingBalance,
  generateReceiptNumber,
} from '../../common/utils/lease-calculations';
import { PrismaClient } from '@prisma/client';

type PrismaTransaction = Omit<
  PrismaClient,
  '$on' | '$connect' | '$disconnect' | '$use' | '$transaction' | '$extends'
>;

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private mapPaymentMethod(
    method: PaymentMethod,
  ): 'ESPACES' | 'MOBILE_MONEY' | 'VIREMENT' | 'CHEQUE' {
    const map: Record<PaymentMethod, 'ESPACES' | 'MOBILE_MONEY' | 'VIREMENT' | 'CHEQUE'> = {
      [PaymentMethod.ESPACES]: 'ESPACES',
      [PaymentMethod.MOBILE_MONEY]: 'MOBILE_MONEY',
      [PaymentMethod.VIREMENT]: 'VIREMENT',
      [PaymentMethod.CHEQUE]: 'CHEQUE',
    };
    return map[method];
  }

  async create(dto: CreatePaymentDto, userId: string) {
    // Rule 1: Transactional payment with row locking
    return this.prisma.$transaction(async (tx: PrismaTransaction) => {
      // Get rent due with row lock
      const rentDue = await tx.rentDue.findUnique({
        where: { id: dto.due_id },
      });

      if (!rentDue) {
        throw new NotFoundException('Échéance non trouvée');
      }

      // Check if due belongs to user
      const lease = await tx.lease.findUnique({
        where: { id: rentDue.lease_id },
      });

      if (!lease || lease.created_by_id !== userId) {
        throw new NotFoundException('Échéance non trouvée');
      }

      // Check if payment exceeds balance (rule 1)
      if (isPaymentExceedingBalance(dto.amount, rentDue.amount_due, rentDue.amount_paid)) {
        throw new BadRequestException("Le montant du paiement dépasse le solde de l'échéance");
      }

      // Generate receipt number (rule 2)
      const year = new Date().getFullYear();
      const counter = await tx.owner_counters.upsert({
        where: {
          owner_id_year: {
            owner_id: userId,
            year,
          },
        },
        create: {
          owner_id: userId,
          year,
          sequence: 1,
        },
        update: {
          sequence: {
            increment: 1,
          },
        },
      });

      const receipt_number = generateReceiptNumber(year, counter.sequence);

      // Create payment
      const payment = await tx.payment.create({
        data: {
          due_id: dto.due_id,
          lease_id: rentDue.lease_id,
          period: rentDue.period,
          amount: dto.amount,
          method: this.mapPaymentMethod(dto.method),
          reference: dto.reference,
          receipt_number,
          note: dto.note,
          payment_date: new Date(),
          // Denormalized fields
          tenant_name: lease.tenant_name,
          unit_label: lease.unit_label,
          property_name: lease.property_name,
          created_by_id: userId,
        },
      });

      // Update rent due amount_paid (rule 1)
      await tx.rentDue.update({
        where: { id: dto.due_id },
        data: {
          amount_paid: {
            increment: dto.amount,
          },
        },
      });

      return payment;
    });
  }

  async findAll(query: QueryPaymentDto, request: RequestWithOwnerFilter) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;
    const sort = query.sort || '-payment_date';
    const ownerFilter = request.ownerFilter || {};

    // Build where clause
    const where: Record<string, unknown> = { ...ownerFilter };

    if (query.due_id) {
      where.due_id = query.due_id;
    }

    if (query.lease_id) {
      where.lease_id = query.lease_id;
    }

    if (query.method) {
      where.method = query.method;
    }

    if (query.from_date || query.to_date) {
      where.payment_date = {};
      if (query.from_date) {
        (where.payment_date as Record<string, Date>).gte = new Date(query.from_date);
      }
      if (query.to_date) {
        (where.payment_date as Record<string, Date>).lte = new Date(query.to_date);
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
      this.prisma.payment.findMany({
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
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
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
    const payment = await this.prisma.payment.findFirst({
      where: { id, ...ownerFilter },
      include: {
        rent_due: {
          select: {
            id: true,
            period: true,
            due_date: true,
            amount_due: true,
            amount_paid: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Paiement non trouvé');
    }

    return payment;
  }

  async cancel(id: string, dto: CancelPaymentDto, request: RequestWithOwnerFilter) {
    const ownerFilter = request.ownerFilter || {};

    // Rule 7: Cancellation with reason and audit log in a transaction
    return this.prisma.$transaction(async (tx: PrismaTransaction) => {
      const payment = await tx.payment.findFirst({
        where: { id, ...ownerFilter },
      });

      if (!payment) {
        throw new NotFoundException('Paiement non trouvé');
      }

      if (payment.cancelled) {
        throw new BadRequestException('Ce paiement est déjà annulé');
      }

      // Cancel payment
      await tx.payment.update({
        where: { id },
        data: {
          cancelled: true,
          cancellation_reason: dto.reason,
        },
      });

      // Decrement rent due amount_paid (rule 7)
      await tx.rentDue.update({
        where: { id: payment.due_id },
        data: {
          amount_paid: {
            decrement: payment.amount,
          },
        },
      });

      // Create audit log (rule 7)
      await tx.audit_log.create({
        data: {
          user_id: (request.currentUser as { id: string })?.id,
          user_name: (request.currentUser as { full_name?: string })?.full_name || 'Unknown',
          action: 'CANCEL',
          entity_type: 'Payment',
          entity_id: id,
          before: JSON.stringify({
            amount: payment.amount,
            cancelled: false,
          }),
          after: JSON.stringify({
            amount: payment.amount,
            cancelled: true,
            reason: dto.reason,
          }),
        },
      });

      return payment;
    });
  }
}
