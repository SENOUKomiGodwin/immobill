import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Wallet } from 'lucide-react';
import { fetchAll } from '@/lib/db';
import { currentPeriod, dueStatus, lateDays, remaining } from '@/lib/rent';
import { money, periodLabel } from '@/lib/format';
import { btnGhost, row, tableHead, td, th } from '@/lib/ui';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import StatusPill from '@/components/common/StatusPill';
import PaymentDialog from '@/components/payments/PaymentDialog';

export default function RentSchedule() {
  const [dues, setDues] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(currentPeriod());
  const [showAll, setShowAll] = useState(false);
  const [target, setTarget] = useState(null);

  const load = useCallback(async () => {
    const [dueList, leaseList] = await Promise.all([fetchAll('RentDue'), fetchAll('Lease')]);
    setDues(dueList);
    setLeases(leaseList);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const graceFor = (leaseId) => Number(leases.find((l) => l.id === leaseId)?.grace_days) || 0;

  const visible = useMemo(() => {
    const list = showAll ? dues : dues.filter((d) => d.period === period);
    const order = { late: 0, partial: 1, pending: 2, paid: 3 };
    return [...list].sort(
      (a, b) =>
        (order[dueStatus(a, graceFor(a.lease_id))] ?? 9) - (order[dueStatus(b, graceFor(b.lease_id))] ?? 9) ||
        String(a.due_date).localeCompare(String(b.due_date))
    );
  }, [dues, leases, period, showAll]);

  const totalDue = visible.reduce((s, d) => s + (Number(d.amount_due) || 0), 0);
  const totalPaid = visible.reduce((s, d) => s + (Number(d.amount_paid) || 0), 0);

  return (
    <div>
      <PageHeader title="Échéancier" subtitle="Les loyers attendus, votre encaissement et les retards en cours.">
        <input
          type="month"
          className="field h-10 w-[168px]"
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setShowAll(false);
          }}
        />
        <button
          type="button"
          className={showAll ? btnGhost + ' border-[#0A24E9] text-[#0A24E9]' : btnGhost}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Période sélectionnée' : 'Toutes les périodes'}
        </button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-[12px] font-medium text-[#5A6472]">Attendu</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none">{money(totalDue)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-[12px] font-medium text-[#5A6472]">Encaissé</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none text-[#3F7C49]">{money(totalPaid)}</p>
        </div>
        <div className="card-surface col-span-2 p-4 lg:col-span-1">
          <p className="text-[12px] font-medium text-[#5A6472]">Reste à encaisser</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none text-[#C63B3F]">
            {money(Math.max(0, totalDue - totalPaid))}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card-surface h-[280px] animate-pulse" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aucune échéance sur cette période"
          description="Créez un bail pour générer automatiquement l'échéancier des loyers."
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className={tableHead}>
                  <th className={th}>Locataire</th>
                  <th className={th}>Unité</th>
                  <th className={th}>Période</th>
                  <th className={th}>Limite</th>
                  <th className={th}>Dû</th>
                  <th className={th}>Payé</th>
                  <th className={th}>Reste</th>
                  <th className={th}>Statut</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {visible.map((due) => {
                  const grace = graceFor(due.lease_id);
                  const status = dueStatus(due, grace);
                  const rest = remaining(due);
                  return (
                    <tr key={due.id} className={row}>
                      <td className={`${td} font-semibold`}>{due.tenant_name}</td>
                      <td className={`${td} text-[#5A6472]`}>
                        {due.unit_label}
                        <span className="block text-[11.5px] text-muted-foreground">{due.property_name}</span>
                      </td>
                      <td className={`${td} text-[#5A6472]`}>{periodLabel(due.period)}</td>
                      <td className={`${td} text-[#5A6472]`}>
                        {due.due_date}
                        {status === 'late' && (
                          <span className="block text-[11px] font-semibold text-[#C63B3F]">
                            {lateDays(due, grace)} j de retard
                          </span>
                        )}
                      </td>
                      <td className={`${td} num font-semibold`}>{money(due.amount_due)}</td>
                      <td className={`${td} num text-[#5A6472]`}>{money(due.amount_paid)}</td>
                      <td className={`${td} num font-bold`}>{rest > 0 ? money(rest) : '—'}</td>
                      <td className={td}>
                        <StatusPill status={status} />
                      </td>
                      <td className={`${td} text-right`}>
                        {rest > 0 ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg bg-[#0A24E9] px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition hover:bg-[#081BBA]"
                            onClick={() => setTarget(due)}
                          >
                            <Wallet className="h-3.5 w-3.5" />
                            Encaisser
                          </button>
                        ) : (
                          <span className="text-[11.5px] font-medium text-[#98A2B3]">Soldé</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaymentDialog
        due={target}
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        onSaved={load}
      />
    </div>
  );
}