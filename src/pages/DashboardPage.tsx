import { useEffect, useState } from 'react';
import { StatCard } from '@/components/ui/Card';
import Card from '@/components/ui/Card';
import { StatCardSkeleton } from '@/components/ui/Loading';
import { formatCurrency } from '@/utils/helpers';
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Home,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { apartmentService } from '@/services/apartmentService';
import { residentService } from '@/services/residentService';
import { dueService } from '@/services/dueService';
import { incomeService } from '@/services/incomeService';
import { expenseService } from '@/services/expenseService';
import type { Due, Income, Expense } from '@/types';

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApartments: 0,
    totalResidents: 0,
    totalFlats: 0,
    overdueCount: 0,
    overdueAmount: 0,
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; gelir: number; gider: number }[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [apartments, residents, dues, incomes, expenses] = await Promise.all([
          apartmentService.getAll(),
          residentService.getActive(),
          dueService.getAll(),
          incomeService.getAll(),
          expenseService.getAll(),
        ]);

        const overdueDues = dues.filter((d: Due) => d.status === 'overdue');
        const totalIncome = incomes.reduce((sum: number, i: Income) => sum + i.amount, 0);
        const totalExpense = expenses.reduce((sum: number, e: Expense) => sum + e.amount, 0);

        setStats({
          totalApartments: apartments.length,
          totalResidents: residents.length,
          totalFlats: apartments.reduce((sum, a) => sum + (a.totalFlats || 0), 0),
          overdueCount: overdueDues.length,
          overdueAmount: overdueDues.reduce((sum: number, d: Due) => sum + d.amount + d.lateFee - d.paidAmount, 0),
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
        });

        // Monthly data
        const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        const currentYear = new Date().getFullYear();
        const monthly = monthNames.map((month, idx) => {
          const monthIncomes = incomes.filter((i: Income) => {
            const d = new Date(i.incomeDate);
            return d.getMonth() === idx && d.getFullYear() === currentYear;
          });
          const monthExpenses = expenses.filter((e: Expense) => {
            const d = new Date(e.expenseDate);
            return d.getMonth() === idx && d.getFullYear() === currentYear;
          });
          return {
            month,
            gelir: monthIncomes.reduce((sum: number, i: Income) => sum + i.amount, 0),
            gider: monthExpenses.reduce((sum: number, e: Expense) => sum + e.amount, 0),
          };
        });
        setMonthlyData(monthly);

        // Expense breakdown
        const categoryMap = new Map<string, number>();
        expenses.forEach((e: Expense) => {
          const current = categoryMap.get(e.category) || 0;
          categoryMap.set(e.category, current + e.amount);
        });
        setExpenseBreakdown(
          Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))
        );
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <StatCardSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam Gelir"
          value={formatCurrency(stats.totalIncome)}
          icon={<TrendingUp className="h-6 w-6 text-success-600" />}
        />
        <StatCard
          title="Toplam Gider"
          value={formatCurrency(stats.totalExpense)}
          icon={<TrendingDown className="h-6 w-6 text-danger-600" />}
        />
        <StatCard
          title="Net Bakiye"
          value={formatCurrency(stats.netBalance)}
          icon={<DollarSign className="h-6 w-6 text-primary-600" />}
        />
        <StatCard
          title="Gecikmiş Aidat"
          value={`${stats.overdueCount} adet`}
          icon={<AlertTriangle className="h-6 w-6 text-warning-600" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Apartmanlar"
          value={stats.totalApartments}
          icon={<Building2 className="h-6 w-6 text-primary-600" />}
        />
        <StatCard
          title="Sakinler"
          value={stats.totalResidents}
          icon={<Users className="h-6 w-6 text-primary-600" />}
        />
        <StatCard
          title="Toplam Daire"
          value={stats.totalFlats}
          icon={<Home className="h-6 w-6 text-primary-600" />}
        />
        <StatCard
          title="Gecikmiş Tutar"
          value={formatCurrency(stats.overdueAmount)}
          icon={<CreditCard className="h-6 w-6 text-danger-600" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income/Expense Chart */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aylık Gelir & Gider</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="gelir" name="Gelir" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gider" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gider Dağılımı</h2>
          {expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {expenseBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              Henüz gider kaydı bulunmuyor
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
