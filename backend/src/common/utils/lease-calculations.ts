/**
 * Fonctions pures pour les calculs de bail et échéances
 * Testables indépendamment de la base de données
 */

export interface LeaseParams {
  start_date: Date;
  end_date?: Date;
  due_day: number;
  rent_amount: number;
  charges_amount: number;
}

export interface RentDue {
  period: string; // Format: YYYY-MM
  due_date: Date;
  amount_due: number;
}

export interface ComputedStatus {
  computed_status: 'Payé' | 'Partiel' | 'Attente' | 'Retard' | 'Annulé';
  days_late: number;
}

/**
 * Calcule le dernier jour du mois pour une date donnée
 * Gère les mois avec moins de jours (ex: février 31 → 28/29)
 */
export function getLastDayOfMonth(year: number, month: number): number {
  const date = new Date(year, month, 0);
  return date.getDate();
}

/**
 * Formate une période en YYYY-MM
 */
export function formatPeriod(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Parse une période YYYY-MM en année et mois
 */
export function parsePeriod(period: string): { year: number; month: number } {
  const [year, month] = period.split('-').map(Number);
  return { year, month };
}

/**
 * Génère les échéances pour un bail
 * Idempotent: mêmes dates pour mêmes paramètres
 */
export function generateRentDues(params: LeaseParams): RentDue[] {
  const { start_date, end_date, due_day, rent_amount, charges_amount } = params;
  const dues: RentDue[] = [];

  const startDate = new Date(start_date);
  const endDate = end_date
    ? new Date(end_date)
    : new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate() - 1);

  let currentYear = startDate.getFullYear();
  let currentMonth = startDate.getMonth() + 1; // JS months are 0-indexed

  while (true) {
    // Calculer la date d'échéance correcte
    const lastDay = getLastDayOfMonth(currentYear, currentMonth);
    const effectiveDueDay = Math.min(due_day, lastDay);
    const dueDate = new Date(currentYear, currentMonth - 1, effectiveDueDay);

    // Vérifier si on dépasse la date de fin
    if (dueDate > endDate) {
      break;
    }

    // Vérifier si on est avant la date de début (première échéance)
    if (dueDate < startDate) {
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
      continue;
    }

    const period = formatPeriod(currentYear, currentMonth);
    const amount_due = rent_amount + charges_amount;

    dues.push({
      period,
      due_date: dueDate,
      amount_due,
    });

    // Passer au mois suivant
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }

    // Limite de sécurité: max 120 échéances (10 ans)
    if (dues.length >= 120) {
      break;
    }
  }

  return dues;
}

/**
 * Calcule le statut calculé d'une échéance
 */
export function computeDueStatus(
  dueDate: Date,
  amountPaid: number,
  amountDue: number,
  graceDays: number = 0,
  isCancelled: boolean = false,
): ComputedStatus {
  if (isCancelled) {
    return { computed_status: 'Annulé', days_late: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDateNormalized = new Date(dueDate);
  dueDateNormalized.setHours(0, 0, 0, 0);

  const daysLate = Math.floor(
    (today.getTime() - dueDateNormalized.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (amountPaid >= amountDue) {
    return { computed_status: 'Payé', days_late: Math.max(0, daysLate) };
  }

  if (amountPaid > 0) {
    return { computed_status: 'Partiel', days_late: Math.max(0, daysLate) };
  }

  if (daysLate > graceDays) {
    return { computed_status: 'Retard', days_late: daysLate };
  }

  return { computed_status: 'Attente', days_late: 0 };
}

/**
 * Calcule le solde restant d'une échéance
 */
export function computeDueBalance(amountDue: number, amountPaid: number): number {
  return Math.max(0, amountDue - amountPaid);
}

/**
 * Vérifie si un paiement dépasse le solde
 */
export function isPaymentExceedingBalance(
  amount: number,
  amountDue: number,
  amountPaid: number,
): boolean {
  const balance = computeDueBalance(amountDue, amountPaid);
  return amount > balance;
}

/**
 * Génère un numéro de quittance
 * Format: Q-AAAA-NNNN
 */
export function generateReceiptNumber(year: number, sequence: number): string {
  return `Q-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Calcule les revenus totaux (règle de caisse)
 * Somme des paiements non annulés par date de paiement
 */
export function computeTotalRevenue(
  payments: Array<{ amount: number; cancelled: boolean; payment_date: Date }>,
): number {
  return payments.filter((p) => !p.cancelled).reduce((sum, p) => sum + p.amount, 0);
}

/**
 * Calcule les dépenses totales (règle de caisse)
 * Somme des dépenses payées non annulées
 */
export function computeTotalExpenses(
  expenses: Array<{ amount: number; cancelled: boolean; paid: boolean }>,
): number {
  return expenses.filter((e) => e.paid && !e.cancelled).reduce((sum, e) => sum + e.amount, 0);
}
