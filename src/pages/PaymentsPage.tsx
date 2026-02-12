import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { paymentService } from '@/services/paymentService';
import { dueService } from '@/services/dueService';
import type { Payment, Due } from '@/types';
import { useModal, useSearch } from '@/hooks/useCommon';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSchema, type PaymentFormData } from '@/utils/validations';
import { PAYMENT_METHODS } from '@/utils/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import { PageLoader } from '@/components/ui/Loading';
import { formatCurrency, formatDate, getMonthName } from '@/utils/helpers';
import { generateReceiptPDF } from '@/services/pdfService';
import { Plus, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const { admin } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingDues, setPendingDues] = useState<Due[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const modal = useModal();
  const { searchTerm, handleSearch } = useSearch();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: 'cash',
      bankReference: '',
      description: '',
      installmentNumber: null,
      totalInstallments: null,
    },
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await paymentService.getAll();
      setPayments(data);
    } catch {
      toast.error('Ödemeler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPendingDues = useCallback(async () => {
    try {
      const allDues = await dueService.getAll();
      setPendingDues(allDues.filter((d) => d.status !== 'paid'));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchPendingDues();
  }, [fetchPayments, fetchPendingDues]);

  const handleSave = async (data: PaymentFormData) => {
    if (!admin) return;
    try {
      const due = pendingDues.find((d) => d.id === data.dueId);
      if (!due) {
        toast.error('Aidat bulunamadı');
        return;
      }
      await paymentService.create(data, due, admin.id);
      toast.success('Ödeme kaydedildi');
      modal.close();
      form.reset();
      fetchPayments();
      fetchPendingDues();
    } catch {
      toast.error('Ödeme kaydedilemedi');
    }
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    await generateReceiptPDF(payment, payment.flatId, payment.residentId);
    toast.success('Makbuz indirildi');
  };

  // Filters
  const filtered = payments.filter((p) => {
    if (filterMethod !== 'all' && p.paymentMethod !== filterMethod) return false;
    if (filterDateFrom && p.paymentDate < filterDateFrom) return false;
    if (filterDateTo && p.paymentDate > filterDateTo) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.receiptNumber.toLowerCase().includes(term) ||
        p.bankReference.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const columns: ColumnDef<Payment>[] = [
    { key: 'date', title: 'Tarih', render: (p) => formatDate(p.paymentDate) },
    { key: 'receipt', title: 'Makbuz No', render: (p) => <span className="font-mono text-xs">{p.receiptNumber}</span> },
    { key: 'amount', title: 'Tutar', render: (p) => <span className="font-semibold">{formatCurrency(p.amount)}</span> },
    { key: 'method', title: 'Yöntem', render: (p) => <Badge status={p.paymentMethod} /> },
    { key: 'reference', title: 'Referans', render: (p) => p.bankReference || '-' },
    { key: 'desc', title: 'Açıklama', render: (p) => p.description || '-' },
    {
      key: 'actions',
      title: '',
      render: (p) => (
        <Button size="sm" variant="ghost" onClick={() => handleDownloadReceipt(p)} title="Makbuz İndir">
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ödeme Yönetimi</h1>
        <Button onClick={() => { form.reset(); modal.openCreate(); }} leftIcon={<Plus className="h-4 w-4" />}>
          Ödeme Kaydet
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          options={[
            { value: 'all', label: 'Tüm Yöntemler' },
            ...PAYMENT_METHODS,
          ]}
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
        />
        <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} placeholder="Başlangıç" />
        <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} placeholder="Bitiş" />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Makbuz no, referans ile ara..."
        emptyMessage="Ödeme bulunamadı"
      />

      {/* Payment Modal */}
      <Modal isOpen={modal.isOpen} onClose={modal.close} title="Ödeme Kaydet">
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <Select
            label="Aidat"
            options={pendingDues.map((d) => ({
              value: d.id,
              label: `${getMonthName(d.month)} ${d.year} - ${formatCurrency(d.amount - d.paidAmount)} kalan`,
            }))}
            placeholder="Aidat seçin"
            {...form.register('dueId')}
            error={form.formState.errors.dueId?.message}
          />
          <Input label="Tutar (TL)" type="number" step="0.01" {...form.register('amount', { valueAsNumber: true })} error={form.formState.errors.amount?.message} />
          <Input label="Ödeme Tarihi" type="date" {...form.register('paymentDate')} error={form.formState.errors.paymentDate?.message} />
          <Select label="Ödeme Yöntemi" options={[...PAYMENT_METHODS]} {...form.register('paymentMethod')} />
          <Input label="Banka Referans No" {...form.register('bankReference')} />
          <Input label="Açıklama" {...form.register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Taksit No" type="number" {...form.register('installmentNumber', { valueAsNumber: true })} />
            <Input label="Toplam Taksit" type="number" {...form.register('totalInstallments', { valueAsNumber: true })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={modal.close}>İptal</Button>
            <Button type="submit" leftIcon={<FileText className="h-4 w-4" />}>Kaydet</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
