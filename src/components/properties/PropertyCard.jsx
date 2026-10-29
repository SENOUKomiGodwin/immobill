import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { money } from '@/lib/format';

export default function PropertyCard({ property, units }) {
  const total = units.length;
  const occupied = units.filter((u) => u.status === 'Occupé').length;
  const potential = units.reduce((s, u) => s + (Number(u.rent_amount) || 0) + (Number(u.charges_amount) || 0), 0);
  const rate = total ? Math.round((occupied / total) * 100) : 0;

  return (
    <Link
      to={`/biens/${property.id}`}
      className="card-surface group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(16,24,40,0.05),0_22px_40px_-26px_rgba(16,24,40,0.35)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="inline-flex rounded-md bg-[#EEF1FE] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#0A24E9]">
            {property.type || 'Bien'}
          </span>
          <p className="mt-2 truncate text-[15px] font-bold tracking-[-0.01em]">{property.name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[property.address, property.city].filter(Boolean).join(', ') || 'Adresse non renseignée'}
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4F6FA] text-[#5A6472] transition group-hover:bg-[#0A24E9] group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#FAFBFD] p-3">
        <div>
          <p className="num text-[16px] font-extrabold leading-none">{total}</p>
          <p className="mt-1 text-[10.5px] font-medium text-muted-foreground">Unités</p>
        </div>
        <div>
          <p className="num text-[16px] font-extrabold leading-none">{occupied}</p>
          <p className="mt-1 text-[10.5px] font-medium text-muted-foreground">Occupées</p>
        </div>
        <div>
          <p className="num text-[13px] font-extrabold leading-none">{money(potential)}</p>
          <p className="mt-1 text-[10.5px] font-medium text-muted-foreground">Loyer / mois</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>Taux d'occupation</span>
          <span className="num font-bold text-foreground">{rate}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFF2F7]">
          <div className="h-full rounded-full bg-[#0A24E9]" style={{ width: `${rate}%` }} />
        </div>
      </div>
    </Link>
  );
}