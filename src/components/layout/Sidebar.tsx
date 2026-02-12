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
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import { useState } from 'react';

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

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-sidebar text-white transition-all duration-300 z-40 flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
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

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-white/10 text-xs text-gray-400">
          <p>v1.0.0</p>
          <p>© 2026 ApartmanTakip</p>
        </div>
      )}
    </aside>
  );
}
