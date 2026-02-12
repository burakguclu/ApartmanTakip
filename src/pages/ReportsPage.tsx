import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { StatCard } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/Loading';
import { formatCurrency, getMonthName, getStatusLabel } from '@/utils/helpers';
import { dueService } from '@/services/dueService';
import { paymentService } from '@/services/paymentService';
import { expenseService } from '@/services/expenseService';
import { generateFinancialSummaryPDF } from '@/services/pdfService';
import { exportFinancialReport } from '@/services/exportService';
import type { Due, Payment, Expense } from '@/types';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [dues, setDues] = useState<Due[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [d, p, e] = await Promise.all([
          dueService.getAll(),
          paymentService.getAll(),
          expenseService.getAll(),
        ]);
        setDues(d);
        setPayments(p);
        setExpenses(e);
      } catch {
        toast.error('Veriler yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const yearDues = dues.filter((d) => d.year === year);
  const yearPayments = payments.filter((p) => new Date(p.paymentDate).getFullYear() === year);
  const yearExpenses = expenses.filter((e) => new Date(e.expenseDate).getFullYear() === year);

  const totalIncome = yearPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const mPayments = yearPayments.filter((p) => new Date(p.paymentDate).getMonth() === i);
    const mExpenses = yearExpenses.filter((e) => new Date(e.expenseDate).getMonth() === i);
    return {
      month: getMonthName(month).slice(0, 3),
      gelir: mPayments.reduce((sum, p) => sum + p.amount, 0),
      gider: mExpenses.reduce((sum, e) => sum + e.amount, 0),
    };
  });

  // Expense breakdown by category
  const categoryMap = new Map<string, number>();
  yearExpenses.forEach((e) => {
    categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
  });
  const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
    name: getStatusLabel(name),
    value,
  }));

  // Collection rate
  const totalDueAmount = yearDues.reduce((sum, d) => sum + d.amount, 0);
  const totalPaidAmount = yearDues.reduce((sum, d) => sum + d.paidAmount, 0);
  const collectionRate = totalDueAmount > 0 ? ((totalPaidAmount / totalDueAmount) * 100).toFixed(1) : '0';

  const handleExportPDF = () => {
    generateFinancialSummaryPDF(yearDues, totalIncome, totalExpense, `${year}`);
    toast.success('PDF raporu indirildi');
  };

  const handleExportExcel = () => {
    exportFinancialReport(yearDues, yearPayments, yearExpenses, year);
    toast.success('Excel raporu indirildi');
  };

  if (isLoading) return <PageLoader />;

  const years = Array.from({ length: 10 }, (_, i) => ({
    value: new Date().getFullYear() - i,
    label: String(new Date().getFullYear() - i),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Raporlar & Analiz</h1>
        <div className="flex items-center gap-3">
          <Select options={years} value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <Button variant="secondary" onClick={handleExportPDF} leftIcon={<FileText className="h-4 w-4" />}>
            PDF
          </Button>
          <Button variant="secondary" onClick={handleExportExcel} leftIcon={<Download className="h-4 w-4" />}>
            Excel
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Toplam Gelir" value={formatCurrency(totalIncome)} icon={<TrendingUp className="h-6 w-6 text-success-600" />} />
        <StatCard title="Toplam Gider" value={formatCurrency(totalExpense)} icon={<TrendingDown className="h-6 w-6 text-danger-600" />} />
        <StatCard title="Net Bakiye" value={formatCurrency(netBalance)} icon={<DollarSign className="h-6 w-6 text-primary-600" />} />
        <StatCard title="Tahsilat Oranı" value={`%${collectionRate}`} icon={<TrendingUp className="h-6 w-6 text-primary-600" />} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income/Expense Bar */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aylık Gelir/Gider</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(val) => formatCurrency(Number(val))} />
              <Legend />
              <Bar dataKey="gelir" name="Gelir" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gider" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Net Balance Line */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kümülatif Bakiye</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData.map((d, i) => ({
              ...d,
              bakiye: monthlyData.slice(0, i + 1).reduce((sum, m) => sum + m.gelir - m.gider, 0),
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(val) => formatCurrency(Number(val))} />
              <Line type="monotone" dataKey="bakiye" name="Bakiye" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Pie */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gider Dağılımı</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">Veri yok</div>
          )}
        </Card>

        {/* Due Status Summary */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aidat Durumu</h2>
          <div className="space-y-4">
            {['paid', 'pending', 'partial', 'overdue'].map((status) => {
              const count = yearDues.filter((d) => d.status === status).length;
              const total = yearDues.length;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{getStatusLabel(status)}</span>
                    <span className="font-medium">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'paid' ? 'bg-success-500' :
                        status === 'pending' ? 'bg-warning-500' :
                        status === 'partial' ? 'bg-primary-500' : 'bg-danger-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
