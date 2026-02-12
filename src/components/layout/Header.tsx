import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, LogOut, Bell, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationService } from '@/services/notificationService';

export default function Header() {
  const { admin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const unread = await notificationService.getUnread();
        setUnreadCount(unread.length);
      } catch {
        // Silently fail
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Apartman Yönetim Sistemi
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-danger-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={isDark ? 'Açık Mod' : 'Koyu Mod'}
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-yellow-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-500" />
          )}
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {admin?.displayName || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{admin?.role || 'admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Çıkış Yap"
          >
            <LogOut className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
