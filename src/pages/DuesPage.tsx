import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dueService } from '@/services/dueService';
import { apartmentService, blockService } from '@/services/apartmentService';
import type { Due, Apartment, Block } from '@/types';
import { useModal, useSearch } from '@/hooks/useCommon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bulkDueSchema, type BulkDueFormData } from '@/utils/validations';
import { MONTHS } from '@/utils/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import { PageLoader } from '@/components/ui/Loading';
import { formatCurrency, formatDate, getMonthName } from '@/utils/helpers';
import { CreditCard, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DuesPage() {
  const { admin } = useAuth();
  const [dues, setDues] = useState<Due[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const bulkModal = useModal();
  const { searchTerm, handleSearch } = useSearch();

  const bulkForm = useForm<BulkDueFormData>({
    resolver: zodResolver(bulkDueSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: 0,
      description: '',
      blockId: '',
    },
  });

  const selectedApartmentId = bulkForm.watch('apartmentId');

  const fetchDues = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dueService.getAll();
      setDues(data);
    } catch {
      toast.error('Aidatlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDues();
    apartmentService.getAll().then(setApartments);
  }, [fetchDues]);

  useEffect(() => {
    if (selectedApartmentId) {
      blockService.getByApartment(selectedApartmentId).then(setBlocks);
    }
  }, [selectedApartmentId]);

  const handleBulkCreate = async (data: BulkDueFormData) => {
    if (!admin) return;
    try {
      const ids = await dueService.bulkCreate(data, admin.id);
      toast.success(`${ids.length} aidat oluşturuldu`);
      bulkModal.close();
      bulkForm.reset();
      fetchDues();
    } catch {
      toast.error('Toplu aidat oluşturma başarısız');
    }
  };

  const handleMarkPaid = async (dueId: string) => {
    if (!admin) return;
    try {
      await dueService.markAsPaid(dueId, admin.id);
      toast.success('Aidat ödendi olarak işaretlendi');
      fetchDues();
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleApplyLateFees = async () => {
    if (!admin) return;
    try {
      const count = await dueService.applyLateFees(admin.id);
      if (count > 0) {
        toast.success(`${count} aidata gecikme faizi uygulandı`);
        fetchDues();
      } else {
        toast.success('Gecikmiş aidat bulunamadı');
      }
    } catch {
      toast.error('Gecikme faizi uygulanamadı');
    }
  };

  // Filters
  const filtered = dues.filter((d) => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (filterYear && d.year !== filterYear) return false;
    return true;
  });

  // Stats
  const pendingCount = dues.filter((d) => d.status === 'pending').length;
  const paidCount = dues.filter((d) => d.status === 'paid').length;
  const overdueCount = dues.filter((d) => d.status === 'overdue').length;
  const totalAmount = dues.reduce((sum, d) => sum + d.amount, 0);

  const columns: ColumnDef<Due>[] = [
    {
      key: 'period',
      title: 'Dönem',
      render: (d) => <span className="font-medium">{getMonthName(d.month)} {d.year}</span>,
    },
    { key: 'amount', title: 'Tutar', render: (d) => formatCurrency(d.amount) },
    { key: 'paid', title: 'Ödenen', render: (d) => formatCurrency(d.paidAmount) },
    { key: 'lateFee', title: 'Gecikme', render: (d) => d.lateFee > 0 ? formatCurrency(d.lateFee) : '-' },
    { key: 'dueDate', title: 'Son Ödeme', render: (d) => formatDate(d.dueDate) },
    { key: 'status', title: 'Durum', render: (d) => <Badge status={d.status} /> },
    {
      key: 'actions',
      title: '',
      render: (d) => d.status !== 'paid' ? (
        <Button size="sm" variant="ghost" onClick={() => handleMarkPaid(d.id)}>
          <CheckCircle className="h-4 w-4 text-success-600" />
        </Button>
      ) : null,
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aidat Yönetimi</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleApplyLateFees} leftIcon={<AlertTriangle className="h-4 w-4" />}>
            Gecikme Faizi Uygula
          </Button>
          <Button onClick={() => { bulkForm.reset({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 0, apartmentId: '', blockId: '', description: '' }); bulkModal.openCreate(); }} leftIcon={<Plus className="h-4 w-4" />}>
            Toplu Aidat Oluştur
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <CreditCard className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Toplam</p>
            <p className="font-semibold">{formatCurrency(totalAmount)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-warning-50 rounded-lg">
            <Clock className="h-5 w-5 text-warning-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Bekleyen</p>
            <p className="font-semibold">{pendingCount} adet</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-success-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-success-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ödenen</p>
            <p className="font-semibold">{paidCount} adet</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-danger-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-danger-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Gecikmiş</p>
            <p className="font-semibold">{overdueCount} adet</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          options={[
            { value: 'all', label: 'Tüm Durumlar' },
            { value: 'pending', label: 'Bekleyen' },
            { value: 'paid', label: 'Ödenen' },
            { value: 'partial', label: 'Kısmi' },
            { value: 'overdue', label: 'Gecikmiş' },
          ]}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        />
        <Input
          type="number"
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
          className="w-24"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Aidat ara..."
        emptyMessage="Aidat bulunamadı"
      />

      {/* Bulk Create Modal */}
      <Modal isOpen={bulkModal.isOpen} onClose={bulkModal.close} title="Toplu Aidat Oluştur">
        <form onSubmit={bulkForm.handleSubmit(handleBulkCreate)} className="space-y-4">
          <Select label="Apartman" options={apartments.map((a) => ({ value: a.id, label: a.name }))} placeholder="Seçin" {...bulkForm.register('apartmentId')} error={bulkForm.formState.errors.apartmentId?.message} />
          <Select label="Blok (Opsiyonel)" options={blocks.map((b) => ({ value: b.id, label: b.name }))} placeholder="Tüm Bloklar" {...bulkForm.register('blockId')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Ay" options={MONTHS.map((m) => ({ value: m.value, label: m.label }))} {...bulkForm.register('month', { valueAsNumber: true })} />
            <Input label="Yıl" type="number" {...bulkForm.register('year', { valueAsNumber: true })} />
          </div>
          <Input label="Aidat Tutarı (TL)" type="number" step="0.01" {...bulkForm.register('amount', { valueAsNumber: true })} error={bulkForm.formState.errors.amount?.message} />
          <Input label="Açıklama" {...bulkForm.register('description')} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={bulkModal.close}>İptal</Button>
            <Button type="submit">Oluştur</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
