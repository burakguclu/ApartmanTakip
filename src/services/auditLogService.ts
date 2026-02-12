import { addDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/utils/constants';
import type { AuditLog, AuditAction, EntityType } from '@/types';
import { getCurrentTimestamp } from '@/utils/helpers';

interface LogParams {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  description: string;
}

export const auditLogService = {
  async log(params: LogParams): Promise<void> {
    try {
      await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        userId: params.userId,
        userEmail: '', // Will be enriched by the caller
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue || null,
        newValue: params.newValue || null,
        description: params.description,
        ipAddress: '',
        timestamp: getCurrentTimestamp(),
      });
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't throw - audit logging should never block the main operation
    }
  },

  async getAll(limitCount: number = 100): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
  },

  async getByEntity(entityType: EntityType, entityId: string): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      where('entityType', '==', entityType),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
  },

  async getByUser(userId: string, limitCount: number = 50): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
  },

  async getByAction(action: AuditAction, limitCount: number = 50): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      where('action', '==', action),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog);
  },
};
