import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { dateFr, money, periodLabel } from '@/lib/format';
import { btnGhost, btnPrimary } from '@/lib/ui';
import { fetchAll } from '@/lib/db';
import { remaining } from '@/lib/rent';

export default function Receipt() {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [lease, setLease] = useState(null);
  const [rentDue, setRentDue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await base44.entities.Payment.get(id);
      setPayment(p);
      if (p?.lease_id) {
        const [leases, dues] = await Promise.all([
          fetchAll('Lease', { id: p.lease_id }),
          fetchAll('RentDue', { id: p.due_id }),
        ]);
        setLease(leases[0] || null);
        setRentDue(dues[0] || null);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="mx-auto mt-10 h-[400px] max-w-[760px] animate-pulse rounded-2xl bg-white" />;

  if (!payment) {
    return (
      <div className="mx-auto mt-16 max-w-[420px] text-center">
        <p className="text-[15px] font-bold">Quittance introuvable</p>
        <Link to="/paiements" className={btnGhost + ' mx-auto mt-4 w-fit'}>
          Retour aux paiements
        </Link>
      </div>
    );
  }

  // Rule: Receipt only available for fully paid dues
  if (rentDue && remaining(rentDue) > 0) {
    return (
      <div className="mx-auto mt-16 max-w-[420px] text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FDECEC] text-[#C63B3F] mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-[15px] font-bold">Quittance non disponible</p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          La quittance n'est disponible que lorsque l'échéance est entièrement soldée.
        </p>
        <Link to="/paiements" className={btnGhost + ' mx-auto mt-4 w-fit'}>
          Retour aux paiements
        </Link>
      </div>
    );
  }

  const rentAmount = Number(lease?.rent_amount) || 0;
  const charges = Number(lease?.charges_amount) || 0;

  return (
    <div className="min-h-screen bg-background px-4 py-6 print:bg-white print:py-0">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link to="/paiements" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Paiements
          </Link>
          <button type="button" className={btnPrimary} onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimer / PDF
          </button>
        </div>

        <div className="card-surface p-8 sm:p-10 print:border-0 print:shadow-none">
          <div className="flex items-start justify-between border-b border-[#EFF2F7] pb-6">
            <div>
              <p className="text-[20px] font-extrabold tracking-[-0.03em]">Immobill</p>
              <p className="text-[11.5px] text-muted-foreground">Gestion locative</p>
            </div>
            <div className="text-right">
              <p className="text-[15px] font-bold uppercase tracking-[-0.01em]">Quittance de loyer</p>
              <p className="num text-[12px] text-muted-foreground">N° {payment.receipt_number}</p>
            </div>
          </div>

          <div className="grid gap-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Locataire</p>
              <p className="mt-1 text-[14px] font-bold">{payment.tenant_name}</p>
              <p className="text-[12.5px] text-[#5A6472]">{lease?.tenant_phone || ''}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Logement</p>
              <p className="mt-1 text-[14px] font-bold">{payment.unit_label}</p>
              <p className="text-[12.5px] text-[#5A6472]">{payment.property_name}</p>
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-y border-[#EFF2F7] bg-[#FAFBFD] text-[10.5px] uppercase tracking-[0.07em] text-[#98A2B3]">
                <th className="px-3 py-2.5 font-semibold">Désignation</th>
                <th className="px-3 py-2.5 text-right font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#F4F6FA] text-[13px]">
                <td className="px-3 py-3">Loyer — {periodLabel(payment.period)}</td>
                <td className="num px-3 py-3 text-right">{money(rentAmount || payment.amount)}</td>
              </tr>
              {charges > 0 && (
                <tr className="border-b border-[#F4F6FA] text-[13px]">
                  <td className="px-3 py-3">Charges</td>
                  <td className="num px-3 py-3 text-right">{money(charges)}</td>
                </tr>
              )}
              <tr className="bg-[#FAFBFD] text-[13px] font-bold">
                <td className="px-3 py-3">Montant versé</td>
                <td className="num px-3 py-3 text-right">{money(payment.amount)}</td>
              </tr>
            </tbody>
          </table>

          <p className="mt-5 text-[12.5px] leading-relaxed text-[#5A6472]">
            Reçu de <span className="font-semibold text-foreground">{payment.tenant_name}</span> la somme de{' '}
            <span className="font-semibold text-foreground">{money(payment.amount)}</span> au titre du loyer et des
            charges de la période <span className="font-semibold text-foreground">{periodLabel(payment.period)}</span>,
            réglée le {dateFr(payment.payment_date)} par {payment.method?.toLowerCase() || 'paiement'}.
          </p>
          <p className="mt-1 text-[12.5px] text-[#5A6472]">
            Cette quittance annule tous les reçus qui auraient pu être établis précédemment pour la même période.
          </p>

          <div className="mt-10 flex items-end justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">Fait le {dateFr(payment.payment_date)}</p>
              {payment.reference && (
                <p className="text-[11px] text-muted-foreground">Référence : {payment.reference}</p>
              )}
            </div>
            <div className="text-center">
              <p className="mb-8 text-[11px] font-semibold text-muted-foreground">Signature du propriétaire</p>
              <div className="w-[160px] border-t border-[#CACED6]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}