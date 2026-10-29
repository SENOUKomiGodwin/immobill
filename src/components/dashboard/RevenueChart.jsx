import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { money, number, pctLabel } from '@/lib/format';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#E7EBF1] bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="num text-[13px] font-bold">{money(payload[0].value)}</p>
    </div>
  );
}

export default function RevenueChart({ revenue }) {
  return (
    <div className="card-surface flex h-full flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#5A6472]">Revenus locatifs</p>
          <p className="num mt-1.5 text-[32px] font-extrabold leading-none">{money(revenue.total)}</p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-[#EAF6EC] px-1.5 py-0.5 text-[11.5px] font-bold text-[#3F7C49]">
              <ArrowUpRight className="h-3 w-3" strokeWidth={2.6} />
              {pctLabel(revenue.delta)}
            </span>
            <span className="text-[11.5px] text-muted-foreground">vs. {money(revenue.previous)}</span>
          </div>
        </div>
        <p className="text-[11.5px] text-muted-foreground">{revenue.caption}</p>
      </div>

      <div className="mt-4 h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenue.points} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0A24E9" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#0A24E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#EFF2F7" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#98A2B3', fontSize: 11, fontWeight: 500 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={74}
              tick={{ fill: '#B4BCC8', fontSize: 10 }}
              tickFormatter={(v) => number(v)}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#C9D2E3', strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0A24E9"
              strokeWidth={2.4}
              fill="url(#revGradient)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#0A24E9' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}