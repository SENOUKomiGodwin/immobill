import type { Lease, NewRecord, RentDue } from '@/types/entities';

export type DueStatus = 'paid' | 'partial' | 'late' | 'pending';

/** Ce dont les calculs de loyer ont besoin d'une échéance. */
type DueAmounts = Partial<Pick<RentDue, 'amount_due' | 'amount_paid'>>;
type DueDates = Pick<RentDue, 'due_date'> & DueAmounts;

export const statusMeta: Record<DueStatus, { label: string; className: string }> = {
  paid: { label: 'Payé', className: 'bg-[#EAF6EC] text-[#3F7C49]' },
  partial: { label: 'Partiel', className: 'bg-[#FEF3E6] text-[#B26A16]' },
  late: { label: 'Retard', className: 'bg-[#FDECEC] text-[#C63B3F]' },
  pending: { label: 'Attente', className: 'bg-[#F2F5FA] text-[#5A6472]' },
};

export const amountPaid = (due?: DueAmounts | null): number => Number(due?.amount_paid) || 0;
export const amountDue = (due?: DueAmounts | null): number => Number(due?.amount_due) || 0;
export const remaining = (due?: DueAmounts | null): number => Math.max(0, amountDue(due) - amountPaid(due));

export function dueStatus(due: DueDates, graceDays: number | string | null = 0): DueStatus {
  if (amountDue(due) > 0 && amountPaid(due) >= amountDue(due)) return 'paid';
  const limit = new Date(due.due_date);
  limit.setDate(limit.getDate() + (Number(graceDays) || 0));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (amountPaid(due) > 0) return limit < today ? 'late' : 'partial';
  if (limit < today) return 'late';
  return 'pending';
}

export function lateDays(due: Pick<RentDue, 'due_date'>, graceDays: number | string | null = 0): number {
  const limit = new Date(due.due_date);
  limit.setDate(limit.getDate() + (Number(graceDays) || 0));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - limit.getTime()) / 86400000));
}

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function buildSchedule(lease: Lease): NewRecord<RentDue>[] {
  const start = new Date(lease.start_date);
  const end = lease.end_date ? new Date(lease.end_date) : null;
  const day = Math.min(28, Math.max(1, Number(lease.due_day) || 1));
  const monthly = Number(lease.rent_amount || 0) + Number(lease.charges_amount || 0);
  const dues: NewRecord<RentDue>[] = [];

  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const guard = new Date(cursor.getFullYear(), cursor.getMonth() + 24, 1);

  while (cursor < guard) {
    const period = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    if (end && cursor > end) break;
    dues.push({
      lease_id: lease.id,
      tenant_id: lease.tenant_id,
      tenant_name: lease.tenant_name,
      tenant_phone: lease.tenant_phone || '',
      unit_id: lease.unit_id,
      unit_label: lease.unit_label,
      property_id: lease.property_id,
      property_name: lease.property_name,
      period,
      due_date: `${period}-${String(day).padStart(2, '0')}`,
      amount_due: monthly,
      amount_paid: 0,
      status: 'Attente',
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return dues;
}

export function receiptNumber(period?: string): string {
  const suffix = String(Math.floor(100 + Math.random() * 900));
  return `Q-${String(period || currentPeriod()).replace('-', '')}-${suffix}`;
}

export function relanceMessage(
  due: Pick<RentDue, 'tenant_name' | 'unit_label' | 'period'> & DueAmounts,
  days: number,
): string {
  return `Bonjour ${due.tenant_name}, votre loyer de ${new Intl.NumberFormat('fr-FR').format(
    remaining(due)
  )} FCFA pour ${due.unit_label} (${due.period}) est en retard de ${days} jour(s). Merci de régulariser. — Immobill`;
}

export function reminderTier(days: number): number {
  if (days >= 15) return 15;
  if (days >= 7) return 7;
  return 1;
}

export function tierLabel(tier: number): string {
  if (tier === 15) return 'J+15';
  if (tier === 7) return 'J+7';
  return 'J+1';
}