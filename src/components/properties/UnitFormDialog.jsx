import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { btnGhost, btnPrimary } from '@/lib/ui';

const TYPES = ['Appartement', 'Studio', 'Chambre', 'Boutique', 'Autre'];

export default function UnitFormDialog({ open, onOpenChange, unit, propertyId, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setForm({
      label: unit?.label || '',
      type: unit?.type || 'Appartement',
      surface: unit?.surface ?? '',
      rent_amount: unit?.rent_amount ?? '',
      charges_amount: unit?.charges_amount ?? '',
      status: unit?.status || 'Libre',
      count: 1,
    });
  }, [open, unit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const count = Math.max(1, Math.min(100, Number(form.count) || 1));

  const submit = async () => {
    if (!form.label?.trim()) return;
    setSaving(true);
    try {
      const payload = {
        property_id: propertyId,
        label: form.label.trim(),
        type: form.type,
        surface: Number(form.surface) || 0,
        rent_amount: Number(form.rent_amount) || 0,
        charges_amount: Number(form.charges_amount) || 0,
        status: form.status,
      };
      if (unit) {
        await base44.entities.Unit.update(unit.id, payload);
        toast({ title: 'Unité mise à jour' });
      } else {
        const records = Array.from({ length: count }, (_, i) => ({
          ...payload,
          label: count > 1 ? `${payload.label} ${i + 1}` : payload.label,
        }));
        if (count > 1) await base44.entities.Unit.bulkCreate(records);
        else await base44.entities.Unit.create(records[0]);
        toast({ title: count > 1 ? `${count} unités ajoutées` : 'Unité ajoutée' });
      }
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[460px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold">{unit ? 'Modifier l’unité' : 'Nouvelle unité'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Libellé</label>
              <input className="field" value={form.label || ''} onChange={set('label')} placeholder="Appt 3" />
            </div>
            <div>
              <label className="label-sm">Type</label>
              <select className="field" value={form.type || 'Appartement'} onChange={set('type')}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {!unit && (
            <div>
              <label className="label-sm">Nombre d’unités</label>
              <input className="field" type="number" min="1" max="100" value={form.count ?? 1} onChange={set('count')} />
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {count > 1
                  ? `Les unités seront nommées « ${form.label?.trim() || 'Appt'} 1 » à « ${form.label?.trim() || 'Appt'} ${count} », avec les mêmes informations.`
                  : 'Une seule unité sera créée.'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-sm">Surface m²</label>
              <input className="field" type="number" value={form.surface ?? ''} onChange={set('surface')} />
            </div>
            <div>
              <label className="label-sm">Loyer</label>
              <input className="field" type="number" value={form.rent_amount ?? ''} onChange={set('rent_amount')} />
            </div>
            <div>
              <label className="label-sm">Charges</label>
              <input className="field" type="number" value={form.charges_amount ?? ''} onChange={set('charges_amount')} />
            </div>
          </div>
          <div>
            <label className="label-sm">Statut</label>
            <select className="field" value={form.status || 'Libre'} onChange={set('status')}>
              <option value="Libre">Libre</option>
              <option value="Occupé">Occupé</option>
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button type="button" className={btnGhost} onClick={() => onOpenChange(false)}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} onClick={submit} disabled={saving || !form.label?.trim()}>
            {saving ? 'Enregistrement…' : !unit && count > 1 ? `Créer ${count} unités` : 'Enregistrer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}