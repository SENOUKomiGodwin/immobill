import { useEffect, useState } from 'react';
import { fetchAll } from '@/lib/db';
import { currentPeriod, dueStatus, lateDays, remaining } from '@/lib/rent';
import type { RentDue } from '@/types/entities';

export interface DashboardStat {
  label: string;
  value: number;
  delta: number | null;
  previous?: number | null;
  tone: 'money' | 'count';
  hint?: string;
  suffix?: string;
}
export interface RecentPayment {
  id: string;
  tenant: string;
  unit: string;
  amount: number;
  method: string;
  date: string;
  status: 'Payé' | 'Partiel' | 'Retard' | 'Attente';
}
export interface DashboardData {
  stats: DashboardStat[];
  revenue: { total: number; delta: number; previous: number; caption: string; points: { label: string; value: number }[] };
  occupancy: { label: string; value: number; color: string }[];
  weekly: { day: string; value: number }[];
  collection: { rate: number; target: number };
  overdue: { id: string; tenant: string; unit: string; days: number; amount: number }[];
  payments: RecentPayment[];
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const COLORS = ['#0A24E9', '#5C9764', '#F0913A', '#5B8DEF', '#98A2B3', '#8B5CF6'];
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const EMPTY: DashboardData = {
  stats: [
    { label: 'Loyers encaissés', value: 0, delta: null, tone: 'money', hint: 'Aucun encaissement ce mois' },
    { label: 'Impayés', value: 0, delta: null, tone: 'money', hint: 'Aucun retard constaté' },
    { label: 'Unités occupées', value: 0, delta: null, tone: 'count', hint: 'Ajoutez vos unités' },
    { label: 'Locataires actifs', value: 0, delta: null, tone: 'count', hint: 'Aucun bail actif' },
  ],
  revenue: { total: 0, delta: 0, previous: 0, caption: 'Encaissements des 6 derniers mois', points: [] },
  occupancy: [],
  weekly: DAYS.map((day) => ({ day, value: 0 })),
  collection: { rate: 0, target: 80 },
  overdue: [],
  payments: [],
};

const monthKey = (offset: number): string => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const inMonth = (dateStr: string | undefined, period: string): boolean => String(dateStr || '').slice(0, 7) === period;

const sum = <T extends object>(list: T[], field: keyof T): number =>
  list.reduce((s, item) => s + (Number(item[field]) || 0), 0);

export default function useDashboardData() {
  const [data, setData] = useState<DashboardData>(EMPTY);

  useEffect(() => {
    let alive = true;

    (async () => {
      const [payments, dues, units, leases] = await Promise.all([
        fetchAll('Payment'),
        fetchAll('RentDue'),
        fetchAll('Unit'),
        fetchAll('Lease'),
      ]);
      if (!alive) return;

      const period = currentPeriod();
      const prev = monthKey(-1);
      const thisMonth = payments.filter((p) => inMonth(p.payment_date, period));
      const lastMonth = payments.filter((p) => inMonth(p.payment_date, prev));
      const paidNow = sum(thisMonth, 'amount');
      const paidPrev = sum(lastMonth, 'amount');
      const dueNow = dues.filter((d) => d.period === period);
      const expected = sum(dueNow, 'amount_due');
      const collected = sum(dueNow, 'amount_paid');
      const lateDues = dues.filter((d) => remaining(d) > 0 && dueStatus(d, 0) === 'late');
      const occupied = units.filter((u) => u.status === 'Occupé').length;
      const activeLeases = leases.filter((l) => l.status === 'Actif');

      const months = [5, 4, 3, 2, 1, 0].map((offset) => {
        const key = monthKey(-offset);
        return {
          label: MONTHS[Number(key.slice(5, 7)) - 1],
          value: sum(payments.filter((p) => inMonth(p.payment_date, key)), 'amount'),
        };
      });
      const total6 = months.reduce((s, m) => s + m.value, 0);
      const prevMonths = [11, 10, 9, 8, 7, 6].map((offset) => monthKey(-offset));
      const prevTotal = sum(payments.filter((p) => prevMonths.includes(String(p.payment_date || '').slice(0, 7))), 'amount');

      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
      const weekly = DAYS.map((day, index) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + index);
        const iso = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(
          dayDate.getDate(),
        ).padStart(2, '0')}`;
        return { day, value: sum(payments.filter((p) => p.payment_date === iso), 'amount') };
      });

      const typeTotals = units.reduce<Record<string, number>>((acc, unit) => {
        const key = unit.type || 'Autre';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      const occupancy = Object.keys(typeTotals).map((label, index) => ({
        label,
        value: typeTotals[label],
        color: COLORS[index % COLORS.length],
      }));

      const dueMap: Record<string, RentDue> = {};
      dues.forEach((d) => {
        dueMap[d.id] = d;
      });

      const recent = [...payments]
        .sort((a, b) => String(b.payment_date).localeCompare(String(a.payment_date)))
        .slice(0, 4)
        .map((p): RecentPayment => {
          const due = dueMap[p.due_id];
          const status = due ? dueStatus(due, 0) : 'paid';
          return {
            id: p.id,
            tenant: p.tenant_name || '—',
            unit: p.unit_label || '—',
            amount: Number(p.amount) || 0,
            method: p.method || '—',
            date: p.payment_date,
            status: status === 'paid' ? 'Payé' : status === 'partial' ? 'Partiel' : status === 'late' ? 'Retard' : 'Attente',
          };
        });

      setData({
        stats: [
          {
            label: 'Loyers encaissés',
            value: paidNow,
            delta: paidPrev > 0 ? Math.round(((paidNow - paidPrev) / paidPrev) * 1000) / 10 : null,
            previous: paidPrev > 0 ? paidPrev : null,
            tone: 'money',
            hint: 'Aucun encaissement le mois dernier',
          },
          {
            label: 'Impayés',
            value: lateDues.reduce((s, d) => s + remaining(d), 0),
            delta: null,
            tone: 'money',
            hint: `${lateDues.length} échéance(s) en retard`,
          },
          {
            label: 'Unités occupées',
            value: occupied,
            delta: null,
            tone: 'count',
            suffix: `/ ${units.length}`,
            hint: `${units.length - occupied} unité(s) libre(s)`,
          },
          {
            label: 'Locataires actifs',
            value: activeLeases.length,
            delta: null,
            tone: 'count',
            hint: `${leases.length} bail(aux) enregistré(s)`,
          },
        ],
        revenue: {
          total: total6,
          delta: prevTotal > 0 ? Math.round(((total6 - prevTotal) / prevTotal) * 1000) / 10 : 0,
          previous: prevTotal,
          caption: 'Encaissements des 6 derniers mois',
          points: months,
        },
        occupancy,
        weekly,
        collection: { rate: expected > 0 ? Math.round((collected / expected) * 100) : 0, target: 80 },
        overdue: [...lateDues]
          .sort((a, b) => remaining(b) - remaining(a))
          .slice(0, 3)
          .map((d) => ({
            id: d.id,
            tenant: d.tenant_name || '—',
            unit: `${d.unit_label || ''} · ${d.property_name || ''}`,
            days: lateDays(d, 0),
            amount: remaining(d),
          })),
        payments: recent,
      });
    })().catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  return data;
}