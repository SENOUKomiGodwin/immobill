import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { amountDue, amountPaid, receiptNumber, remaining } from '@/lib/rent';
import { money, todayISO } from '@/lib/format';
import { btnGhost, btnPrimary } from '@/lib/ui';

const METHODS = ['Espèces', 'Mobile money', 'Virement', 'Chèque'];

export default function PaymentDialog({ due, open, onOpenChange, onSaved }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Espèces');
  const [date, setDate] = useState(todayISO());
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !due) return;
    setAmount(String(remaining(due)));
    setMethod('Espèces');
    setDate(todayISO());
    setReference('');
    setReceipt(null);
  }, [open, due?.id]);

  const submit = async () => {
    const value = Number(amount) || 0;
    if (value <= 0) return;
    setSaving(true);
    try {
      const paid = amountPaid(due) + value;
      const payment = await base44.entities.Payment.create({
        due_id: due.id,
        lease_id: due.lease_id,
        tenant_id: due.tenant_id,
        tenant_name: due.tenant_name,
        unit_label: due.unit_label,
        property_name: due.property_name,
        period: due.period,
        amount: value,
        payment_date: date,
        method,
        reference,
        receipt_number: receiptNumber(due.period),
      });

      await base44.entities.RentDue.update(due.id, {
        amount_paid: paid,
        status: paid >= amountDue(due) ? 'Payé' : 'Partiel',
      });

      toast({ title: 'Paiement enregistré' });
      if (paid >= amountDue(due)) setReceipt({ paymentId: payment.id, number: payment.receipt_number });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!due) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold">Enregistrer un paiement</DialogTitle>
        </DialogHeader>

        {receipt ? (
          <div className="py-2">
            <div className="flex flex-col items-center rounded-2xl bg-[#EAF6EC] px-4 py-6 text-center">
              <CheckCircle2 className="h-9 w-9 text-[#3F7C49]" />
              <p className="mt-2 text-[14px] font-bold text-[#2F6238]">Échéance entièrement soldée</p>
              <p className="mt-1 text-[12px] text-[#3F7C49]">Quittance {receipt.number}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className={btnGhost + ' flex-1'} onClick={() => onOpenChange(false)}>
                Fermer
              </button>
              <Link to={`/quittances/${receipt.paymentId}`} className={btnPrimary + ' flex-1'}>
                Voir la quittance
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-[#FAFBFD] p-3 text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Locataire</span>
                <span className="font-semibold">{due.tenant_name}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Période</span>
                <span className="font-semibold">{due.period}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Reste à payer</span>
                <span className="num font-bold">{money(remaining(due))}</span>
              </div>
            </div>

            <div className="space-y-3.5 py-1">
              <div>
                <label className="label-sm">Montant encaissé (FCFA)</label>
                <input className="field" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-sm">Moyen</label>
                  <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
                    {METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-sm">Date</label>
                  <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label-sm">Référence (optionnel)</label>
                <input className="field" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° transaction" />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <button type="button" className={btnGhost} onClick={() => onOpenChange(false)}>
                Annuler
              </button>
              <button type="button" className={btnPrimary} onClick={submit} disabled={saving || !(Number(amount) > 0)}>
                {saving ? 'Enregistrement…' : 'Encaisser'}
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}