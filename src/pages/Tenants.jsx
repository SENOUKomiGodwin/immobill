import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Users } from 'lucide-react';
import { fetchAll } from '@/lib/db';
import { money } from '@/lib/format';
import { btnPrimary, row, tableHead, td, th } from '@/lib/ui';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import TenantFormDialog from '@/components/tenants/TenantFormDialog';

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, tenant: null });

  const load = useCallback(async () => {
    const [tenantList, leaseList] = await Promise.all([
      fetchAll('Tenant', {}, { sort: 'full_name' }),
      fetchAll('Lease', { status: 'Actif' }),
    ]);
    setTenants(tenantList);
    setLeases(leaseList);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const leaseFor = (tenantId) => leases.find((l) => l.tenant_id === tenantId);

  return (
    <div>
      <PageHeader title="Locataires" subtitle="Les personnes qui occupent vos unités et leur bail en cours.">
        <button type="button" className={btnPrimary} onClick={() => setDialog({ open: true, tenant: null })}>
          <Plus className="h-4 w-4" />
          Nouveau locataire
        </button>
      </PageHeader>

      {loading ? (
        <div className="card-surface h-[240px] animate-pulse" />
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun locataire"
          description="Ajoutez un locataire pour pouvoir créer un bail et générer son échéancier de loyers."
          action={
            <button type="button" className={btnPrimary} onClick={() => setDialog({ open: true, tenant: null })}>
              <Plus className="h-4 w-4" />
              Ajouter un locataire
            </button>
          }
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className={tableHead}>
                  <th className={th}>Locataire</th>
                  <th className={th}>Téléphone</th>
                  <th className={th}>Unité</th>
                  <th className={th}>Loyer mensuel</th>
                  <th className={th}>Avance</th>
                  <th className={th}>Bail</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => {
                  const lease = leaseFor(tenant.id);
                  return (
                    <tr key={tenant.id} className={row}>
                      <td className={td}>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF1FE] text-[11px] font-bold text-[#0A24E9]">
                            {(tenant.full_name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-semibold">{tenant.full_name}</p>
                            <p className="text-[11.5px] text-muted-foreground">{tenant.city || tenant.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${td} text-[#5A6472]`}>{tenant.phone || '—'}</td>
                      <td className={`${td} text-[#5A6472]`}>{lease?.unit_label || '—'}</td>
                      <td className={`${td} num font-semibold`}>
                        {lease ? money(lease.rent_amount) : tenant.rent_amount ? money(tenant.rent_amount) : '—'}
                      </td>
                      <td className={`${td} text-[#5A6472]`}>
                        {tenant.advance_amount ? (
                          <>
                            <span className="num font-semibold text-foreground">{tenant.advance_months || 0} mois</span>
                            <span className="num block text-[11.5px] text-muted-foreground">
                              {money(tenant.advance_amount)}
                            </span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={td}>
                        <span
                          className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                            lease ? 'bg-[#EAF6EC] text-[#3F7C49]' : 'bg-[#F2F5FA] text-[#5A6472]'
                          }`}
                        >
                          {lease ? 'Actif' : 'Sans bail'}
                        </span>
                      </td>
                      <td className={`${td} text-right`}>
                        <button
                          type="button"
                          className="rounded-lg border border-[#E4E8EF] p-1.5 text-[#5A6472] transition hover:border-[#0A24E9] hover:text-[#0A24E9]"
                          onClick={() => setDialog({ open: true, tenant })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TenantFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        tenant={dialog.tenant}
        onSaved={load}
      />
    </div>
  );
}