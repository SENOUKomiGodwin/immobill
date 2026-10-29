import { useCallback, useEffect, useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { fetchAll } from '@/lib/db';
import { btnPrimary } from '@/lib/ui';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import PropertyCard from '@/components/properties/PropertyCard';
import PropertyFormDialog from '@/components/properties/PropertyFormDialog';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, property: null });

  const load = useCallback(async () => {
    const [props, unitList] = await Promise.all([fetchAll('Property', {}, { sort: 'name' }), fetchAll('Unit')]);
    setProperties(props);
    setUnits(unitList);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader title="Biens" subtitle="Vos immeubles, maisons et résidences, avec leurs unités louables.">
        <button type="button" className={btnPrimary} onClick={() => setDialog({ open: true, property: null })}>
          <Plus className="h-4 w-4" />
          Nouveau bien
        </button>
      </PageHeader>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-surface h-[210px] animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun bien enregistré"
          description="Commencez par ajouter un immeuble ou une maison, puis créez les unités que vous louez."
          action={
            <button type="button" className={btnPrimary} onClick={() => setDialog({ open: true, property: null })}>
              <Plus className="h-4 w-4" />
              Ajouter mon premier bien
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              units={units.filter((u) => u.property_id === property.id)}
            />
          ))}
        </div>
      )}

      <PropertyFormDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        property={dialog.property}
        onSaved={load}
      />
    </div>
  );
}