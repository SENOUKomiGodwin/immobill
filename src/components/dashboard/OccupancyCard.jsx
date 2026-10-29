import { number } from '@/lib/format';

export default function OccupancyCard({ occupancy, title = 'Répartition du parc' }) {
  const total = occupancy.reduce((s, o) => s + o.value, 0);

  return (
    <div className="card-surface flex h-full flex-col p-5">
      <p className="text-[13px] font-medium text-[#5A6472]">{title}</p>
      <p className="num mt-1.5 text-[24px] font-extrabold leading-none">{number(total)}</p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">unités louables au total</p>

      <div className="mt-5 space-y-4">
        {occupancy.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="font-medium text-[#5A6472]">{item.label}</span>
              <span className="num font-bold">{item.value}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F4F9]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round((item.value / total) * 100)}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}