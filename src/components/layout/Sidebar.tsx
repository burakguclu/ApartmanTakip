import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Receipt,
  BarChart3,
  FileSpreadsheet,
  ScrollText,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/utils/helpers';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/apartments', label: 'Apartmanlar', icon: Building2 },
  { path: '/residents', label: 'Sakinler', icon: Users },
  { path: '/dues', label: 'Aidatlar', icon: CreditCard },
  { path: '/incomes', label: 'Gelirler', icon: TrendingUp },
  { path: '/expenses', label: 'Giderler', icon: Receipt },
  { path: '/reports', label: 'Raporlar', icon: BarChart3 },
  { path: '/exports', label: 'Dışa Aktarım', icon: FileSpreadsheet },
  { path: '/audit-logs', label: 'İşlem Kayıtları', icon: ScrollText },
  { path: '/notifications', label: 'Bildirimler', icon: Bell },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const location = useLocation();

  const renderNav = (collapsed: boolean, onClickLink?: () => void) => (
    <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClickLink}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-active text-white'
                : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-sidebar text-white transition-all duration-300 z-50 flex-col',
          'hidden lg:flex',
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary-400" />
              <span className="font-bold text-lg">ApartmanTakip</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-sidebar-hover transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        {renderNav(isCollapsed)}
        {!isCollapsed && (
          <div className="px-4 py-3 border-t border-white/10 text-xs text-gray-400">
            <p>v1.0.0</p>
            <p>© 2026 ApartmanTakip</p>
          </div>
        )}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-sidebar text-white transition-transform duration-300 z-50 flex flex-col lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary-400" />
            <span className="font-bold text-lg">ApartmanTakip</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-sidebar-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {renderNav(false, () => setIsMobileOpen(false))}
        <div className="px-4 py-3 border-t border-white/10 text-xs text-gray-400">
          <p>v1.0.0</p>
          <p>© 2026 ApartmanTakip</p>
        </div>
      </aside>
    </>
  );
}
