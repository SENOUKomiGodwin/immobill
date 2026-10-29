import { useCallback, useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/db';
import { dateFr, money } from '@/lib/format';
import { btnPrimary, row, tableHead, td, th } from '@/lib/ui';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import LeaseFormDialog from '@/components/leases/LeaseFormDialog';

export default function Leases() {
  const [leases, setLeases] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const [leaseList, unitList, tenantList, propertyList] = await Promise.all([
      fetchAll('Lease'),
      fetchAll('Unit', {}, { sort: 'label' }),
      fetchAll('Tenant', {}, { sort: 'full_name' }),
      fetchAll('Property', {}, { sort: 'name' }),
    ]);
    setLeases(leaseList);
    setUnits(unitList);
    setTenants(tenantList);
    setProperties(propertyList);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const close = async (lease) => {
    if (!window.confirm(`Clôturer le bail de ${lease.tenant_name} ? L'historique des paiements est conservé.`)) return;
    await base44.entities.Lease.update(lease.id, { status: 'Terminé' });
    await base44.entities.Unit.update(lease.unit_id, { status: 'Libre' });
    load();
  };

  return (
    <div>
      <PageHeader title="Baux" subtitle="Chaque bail génère automatiquement son échéancier de loyers.">
        <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouveau bail
        </button>
      </PageHeader>

      {loading ? (
        <div className="card-surface h-[240px] animate-pulse" />
      ) : leases.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun bail"
          description="Créez un bail pour lier un locataire à une unité libre : les échéances seront générées automatiquement."
          action={
            <button type="button" className={btnPrimary} onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Créer un bail
            </button>
          }
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className={tableHead}>
                  <th className={th}>Locataire</th>
                  <th className={th}>Unité</th>
                  <th className={th}>Période</th>
                  <th className={th}>Loyer + charges</th>
                  <th className={th}>Caution</th>
                  <th className={th}>Statut</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.id} className={row}>
                    <td className={`${td} font-semibold`}>{lease.tenant_name}</td>
                    <td className={`${td} text-[#5A6472]`}>
                      {lease.unit_label}
                      <span className="block text-[11.5px] text-muted-foreground">{lease.property_name}</span>
                    </td>
                    <td className={`${td} text-[#5A6472]`}>
                      {dateFr(lease.start_date)}
                      <span className="block text-[11.5px] text-muted-foreground">
                        {lease.end_date ? `au ${dateFr(lease.end_date)}` : 'sans terme'}
                      </span>
                    </td>
                    <td className={`${td} num font-semibold`}>
                      {money((Number(lease.rent_amount) || 0) + (Number(lease.charges_amount) || 0))}
                    </td>
                    <td className={`${td} num text-[#5A6472]`}>{money(lease.deposit_amount)}</td>
                    <td className={td}>
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          lease.status === 'Actif' ? 'bg-[#EAF6EC] text-[#3F7C49]' : 'bg-[#F2F5FA] text-[#5A6472]'
                        }`}
                      >
                        {lease.status}
                      </span>
                    </td>
                    <td className={`${td} text-right`}>
                      {lease.status === 'Actif' && (
                        <button
                          type="button"
                          className="rounded-lg border border-[#E4E8EF] px-2.5 py-1 text-[11.5px] font-semibold text-[#5A6472] transition hover:border-[#C63B3F] hover:text-[#C63B3F]"
                          onClick={() => close(lease)}
                        >
                          Clôturer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LeaseFormDialog
        open={open}
        onOpenChange={setOpen}
        units={units}
        tenants={tenants}
        properties={properties}
        onSaved={load}
      />
    </div>
  );
}