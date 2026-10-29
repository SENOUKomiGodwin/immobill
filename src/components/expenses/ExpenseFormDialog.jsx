import { useEffect, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { todayISO } from '@/lib/format';
import { btnGhost, btnPrimary } from '@/lib/ui';

const CATEGORIES = ['Plomberie', 'Peinture', 'Électricité', 'Taxes', 'Assurance', 'Gardiennage', 'Réparation', 'Autre'];

export default function ExpenseFormDialog({ open, onOpenChange, properties, onSaved, expense }) {
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        label: expense.label || '',
        category: expense.category || 'Plomberie',
        property_id: expense.property_id || '',
        vendor: expense.vendor || '',
        amount: expense.amount || '',
        expense_date: expense.expense_date || todayISO(),
        paid: expense.paid !== false,
        refacture: expense.refacture || false,
        recovered_amount: expense.recovered_amount || '',
        note: expense.note || '',
      });
      setFile(null);
      setRemoveFile(false);
    } else {
      setForm({
        label: '',
        category: 'Plomberie',
        property_id: '',
        vendor: '',
        amount: '',
        expense_date: todayISO(),
        paid: true,
        refacture: false,
        recovered_amount: '',
        note: '',
      });
      setFile(null);
      setRemoveFile(false);
    }
  }, [open, expense]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.label?.trim() || !(Number(form.amount) > 0)) return;
    setSaving(true);
    try {
      let receipt_uri = expense?.receipt_uri || '';
      if (file) {
        const upload = await base44.integrations.Core.UploadPrivateFile({ file });
        receipt_uri = upload.file_uri;
      } else if (removeFile) {
        receipt_uri = '';
      }
      const property = properties.find((p) => p.id === form.property_id);
      const data = {
        label: form.label.trim(),
        category: form.category,
        property_id: form.property_id,
        property_name: property?.name || '',
        vendor: form.vendor,
        amount: Number(form.amount) || 0,
        expense_date: form.expense_date,
        paid: Boolean(form.paid),
        refacture: Boolean(form.refacture),
        recovered_amount: Number(form.recovered_amount) || 0,
        note: form.note,
        receipt_uri,
      };

      if (expense) {
        await base44.entities.Expense.update(expense.id, data);
        toast({ title: 'Dépense modifiée' });
      } else {
        await base44.entities.Expense.create(data);
        toast({ title: 'Dépense enregistrée' });
      }
      onOpenChange(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold">{expense ? 'Modifier la dépense' : 'Nouvelle dépense'}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-3.5 overflow-y-auto py-1 pr-1">
          <div>
            <label className="label-sm">Libellé</label>
            <input className="field" value={form.label || ''} onChange={set('label')} placeholder="Réparation fuite salle de bain" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Catégorie</label>
              <select className="field" value={form.category || 'Plomberie'} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-sm">Bien</label>
              <select className="field" value={form.property_id || ''} onChange={set('property_id')}>
                <option value="">Non rattaché</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-sm">Montant (FCFA)</label>
              <input className="field" type="number" value={form.amount || ''} onChange={set('amount')} />
            </div>
            <div>
              <label className="label-sm">Date</label>
              <input className="field" type="date" value={form.expense_date || ''} onChange={set('expense_date')} />
            </div>
          </div>
          <div>
            <label className="label-sm">Prestataire</label>
            <input className="field" value={form.vendor || ''} onChange={set('vendor')} placeholder="Plombier, électricien…" />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-[#FAFBFD] px-3 py-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0A24E9]"
              checked={Boolean(form.paid)}
              onChange={(e) => setForm((f) => ({ ...f, paid: e.target.checked }))}
            />
            <span className="text-[12.5px] font-medium">Dépense déjà payée</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-[#FAFBFD] px-3 py-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#0A24E9]"
              checked={Boolean(form.refacture)}
              onChange={(e) => setForm((f) => ({ ...f, refacture: e.target.checked }))}
            />
            <span className="text-[12.5px] font-medium">Refacturée au locataire</span>
          </label>

          {form.refacture && (
            <div>
              <label className="label-sm">Montant récupéré (FCFA)</label>
              <input className="field" type="number" value={form.recovered_amount || ''} onChange={set('recovered_amount')} />
            </div>
          )}

          <div>
            <label className="label-sm">Justificatif</label>
            {expense?.receipt_uri && !file && !removeFile ? (
              <div className="flex items-center justify-between rounded-xl border border-[#D7DEE9] px-3 py-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-[#0A24E9]" />
                  <span className="text-[12px] text-[#5A6472]">Fichier existant</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveFile(true)}
                  className="rounded-lg p-1 text-[#DC2626] hover:bg-[#FEF2F2]"
                  title="Supprimer le fichier"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#D7DEE9] px-3 text-[12px] text-muted-foreground hover:border-[#0A24E9]">
                <Paperclip className="h-4 w-4" />
                {file ? file.name : 'Photo de la facture (stockée en privé)'}
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            )}
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
            disabled={saving || !form.label?.trim() || !(Number(form.amount) > 0)}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}