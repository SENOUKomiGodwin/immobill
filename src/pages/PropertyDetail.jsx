import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/db';
import { money } from '@/lib/format';
import { btnGhost, btnPrimary, row, tableHead, td, th } from '@/lib/ui';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import PropertyFormDialog from '@/components/properties/PropertyFormDialog';
import UnitFormDialog from '@/components/properties/UnitFormDialog';

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyDialog, setPropertyDialog] = useState(false);
  const [unitDialog, setUnitDialog] = useState({ open: false, unit: null });

  const load = useCallback(async () => {
    const [prop, unitList, leaseList] = await Promise.all([
      base44.entities.Property.get(id),
      fetchAll('Unit', { property_id: id }),
      fetchAll('Lease', { property_id: id, status: 'Actif' }),
    ]);
    setProperty(prop);
    // Les unités occupées apparaissent en tête de liste
    setUnits([...unitList].sort((a, b) => (b.status === 'Occupé' ? 1 : 0) - (a.status === 'Occupé' ? 1 : 0)));
    setLeases(leaseList);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const activeLeaseFor = (unitId) => leases.find((l) => l.unit_id === unitId);
  const occupied = units.filter((u) => u.status === 'Occupé').length;
  const potential = units.reduce((s, u) => s + (Number(u.rent_amount) || 0) + (Number(u.charges_amount) || 0), 0);
  const collected = leases.reduce((s, l) => s + (Number(l.rent_amount) || 0) + (Number(l.charges_amount) || 0), 0);

  if (loading) return <div className="card-surface h-[300px] animate-pulse" />;

  if (!property) {
    return (
      <EmptyState
        title="Bien introuvable"
        description="Ce bien n'existe pas ou ne vous appartient pas."
        action={
          <Link to="/biens" className={btnGhost}>
            Retour aux biens
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Link to="/biens" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Tous les biens
      </Link>

      <PageHeader
        title={property.name}
        subtitle={[property.type, property.address, property.city].filter(Boolean).join(' · ')}
      >
        <button type="button" className={btnGhost} onClick={() => setPropertyDialog(true)}>
          <Pencil className="h-4 w-4" />
          Modifier
        </button>
        <button type="button" className={btnPrimary} onClick={() => setUnitDialog({ open: true, unit: null })}>
          <Plus className="h-4 w-4" />
          Ajouter une unité
        </button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Unités', value: `${units.length}` },
          { label: 'Unités occupées', value: `${occupied} / ${units.length}` },
          { label: 'Loyer potentiel', value: money(potential) },
          { label: 'Loyer encaissable', value: money(collected) },
        ].map((stat) => (
          <div key={stat.label} className="card-surface p-4">
            <p className="text-[12px] font-medium text-[#5A6472]">{stat.label}</p>
            <p className="num mt-2 text-[18px] font-extrabold leading-none">{stat.value}</p>
          </div>
        ))}
      </div>

      {units.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="Aucune unité"
          description="Découpez ce bien en unités louables (appartements, studios, boutiques) pour créer des baux."
          action={
            <button type="button" className={btnPrimary} onClick={() => setUnitDialog({ open: true, unit: null })}>
              <Plus className="h-4 w-4" />
              Ajouter une unité
            </button>
          }
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className={tableHead}>
                  <th className={th}>Unité</th>
                  <th className={th}>Type</th>
                  <th className={th}>Surface</th>
                  <th className={th}>Loyer + charges</th>
                  <th className={th}>Locataire</th>
                  <th className={th}>Statut</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const lease = activeLeaseFor(unit.id);
                  return (
                    <tr key={unit.id} className={row}>
                      <td className={`${td} font-semibold`}>{unit.label}</td>
                      <td className={`${td} text-[#5A6472]`}>{unit.type}</td>
                      <td className={`${td} num text-[#5A6472]`}>{unit.surface ? `${unit.surface} m²` : '—'}</td>
                      <td className={`${td} num font-semibold`}>
                        {money((Number(unit.rent_amount) || 0) + (Number(unit.charges_amount) || 0))}
                      </td>
                      <td className={`${td} text-[#5A6472]`}>{lease?.tenant_name || '—'}</td>
                      <td className={td}>
                        <span
                          className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                            unit.status === 'Occupé' ? 'bg-[#EAF6EC] text-[#3F7C49]' : 'bg-[#F2F5FA] text-[#5A6472]'
                          }`}
                        >
                          {unit.status}
                        </span>
                      </td>
                      <td className={`${td} text-right`}>
                        <button
                          type="button"
                          className="rounded-lg border border-[#E4E8EF] p-1.5 text-[#5A6472] transition hover:border-[#0A24E9] hover:text-[#0A24E9]"
                          onClick={() => setUnitDialog({ open: true, unit })}
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

      <PropertyFormDialog
        open={propertyDialog}
        onOpenChange={setPropertyDialog}
        property={property}
        onSaved={load}
      />
      <UnitFormDialog
        open={unitDialog.open}
        onOpenChange={(open) => setUnitDialog((d) => ({ ...d, open }))}
        unit={unitDialog.unit}
        propertyId={id}
        onSaved={load}
      />
    </div>
  );
}