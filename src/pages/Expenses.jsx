import { useCallback, useEffect, useState } from 'react';
import { MoreHorizontal, Paperclip, Plus, Pencil, Trash2, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { fetchAll } from '@/lib/db';
import { dateFr, money } from '@/lib/format';
import { btnPrimary, row, tableHead, td, th } from '@/lib/ui';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import ExpenseFormDialog from '@/components/expenses/ExpenseFormDialog';
import ExpenseDeleteDialog from '@/components/expenses/ExpenseDeleteDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const load = useCallback(async () => {
    const [expenseList, propertyList] = await Promise.all([fetchAll('Expense'), fetchAll('Property', {}, { sort: 'name' })]);
    setExpenses(expenseList.sort((a, b) => String(b.expense_date).localeCompare(String(a.expense_date))));
    setProperties(propertyList);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openReceipt = async (uri) => {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 300 });
    window.open(signed_url, '_blank', 'noopener');
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setOpen(true);
  };

  const handleDelete = (expense) => {
    setExpenseToDelete(expense);
    setDeleteOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedExpense(null);
    setOpen(true);
  };

  const total = expenses.filter((e) => e.paid).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const engaged = expenses.filter((e) => !e.paid).reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <div>
      <PageHeader title="Dépenses" subtitle="Travaux, taxes et charges liés à vos biens.">
        <button type="button" className={btnPrimary} onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />
          Nouvelle dépense
        </button>
      </PageHeader>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="card-surface p-4">
          <p className="text-[12px] font-medium text-[#5A6472]">Dépenses payées</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none">{money(total)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-[12px] font-medium text-[#5A6472]">Engagements à payer</p>
          <p className="num mt-2 text-[19px] font-extrabold leading-none text-[#B26A16]">{money(engaged)}</p>
        </div>
      </div>

      {loading ? (
        <div className="card-surface h-[240px] animate-pulse" />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Aucune dépense"
          description="Enregistrez vos travaux et charges pour obtenir un résultat net fiable dans vos bilans."
          action={
            <button type="button" className={btnPrimary} onClick={handleOpenCreate}>
              <Plus className="h-4 w-4" />
              Ajouter une dépense
            </button>
          }
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className={tableHead}>
                  <th className={th}>Libellé</th>
                  <th className={th}>Catégorie</th>
                  <th className={th}>Bien</th>
                  <th className={th}>Date</th>
                  <th className={th}>Montant</th>
                  <th className={th}>Statut</th>
                  <th className={th}>Justificatif</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className={row}>
                    <td className={`${td} font-semibold`}>{expense.label}</td>
                    <td className={`${td} text-[#5A6472]`}>{expense.category}</td>
                    <td className={`${td} text-[#5A6472]`}>{expense.property_name || '—'}</td>
                    <td className={`${td} text-[#5A6472]`}>{dateFr(expense.expense_date)}</td>
                    <td className={`${td} num font-bold`}>{money(expense.amount)}</td>
                    <td className={td}>
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                          expense.paid ? 'bg-[#EAF6EC] text-[#3F7C49]' : 'bg-[#FEF3E6] text-[#B26A16]'
                        }`}
                      >
                        {expense.paid ? 'Payée' : 'À payer'}
                      </span>
                    </td>
                    <td className={td}>
                      {expense.receipt_uri ? (
                        <button
                          type="button"
                          onClick={() => openReceipt(expense.receipt_uri)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E4E8EF] px-2 py-1 text-[11px] font-semibold text-[#0A24E9] hover:border-[#0A24E9]"
                        >
                          <Paperclip className="h-3 w-3" />
                          Voir
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#98A2B3]">—</span>
                      )}
                    </td>
                    <td className={`${td} text-right`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button type="button" className="rounded-lg p-1.5 hover:bg-[#FAFBFD]">
                            <MoreHorizontal className="h-4 w-4 text-[#5A6472]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(expense)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(expense)} className="text-[#DC2626]">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ExpenseFormDialog open={open} onOpenChange={setOpen} properties={properties} onSaved={load} expense={selectedExpense} />
      <ExpenseDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} expense={expenseToDelete} onDeleted={load} />
    </div>
  );
}