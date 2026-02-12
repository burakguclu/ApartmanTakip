import { useEffect, useState } from 'react';
import { auditLogService } from '@/services/auditLogService';
import { exportLogsToExcel } from '@/services/exportService';
import type { AuditLog } from '@/types';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DataTable, { type ColumnDef } from '@/components/ui/DataTable';
import { PageLoader } from '@/components/ui/Loading';
import { useSearch } from '@/hooks/useCommon';
import { formatDateTime } from '@/utils/helpers';
import { Download, Clock, User, FileText, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const { searchTerm, handleSearch } = useSearch();

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      try {
        const data = await auditLogService.getAll(500);
        setLogs(data);
      } catch {
        toast.error('Kayıtlar yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (filterEntity !== 'all' && log.entityType !== filterEntity) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.description.toLowerCase().includes(term) ||
        log.userEmail.toLowerCase().includes(term) ||
        log.userId.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleExport = () => {
    exportLogsToExcel(filtered);
    toast.success('Kayıtlar dışa aktarıldı');
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout': return <Shield className="h-4 w-4 text-primary-500" />;
      case 'create': return <FileText className="h-4 w-4 text-success-500" />;
      case 'update': return <FileText className="h-4 w-4 text-warning-500" />;
      case 'delete': return <FileText className="h-4 w-4 text-danger-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Oluşturma',
      update: 'Güncelleme',
      delete: 'Silme',
      login: 'Giriş',
      logout: 'Çıkış',
      export: 'Dışa Aktarım',
      approve: 'Onay',
      reject: 'Red',
    };
    return labels[action] || action;
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'timestamp',
      title: 'Tarih/Saat',
      render: (log) => (
        <span className="text-sm whitespace-nowrap">{formatDateTime(log.timestamp)}</span>
      ),
    },
    {
      key: 'action',
      title: 'İşlem',
      render: (log) => (
        <div className="flex items-center gap-2">
          {getActionIcon(log.action)}
          <span className="text-sm font-medium">{getActionLabel(log.action)}</span>
        </div>
      ),
    },
    {
      key: 'entity',
      title: 'Varlık',
      render: (log) => <span className="text-sm capitalize">{log.entityType}</span>,
    },
    {
      key: 'description',
      title: 'Açıklama',
      render: (log) => <span className="text-sm">{log.description}</span>,
    },
    {
      key: 'user',
      title: 'Kullanıcı',
      render: (log) => (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{log.userEmail || log.userId.slice(0, 8)}</span>
        </div>
      ),
    },
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">İşlem Kayıtları</h1>
        <Button variant="secondary" onClick={handleExport} leftIcon={<Download className="h-4 w-4" />}>
          Excel İndir
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          options={[
            { value: 'all', label: 'Tüm İşlemler' },
            { value: 'create', label: 'Oluşturma' },
            { value: 'update', label: 'Güncelleme' },
            { value: 'delete', label: 'Silme' },
            { value: 'login', label: 'Giriş' },
            { value: 'logout', label: 'Çıkış' },
            { value: 'export', label: 'Dışa Aktarım' },
          ]}
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        />
        <Select
          options={[
            { value: 'all', label: 'Tüm Varlıklar' },
            { value: 'apartment', label: 'Apartman' },
            { value: 'block', label: 'Blok' },
            { value: 'flat', label: 'Daire' },
            { value: 'resident', label: 'Sakin' },
            { value: 'due', label: 'Aidat' },
            { value: 'payment', label: 'Ödeme' },
            { value: 'expense', label: 'Gider' },
            { value: 'admin', label: 'Admin' },
          ]}
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
        />
      </div>

      <Card className="text-sm text-gray-500 dark:text-gray-400" padding={true}>
        Toplam {filtered.length} kayıt gösteriliyor
      </Card>

      <DataTable
        columns={columns}
        data={filtered}
        searchValue={searchTerm}
        onSearchChange={handleSearch}
        searchPlaceholder="Açıklama, kullanıcı ile ara..."
        emptyMessage="Kayıt bulunamadı"
      />
    </div>
  );
}
