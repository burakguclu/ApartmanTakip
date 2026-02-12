import { useCallback, useState } from 'react';
import { dueService } from '@/services/dueService';
import { paymentService } from '@/services/paymentService';
import { expenseService } from '@/services/expenseService';
import { auditLogService } from '@/services/auditLogService';
import {
  exportDuesToExcel,
  exportPaymentsToExcel,
  exportExpensesToExcel,
  exportLogsToExcel,
  exportFinancialReport,
} from '@/services/exportService';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  FileSpreadsheet,
  CreditCard,
  Wallet,
  Receipt,
  ScrollText,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function ExportsPage() {
  const { admin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());

  const handleExport = useCallback(async (type: string) => {
    setIsLoading(true);
    try {
      switch (type) {
        case 'dues': {
          const dues = await dueService.getAll();
          exportDuesToExcel(dues);
          break;
        }
        case 'payments': {
          const payments = await paymentService.getAll();
          exportPaymentsToExcel(payments);
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
        case 'financial': {
          const [dues, payments, expenses] = await Promise.all([
            dueService.getAll(),
            paymentService.getAll(),
            expenseService.getAll(),
          ]);
          const yearDues = dues.filter((d) => d.year === exportYear);
          const yearPayments = payments.filter((p) => new Date(p.paymentDate).getFullYear() === exportYear);
          const yearExpenses = expenses.filter((e) => new Date(e.expenseDate).getFullYear() === exportYear);
          exportFinancialReport(yearDues, yearPayments, yearExpenses, exportYear);
          break;
        }
      }
      toast.success('Dışa aktarım tamamlandı');
      // Audit log
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
  }, [admin, exportYear]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dışa Aktarım</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dues Export */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Aidatlar</h3>
              <p className="text-sm text-gray-500 mt-1">Tüm aidat kayıtlarını Excel olarak indirin</p>
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

        {/* Payments Export */}
        <Card>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-success-50 rounded-lg">
              <Wallet className="h-6 w-6 text-success-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Ödemeler</h3>
              <p className="text-sm text-gray-500 mt-1">Tüm ödeme kayıtlarını Excel olarak indirin</p>
              <Button
                className="mt-3"
                size="sm"
                onClick={() => handleExport('payments')}
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
            <div className="p-3 bg-danger-50 rounded-lg">
              <Receipt className="h-6 w-6 text-danger-600" />
            </div>
            <div className="flex-1">
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
            <div className="p-3 bg-warning-50 rounded-lg">
              <ScrollText className="h-6 w-6 text-warning-600" />
            </div>
            <div className="flex-1">
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
        <Card className="md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Yıllık Finansal Rapor</h3>
              <p className="text-sm text-gray-500 mt-1">Aidatlar, ödemeler, giderler ve özet içeren çoklu sayfa rapor</p>
              <div className="flex items-center gap-3 mt-3">
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
