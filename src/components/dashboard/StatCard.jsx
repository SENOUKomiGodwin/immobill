import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { money, number, pctLabel } from '@/lib/format';

export default function StatCard({ label, value, delta, previous, tone = 'money', suffix, invert = false, hint }) {
  const hasDelta = delta !== null && delta !== undefined;
  const good = invert ? delta <= 0 : delta >= 0;
  const Icon = delta >= 0 ? ArrowUpRight : ArrowDownRight;
  const display = tone === 'money' ? money(value) : number(value);
  const previousLabel =
    previous == null ? null : tone === 'money' ? money(previous) : `${number(previous)}${suffix || ''}`;

  return (
    <div className="card-surface p-5 transition-shadow hover:shadow-[0_2px_4px_rgba(16,24,40,0.05),0_18px_36px_-24px_rgba(16,24,40,0.28)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-[#5A6472]">{label}</p>
        {suffix && <span className="num text-[11px] font-semibold text-[#A9B2BF]">{suffix}</span>}
      </div>
      <p className="num mt-2.5 text-[27px] font-extrabold leading-none">{display}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {hasDelta ? (
          <>
            <span
              className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11.5px] font-bold ${
                good ? 'bg-[#EAF6EC] text-[#3F7C49]' : 'bg-[#FDECEC] text-[#C63B3F]'
              }`}
            >
              <Icon className="h-3 w-3" strokeWidth={2.6} />
              {pctLabel(delta)}
            </span>
            {previousLabel && <span className="text-[11.5px] text-muted-foreground">vs. {previousLabel}</span>}
          </>
        ) : (
          <span className="text-[11.5px] text-muted-foreground">{hint || 'Sur la période en cours'}</span>
        )}
      </div>
    </div>
  );
}