import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, FileText, CalendarDays,
  Wallet, AlertTriangle, BarChart3, ChevronDown, LogOut, ShieldCheck,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const MAIN = [
  { label: 'Tableau de bord', path: '/', icon: LayoutDashboard },
  { label: 'Biens', path: '/biens', icon: Building2 },
  { label: 'Locataires', path: '/locataires', icon: Users },
  { label: 'Baux', path: '/baux', icon: FileText },
];

const FINANCE = [
  { label: 'Échéancier', path: '/echeances', icon: CalendarDays },
  { label: 'Paiements', path: '/paiements', icon: Wallet },
  { label: 'Impayés', path: '/impayes', icon: AlertTriangle },
  { label: 'Bilans', path: '/bilans', icon: BarChart3 },
];

const itemClass = ({ isActive }) =>
  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-all ${
    isActive
      ? 'bg-[#EEF1FE] font-semibold text-[#0A24E9]'
      : 'font-medium text-[#5A6472] hover:bg-[#F5F7FA] hover:text-foreground'
  }`;

export default function SidebarNav({ onNavigate }) {
  const [openFinance, setOpenFinance] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const initials = (user?.full_name || user?.email || 'IM')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#0A24E9] text-white">
          <Building2 className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <p className="text-[16px] font-extrabold tracking-[-0.02em]">Immobill</p>
          <p className="text-[11px] font-medium text-muted-foreground">Gestion locative</p>
        </div>
      </div>

      <div className="mx-4 mb-5 rounded-2xl bg-[#F7F8FB] p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B0D17] text-[12px] font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-semibold">{user?.full_name || 'Mon espace'}</p>
            <p className="text-[11px] text-[#5C9764]">Propriétaire</p>
          </div>
          <button
            type="button"
            onClick={() => base44.auth.logout()}
            title="Se déconnecter"
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-white hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {MAIN.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} className={itemClass} onClick={onNavigate}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
            {label}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setOpenFinance((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-[#5A6472] transition-all hover:bg-[#F5F7FA] hover:text-foreground"
        >
          <Wallet className="h-[18px] w-[18px]" strokeWidth={1.9} />
          Finances
          <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openFinance ? 'rotate-180' : ''}`} />
        </button>
        {openFinance && (
          <div className="ml-[26px] space-y-0.5 border-l border-[#E9EDF3] pl-3">
            {FINANCE.map(({ label, path, icon: Icon }) => (
              <NavLink key={path} to={path} className={itemClass} onClick={onNavigate}>
                <Icon className="h-[16px] w-[16px]" strokeWidth={1.9} />
                {label}
              </NavLink>
            ))}
          </div>
        )}

        <NavLink to="/depenses" className={itemClass} onClick={onNavigate}>
          <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.9} />
          Dépenses
        </NavLink>
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-2xl bg-[#0A24E9] p-4 text-white">
          <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="text-[13px] font-bold leading-snug">Vos données sont isolées</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-white/70">
            Chaque propriétaire ne voit que son propre parc.
          </p>
        </div>
      </div>
    </div>
  );
}