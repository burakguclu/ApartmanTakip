import { useCallback, useEffect, useState } from 'react';
import { dueService } from '@/services/dueService';
import { incomeService } from '@/services/incomeService';
import { expenseService } from '@/services/expenseService';
import { auditLogService } from '@/services/auditLogService';
import { apartmentService, blockService, flatService } from '@/services/apartmentService';
import { residentService } from '@/services/residentService';
import {
  exportDuesToExcel,
  exportIncomesToExcel,
  exportExpensesToExcel,
  exportLogsToExcel,
  exportFinancialReport,
  exportMonthlyDuesReport,
} from '@/services/exportService';
import type { Block, Flat, Resident, Apartment } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { MONTHS } from '@/utils/constants';
import {
  FileSpreadsheet,
  CreditCard,
  TrendingUp,
  Receipt,
  ScrollText,
  Download,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function ExportsPage() {
  const { admin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [dueMonth, setDueMonth] = useState(new Date().getMonth() + 1);
  const [dueYear, setDueYear] = useState(new Date().getFullYear());

  // Lookup data for enriched exports
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);

  useEffect(() => {
    apartmentService.getAll().then((apts) => {
      setApartments(apts);
      if (apts.length > 0) setSelectedApartmentId(apts[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedApartmentId) return;
    Promise.all([
      blockService.getByApartment(selectedApartmentId),
      flatService.getByApartment(selectedApartmentId),
      residentService.getByApartment(selectedApartmentId),
    ]).then(([b, f, r]) => {
      setBlocks(b);
      setFlats(f);
      setResidents(r);
    });
  }, [selectedApartmentId]);

  const lookup = { blocks, flats, residents };

  const handleExport = useCallback(async (type: string) => {
    setIsLoading(true);
    try {
      switch (type) {
        case 'dues': {
          const dues = await dueService.getAll();
          const aptDues = selectedApartmentId ? dues.filter((d) => d.apartmentId === selectedApartmentId) : dues;
          exportDuesToExcel(aptDues, lookup);
          break;
        }
        case 'incomes': {
          const incomes = await incomeService.getAll();
          exportIncomesToExcel(incomes);
          break;
        }
        case 'expenses': {
          const expenses = await expenseService.getAll();
          exportExpensesToExcel(expenses);
          break;
        }
        case 'logs': {
          const logs = await auditLogService.getAll(500);
          exportLogsToExcel(logs);
          break;
        }
        case 'monthly-dues': {
          const dues = await dueService.getAll();
          const aptDues = selectedApartmentId ? dues.filter((d) => d.apartmentId === selectedApartmentId) : dues;
          exportMonthlyDuesReport(aptDues, dueMonth, dueYear, lookup);
          break;
        }
        case 'financial': {
          const [dues, incomes, expenses] = await Promise.all([
            dueService.getAll(),
            incomeService.getAll(),
            expenseService.getAll(),
          ]);
          const yearDues = dues.filter((d) => d.year === exportYear);
          const yearIncomes = incomes.filter((i) => new Date(i.incomeDate).getFullYear() === exportYear);
          const yearExpenses = expenses.filter((e) => new Date(e.expenseDate).getFullYear() === exportYear);
          exportFinancialReport(yearDues, yearIncomes, yearExpenses, exportYear, lookup);
          break;
        }
      }
      toast.success('Dışa aktarım tamamlandı');
      if (admin) {
        await auditLogService.log({
          userId: admin.id,
          action: 'export',
          entityType: 'system',
          entityId: type,
          description: `Dışa aktarım: ${type}`,
        });
      }
    } catch {
      toast.error('Dışa aktarım başarısız');
    } finally {
      setIsLoading(false);
    }
  }, [admin, exportYear, dueMonth, dueYear, selectedApartmentId, lookup]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dışa Aktarım</h1>
        {apartments.length > 1 && (
          <Select
            label="Apartman"
            options={apartments.map((a) => ({ value: a.id, label: a.name }))}
            value={selectedApartmentId}
            onChange={(e) => setSelectedApartmentId(e.target.value)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Monthly Dues Report (NEW - Primary) */}
        <Card className="sm:col-span-2 lg:col-span-3 border-2 border-primary-200 dark:border-primary-800">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg shrink-0">
              <CalendarDays className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Aylık Aidat Raporu</h3>
              <p className="text-sm text-gray-500 mt-1">
                Seçilen ay için daire bazlı aidat ödeme durumu — hangi daire ödedi, bekleyen, gecikmiş detaylı rapor
              </p>
              <div className="flex flex-wrap items-end gap-3 mt-3">
                <Select
                  label="Ay"
                  options={MONTHS.map((m) => ({ value: m.value, label: m.label }))}
                  value={dueMonth}
                  onChange={(e) => setDueMonth(Number(e.target.value))}
                />
                <Input
                  label="Yıl"
                  type="number"
                  value={dueYear}
                  onChange={(e) => setDueYear(Number(e.target.value))}
                  className="w-24"
                />
                <Button
                  size="sm"
                  onClick={() => handleExport('monthly-dues')}
                  isLoading={isLoading}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Rapor İndir
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Dues Export */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg shrink-0">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">Aidatlar</h3>
              <p className="text-sm text-gray-500 mt-1">Blok, daire, sakin bilgili aidat listesi</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => handleExport('dues')}
                isLoading={isLoading}
                leftIcon={<Download className="h-4 w-4" />}
              >
                İndir
              </Button>
            </div>
          </div>
        </Card>

        {/* Incomes Export */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-success-50 rounded-lg shrink-0">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">Gelirler</h3>
              <p className="text-sm text-gray-500 mt-1">Tüm gelir kayıtlarını Excel olarak indirin</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => handleExport('incomes')}
                isLoading={isLoading}
                leftIcon={<Download className="h-4 w-4" />}
              >
                İndir
              </Button>
            </div>
          </div>
        </Card>

        {/* Expenses Export */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-danger-50 rounded-lg shrink-0">
              <Receipt className="h-6 w-6 text-danger-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">Giderler</h3>
              <p className="text-sm text-gray-500 mt-1">Tüm gider kayıtlarını Excel olarak indirin</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => handleExport('expenses')}
                isLoading={isLoading}
                leftIcon={<Download className="h-4 w-4" />}
              >
                İndir
              </Button>
            </div>
          </div>
        </Card>

        {/* Audit Logs Export */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-warning-50 rounded-lg shrink-0">
              <ScrollText className="h-6 w-6 text-warning-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">İşlem Kayıtları</h3>
              <p className="text-sm text-gray-500 mt-1">İşlem loglarını Excel olarak indirin</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => handleExport('logs')}
                isLoading={isLoading}
                leftIcon={<Download className="h-4 w-4" />}
              >
                İndir
              </Button>
            </div>
          </div>
        </Card>

        {/* Financial Report */}
        <Card className="sm:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg shrink-0">
              <FileSpreadsheet className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">Yıllık Finansal Rapor</h3>
              <p className="text-sm text-gray-500 mt-1">
                Aidatlar, gelirler, giderler, aylık özet ve kategori analizi içeren çoklu sayfa rapor
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Input
                  type="number"
                  value={exportYear}
                  onChange={(e) => setExportYear(Number(e.target.value))}
                  className="w-24"
                />
                <Button
                  size="sm"
                  onClick={() => handleExport('financial')}
                  isLoading={isLoading}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Rapor İndir
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
