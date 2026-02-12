import {
  createDocument,
  updateDocument,
  getDocuments,
  getDocument,
  getDocumentsByField,
  batchCreateDocuments,
} from './firestoreService';
import { where } from 'firebase/firestore';
import { COLLECTIONS, DEFAULT_DUE_DAY } from '@/utils/constants';
import type { Due, Flat } from '@/types';
import type { DueFormData, BulkDueFormData } from '@/utils/validations';
import { auditLogService } from './auditLogService';
import { flatService } from './apartmentService';
import { calculateLateFee } from '@/utils/helpers';

export const dueService = {
  async create(data: DueFormData, apartmentId: string, blockId: string, residentId: string, userId: string): Promise<string> {
    const id = await createDocument<Record<string, unknown>>(COLLECTIONS.DUES, {
      ...data,
      apartmentId,
      blockId,
      residentId,
      status: 'pending',
      paidAmount: 0,
      lateFee: 0,
      lateFeeApplied: false,
    });
    await auditLogService.log({
      userId,
      action: 'create',
      entityType: 'due',
      entityId: id,
      newValue: data as unknown as Record<string, unknown>,
      description: `Aidat oluşturuldu: ${data.month}/${data.year} - ${data.amount} TL`,
    });
    return id;
  },

  async bulkCreate(data: BulkDueFormData, userId: string): Promise<string[]> {
    // Get all flats for the apartment/block
    let flats: Flat[];
    if (data.blockId) {
      flats = await flatService.getByBlock(data.blockId);
    } else {
      flats = await flatService.getByApartment(data.apartmentId);
    }

    if (flats.length === 0) {
      return [];
    }
    const dueDate = `${data.year}-${String(data.month).padStart(2, '0')}-${String(DEFAULT_DUE_DAY).padStart(2, '0')}`;

    const dueItems = flats.map((flat) => ({
      apartmentId: data.apartmentId,
      blockId: flat.blockId,
      flatId: flat.id,
      residentId: flat.tenantId || flat.ownerId || '',
      amount: data.amount,
      month: data.month,
      year: data.year,
      dueDate,
      status: 'pending' as const,
      paidAmount: 0,
      lateFee: 0,
      lateFeeApplied: false,
      description: data.description || `${data.month}/${data.year} Aidatı`,
    }));

    const ids = await batchCreateDocuments(COLLECTIONS.DUES, dueItems);

    await auditLogService.log({
      userId,
      action: 'create',
      entityType: 'due',
      entityId: 'bulk',
      newValue: { count: ids.length, ...data } as unknown as Record<string, unknown>,
      description: `Toplu aidat oluşturuldu: ${ids.length} adet - ${data.month}/${data.year}`,
    });

    return ids;
  },

  async update(id: string, data: Partial<Due>, userId: string): Promise<void> {
    await updateDocument(COLLECTIONS.DUES, id, data as Record<string, unknown>);
    await auditLogService.log({
      userId,
      action: 'update',
      entityType: 'due',
      entityId: id,
      newValue: data as unknown as Record<string, unknown>,
      description: `Aidat güncellendi`,
    });
  },

  async markAsPaid(id: string, userId: string): Promise<void> {
    const due = await this.getById(id);
    if (!due) throw new Error('Aidat bulunamadı');

    await updateDocument(COLLECTIONS.DUES, id, {
      status: 'paid',
      paidAmount: due.amount + due.lateFee,
    });
    await auditLogService.log({
      userId,
      action: 'update',
      entityType: 'due',
      entityId: id,
      description: `Aidat ödendi olarak işaretlendi`,
    });
  },

  async applyLateFees(userId: string): Promise<number> {
    const now = new Date();
    const overdueDues = await getDocuments<Due>(COLLECTIONS.DUES, [
      where('status', 'in', ['pending', 'partial']),
    ]);

    let updatedCount = 0;
    for (const due of overdueDues) {
      const dueDate = new Date(due.dueDate);
      if (now > dueDate) {
        const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const lateFee = calculateLateFee(due.amount, daysLate);

        await updateDocument(COLLECTIONS.DUES, due.id, {
          status: 'overdue',
          lateFee,
          lateFeeApplied: true,
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await auditLogService.log({
        userId,
        action: 'update',
        entityType: 'due',
        entityId: 'batch',
        description: `Gecikme faizi uygulandı: ${updatedCount} aidat`,
      });
    }

    return updatedCount;
  },

  async getAll(): Promise<Due[]> {
    return getDocuments<Due>(COLLECTIONS.DUES);
  },

  async getByFlat(flatId: string): Promise<Due[]> {
    return getDocumentsByField<Due>(COLLECTIONS.DUES, 'flatId', flatId);
  },

  async getByResident(residentId: string): Promise<Due[]> {
    return getDocumentsByField<Due>(COLLECTIONS.DUES, 'residentId', residentId);
  },

  async getByApartment(apartmentId: string): Promise<Due[]> {
    return getDocumentsByField<Due>(COLLECTIONS.DUES, 'apartmentId', apartmentId);
  },

  async getOverdue(): Promise<Due[]> {
    return getDocuments<Due>(COLLECTIONS.DUES, [where('status', '==', 'overdue')]);
  },

  async getByMonthYear(month: number, year: number): Promise<Due[]> {
    return getDocuments<Due>(COLLECTIONS.DUES, [
      where('month', '==', month),
      where('year', '==', year),
    ]);
  },

  async getById(id: string): Promise<Due | null> {
    return getDocument<Due>(COLLECTIONS.DUES, id);
  },
};
