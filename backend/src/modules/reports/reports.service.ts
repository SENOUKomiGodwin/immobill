import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MonthlyReportDto, AnnualReportDto } from './dto/report.dto';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

export interface MonthlyReport {
  period: string;
  revenue: number;
  spent: number;
  net: number;
  expected: number;
  collected: number;
  rate: number;
  activeLeases: number;
  byProperty: Array<{
    name: string;
    expected: number;
    collected: number;
    expenses: number;
    net: number;
  }>;
}

export interface AnnualReport {
  year: number;
  totalRevenue: number;
  totalSpent: number;
  totalNet: number;
  totalExpected: number;
  totalCollected: number;
  averageRate: number;
  byMonth: Array<{
    period: string;
    revenue: number;
    spent: number;
    net: number;
    expected: number;
    collected: number;
    rate: number;
  }>;
  byProperty: Array<{
    name: string;
    expected: number;
    collected: number;
    expenses: number;
    net: number;
  }>;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyReport(dto: MonthlyReportDto, request: RequestWithOwnerFilter): Promise<MonthlyReport> {
    const period = dto.period || this.currentPeriod();
    const ownerFilter = request.ownerFilter || {};
    const userId = (ownerFilter.created_by_id as string) || '';

    // Get all relevant data with property filter
    const propertyWhere = dto.property_id ? { property_id: dto.property_id } : {};

    const [payments, expenses, dues, leases] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          cancelled: false,
          created_by_id: userId,
          ...propertyWhere,
        },
      }),
      this.prisma.expense.findMany({
        where: {
          paid: true,
          cancelled: false,
          created_by_id: userId,
          ...propertyWhere,
        },
      }),
      this.prisma.rentDue.findMany({
        where: {
          created_by_id: userId,
          ...propertyWhere,
        },
      }),
      this.prisma.lease.findMany({
        where: {
          created_by_id: userId,
        },
      }),
    ]);

    // Filter by period in application logic
    const inPeriod = (dateStr: string | Date | null | undefined) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === period;
    };

    const monthPayments = payments.filter((p) => inPeriod(p.payment_date));
    const monthExpenses = expenses.filter((e) => inPeriod(e.expense_date));
    const monthDues = dues.filter((d) => d.period === period);

    // Calculate totals
    const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const expected = monthDues.reduce((sum, d) => sum + d.amount_due, 0);
    const collected = monthDues.reduce((sum, d) => sum + d.amount_paid, 0);
    const activeLeases = leases.filter((l) => l.status === 'ACTIF').length;

    // Group by property
    const byPropertyMap = new Map<string, { expected: number; collected: number; expenses: number }>();
    monthDues.forEach((d) => {
      const key = d.property_name || 'Sans bien';
      const existing = byPropertyMap.get(key) || { expected: 0, collected: 0, expenses: 0 };
      existing.expected += d.amount_due;
      existing.collected += d.amount_paid;
      byPropertyMap.set(key, existing);
    });

    monthExpenses.forEach((e) => {
      const key = e.property_name || 'Sans bien';
      const existing = byPropertyMap.get(key) || { expected: 0, collected: 0, expenses: 0 };
      existing.expenses += e.amount;
      byPropertyMap.set(key, existing);
    });

    const byProperty = Array.from(byPropertyMap.entries()).map(([name, data]) => ({
      name,
      expected: data.expected,
      collected: data.collected,
      expenses: data.expenses,
      net: data.collected - data.expenses,
    })).sort((a, b) => b.collected - a.collected);

    return {
      period,
      revenue,
      spent,
      net: revenue - spent,
      expected,
      collected,
      rate: expected > 0 ? Math.round((collected / expected) * 100) : 0,
      activeLeases,
      byProperty,
    };
  }

  async getAnnualReport(dto: AnnualReportDto, request: RequestWithOwnerFilter): Promise<AnnualReport> {
    const ownerFilter = request.ownerFilter || {};
    const yearStr = dto.year.toString();
    const userId = (ownerFilter.created_by_id as string) || '';

    const propertyWhere = dto.property_id ? { property_id: dto.property_id } : {};

    const [payments, expenses, dues] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          cancelled: false,
          created_by_id: userId,
          ...propertyWhere,
        },
      }),
      this.prisma.expense.findMany({
        where: {
          paid: true,
          cancelled: false,
          created_by_id: userId,
          ...propertyWhere,
        },
      }),
      this.prisma.rentDue.findMany({
        where: {
          created_by_id: userId,
          ...propertyWhere,
        },
      }),
    ]);

    // Filter by year
    const inYear = (dateStr: string | Date | null | undefined) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === dto.year;
    };

    const yearPayments = payments.filter((p) => inYear(p.payment_date));
    const yearExpenses = expenses.filter((e) => inYear(e.expense_date));
    const yearDues = dues.filter((d) => d.period.startsWith(yearStr));

    // Calculate totals
    const totalRevenue = yearPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalSpent = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpected = yearDues.reduce((sum, d) => sum + d.amount_due, 0);
    const totalCollected = yearDues.reduce((sum, d) => sum + d.amount_paid, 0);

    // Group by month
    const byMonthMap = new Map<string, { revenue: number; spent: number; expected: number; collected: number }>();
    yearDues.forEach((d) => {
      const existing = byMonthMap.get(d.period) || { revenue: 0, spent: 0, expected: 0, collected: 0 };
      existing.expected += d.amount_due;
      existing.collected += d.amount_paid;
      byMonthMap.set(d.period, existing);
    });

    yearPayments.forEach((p) => {
      const period = `${new Date(p.payment_date).getFullYear()}-${String(new Date(p.payment_date).getMonth() + 1).padStart(2, '0')}`;
      const existing = byMonthMap.get(period) || { revenue: 0, spent: 0, expected: 0, collected: 0 };
      existing.revenue += p.amount;
      byMonthMap.set(period, existing);
    });

    yearExpenses.forEach((e) => {
      const period = `${new Date(e.expense_date).getFullYear()}-${String(new Date(e.expense_date).getMonth() + 1).padStart(2, '0')}`;
      const existing = byMonthMap.get(period) || { revenue: 0, spent: 0, expected: 0, collected: 0 };
      existing.spent += e.amount;
      byMonthMap.set(period, existing);
    });

    const byMonth = Array.from(byMonthMap.entries())
      .map(([period, data]) => ({
        period,
        revenue: data.revenue,
        spent: data.spent,
        net: data.revenue - data.spent,
        expected: data.expected,
        collected: data.collected,
        rate: data.expected > 0 ? Math.round((data.collected / data.expected) * 100) : 0,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Group by property
    const byPropertyMap = new Map<string, { expected: number; collected: number; expenses: number }>();
    yearDues.forEach((d) => {
      const key = d.property_name || 'Sans bien';
      const existing = byPropertyMap.get(key) || { expected: 0, collected: 0, expenses: 0 };
      existing.expected += d.amount_due;
      existing.collected += d.amount_paid;
      byPropertyMap.set(key, existing);
    });

    yearExpenses.forEach((e) => {
      const key = e.property_name || 'Sans bien';
      const existing = byPropertyMap.get(key) || { expected: 0, collected: 0, expenses: 0 };
      existing.expenses += e.amount;
      byPropertyMap.set(key, existing);
    });

    const byProperty = Array.from(byPropertyMap.entries()).map(([name, data]) => ({
      name,
      expected: data.expected,
      collected: data.collected,
      expenses: data.expenses,
      net: data.collected - data.expenses,
    })).sort((a, b) => b.collected - a.collected);

    return {
      year: dto.year,
      totalRevenue,
      totalSpent,
      totalNet: totalRevenue - totalSpent,
      totalExpected,
      totalCollected,
      averageRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
      byMonth,
      byProperty,
    };
  }

  private currentPeriod(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
