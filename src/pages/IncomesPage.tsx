import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { incomeService } from '@/services/incomeService';
import { apartmentService } from '@/services/apartmentService';
import type { Income, Apartment } from '@/types';
import { useModal, useSearch } from '@/hooks/useCommon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeSchema, type IncomeFormData } from '@/utils/validations';
import { INCOME_CATEGORIES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import { PageLoader } from '@/components/ui/Loading';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function IncomesPage() {
  const { admin } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterApartmentId, setFilterApartmentId] = useState('all');

  const modal = useModal();
  const { searchTerm, handleSearch } = useSearch();

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { category: 'dues', payer: '', description: '' },
  });

  const fetchIncomes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await incomeService.getAll();
      setIncomes(data);
    } catch {
      toast.error('Gelirler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
    apartmentService.getAll().then(setApartments);
  }, [fetchIncomes]);

  const handleSave = async (data: IncomeFormData) => {
    if (!admin) return;
    try {
      if (modal.editingId) {
        const old = incomes.find((e) => e.id === modal.editingId);
        if (old) await incomeService.update(modal.editingId, data, admin.id, old);
        toast.success('Gelir güncellendi');
      } else {
        await incomeService.create(data, admin.id);
        toast.success('Gelir eklendi');
      }
      modal.close();
      form.reset();
      fetchIncomes();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleEdit = (income: Income) => {
    form.reset({
      apartmentId: income.apartmentId,
      category: income.category,
      amount: income.amount,
      description: income.description,
      payer: income.payer,
      incomeDate: income.incomeDate,
    });
    modal.openEdit(income.id);
  };

  const handleDelete = async () => {
    if (!admin || !deleteId) return;
    const income = incomes.find((e) => e.id === deleteId);
    if (income) {
      try {
        await incomeService.delete(deleteId, admin.id, income.description);
        toast.success('Gelir silindi');
        fetchIncomes();
      } catch {
        toast.error('Silme başarısız');
      }
    }
    setDeleteId(null);
  };

  const filtered = incomes.filter((i) => {
    if (filterApartmentId !== 'all' && i.apartmentId !== filterApartmentId) return false;
    if (filterCategory !== 'all' && i.category !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        i.description.toLowerCase().includes(term) ||
        i.payer.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalAmount = filtered.reduce((sum, i) => sum + i.amount, 0);

  const columns: ColumnDef<Income>[] = [
    { key: 'apartment', title: 'Apartman', render: (i) => {
      const apt = apartments.find((a) => a.id === i.apartmentId);
      return <span className="font-medium">{apt?.name ?? '-'}</span>;
    }},
    { key: 'date', title: 'Tarih', render: (i) => formatDate(i.incomeDate) },
    { key: 'category', title: 'Kategori', render: (i) => <Badge status={i.category} /> },
    {
      key: 'amount',
      title: 'Tutar',
      render: (i) => (
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
          +{formatCurrency(i.amount)}
        </span>
      ),
    },
    { key: 'payer', title: 'Ödemeyi Yapan', render: (i) => i.payer || '-' },
    { key: 'desc', title: 'Açıklama', render: (i) => i.description },
    {
      key: 'actions',
      title: '',
      render: (i) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleEdit(i); }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Edit className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(i.id); }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gelir Yönetimi</h1>
        <Button
          onClick={() => {
            form.reset({
              category: 'dues',
              payer: '',
              description: '',
              apartmentId: filterApartmentId !== 'all' ? filterApartmentId : '',
              amount: 0,
              incomeDate: new Date().toISOString().split('T')[0],
            });
            modal.openCreate();
          }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Gelir Ekle
        </Button>
      </div>

      {/* Summary */}
      <Card className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">Toplam Gelir</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          options={[
            { value: 'all', label: 'Tüm Apartmanlar' },
            ...apartments.map((a) => ({ value: a.id, label: a.name })),
          ]}
          value={filterApartmentId}
          onChange={(e) => setFilterApartmentId(e.target.value)}
        />
        <Select
          options={[
            { value: 'all', label: 'Tüm Kategoriler' },
            ...INCOME_CATEGORIES,
          ]}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Gelir ara..."
        emptyMessage="Gelir bulunamadı"
      />

      {/* Income Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.isEditing ? 'Gelir Düzenle' : 'Gelir Ekle'}
      >
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <Select
            label="Apartman"
            options={apartments.map((a) => ({ value: a.id, label: a.name }))}
            placeholder="Seçin"
            {...form.register('apartmentId')}
            error={form.formState.errors.apartmentId?.message}
          />
          <Select
            label="Kategori"
            options={[...INCOME_CATEGORIES]}
            {...form.register('category')}
            error={form.formState.errors.category?.message}
          />
          <Input
            label="Tutar (TL)"
            type="number"
            step="0.01"
            {...form.register('amount', { valueAsNumber: true })}
            error={form.formState.errors.amount?.message}
          />
          <Input
            label="Açıklama"
            {...form.register('description')}
            error={form.formState.errors.description?.message}
          />
          <Input label="Ödemeyi Yapan" {...form.register('payer')} />
          <Input
            label="Gelir Tarihi"
            type="date"
            {...form.register('incomeDate')}
            error={form.formState.errors.incomeDate?.message}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={modal.close}>
              İptal
            </Button>
            <Button type="submit">
              {modal.isEditing ? 'Güncelle' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Silme Onayı"
        message="Bu gelir kaydı silinecek. Onaylıyor musunuz?"
        confirmLabel="Sil"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
