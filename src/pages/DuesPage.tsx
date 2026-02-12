import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dueService } from '@/services/dueService';
import { apartmentService, blockService, flatService } from '@/services/apartmentService';
import type { Due, Apartment, Block, Flat } from '@/types';
import { useModal } from '@/hooks/useCommon';
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
import { PageLoader } from '@/components/ui/Loading';
import { formatCurrency, getMonthName } from '@/utils/helpers';
import { Plus, CheckCircle, Clock, AlertTriangle, Home, LayoutGrid, List } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DuesPage() {
  const { admin } = useAuth();
  const [dues, setDues] = useState<Due[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const bulkModal = useModal();

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

  const bulkSelectedApartmentId = bulkForm.watch('apartmentId');
  const [bulkBlocks, setBulkBlocks] = useState<Block[]>([]);

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
    apartmentService.getAll().then((apts) => {
      setApartments(apts);
      if (apts.length > 0) {
        setSelectedApartmentId((prev) => prev || apts[0].id);
      }
    });
  }, [fetchDues]);

  // Load blocks and flats when apartment changes
  useEffect(() => {
    if (selectedApartmentId) {
      blockService.getByApartment(selectedApartmentId).then(setBlocks);
      flatService.getByApartment(selectedApartmentId).then(setFlats);
    } else {
      setBlocks([]);
      setFlats([]);
    }
    setSelectedBlockId('');
  }, [selectedApartmentId]);

  // Load blocks for bulk modal
  useEffect(() => {
    if (bulkSelectedApartmentId) {
      blockService.getByApartment(bulkSelectedApartmentId).then(setBulkBlocks);
    }
  }, [bulkSelectedApartmentId]);

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

  // Filter dues for the selected period and apartment
  const filteredDues = useMemo(() => {
    return dues.filter((d) => {
      if (selectedApartmentId && d.apartmentId !== selectedApartmentId) return false;
      if (selectedBlockId && d.blockId !== selectedBlockId) return false;
      if (d.month !== filterMonth) return false;
      if (d.year !== filterYear) return false;
      return true;
    });
  }, [dues, selectedApartmentId, selectedBlockId, filterMonth, filterYear]);

  // Filter flats by block
  const filteredFlats = useMemo(() => {
    if (!selectedBlockId) return flats;
    return flats.filter((f) => f.blockId === selectedBlockId);
  }, [flats, selectedBlockId]);

  // Build flat-to-due map
  const flatDueMap = useMemo(() => {
    const map: Record<string, Due> = {};
    filteredDues.forEach((d) => {
      if (d.flatId) map[d.flatId] = d;
    });
    return map;
  }, [filteredDues]);

  // Stats for the selected period
  const periodStats = useMemo(() => {
    const total = filteredDues.length;
    const paid = filteredDues.filter((d) => d.status === 'paid').length;
    const pending = filteredDues.filter((d) => d.status === 'pending').length;
    const overdue = filteredDues.filter((d) => d.status === 'overdue').length;
    const totalAmount = filteredDues.reduce((sum, d) => sum + d.amount, 0);
    const paidAmount = filteredDues
      .filter((d) => d.status === 'paid')
      .reduce((sum, d) => sum + d.paidAmount, 0);
    const collectionRate = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { total, paid, pending, overdue, totalAmount, paidAmount, collectionRate };
  }, [filteredDues]);

  const getCardStyle = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700';
      case 'pending':
        return 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700';
      case 'overdue':
        return 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700';
      case 'partial':
        return 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700';
      default:
        return 'border-gray-200 bg-gray-50 border-dashed dark:bg-gray-800/50 dark:border-gray-600';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Home className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'paid':
        return 'Ödendi';
      case 'pending':
        return 'Bekliyor';
      case 'overdue':
        return 'Gecikmiş';
      case 'partial':
        return 'Kısmi';
      default:
        return 'Aidat Yok';
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aidat Yönetimi</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleApplyLateFees}
            leftIcon={<AlertTriangle className="h-4 w-4" />}
          >
            Gecikme Faizi
          </Button>
          <Button
            onClick={() => {
              bulkForm.reset({
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                amount: 0,
                apartmentId: '',
                blockId: '',
                description: '',
              });
              bulkModal.openCreate();
            }}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Toplu Aidat Oluştur
          </Button>
        </div>
      </div>

      {/* Period & Apartment Selector */}
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Apartman"
            options={apartments.map((a) => ({ value: a.id, label: a.name }))}
            value={selectedApartmentId}
            onChange={(e) => setSelectedApartmentId(e.target.value)}
          />
          {blocks.length > 0 && (
            <Select
              label="Blok"
              options={[
                { value: '', label: 'Tüm Bloklar' },
                ...blocks.map((b) => ({ value: b.id, label: b.name })),
              ]}
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
            />
          )}
          <Select
            label="Ay"
            options={MONTHS.map((m) => ({ value: m.value, label: m.label }))}
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
          />
          <Input
            label="Yıl"
            type="number"
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="w-24"
          />
          <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50'
              }`}
              title="Tablo Görünümü"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-primary-600">{periodStats.collectionRate}%</div>
          <p className="text-sm text-gray-500 mt-1">Tahsilat Oranı</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${periodStats.collectionRate}%` }}
            />
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ödenen</p>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              {periodStats.paid} / {periodStats.total}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Bekleyen</p>
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              {periodStats.pending} adet
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Gecikmiş</p>
            <p className="font-semibold text-red-700 dark:text-red-400">
              {periodStats.overdue} adet
            </p>
          </div>
        </Card>
      </div>

      {/* Flat Payment Grid */}
      {viewMode === 'grid' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daire Ödeme Durumu — {getMonthName(filterMonth)} {filterYear}
            </h2>
            <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-400" /> Ödendi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-400" /> Bekliyor
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-400" /> Gecikmiş
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-gray-300" /> Aidat Yok
              </span>
            </div>
          </div>

          {filteredFlats.length === 0 ? (
            <Card className="text-center py-12">
              <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Bu apartmanda henüz daire bulunmuyor</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredFlats
                .sort((a, b) =>
                  a.flatNumber.localeCompare(b.flatNumber, 'tr', { numeric: true })
                )
                .map((flat) => {
                  const due = flatDueMap[flat.id];
                  const status = due?.status;
                  return (
                    <div
                      key={flat.id}
                      className={`relative border-2 rounded-xl p-3 transition-all hover:shadow-md ${getCardStyle(status)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          Daire {flat.flatNumber}
                        </span>
                        {getStatusIcon(status)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Kat: {flat.floor}
                      </div>
                      {due ? (
                        <>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(due.amount)}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span
                              className={`text-xs font-medium ${
                                status === 'paid'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : status === 'overdue'
                                    ? 'text-red-700 dark:text-red-400'
                                    : status === 'partial'
                                      ? 'text-blue-700 dark:text-blue-400'
                                      : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {getStatusText(status)}
                            </span>
                            {status !== 'paid' && (
                              <button
                                onClick={() => handleMarkPaid(due.id)}
                                className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded hover:bg-emerald-700 transition-colors"
                              >
                                Ödendi
                              </button>
                            )}
                          </div>
                          {due.lateFee > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              +{formatCurrency(due.lateFee)} gecikme
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 mt-1">
                          Henüz aidat tanımlanmamış
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Daire
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Kat
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Tutar
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Ödenen
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Gecikme
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFlats.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Daire bulunamadı
                  </td>
                </tr>
              ) : (
                filteredFlats
                  .sort((a, b) =>
                    a.flatNumber.localeCompare(b.flatNumber, 'tr', {
                      numeric: true,
                    })
                  )
                  .map((flat) => {
                    const due = flatDueMap[flat.id];
                    return (
                      <tr
                        key={flat.id}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          Daire {flat.flatNumber}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          Kat {flat.floor}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {due ? formatCurrency(due.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {due ? formatCurrency(due.paidAmount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {due && due.lateFee > 0
                            ? formatCurrency(due.lateFee)
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {due ? (
                            <Badge status={due.status} />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {due && due.status !== 'paid' ? (
                            <button
                              onClick={() => handleMarkPaid(due.id)}
                              className="text-xs bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 transition-colors"
                            >
                              Ödendi İşaretle
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {filteredDues.length > 0 && (
        <Card className="flex flex-wrap gap-6 items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Toplam Aidat:</span>
            <span className="ml-2 font-bold text-gray-900 dark:text-white">
              {formatCurrency(periodStats.totalAmount)}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Tahsil Edilen:</span>
            <span className="ml-2 font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(periodStats.paidAmount)}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Kalan:</span>
            <span className="ml-2 font-bold text-red-700 dark:text-red-400">
              {formatCurrency(periodStats.totalAmount - periodStats.paidAmount)}
            </span>
          </div>
        </Card>
      )}

      {/* Bulk Create Modal */}
      <Modal
        isOpen={bulkModal.isOpen}
        onClose={bulkModal.close}
        title="Toplu Aidat Oluştur"
      >
        <form
          onSubmit={bulkForm.handleSubmit(handleBulkCreate)}
          className="space-y-4"
        >
          <Select
            label="Apartman"
            options={apartments.map((a) => ({ value: a.id, label: a.name }))}
            placeholder="Seçin"
            {...bulkForm.register('apartmentId')}
            error={bulkForm.formState.errors.apartmentId?.message}
          />
          <Select
            label="Blok (Opsiyonel)"
            options={bulkBlocks.map((b) => ({ value: b.id, label: b.name }))}
            placeholder="Tüm Bloklar"
            {...bulkForm.register('blockId')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ay"
              options={MONTHS.map((m) => ({ value: m.value, label: m.label }))}
              {...bulkForm.register('month', { valueAsNumber: true })}
            />
            <Input
              label="Yıl"
              type="number"
              {...bulkForm.register('year', { valueAsNumber: true })}
            />
          </div>
          <Input
            label="Aidat Tutarı (TL)"
            type="number"
            step="0.01"
            {...bulkForm.register('amount', { valueAsNumber: true })}
            error={bulkForm.formState.errors.amount?.message}
          />
          <Input label="Açıklama" {...bulkForm.register('description')} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={bulkModal.close}>
              İptal
            </Button>
            <Button type="submit">Oluştur</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
