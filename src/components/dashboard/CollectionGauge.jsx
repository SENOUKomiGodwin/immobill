import { Link } from 'react-router-dom';

export default function CollectionGauge({ collection }) {
  const rate = Math.max(0, Math.min(100, collection.rate));
  const target = Math.max(0, Math.min(100, collection.target));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const onTrack = rate >= target;

  return (
    <div className="card-surface flex h-full flex-col p-5">
      <p className="text-[13px] font-medium text-[#5A6472]">Taux de recouvrement</p>

      <div className="relative mx-auto mt-3 flex h-[150px] w-[150px] items-center justify-center">
        <svg viewBox="0 0 130 130" className="h-full w-full -rotate-90">
          <circle cx="65" cy="65" r={radius} fill="none" stroke="#EFF2F7" strokeWidth="11" />
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="#0A24E9"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${(rate / 100) * circumference} ${circumference}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-[30px] font-extrabold leading-none">{rate}%</span>
          <span className="mt-1 text-[11px] font-medium text-muted-foreground">ce mois</span>
        </div>
      </div>

      <p className="mt-1 text-center text-[12px] font-medium text-[#3F7C49]">
        {onTrack ? 'Objectif de recouvrement atteint' : `Objectif de ${target} % à atteindre`}
      </p>

      <Link
        to="/bilans"
        className="mt-4 flex h-10 items-center justify-center rounded-xl border border-[#E4E8EF] text-[12.5px] font-semibold text-foreground transition hover:border-[#0A24E9] hover:text-[#0A24E9]"
      >
        Voir le détail
      </Link>
    </div>
  );
}