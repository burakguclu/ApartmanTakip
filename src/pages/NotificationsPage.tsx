import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import type { Notification } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Loading';
import { formatDateTime } from '@/utils/helpers';
import { BellOff, CheckCheck, AlertTriangle, CreditCard, Clock, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/helpers';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true);
      try {
        const data = await notificationService.getAll();
        setNotifications(data);
      } catch {
        toast.error('Bildirimler yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'overdue': return <AlertTriangle className="h-5 w-5 text-danger-500" />;
      case 'payment': return <CreditCard className="h-5 w-5 text-success-500" />;
      case 'reminder': return <Clock className="h-5 w-5 text-warning-500" />;
      default: return <Info className="h-5 w-5 text-primary-500" />;
    }
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bildirimler</h1>
          <p className="text-sm text-gray-500 mt-1">{unreadCount} okunmamış bildirim</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tümü
          </Button>
          <Button
            variant={filter === 'unread' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Okunmamış
          </Button>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} leftIcon={<CheckCheck className="h-4 w-4" />}>
              Tümünü Okundu Yap
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12">
              <BellOff className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500">Bildirim bulunamadı</p>
            </div>
          </Card>
        ) : (
          filtered.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                !notification.isRead && 'border-l-4 border-l-primary-500'
              )}
              padding={false}
            >
              <div
                className="flex items-start gap-4 p-4"
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
              >
                <div className="mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn('font-medium', !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400')}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-400">{formatDateTime(notification.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                </div>
                {!notification.isRead && (
                  <div className="h-2 w-2 rounded-full bg-primary-500 mt-2" />
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
