import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { buildSchedule } from '@/lib/rent';
import { todayISO } from '@/lib/format';
import { btnGhost, btnPrimary } from '@/lib/ui';

const EMPTY = {
  propertyId: '',
  unit_id: '',
  tenant_id: '',
  start_date: todayISO(),
  end_date: '',
  rent_amount: '',
  charges_amount: '',
  deposit_amount: '',
  due_day: 5,
  grace_days: 5,
  penalty_enabled: false,
  notes: '',
};

export default function LeaseFormDialog({ open, onOpenChange, units, tenants, properties, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [extraUnits, setExtraUnits] = useState([]);
  const [newUnit, setNewUnit] = useState({ label: '', rent_amount: '' });
  const [creatingUnit, setCreatingUnit] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setExtraUnits([]);
      setNewUnit({ label: '', rent_amount: '' });
    }
  }, [open]);

  const allUnits = [...units, ...extraUnits];
  const freeUnits = allUnits.filter((u) => u.status !== 'Occupé' || u.id === form.unit_id);
  const visibleUnits = form.propertyId ? freeUnits.filter((u) => u.property_id === form.propertyId) : freeUnits;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickUnit = (e) => {
    const unit = allUnits.find((u) => u.id === e.target.value);
    setForm((f) => ({
      ...f,
      unit_id: e.target.value,
      propertyId: unit?.property_id || f.propertyId,
      rent_amount: unit?.rent_amount ?? f.rent_amount,
      charges_amount: unit?.charges_amount ?? f.charges_amount,
    }));
  };

  const createUnit = async () => {
    if (!newUnit.label.trim() || !form.propertyId) return;
    setCreatingUnit(true);
    try {
      const created = await base44.entities.Unit.create({
        property_id: form.propertyId,
        label: newUnit.label.trim(),
        type: 'Appartement',
        rent_amount: Number(newUnit.rent_amount) || 0,
        status: 'Libre',
      });
      setExtraUnits((list) => [...list, created]);
      setForm((f) => ({ ...f, unit_id: created.id, rent_amount: created.rent_amount || f.rent_amount }));
      setNewUnit({ label: '', rent_amount: '' });
      toast({ title: 'Unité ajoutée', description: created.label });
    } finally {
      setCreatingUnit(false);
    }
  };

  const submit = async () => {
    const unit = allUnits.find((u) => u.id === form.unit_id);
    const tenant = tenants.find((t) => t.id === form.tenant_id);
    const property = properties.find((p) => p.id === unit?.property_id);
    if (!unit || !tenant) return;

    setSaving(true);
    try {
      const lease = await base44.entities.Lease.create({
        unit_id: unit.id,
        unit_label: unit.label,
        property_id: unit.property_id,
        property_name: property?.name || '',
        tenant_id: tenant.id,
        tenant_name: tenant.full_name,
        tenant_phone: tenant.phone || '',
        start_date: form.start_date,
        end_date: form.end_date || '',
        rent_amount: Number(form.rent_amount) || 0,
        charges_amount: Number(form.charges_amount) || 0,
        deposit_amount: Number(form.deposit_amount) || 0,
        due_day: Number(form.due_day) || 5,
        grace_days: Number(form.grace_days) || 0,
        penalty_enabled: Boolean(form.penalty_enabled),
        status: 'Actif',
        notes: form.notes,
      });

      const schedule = buildSchedule(lease);
      if (schedule.length) await base44.entities.RentDue.bulkCreate(schedule);
      await base44.entities.Unit.update(unit.id, { status: 'Occupé' });

      toast({ title: 'Bail créé', description: `${schedule.length} échéance(s) générée(s).` });
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold">Nouveau bail</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-3.5 overflow-y-auto py-1 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Bien</label>
              <select className="field" value={form.propertyId} onChange={set('propertyId')}>
                <option value="">Tous les biens</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-sm">Unité libre</label>
              <select className="field" value={form.unit_id} onChange={pickUnit}>
                <option value="">Choisir…</option>
                {visibleUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-sm">Locataire</label>
            <select className="field" value={form.tenant_id} onChange={set('tenant_id')}>
              <option value="">Choisir…</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Début du bail</label>
              <input className="field" type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div>
              <label className="label-sm">Fin (optionnel)</label>
              <input className="field" type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-sm">Loyer</label>
              <input className="field" type="number" value={form.rent_amount} onChange={set('rent_amount')} />
            </div>
            <div>
              <label className="label-sm">Charges</label>
              <input className="field" type="number" value={form.charges_amount} onChange={set('charges_amount')} />
            </div>
            <div>
              <label className="label-sm">Caution</label>
              <input className="field" type="number" value={form.deposit_amount} onChange={set('deposit_amount')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Jour d'échéance</label>
              <input className="field" type="number" min="1" max="28" value={form.due_day} onChange={set('due_day')} />
            </div>
            <div>
              <label className="label-sm">Délai de grâce (jours)</label>
              <input className="field" type="number" min="0" value={form.grace_days} onChange={set('grace_days')} />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-[#FAFBFD] px-3 py-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0A24E9]"
              checked={form.penalty_enabled}
              onChange={(e) => setForm((f) => ({ ...f, penalty_enabled: e.target.checked }))}
            />
            <span className="text-[12.5px] font-medium">Activer les pénalités de retard sur ce bail</span>
          </label>

          {visibleUnits.length === 0 && (
            <div className="rounded-xl border border-[#F1DFC2] bg-[#FEF8EE] px-3 py-3">
              <p className="text-[12px] font-semibold text-[#8A5A16]">Aucune unité libre</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#8A5A16]/85">
                {form.propertyId
                  ? 'Créez une unité pour ce bien : elle sera sélectionnée automatiquement.'
                  : 'Choisissez d’abord un bien, puis créez une unité.'}
              </p>
              {form.propertyId && (
                <>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <input
                      className="field h-9"
                      placeholder="Appt 1"
                      value={newUnit.label}
                      onChange={(e) => setNewUnit((n) => ({ ...n, label: e.target.value }))}
                    />
                    <input
                      className="field h-9"
                      type="number"
                      placeholder="Loyer"
                      value={newUnit.rent_amount}
                      onChange={(e) => setNewUnit((n) => ({ ...n, rent_amount: e.target.value }))}
                    />
                  </div>
                  <button
                    type="button"
                    className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#8A5A16] px-3 text-[12px] font-semibold text-white transition hover:bg-[#744A11] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={createUnit}
                    disabled={creatingUnit || !newUnit.label.trim()}
                  >
                    {creatingUnit ? 'Création…' : 'Créer l’unité'}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="rounded-xl bg-[#EEF1FE] px-3 py-2.5 text-[11.5px] leading-relaxed text-[#0A24E9]">
            L'échéancier sera généré automatiquement à partir du mois de début, à raison d'une échéance par mois.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button type="button" className={btnGhost} onClick={() => onOpenChange(false)}>
            Annuler
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={submit}
            disabled={saving || !form.unit_id || !form.tenant_id}
          >
            {saving ? 'Création…' : 'Créer le bail'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}