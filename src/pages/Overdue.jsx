import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, MessageCircle, History } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/db';
import { amountDue, amountPaid, dueStatus, lateDays, remaining, relanceMessage, reminderTier, tierLabel } from '@/lib/rent';
import { money, periodLabel } from '@/lib/format';
import { btnPrimary } from '@/lib/ui';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import PaymentDialog from '@/components/payments/PaymentDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const waLink = (phone, message) => {
  const digits = String(phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export default function Overdue() {
  const [dues, setDues] = useState([]);
  const [leases, setLeases] = useState([]);
  const [reminders, setReminders] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [target, setTarget] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDue, setHistoryDue] = useState(null);

  const load = useCallback(async () => {
    const [dueList, leaseList, reminderList] = await Promise.all([fetchAll('RentDue'), fetchAll('Lease'), fetchAll('Reminder')]);
    setDues(dueList);
    setLeases(leaseList);
    // Group reminders by due_id
    const remindersByDue = {};
    reminderList.forEach((r) => {
      if (!remindersByDue[r.due_id]) {
        remindersByDue[r.due_id] = [];
      }
      remindersByDue[r.due_id].push(r);
    });
    setReminders(remindersByDue);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const graceFor = (leaseId) => Number(leases.find((l) => l.id === leaseId)?.grace_days) || 0;

  const late = dues
    .filter((d) => remaining(d) > 0 && dueStatus(d, graceFor(d.lease_id)) === 'late')
    .sort((a, b) => lateDays(b, graceFor(b.lease_id)) - lateDays(a, graceFor(a.lease_id)));

  const total = late.reduce((s, d) => s + remaining(d), 0);
  const tenants = new Set(late.map((d) => d.tenant_id)).size;

  const copy = async (due, days) => {
    try {
      await navigator.clipboard.writeText(relanceMessage(due, days));
      setCopied(due.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const recordReminder = async (due, days, method) => {
    try {
      const tier = reminderTier(days);
      const message = relanceMessage(due, days);
      await base44.entities.Reminder.create({
        due_id: due.id,
        tier,
        method,
        message,
      });
      load();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la relance:', error);
    }
  };

  const showHistory = (due) => {
    setHistoryDue(due);
    setHistoryOpen(true);
  };

  return (
    <div>
      <PageHeader title="Impayés" subtitle="Les loyers en retard et le suivi des relances." />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-[12px] font-medium text-[#5A6472]">Montant en retard</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none text-[#C63B3F]">{money(total)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-[12px] font-medium text-[#5A6472]">Échéances en retard</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none">{late.length}</p>
        </div>
        <div className="card-surface col-span-2 p-4 lg:col-span-1">
          <p className="text-[12px] font-medium text-[#5A6472]">Locataires concernés</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none">{tenants}</p>
        </div>
      </div>

      {loading ? (
        <div className="card-surface h-[240px] animate-pulse" />
      ) : late.length === 0 ? (
        <EmptyState
          icon={Check}
          title="Aucun impayé"
          description="Tous vos loyers sont à jour. Les retards apparaîtront ici avec un lien de relance WhatsApp."
        />
      ) : (
        <div className="space-y-3">
          {late.map((due) => {
            const grace = graceFor(due.lease_id);
            const days = lateDays(due, grace);
            const message = relanceMessage(due, days);
            const tier = reminderTier(days);
            const dueReminders = reminders[due.id] || [];
            const hasReminderForTier = dueReminders.some((r) => r.tier === tier);
            return (
              <div key={due.id} className="card-surface flex flex-wrap items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDECEC] text-[#C63B3F]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-[160px] flex-1">
                  <p className="text-[13.5px] font-bold">{due.tenant_name}</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {due.unit_label} · {due.property_name}
                  </p>
                </div>
                <div className="min-w-[110px]">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Période</p>
                  <p className="text-[12.5px] font-semibold">{periodLabel(due.period)}</p>
                </div>
                <div className="min-w-[90px]">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Retard</p>
                  <p className="num text-[12.5px] font-bold text-[#C63B3F]">{days} j</p>
                </div>
                <div className="min-w-[130px]">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Reste</p>
                  <p className="num text-[13px] font-extrabold">{money(remaining(due))}</p>
                  <p className="num text-[10.5px] text-muted-foreground">
                    sur {money(amountDue(due))} · payé {money(amountPaid(due))}
                  </p>
                </div>
                <div className="min-w-[100px]">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">Relances</p>
                  <p className="text-[12.5px] font-semibold">{dueReminders.length}</p>
                  {dueReminders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => showHistory(due)}
                      className="mt-1 text-[11px] text-[#0A24E9] hover:underline"
                    >
                      Voir l'historique
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className={btnPrimary} onClick={() => setTarget(due)}>
                    Encaisser
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(due, days)}
                    className="flex h-10 items-center gap-1.5 rounded-xl border border-[#E4E8EF] bg-white px-3 text-[12px] font-semibold transition hover:border-[#0A24E9] hover:text-[#0A24E9]"
                  >
                    {copied === due.id ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                    {copied === due.id ? 'Copié' : 'Copier'}
                  </button>
                  <a
                    href={waLink(due.tenant_phone, message)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => recordReminder(due, days, 'whatsapp')}
                    className="flex h-10 items-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-[12px] font-semibold text-white transition hover:bg-[#1EB457]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Relancer
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PaymentDialog
        due={target}
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        onSaved={load}
      />

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold">Historique des relances</DialogTitle>
          </DialogHeader>
          {historyDue && (
            <div className="space-y-3 py-2">
              <div className="mb-4 rounded-xl bg-[#FAFBFD] p-3">
                <p className="text-[13px] font-bold">{historyDue.tenant_name}</p>
                <p className="text-[11.5px] text-muted-foreground">
                  {historyDue.unit_label} · {periodLabel(historyDue.period)}
                </p>
              </div>
              {reminders[historyDue.id]?.length > 0 ? (
                <div className="space-y-2">
                  {reminders[historyDue.id].map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border border-[#E4E8EF] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF1FE] text-[#0A24E9]">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold capitalize">{r.method}</p>
                          <p className="text-[11px] text-muted-foreground">Palier {tierLabel(r.tier)}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{r.created_date?.split('T')[0]}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-[13px] text-muted-foreground">Aucune relance enregistrée</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}