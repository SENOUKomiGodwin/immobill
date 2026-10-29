import { money } from '@/lib/format';

export default function ActivityCard({ weekly, title = 'Encaissements de la semaine' }) {
  const max = Math.max(...weekly.map((d) => d.value), 1);
  const best = weekly.reduce((acc, d) => (d.value > acc.value ? d : acc), weekly[0] || { day: '—', value: 0 });

  return (
    <div className="card-surface flex h-full flex-col p-5">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-[#5A6472]">{title}</p>
        <span className="rounded-md bg-[#F2F5FA] px-2 py-0.5 text-[11px] font-semibold text-[#5A6472]">
          {money(weekly.reduce((s, d) => s + d.value, 0))}
        </span>
      </div>
      <p className="num mt-1.5 text-[24px] font-extrabold leading-none">{money(best.value)}</p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">Meilleur jour : {best.day}</p>

      <div className="mt-5 flex flex-1 items-end justify-between gap-2">
        {weekly.map((d) => {
          const active = d.value === best.value && d.value > 0;
          const height = Math.max(8, Math.round((d.value / max) * 104));
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2" title={money(d.value)}>
              <div
                className={`w-full rounded-lg transition-all duration-300 ${
                  active ? 'bg-[#0A24E9]' : 'bg-[#E6EBF4] hover:bg-[#D5DDEC]'
                }`}
                style={{ height: `${height}px` }}
              />
              <span className={`text-[11px] ${active ? 'font-bold text-[#0A24E9]' : 'font-medium text-[#98A2B3]'}`}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}