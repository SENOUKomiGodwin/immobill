// Client API pour les bilans (backend NestJS)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface MonthlyReport {
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

interface AnnualReport {
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

export async function getMonthlyReport(period?: string, propertyId?: string): Promise<MonthlyReport> {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  if (period) params.append('period', period);
  if (propertyId) params.append('property_id', propertyId);

  const response = await fetch(`${API_BASE_URL}/reports/monthly?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch monthly report');
  }

  return response.json();
}

export async function getAnnualReport(year: number, propertyId?: string): Promise<AnnualReport> {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();
  params.append('year', year.toString());
  if (propertyId) params.append('property_id', propertyId);

  const response = await fetch(`${API_BASE_URL}/reports/annual?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch annual report');
  }

  return response.json();
}
