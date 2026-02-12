import {
  createDocument,
  updateDocument,
  getDocuments,
} from './firestoreService';
import { where, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '@/utils/constants';
import type { Notification, NotificationType, EntityType } from '@/types';
import { getCurrentTimestamp } from '@/utils/helpers';

export const notificationService = {
  async create(
    type: NotificationType,
    title: string,
    message: string,
    entityType: EntityType,
    entityId: string
  ): Promise<string> {
    return createDocument<Record<string, unknown>>(COLLECTIONS.NOTIFICATIONS, {
      type,
      title,
      message,
      isRead: false,
      entityType,
      entityId,
      readAt: null,
    });
  },

  async markAsRead(id: string): Promise<void> {
    await updateDocument(COLLECTIONS.NOTIFICATIONS, id, {
      isRead: true,
      readAt: getCurrentTimestamp(),
    });
  },

  async markAllAsRead(): Promise<void> {
    const unread = await this.getUnread();
    for (const notification of unread) {
      await this.markAsRead(notification.id);
    }
  },

  async getAll(): Promise<Notification[]> {
    return getDocuments<Notification>(COLLECTIONS.NOTIFICATIONS, [
      orderBy('createdAt', 'desc'),
    ]);
  },

  async getUnread(): Promise<Notification[]> {
    return getDocuments<Notification>(COLLECTIONS.NOTIFICATIONS, [
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
    ]);
  },

  async createOverdueAlert(flatNumber: string, amount: number, dueId: string): Promise<void> {
    await this.create(
      'overdue',
      'Gecikmiş Aidat',
      `Daire ${flatNumber} - ${amount} TL aidat ödemesi gecikmiştir.`,
      'due',
      dueId
    );
  },

  async createPaymentConfirmation(flatNumber: string, amount: number, paymentId: string): Promise<void> {
    await this.create(
      'payment',
      'Ödeme Onayı',
      `Daire ${flatNumber} - ${amount} TL ödeme kaydedildi.`,
      'payment',
      paymentId
    );
  },

  async createMonthlyReminder(month: string, year: number): Promise<void> {
    await this.create(
      'reminder',
      'Aylık Aidat Hatırlatma',
      `${month} ${year} aidatları oluşturulmuştur.`,
      'system',
      'monthly-reminder'
    );
  },
};
