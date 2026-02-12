import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import { PageLoader } from '@/components/ui/Loading';

// Lazy loaded pages
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ApartmentsPage = lazy(() => import('@/pages/ApartmentsPage'));
const ResidentsPage = lazy(() => import('@/pages/ResidentsPage'));
const DuesPage = lazy(() => import('@/pages/DuesPage'));
const PaymentsPage = lazy(() => import('@/pages/PaymentsPage'));
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const ExportsPage = lazy(() => import('@/pages/ExportsPage'));
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/apartments" element={<ApartmentsPage />} />
            <Route path="/residents" element={<ResidentsPage />} />
            <Route path="/dues" element={<DuesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/exports" element={<ExportsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
