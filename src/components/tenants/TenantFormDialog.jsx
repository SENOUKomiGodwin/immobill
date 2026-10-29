import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { money } from '@/lib/format';
import { btnGhost, btnPrimary } from '@/lib/ui';

export default function TenantFormDialog({ open, onOpenChange, tenant, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setForm({
      full_name: tenant?.full_name || '',
      phone: tenant?.phone || '',
      email: tenant?.email || '',
      id_number: tenant?.id_number || '',
      city: tenant?.city || '',
      rent_amount: tenant?.rent_amount ?? '',
      advance_amount: tenant?.advance_amount ?? '',
      notes: tenant?.notes || '',
    });
  }, [open, tenant]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const rent = Number(form.rent_amount) || 0;
  const advance = Number(form.advance_amount) || 0;
  const advanceMonths = rent > 0 ? Math.floor(advance / rent) : 0;
  const advanceRest = rent > 0 ? advance % rent : advance;

  const submit = async () => {
    if (!form.full_name?.trim()) return;
    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        id_number: form.id_number,
        city: form.city,
        rent_amount: rent,
        advance_amount: advance,
        advance_months: advanceMonths,
        notes: form.notes,
      };
      if (tenant) await base44.entities.Tenant.update(tenant.id, payload);
      else await base44.entities.Tenant.create(payload);
      toast({ title: tenant ? 'Locataire mis à jour' : 'Locataire ajouté' });
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
          <DialogTitle className="text-[17px] font-bold">{tenant ? 'Modifier le locataire' : 'Nouveau locataire'}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-3.5 overflow-y-auto py-1 pr-1">
          <div>
            <label className="label-sm">Nom complet</label>
            <input className="field" value={form.full_name || ''} onChange={set('full_name')} placeholder="Kossi Adjovi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Téléphone</label>
              <input className="field" value={form.phone || ''} onChange={set('phone')} placeholder="+228 90 00 00 00" />
            </div>
            <div>
              <label className="label-sm">Ville</label>
              <input className="field" value={form.city || ''} onChange={set('city')} placeholder="Lomé" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Loyer mensuel (FCFA)</label>
              <input
                className="field"
                type="number"
                value={form.rent_amount ?? ''}
                onChange={set('rent_amount')}
                placeholder="150000"
              />
            </div>
            <div>
              <label className="label-sm">Avance versée (FCFA)</label>
              <input
                className="field"
                type="number"
                value={form.advance_amount ?? ''}
                onChange={set('advance_amount')}
                placeholder="300000"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[#EEF1FE] px-3 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-[#0A24E9]">Mois d'avance couverts</span>
              <span className="num text-[16px] font-extrabold text-[#0A24E9]">{advanceMonths}</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#0A24E9]/80">
              {rent > 0
                ? advanceRest > 0
                  ? `${money(advance)} versés · ${money(advanceRest)} au-delà des mois complets.`
                  : `${money(advance)} versés, soit ${advanceMonths} mois de loyer de ${money(rent)}.`
                : 'Renseignez le loyer mensuel pour calculer le nombre de mois d’avance.'}
            </p>
          </div>

          <div>
            <label className="label-sm">Email</label>
            <input className="field" type="email" value={form.email || ''} onChange={set('email')} />
          </div>
          <div>
            <label className="label-sm">Pièce d'identité</label>
            <input className="field" value={form.id_number || ''} onChange={set('id_number')} placeholder="Carte nationale / passeport" />
          </div>
          <div>
            <label className="label-sm">Notes</label>
            <textarea className="field h-20 py-2" value={form.notes || ''} onChange={set('notes')} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button type="button" className={btnGhost} onClick={() => onOpenChange(false)}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} onClick={submit} disabled={saving || !form.full_name?.trim()}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}