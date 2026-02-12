import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { cn } from '@/utils/helpers';

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div
        className={cn(
          'flex-1 transition-all duration-300',
          'ml-0 lg:ml-64',
          isCollapsed && 'lg:ml-16'
        )}
      >
        <Header onMenuToggle={() => setIsMobileOpen(true)} />
        <main className="p-3 sm:p-4 md:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
