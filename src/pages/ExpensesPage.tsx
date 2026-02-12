import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService } from '@/services/expenseService';
import { apartmentService } from '@/services/apartmentService';
import type { Expense, Apartment } from '@/types';
import { useModal, useSearch } from '@/hooks/useCommon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, type ExpenseFormData } from '@/utils/validations';
import { EXPENSE_CATEGORIES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import { PageLoader } from '@/components/ui/Loading';
import { formatCurrency, formatDate, getStatusLabel } from '@/utils/helpers';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const { admin } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const modal = useModal();
  const { searchTerm, handleSearch } = useSearch();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: 'maintenance', isRecurring: false, vendor: '', recurringPeriod: null },
  });

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await expenseService.getAll();
      setExpenses(data);
    } catch {
      toast.error('Giderler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    apartmentService.getAll().then(setApartments);
  }, [fetchExpenses]);

  const handleSave = async (data: ExpenseFormData) => {
    if (!admin) return;
    try {
      if (modal.editingId) {
        const old = expenses.find((e) => e.id === modal.editingId);
        if (old) await expenseService.update(modal.editingId, data, admin.id, old);
        toast.success('Gider güncellendi');
      } else {
        await expenseService.create(data, admin.id);
        toast.success('Gider eklendi');
      }
      modal.close();
      form.reset();
      fetchExpenses();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleEdit = (expense: Expense) => {
    form.reset({
      apartmentId: expense.apartmentId,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      vendor: expense.vendor,
      expenseDate: expense.expenseDate,
      isRecurring: expense.isRecurring,
      recurringPeriod: expense.recurringPeriod,
    });
    modal.openEdit(expense.id);
  };

  const handleDelete = async () => {
    if (!admin || !deleteId) return;
    const expense = expenses.find((e) => e.id === deleteId);
    if (expense) {
      try {
        await expenseService.delete(deleteId, admin.id, expense.description);
        toast.success('Gider silindi');
        fetchExpenses();
      } catch {
        toast.error('Silme başarısız');
      }
    }
    setDeleteId(null);
  };

  const handleApprove = async (id: string) => {
    if (!admin) return;
    try {
      await expenseService.approve(id, admin.id);
      toast.success('Gider onaylandı');
      fetchExpenses();
    } catch {
      toast.error('Onaylama başarısız');
    }
  };

  const handleReject = async (id: string) => {
    if (!admin) return;
    try {
      await expenseService.reject(id, admin.id);
      toast.success('Gider reddedildi');
      fetchExpenses();
    } catch {
      toast.error('Reddetme başarısız');
    }
  };

  const filtered = expenses.filter((e) => {
    if (filterCategory !== 'all' && e.category !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        e.description.toLowerCase().includes(term) ||
        e.vendor.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const columns: ColumnDef<Expense>[] = [
    { key: 'date', title: 'Tarih', render: (e) => formatDate(e.expenseDate) },
    { key: 'category', title: 'Kategori', render: (e) => getStatusLabel(e.category) },
    { key: 'desc', title: 'Açıklama', render: (e) => e.description },
    { key: 'vendor', title: 'Tedarikçi', render: (e) => e.vendor || '-' },
    { key: 'amount', title: 'Tutar', render: (e) => <span className="font-semibold">{formatCurrency(e.amount)}</span> },
    { key: 'recurring', title: 'Tekrar', render: (e) => e.isRecurring ? 'Evet' : '-' },
    { key: 'status', title: 'Durum', render: (e) => <Badge status={e.status} /> },
    {
      key: 'actions',
      title: '',
      render: (e) => (
        <div className="flex gap-1">
          {e.status === 'pending' && (
            <>
              <button onClick={() => handleApprove(e.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Onayla">
                <CheckCircle className="h-4 w-4 text-success-600" />
              </button>
              <button onClick={() => handleReject(e.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Reddet">
                <XCircle className="h-4 w-4 text-danger-500" />
              </button>
            </>
          )}
          <button onClick={() => handleEdit(e)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Edit className="h-4 w-4 text-gray-500" />
          </button>
          <button onClick={() => setDeleteId(e.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <Trash2 className="h-4 w-4 text-danger-500" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gider Yönetimi</h1>
        <Button onClick={() => { form.reset({ category: 'maintenance', isRecurring: false, vendor: '', recurringPeriod: null, apartmentId: '', amount: 0, description: '', expenseDate: '' }); modal.openCreate(); }} leftIcon={<Plus className="h-4 w-4" />}>
          Gider Ekle
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          options={[{ value: 'all', label: 'Tüm Kategoriler' }, ...EXPENSE_CATEGORIES]}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Açıklama, tedarikçi ile ara..."
        emptyMessage="Gider bulunamadı"
      />

      {/* Modal */}
      <Modal isOpen={modal.isOpen} onClose={modal.close} title={modal.isEditing ? 'Gider Düzenle' : 'Gider Ekle'} size="lg">
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <Select label="Apartman" options={apartments.map((a) => ({ value: a.id, label: a.name }))} placeholder="Seçin" {...form.register('apartmentId')} error={form.formState.errors.apartmentId?.message} />
          <Select label="Kategori" options={[...EXPENSE_CATEGORIES]} {...form.register('category')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tutar (TL)" type="number" step="0.01" {...form.register('amount', { valueAsNumber: true })} error={form.formState.errors.amount?.message} />
            <Input label="Tarih" type="date" {...form.register('expenseDate')} error={form.formState.errors.expenseDate?.message} />
          </div>
          <Input label="Açıklama" {...form.register('description')} error={form.formState.errors.description?.message} />
          <Input label="Tedarikçi" {...form.register('vendor')} />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...form.register('isRecurring')} className="rounded" />
              Tekrarlayan Gider
            </label>
            {form.watch('isRecurring') && (
              <Select
                options={[
                  { value: 'monthly', label: 'Aylık' },
                  { value: 'quarterly', label: '3 Aylık' },
                  { value: 'yearly', label: 'Yıllık' },
                ]}
                {...form.register('recurringPeriod')}
              />
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={modal.close}>İptal</Button>
            <Button type="submit">{modal.isEditing ? 'Güncelle' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Silme Onayı"
        message="Bu gider kaydı silinecek. Onaylıyor musunuz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
