import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestWithOwnerFilter } from '../../common/types/express.d';

describe('ReportsService - Reference Test', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  // Fixed test data - represents a controlled scenario
  const MOCK_USER_ID = 'test-user-123';
  const MOCK_PROPERTY_ID = 'property-001';
  const MOCK_PERIOD = '2024-01';
  const MOCK_YEAR = 2024;

  const MOCK_DATA = {
    payments: [
      { id: 'p1', amount: 50000, payment_date: new Date('2024-01-15'), cancelled: false, created_by_id: MOCK_USER_ID, due_id: 'd1', lease_id: 'l1', tenant_id: 't1', tenant_name: 'Test Tenant', unit_label: 'Unit 1', property_name: 'Test Property', period: '2024-01', method: 'ESPACES', reference: null, receipt_number: 'Q-2024-001', note: null, created_date: new Date(), updated_date: new Date() },
      { id: 'p2', amount: 75000, payment_date: new Date('2024-01-20'), cancelled: false, created_by_id: MOCK_USER_ID, due_id: 'd1', lease_id: 'l1', tenant_id: 't1', tenant_name: 'Test Tenant', unit_label: 'Unit 1', property_name: 'Test Property', period: '2024-01', method: 'ESPACES', reference: null, receipt_number: 'Q-2024-002', note: null, created_date: new Date(), updated_date: new Date() },
      { id: 'p3', amount: 30000, payment_date: new Date('2024-02-10'), cancelled: false, created_by_id: MOCK_USER_ID, due_id: 'd2', lease_id: 'l1', tenant_id: 't1', tenant_name: 'Test Tenant', unit_label: 'Unit 1', property_name: 'Test Property', period: '2024-02', method: 'ESPACES', reference: null, receipt_number: 'Q-2024-003', note: null, created_date: new Date(), updated_date: new Date() },
    ],
    expenses: [
      { id: 'e1', amount: 15000, expense_date: new Date('2024-01-10'), paid: true, cancelled: false, created_by_id: MOCK_USER_ID, property_name: 'Test Property', label: 'Test Expense 1', category: 'AUTRE', vendor: null, refacture: false, recovered_amount: 0, receipt_uri: null, note: null, property_id: MOCK_PROPERTY_ID, cancellation_reason: null, created_date: new Date(), updated_date: new Date() },
      { id: 'e2', amount: 25000, expense_date: new Date('2024-01-25'), paid: true, cancelled: false, created_by_id: MOCK_USER_ID, property_name: 'Test Property', label: 'Test Expense 2', category: 'AUTRE', vendor: null, refacture: false, recovered_amount: 0, receipt_uri: null, note: null, property_id: MOCK_PROPERTY_ID, cancellation_reason: null, created_date: new Date(), updated_date: new Date() },
      { id: 'e3', amount: 10000, expense_date: new Date('2024-02-05'), paid: true, cancelled: false, created_by_id: MOCK_USER_ID, property_name: 'Test Property', label: 'Test Expense 3', category: 'AUTRE', vendor: null, refacture: false, recovered_amount: 0, receipt_uri: null, note: null, property_id: MOCK_PROPERTY_ID, cancellation_reason: null, created_date: new Date(), updated_date: new Date() },
    ],
    dues: [
      { id: 'd1', period: '2024-01', amount_due: 100000, amount_paid: 100000, created_by_id: MOCK_USER_ID, property_name: 'Test Property', lease_id: 'l1', tenant_id: 't1', tenant_name: 'Test Tenant', tenant_phone: null, unit_id: 'u1', unit_label: 'Unit 1', property_id: MOCK_PROPERTY_ID, due_date: new Date('2024-01-05'), status: 'PAYE', computed_status: 'paid', days_late: 0, created_date: new Date(), updated_date: new Date() },
      { id: 'd2', period: '2024-02', amount_due: 100000, amount_paid: 30000, created_by_id: MOCK_USER_ID, property_name: 'Test Property', lease_id: 'l1', tenant_id: 't1', tenant_name: 'Test Tenant', tenant_phone: null, unit_id: 'u1', unit_label: 'Unit 1', property_id: MOCK_PROPERTY_ID, due_date: new Date('2024-02-05'), status: 'PARTIEL', computed_status: 'partial', days_late: 0, created_date: new Date(), updated_date: new Date() },
    ],
    leases: [
      { id: 'l1', status: 'ACTIF', created_by_id: MOCK_USER_ID, unit_id: 'u1', unit_label: 'Unit 1', property_id: MOCK_PROPERTY_ID, property_name: 'Test Property', tenant_id: 't1', tenant_name: 'Test Tenant', tenant_phone: null, start_date: new Date('2024-01-01'), end_date: null, rent_amount: 100000, charges_amount: 0, deposit_amount: 0, due_day: 5, grace_days: 0, penalty_enabled: false, notes: null, created_date: new Date(), updated_date: new Date() },
      { id: 'l2', status: 'TERMINE', created_by_id: MOCK_USER_ID, unit_id: 'u2', unit_label: 'Unit 2', property_id: MOCK_PROPERTY_ID, property_name: 'Test Property', tenant_id: 't2', tenant_name: 'Test Tenant 2', tenant_phone: null, start_date: new Date('2023-01-01'), end_date: new Date('2023-12-31'), rent_amount: 100000, charges_amount: 0, deposit_amount: 0, due_day: 5, grace_days: 0, penalty_enabled: false, notes: null, created_date: new Date(), updated_date: new Date() },
    ],
  };

  // Expected results - written as reference values
  const EXPECTED_MONTHLY_REPORT = {
    period: '2024-01',
    revenue: 125000, // 50000 + 75000 (payments in January)
    spent: 40000,    // 15000 + 25000 (paid expenses in January)
    net: 85000,      // 125000 - 40000
    expected: 100000, // amount_due from dues in January
    collected: 100000, // amount_paid from dues in January
    rate: 100,       // (100000 / 100000) * 100
    activeLeases: 1,  // only ACTIF leases
    byProperty: [
      {
        name: 'Test Property',
        expected: 100000,
        collected: 100000,
        expenses: 40000,
        net: 60000, // 100000 - 40000
      },
    ],
  };

  const EXPECTED_ANNUAL_REPORT = {
    year: 2024,
    totalRevenue: 155000, // 50000 + 75000 + 30000 (all payments in 2024)
    totalSpent: 50000,    // 15000 + 25000 + 10000 (all paid expenses in 2024)
    totalNet: 105000,     // 155000 - 50000
    totalExpected: 200000, // 100000 + 100000 (all dues in 2024)
    totalCollected: 130000, // 100000 + 30000 (all amount_paid in 2024)
    averageRate: 65,      // (130000 / 200000) * 100
    byMonth: [
      {
        period: '2024-01',
        revenue: 125000,
        spent: 40000,
        net: 85000,
        expected: 100000,
        collected: 100000,
        rate: 100,
      },
      {
        period: '2024-02',
        revenue: 30000,
        spent: 10000,
        net: 20000,
        expected: 100000,
        collected: 30000,
        rate: 30,
      },
    ],
    byProperty: [
      {
        name: 'Test Property',
        expected: 200000,
        collected: 130000,
        expenses: 50000,
        net: 80000,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: {
            payment: {
              findMany: jest.fn().mockResolvedValue(MOCK_DATA.payments),
            },
            expense: {
              findMany: jest.fn().mockResolvedValue(MOCK_DATA.expenses),
            },
            rentDue: {
              findMany: jest.fn().mockResolvedValue(MOCK_DATA.dues),
            },
            lease: {
              findMany: jest.fn().mockResolvedValue(MOCK_DATA.leases),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  const createMockRequest = (): RequestWithOwnerFilter => ({
    ownerFilter: { created_by_id: MOCK_USER_ID },
  } as any);

  it('should calculate monthly report correctly with fixed data', async () => {
    const request = createMockRequest();

    const result = await service.getMonthlyReport({ period: MOCK_PERIOD }, request);

    // Compare with expected results
    expect(result.period).toBe(EXPECTED_MONTHLY_REPORT.period);
    expect(result.revenue).toBe(EXPECTED_MONTHLY_REPORT.revenue);
    expect(result.spent).toBe(EXPECTED_MONTHLY_REPORT.spent);
    expect(result.net).toBe(EXPECTED_MONTHLY_REPORT.net);
    expect(result.expected).toBe(EXPECTED_MONTHLY_REPORT.expected);
    expect(result.collected).toBe(EXPECTED_MONTHLY_REPORT.collected);
    expect(result.rate).toBe(EXPECTED_MONTHLY_REPORT.rate);
    expect(result.activeLeases).toBe(EXPECTED_MONTHLY_REPORT.activeLeases);
    expect(result.byProperty).toHaveLength(EXPECTED_MONTHLY_REPORT.byProperty.length);
    expect(result.byProperty[0].name).toBe(EXPECTED_MONTHLY_REPORT.byProperty[0].name);
    expect(result.byProperty[0].expected).toBe(EXPECTED_MONTHLY_REPORT.byProperty[0].expected);
    expect(result.byProperty[0].collected).toBe(EXPECTED_MONTHLY_REPORT.byProperty[0].collected);
    expect(result.byProperty[0].expenses).toBe(EXPECTED_MONTHLY_REPORT.byProperty[0].expenses);
    expect(result.byProperty[0].net).toBe(EXPECTED_MONTHLY_REPORT.byProperty[0].net);
  });

  it('should calculate annual report correctly with fixed data', async () => {
    const request = createMockRequest();

    const result = await service.getAnnualReport({ year: MOCK_YEAR }, request);

    // Compare with expected results
    expect(result.year).toBe(EXPECTED_ANNUAL_REPORT.year);
    expect(result.totalRevenue).toBe(EXPECTED_ANNUAL_REPORT.totalRevenue);
    expect(result.totalSpent).toBe(EXPECTED_ANNUAL_REPORT.totalSpent);
    expect(result.totalNet).toBe(EXPECTED_ANNUAL_REPORT.totalNet);
    expect(result.totalExpected).toBe(EXPECTED_ANNUAL_REPORT.totalExpected);
    expect(result.totalCollected).toBe(EXPECTED_ANNUAL_REPORT.totalCollected);
    expect(result.averageRate).toBe(EXPECTED_ANNUAL_REPORT.averageRate);
    expect(result.byMonth).toHaveLength(EXPECTED_ANNUAL_REPORT.byMonth.length);
    expect(result.byProperty).toHaveLength(EXPECTED_ANNUAL_REPORT.byProperty.length);

    // Verify first month
    expect(result.byMonth[0].period).toBe(EXPECTED_ANNUAL_REPORT.byMonth[0].period);
    expect(result.byMonth[0].revenue).toBe(EXPECTED_ANNUAL_REPORT.byMonth[0].revenue);
    expect(result.byMonth[0].spent).toBe(EXPECTED_ANNUAL_REPORT.byMonth[0].spent);
    expect(result.byMonth[0].net).toBe(EXPECTED_ANNUAL_REPORT.byMonth[0].net);
    expect(result.byMonth[0].rate).toBe(EXPECTED_ANNUAL_REPORT.byMonth[0].rate);

    // Verify property breakdown
    expect(result.byProperty[0].name).toBe(EXPECTED_ANNUAL_REPORT.byProperty[0].name);
    expect(result.byProperty[0].expected).toBe(EXPECTED_ANNUAL_REPORT.byProperty[0].expected);
    expect(result.byProperty[0].collected).toBe(EXPECTED_ANNUAL_REPORT.byProperty[0].collected);
    expect(result.byProperty[0].expenses).toBe(EXPECTED_ANNUAL_REPORT.byProperty[0].expenses);
    expect(result.byProperty[0].net).toBe(EXPECTED_ANNUAL_REPORT.byProperty[0].net);
  });

  it('should handle empty data gracefully', async () => {
    // Mock empty data
    jest.spyOn(prisma.payment, 'findMany').mockResolvedValue([]);
    jest.spyOn(prisma.expense, 'findMany').mockResolvedValue([]);
    jest.spyOn(prisma.rentDue, 'findMany').mockResolvedValue([]);
    jest.spyOn(prisma.lease, 'findMany').mockResolvedValue([]);

    const request = createMockRequest();

    const result = await service.getMonthlyReport({ period: MOCK_PERIOD }, request);

    expect(result.revenue).toBe(0);
    expect(result.spent).toBe(0);
    expect(result.net).toBe(0);
    expect(result.expected).toBe(0);
    expect(result.collected).toBe(0);
    expect(result.rate).toBe(0);
    expect(result.activeLeases).toBe(0);
    expect(result.byProperty).toHaveLength(0);
  });
});
