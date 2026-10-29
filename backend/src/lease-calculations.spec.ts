import {
  getLastDayOfMonth,
  formatPeriod,
  parsePeriod,
  generateRentDues,
  computeDueStatus,
  computeDueBalance,
  isPaymentExceedingBalance,
  generateReceiptNumber,
  computeTotalRevenue,
  computeTotalExpenses,
} from '../src/common/utils/lease-calculations';

describe('Lease Calculations - Pure Functions', () => {
  describe('getLastDayOfMonth', () => {
    it('should return 31 for January', () => {
      expect(getLastDayOfMonth(2024, 1)).toBe(31);
    });

    it('should return 28 for February 2024 (non-leap)', () => {
      expect(getLastDayOfMonth(2024, 2)).toBe(29); // 2024 is leap year
    });

    it('should return 28 for February 2023 (non-leap)', () => {
      expect(getLastDayOfMonth(2023, 2)).toBe(28);
    });

    it('should return 30 for April', () => {
      expect(getLastDayOfMonth(2024, 4)).toBe(30);
    });

    it('should return 31 for December', () => {
      expect(getLastDayOfMonth(2024, 12)).toBe(31);
    });
  });

  describe('formatPeriod', () => {
    it('should format January 2024 as 2024-01', () => {
      expect(formatPeriod(2024, 1)).toBe('2024-01');
    });

    it('should format December 2024 as 2024-12', () => {
      expect(formatPeriod(2024, 12)).toBe('2024-12');
    });

    it('should pad single-digit months', () => {
      expect(formatPeriod(2024, 5)).toBe('2024-05');
    });
  });

  describe('parsePeriod', () => {
    it('should parse 2024-01 correctly', () => {
      expect(parsePeriod('2024-01')).toEqual({ year: 2024, month: 1 });
    });

    it('should parse 2024-12 correctly', () => {
      expect(parsePeriod('2024-12')).toEqual({ year: 2024, month: 12 });
    });
  });

  describe('generateRentDues', () => {
    it('should generate 12 monthly dues for a 1-year lease', () => {
      const params = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        due_day: 5,
        rent_amount: 50000,
        charges_amount: 5000,
      };

      const dues = generateRentDues(params);

      expect(dues).toHaveLength(12);
      expect(dues[0].period).toBe('2024-01');
      expect(dues[0].amount_due).toBe(55000);
      expect(dues[11].period).toBe('2024-12');
    });

    it('should cap due_day to last day of month', () => {
      const params = {
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-29'),
        due_day: 31, // February never has 31 days
        rent_amount: 50000,
        charges_amount: 5000,
      };

      const dues = generateRentDues(params);

      expect(dues).toHaveLength(1);
      expect(dues[0].due_date.getDate()).toBe(29); // 2024 is leap year
    });

    it('should handle leap year February correctly', () => {
      const params = {
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-29'),
        due_day: 29,
        rent_amount: 50000,
        charges_amount: 5000,
      };

      const dues = generateRentDues(params);

      expect(dues).toHaveLength(1);
      expect(dues[0].due_date.getDate()).toBe(29);
    });

    it('should be idempotent', () => {
      const params = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        due_day: 5,
        rent_amount: 50000,
        charges_amount: 5000,
      };

      const dues1 = generateRentDues(params);
      const dues2 = generateRentDues(params);

      expect(dues1).toEqual(dues2);
    });

    it('should handle leases without end_date (default 1 year)', () => {
      const params = {
        start_date: new Date('2024-01-01'),
        due_day: 5,
        rent_amount: 50000,
        charges_amount: 5000,
      };

      const dues = generateRentDues(params);

      expect(dues).toHaveLength(12);
    });

    it('should limit to 120 dues (10 years)', () => {
      const params = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2035-01-01'),
        due_day: 5,
        rent_amount: 50000,
        charges_amount: 5000,
      };

      const dues = generateRentDues(params);

      expect(dues.length).toBeLessThanOrEqual(120);
    });
  });

  describe('computeDueStatus', () => {
    it('should return Payé when fully paid', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5); // 5 days ago
      const result = computeDueStatus(dueDate, 55000, 55000);

      expect(result).toEqual({ computed_status: 'Payé', days_late: 5 });
    });

    it('should return Payé with 0 days_late when paid on time', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5); // 5 days in future
      const result = computeDueStatus(dueDate, 55000, 55000);

      expect(result).toEqual({ computed_status: 'Payé', days_late: 0 });
    });

    it('should return Partiel when partially paid', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 5); // 5 days ago
      const result = computeDueStatus(dueDate, 30000, 55000);

      expect(result).toEqual({ computed_status: 'Partiel', days_late: 5 });
    });

    it('should return Attente when not paid and within grace period', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5); // 5 days in future
      const result = computeDueStatus(dueDate, 0, 55000, 7);

      expect(result).toEqual({ computed_status: 'Attente', days_late: 0 });
    });

    it('should return Retard when not paid and past grace period', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 10); // 10 days ago
      const result = computeDueStatus(dueDate, 0, 55000, 7);

      expect(result).toEqual({ computed_status: 'Retard', days_late: 10 });
    });

    it('should return Annulé when cancelled', () => {
      const dueDate = new Date('2024-01-15');
      const result = computeDueStatus(dueDate, 0, 55000, 0, true);

      expect(result).toEqual({ computed_status: 'Annulé', days_late: 0 });
    });

    it('should calculate days_late correctly for paid dues', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 10); // 10 days ago
      const result = computeDueStatus(dueDate, 55000, 55000);

      expect(result).toEqual({ computed_status: 'Payé', days_late: 10 });
    });
  });

  describe('computeDueBalance', () => {
    it('should return remaining balance', () => {
      expect(computeDueBalance(55000, 30000)).toBe(25000);
    });

    it('should return 0 when fully paid', () => {
      expect(computeDueBalance(55000, 55000)).toBe(0);
    });

    it('should return full amount when nothing paid', () => {
      expect(computeDueBalance(55000, 0)).toBe(55000);
    });

    it('should not return negative balance', () => {
      expect(computeDueBalance(55000, 60000)).toBe(0);
    });
  });

  describe('isPaymentExceedingBalance', () => {
    it('should return false when payment equals balance', () => {
      expect(isPaymentExceedingBalance(25000, 55000, 30000)).toBe(false);
    });

    it('should return false when payment is less than balance', () => {
      expect(isPaymentExceedingBalance(20000, 55000, 30000)).toBe(false);
    });

    it('should return true when payment exceeds balance', () => {
      expect(isPaymentExceedingBalance(30000, 55000, 30000)).toBe(true);
    });

    it('should return false when nothing paid yet', () => {
      expect(isPaymentExceedingBalance(50000, 55000, 0)).toBe(false);
    });

    it('should return true when payment exceeds full amount', () => {
      expect(isPaymentExceedingBalance(60000, 55000, 0)).toBe(true);
    });
  });

  describe('generateReceiptNumber', () => {
    it('should generate correct format', () => {
      expect(generateReceiptNumber(2024, 1)).toBe('Q-2024-0001');
    });

    it('should pad sequence to 4 digits', () => {
      expect(generateReceiptNumber(2024, 123)).toBe('Q-2024-0123');
    });

    it('should handle large sequence numbers', () => {
      expect(generateReceiptNumber(2024, 9999)).toBe('Q-2024-9999');
    });
  });

  describe('computeTotalRevenue', () => {
    it('should sum non-cancelled payments', () => {
      const payments = [
        { amount: 50000, cancelled: false, payment_date: new Date('2024-01-15') },
        { amount: 30000, cancelled: false, payment_date: new Date('2024-02-15') },
        { amount: 20000, cancelled: true, payment_date: new Date('2024-03-15') },
      ];

      expect(computeTotalRevenue(payments)).toBe(80000);
    });

    it('should return 0 when no payments', () => {
      expect(computeTotalRevenue([])).toBe(0);
    });

    it('should return 0 when all payments cancelled', () => {
      const payments = [
        { amount: 50000, cancelled: true, payment_date: new Date('2024-01-15') },
        { amount: 30000, cancelled: true, payment_date: new Date('2024-02-15') },
      ];

      expect(computeTotalRevenue(payments)).toBe(0);
    });
  });

  describe('computeTotalExpenses', () => {
    it('should sum paid non-cancelled expenses', () => {
      const expenses = [
        { amount: 10000, cancelled: false, paid: true },
        { amount: 5000, cancelled: false, paid: true },
        { amount: 3000, cancelled: false, paid: false },
        { amount: 2000, cancelled: true, paid: true },
      ];

      expect(computeTotalExpenses(expenses)).toBe(15000);
    });

    it('should return 0 when no expenses', () => {
      expect(computeTotalExpenses([])).toBe(0);
    });

    it('should exclude unpaid expenses', () => {
      const expenses = [
        { amount: 10000, cancelled: false, paid: false },
        { amount: 5000, cancelled: false, paid: false },
      ];

      expect(computeTotalExpenses(expenses)).toBe(0);
    });
  });
});
