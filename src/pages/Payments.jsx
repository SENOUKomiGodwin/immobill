import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt as ReceiptIcon, Lock } from 'lucide-react';
import { fetchAll } from '@/lib/db';
import { dateFr, money, periodLabel } from '@/lib/format';
import { row, tableHead, td, th } from '@/lib/ui';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { remaining } from '@/lib/rent';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [dues, setDues] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [paymentList, dueList] = await Promise.all([fetchAll('Payment'), fetchAll('RentDue')]);
      setPayments(paymentList.sort((a, b) => String(b.payment_date).localeCompare(String(a.payment_date))));
      // Index dues by id for quick lookup
      const duesById = {};
      dueList.forEach((d) => {
        duesById[d.id] = d;
      });
      setDues(duesById);
      setLoading(false);
    })();
  }, []);

  const total = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div>
      <PageHeader title="Paiements" subtitle="Tous les encaissements enregistrés et leurs quittances." />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-[12px] font-medium text-[#5A6472]">Total encaissé</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none">{money(total)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-[12px] font-medium text-[#5A6472]">Paiements</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none">{payments.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="card-surface h-[240px] animate-pulse" />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={ReceiptIcon}
          title="Aucun paiement"
          description="Encaissez un loyer depuis l'échéancier : la quittance sera créée automatiquement."
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className={tableHead}>
                  <th className={th}>Quittance</th>
                  <th className={th}>Locataire</th>
                  <th className={th}>Unité</th>
                  <th className={th}>Période</th>
                  <th className={th}>Date</th>
                  <th className={th}>Moyen</th>
                  <th className={th}>Montant</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const due = dues[p.due_id];
                  const isFullyPaid = due && remaining(due) <= 0;
                  return (
                    <tr key={p.id} className={row}>
                      <td className={`${td} font-semibold`}>{p.receipt_number || '—'}</td>
                      <td className={`${td} text-[#5A6472]`}>{p.tenant_name}</td>
                      <td className={`${td} text-[#5A6472]`}>{p.unit_label}</td>
                      <td className={`${td} text-[#5A6472]`}>{periodLabel(p.period)}</td>
                      <td className={`${td} text-[#5A6472]`}>{dateFr(p.payment_date)}</td>
                      <td className={`${td} text-[#5A6472]`}>{p.method}</td>
                      <td className={`${td} num font-bold`}>{money(p.amount)}</td>
                      <td className={`${td} text-right`}>
                        {isFullyPaid ? (
                          <Link
                            to={`/quittances/${p.id}`}
                            className="rounded-lg border border-[#E4E8EF] px-2.5 py-1 text-[11.5px] font-semibold text-[#0A24E9] transition hover:border-[#0A24E9]"
                          >
                            Quittance
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-[#E4E8EF] px-2.5 py-1 text-[11.5px] font-semibold text-[#98A2B3]">
                            <Lock className="h-3 w-3" />
                            Non soldé
                          </span>
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
    </div>
  );
}