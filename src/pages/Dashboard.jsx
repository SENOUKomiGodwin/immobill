import { Link } from 'react-router-dom';
import { Plus, Wallet } from 'lucide-react';
import useDashboardData from '@/hooks/useDashboardData';
import StatCard from '@/components/dashboard/StatCard';
import RevenueChart from '@/components/dashboard/RevenueChart';
import CollectionGauge from '@/components/dashboard/CollectionGauge';
import ActivityCard from '@/components/dashboard/ActivityCard';
import OccupancyCard from '@/components/dashboard/OccupancyCard';
import OverdueCard from '@/components/dashboard/OverdueCard';
import RecentPaymentsTable from '@/components/dashboard/RecentPaymentsTable';

export default function Dashboard() {
  const data = useDashboardData();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em]">Tableau de bord</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Vue d'ensemble de vos loyers, de vos biens et de vos impayés.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/baux"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-[#E4E8EF] bg-white px-3.5 text-[12.5px] font-semibold transition hover:border-[#D7DEE9]"
          >
            <Plus className="h-4 w-4" />
            Nouveau bail
          </Link>
          <Link
            to="/echeances"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-[#0A24E9] px-3.5 text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(10,36,233,0.9)] transition hover:bg-[#081BBA]"
          >
            <Wallet className="h-4 w-4" />
            Enregistrer un paiement
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <RevenueChart revenue={data.revenue} />
        </div>
        <div className="xl:col-span-4">
          <CollectionGauge collection={data.collection} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActivityCard weekly={data.weekly} />
        <OccupancyCard occupancy={data.occupancy} />
        <OverdueCard overdue={data.overdue} />
      </div>

      <RecentPaymentsTable payments={data.payments} />
    </div>
  );
}