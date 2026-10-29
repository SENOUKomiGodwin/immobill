import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { btnGhost, btnPrimary } from '@/lib/ui';

const TYPES = ['Immeuble', 'Maison', 'Résidence', 'Boutique', 'Terrain'];
const EMPTY = { name: '', type: 'Immeuble', address: '', city: '', notes: '' };

export default function PropertyFormDialog({ open, onOpenChange, property, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setForm(
      property
        ? {
            name: property.name || '',
            type: property.type || 'Immeuble',
            address: property.address || '',
            city: property.city || '',
            notes: property.notes || '',
          }
        : EMPTY
    );
  }, [open, property]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (property) await base44.entities.Property.update(property.id, form);
      else await base44.entities.Property.create(form);
      toast({ title: property ? 'Bien mis à jour' : 'Bien ajouté' });
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
          <DialogTitle className="text-[17px] font-bold">
            {property ? 'Modifier le bien' : 'Nouveau bien'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          <div>
            <label className="label-sm">Nom du bien</label>
            <input className="field" value={form.name} onChange={set('name')} placeholder="Résidence Agoè" />
          </div>
          <div>
            <label className="label-sm">Type</label>
            <select className="field" value={form.type} onChange={set('type')}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Adresse</label>
              <input className="field" value={form.address} onChange={set('address')} placeholder="Rue 12, Agoè" />
            </div>
            <div>
              <label className="label-sm">Ville</label>
              <input className="field" value={form.city} onChange={set('city')} placeholder="Lomé" />
            </div>
          </div>
          <div>
            <label className="label-sm">Notes</label>
            <textarea className="field h-20 py-2" value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button type="button" className={btnGhost} onClick={() => onOpenChange(false)}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} onClick={submit} disabled={saving || !form.name.trim()}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}