import { Link } from 'react-router-dom';
import { dateFr, money } from '@/lib/format';

const STATUS = {
  Payé: 'bg-[#EAF6EC] text-[#3F7C49]',
  Partiel: 'bg-[#FEF3E6] text-[#B26A16]',
  Retard: 'bg-[#FDECEC] text-[#C63B3F]',
  Attente: 'bg-[#F2F5FA] text-[#5A6472]',
};

export default function RecentPaymentsTable({ payments, title = 'Derniers paiements' }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <p className="text-[15px] font-bold tracking-[-0.01em]">{title}</p>
        <Link to="/paiements" className="text-[12px] font-semibold text-[#0A24E9] hover:underline">
          Voir tout
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-y border-[#EFF2F7] bg-[#FAFBFD] text-[10.5px] uppercase tracking-[0.07em] text-[#98A2B3]">
              <th className="px-5 py-2.5 font-semibold">Locataire</th>
              <th className="px-5 py-2.5 font-semibold">Unité</th>
              <th className="px-5 py-2.5 font-semibold">Date</th>
              <th className="px-5 py-2.5 font-semibold">Moyen</th>
              <th className="px-5 py-2.5 text-right font-semibold">Montant</th>
              <th className="px-5 py-2.5 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-[#F4F6FA] text-[13px] last:border-0 hover:bg-[#FAFBFD]">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF1FE] text-[11px] font-bold text-[#0A24E9]">
                      {p.tenant.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                    </div>
                    <span className="font-semibold">{p.tenant}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-[#5A6472]">{p.unit}</td>
                <td className="px-5 py-3.5 text-[#5A6472]">{dateFr(p.date)}</td>
                <td className="px-5 py-3.5 text-[#5A6472]">{p.method}</td>
                <td className="num px-5 py-3.5 text-right font-bold">{money(p.amount)}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${STATUS[p.status] || STATUS.Attente}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                  Aucun paiement enregistré pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}