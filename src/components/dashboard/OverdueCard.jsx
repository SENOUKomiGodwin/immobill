import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { money } from '@/lib/format';

export default function OverdueCard({ overdue }) {
  const total = overdue.reduce((s, o) => s + o.amount, 0) || 0;

  return (
    <div className="card-surface flex h-full flex-col p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-[#5A6472]">Impayés à relancer</p>
        <Link to="/impayes" className="text-[11.5px] font-semibold text-[#0A24E9] hover:underline">
          Tout voir
        </Link>
      </div>
      <p className="num mt-1.5 text-[24px] font-extrabold leading-none">{money(total)}</p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">{overdue.length} locataire(s) en retard</p>

      <div className="mt-4 space-y-2.5">
        {overdue.slice(0, 3).map((item) =>
        <Link
          key={item.id}
          to="/impayes"
          className="flex items-center gap-2.5 rounded-xl border border-[#F0F3F8] px-2.5 py-2 transition hover:border-[#DCE3EF] hover:bg-[#FAFBFD]">
          
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FDECEC] text-[11px] font-bold text-[#C63B3F]">
              {item.tenant.split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[12.5px] font-semibold">{item.tenant}</p>
              <p className="truncate text-[11px] text-muted-foreground">{item.days} j de retard</p>
            </div>
            <div className="text-right leading-tight">
              <p className="num text-[12px] font-bold">{money(item.amount)}</p>
            </div>
          </Link>
        )}
        {overdue.length === 0 &&
        <p className="rounded-xl bg-[#EAF6EC] px-3 py-3 text-[12px] font-medium text-[#3F7C49]">Aucun impayé. Tous les loyers sont à jour.

        </p>
        }
      </div>

      <Link
        to="/impayes"
        className="mt-auto flex h-10 items-center justify-center gap-1 rounded-xl bg-[#F2F5FA] text-[12.5px] font-semibold text-foreground transition hover:bg-[#E9EEF8]">
        
        Centre de relances
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>);

}