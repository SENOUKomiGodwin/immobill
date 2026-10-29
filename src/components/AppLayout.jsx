import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Bell, Menu, Search, X } from 'lucide-react';
import SidebarNav from '@/components/layout/SidebarNav';

const TITLES = {
  '/': 'Tableau de bord',
  '/biens': 'Biens',
  '/locataires': 'Locataires',
  '/baux': 'Baux',
  '/echeances': 'Échéancier',
  '/paiements': 'Paiements',
  '/impayes': 'Impayés',
  '/bilans': 'Bilans',
  '/depenses': 'Dépenses',
};

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const title = TITLES[pathname] || (pathname.startsWith('/biens/') ? 'Fiche du bien' : 'Immobill');
  const month = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-[#E7EBF1] bg-white lg:block">
        <SidebarNav />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-[#0B0D17]/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-[#F5F7FA]"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-[#E7EBF1]/70 bg-background/85 px-4 backdrop-blur-md lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border border-[#E4E8EF] bg-white p-2 text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-[13px] font-semibold text-muted-foreground">{month}</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/locataires"
              className="hidden items-center gap-2 rounded-xl border border-[#E4E8EF] bg-white px-3 py-2 text-[13px] text-muted-foreground transition hover:border-[#D7DEE9] md:flex"
            >
              <Search className="h-4 w-4" />
              <span className="w-[150px] text-left">Rechercher…</span>
            </Link>
            <Link
              to="/impayes"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E8EF] bg-white text-[#5A6472] transition hover:text-foreground"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#E5484D]" />
            </Link>
            <div className="hidden h-10 items-center gap-2 rounded-xl border border-[#E4E8EF] bg-white pl-1 pr-3 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B0D17] text-[11px] font-bold text-white">
                IM
              </div>
              <span className="text-[12.5px] font-semibold">{title}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-5 lg:px-8 lg:pt-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}