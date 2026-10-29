import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { btnGhost, btnPrimary } from '@/lib/ui';

export default function ExpenseDeleteDialog({ open, onOpenChange, expense, onDeleted }) {
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!reason?.trim()) {
      toast({ title: 'Veuillez indiquer le motif de suppression', variant: 'destructive' });
      return;
    }
    setDeleting(true);
    try {
      await base44.entities.Expense.update(expense.id, {
        cancellation_reason: reason.trim(),
      });
      await base44.entities.Expense.delete(expense.id);
      toast({ title: 'Dépense supprimée' });
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold">Supprimer la dépense</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-xl bg-[#FEF3E6] p-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#B26A16]" />
            <div className="text-[13px] leading-relaxed text-[#5A6472]">
              <span className="font-semibold">Attention :</span> cette action est irréversible. Veuillez indiquer le motif de cette suppression.
            </div>
          </div>

          <div>
            <label className="label-sm">Motif de suppression *</label>
            <textarea
              className="field min-h-[80px] resize-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Erreur de saisie, dépense en double, etc."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <button type="button" className={btnGhost} onClick={() => onOpenChange(false)} disabled={deleting}>
            Annuler
          </button>
          <button
            type="button"
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#DC2626] px-3.5 text-[12.5px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(220,38,38,0.9)] transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleDelete}
            disabled={deleting || !reason?.trim()}
          >
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
