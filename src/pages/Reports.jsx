import { useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchAll } from '@/lib/db';
import { compactMoney, money, periodLabel } from '@/lib/format';
import { currentPeriod } from '@/lib/rent';
import { btnGhost, row, tableHead, td, th } from '@/lib/ui';
import PageHeader from '@/components/common/PageHeader';
import { getMonthlyReport } from '@/api/reportsClient';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const monthKey = (offset) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function Reports() {
  const [properties, setProperties] = useState([]);
  const [period, setPeriod] = useState(currentPeriod());
  const [selectedProperty, setSelectedProperty] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useBackend, setUseBackend] = useState(false); // Toggle between Base44 and backend

  useEffect(() => {
    fetchAll('Property', {}, { sort: 'name' }).then(setProperties);
  }, []);

  useEffect(() => {
    if (useBackend) {
      setLoading(true);
      getMonthlyReport(period, selectedProperty || undefined)
        .then((data) => {
          setReport({
            revenue: data.revenue,
            spent: data.spent,
            net: data.net,
            expected: data.expected,
            collected: data.collected,
            rate: data.rate,
            activeLeases: data.activeLeases,
            rows: data.byProperty.map((p) => ({
              name: p.name,
              expected: p.expected,
              collected: p.collected,
              expenses: p.expenses,
              net: p.net,
            })),
            series: [5, 4, 3, 2, 1, 0].map((offset) => {
              const key = monthKey(-offset);
              return {
                label: MONTHS[Number(key.slice(5, 7)) - 1],
                revenus: 0, // Would need backend API for series
                depenses: 0,
              };
            }),
          });
          setLoading(false);
        })
        .catch(() => {
          setUseBackend(false);
          setLoading(false);
        });
    }
  }, [period, selectedProperty, useBackend]);

  // Fallback to Base44 if backend not available
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dues, setDues] = useState([]);
  const [leases, setLeases] = useState([]);

  useEffect(() => {
    if (!useBackend) {
      (async () => {
        const [p, e, d, l] = await Promise.all([
          fetchAll('Payment'),
          fetchAll('Expense'),
          fetchAll('RentDue'),
          fetchAll('Lease'),
        ]);
        setPayments(p);
        setExpenses(e);
        setDues(d);
        setLeases(l);
        setLoading(false);
      })();
    }
  }, [useBackend, period, selectedProperty]);

  const base44Report = useMemo(() => {
    if (useBackend) return null;

    const inMonth = (value) => String(value || '').slice(0, 7) === period;
    const propertyFilter = selectedProperty ? (item) => item.property_id === selectedProperty : () => true;

    const filteredPayments = payments.filter(propertyFilter);
    const filteredExpenses = expenses.filter(propertyFilter);
    const filteredDues = dues.filter(propertyFilter);

    const revenue = filteredPayments.filter((p) => inMonth(p.payment_date)).reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const spent = filteredExpenses
      .filter((e) => e.paid && inMonth(e.expense_date))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const periodDues = filteredDues.filter((d) => d.period === period);
    const expected = periodDues.reduce((s, d) => s + (Number(d.amount_due) || 0), 0);
    const collected = periodDues.reduce((s, d) => s + (Number(d.amount_paid) || 0), 0);
    const activeLeases = leases.filter((l) => l.status === 'Actif').length;

    const byProperty = {};
    periodDues.forEach((d) => {
      const key = d.property_name || 'Sans bien';
      byProperty[key] = byProperty[key] || { name: key, expected: 0, collected: 0, expenses: 0 };
      byProperty[key].expected += Number(d.amount_due) || 0;
      byProperty[key].collected += Number(d.amount_paid) || 0;
    });
    filteredExpenses
      .filter((e) => e.paid && inMonth(e.expense_date))
      .forEach((e) => {
        const key = e.property_name || 'Sans bien';
        byProperty[key] = byProperty[key] || { name: key, expected: 0, collected: 0, expenses: 0 };
        byProperty[key].expenses += Number(e.amount) || 0;
      });

    const series = [5, 4, 3, 2, 1, 0].map((offset) => {
      const key = monthKey(-offset);
      return {
        label: MONTHS[Number(key.slice(5, 7)) - 1],
        revenus: filteredPayments.filter((p) => String(p.payment_date || '').slice(0, 7) === key).reduce((s, p) => s + (Number(p.amount) || 0), 0),
        depenses: filteredExpenses
          .filter((e) => e.paid && String(e.expense_date || '').slice(0, 7) === key)
          .reduce((s, e) => s + (Number(e.amount) || 0), 0),
      };
    });

    return {
      revenue,
      spent,
      net: revenue - spent,
      expected,
      collected,
      rate: expected > 0 ? Math.round((collected / expected) * 100) : 0,
      activeLeases,
      rows: Object.values(byProperty).sort((a, b) => b.collected - a.collected),
      series,
    };
  }, [payments, expenses, dues, leases, period, selectedProperty, useBackend]);

  const currentReport = report || base44Report;

  return (
    <div>
      <PageHeader title="Bilans" subtitle="Revenus, dépenses et résultat net de votre parc locatif.">
        <div className="flex items-center gap-2">
          <input type="month" className="field h-10 w-[168px]" value={period} onChange={(e) => setPeriod(e.target.value)} />
          <select className="field h-10 w-[200px]" value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)}>
            <option value="">Tous les biens</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="button" className={btnGhost} onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Exporter en PDF
          </button>
        </div>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Revenus encaissés', value: money(currentReport?.revenue || 0), tone: 'text-[#3F7C49]' },
          { label: 'Dépenses payées', value: money(currentReport?.spent || 0), tone: 'text-[#C63B3F]' },
          { label: 'Résultat net', value: money(currentReport?.net || 0), tone: 'text-foreground' },
          { label: 'Taux de recouvrement', value: `${currentReport?.rate || 0} %`, tone: 'text-[#0A24E9]' },
        ].map((kpi) => (
          <div key={kpi.label} className="card-surface p-4">
            <p className="text-[12px] font-medium text-[#5A6472]">{kpi.label}</p>
            <p className={`num mt-2 text-[18px] font-extrabold leading-none ${kpi.tone}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="card-surface p-5 xl:col-span-7">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-medium text-[#5A6472]">Revenus vs dépenses</p>
            <p className="text-[11.5px] text-muted-foreground">{periodLabel(period)}</p>
          </div>
          <div className="mt-4 h-[240px]">
            {loading ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-[#F4F6FA]" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentReport?.series || []} margin={{ top: 6, right: 4, left: -18, bottom: 0 }} barGap={4}>
                  <CartesianGrid stroke="#EFF2F7" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#98A2B3', fontSize: 11 }} dy={6} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#B4BCC8', fontSize: 10 }}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value) => money(value)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E7EBF1', fontSize: 12 }}
                  />
                  <Bar dataKey="revenus" name="Revenus" fill="#0A24E9" radius={[6, 6, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="depenses" name="Dépenses" fill="#C6D0E6" radius={[6, 6, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card-surface p-5 xl:col-span-5">
          <p className="text-[13px] font-medium text-[#5A6472]">Situation de la période</p>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Loyers attendus', value: money(currentReport?.expected || 0) },
              { label: 'Loyers encaissés', value: money(currentReport?.collected || 0) },
              { label: 'Reste à recouvrer', value: money(Math.max(0, (currentReport?.expected || 0) - (currentReport?.collected || 0))) },
              { label: 'Baux actifs', value: `${currentReport?.activeLeases || 0}` },
            ].map((line) => (
              <div key={line.label} className="flex items-center justify-between border-b border-[#F4F6FA] pb-2.5 last:border-0">
                <span className="text-[12.5px] text-[#5A6472]">{line.label}</span>
                <span className="num text-[13px] font-bold">{line.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-[#F7F8FB] px-3 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Les revenus sont calculés en comptabilité de caisse : un loyer compte dans le mois où il est encaissé. Les
            cautions ne sont jamais comptées comme revenus.
          </p>
        </div>
      </div>

      <div className="card-surface mt-4 overflow-hidden">
        <p className="px-5 pb-3 pt-5 text-[15px] font-bold">Détail par bien — {periodLabel(period)}</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className={tableHead}>
                <th className={th}>Bien</th>
                <th className={th}>Attendu</th>
                <th className={th}>Encaissé</th>
                <th className={th}>Dépenses</th>
                <th className={th}>Net</th>
              </tr>
            </thead>
            <tbody>
              {(currentReport?.rows || []).map((rowItem) => (
                <tr key={rowItem.name} className={row}>
                  <td className={`${td} font-semibold`}>{rowItem.name}</td>
                  <td className={`${td} num text-[#5A6472]`}>{money(rowItem.expected)}</td>
                  <td className={`${td} num text-[#5A6472]`}>{money(rowItem.collected)}</td>
                  <td className={`${td} num text-[#5A6472]`}>{money(rowItem.expenses)}</td>
                  <td className={`${td} num font-bold`}>{compactMoney(rowItem.collected - rowItem.expenses)}</td>
                </tr>
              ))}
              {(currentReport?.rows || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                    Aucune donnée pour cette période.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}