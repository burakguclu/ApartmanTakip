import {
  createDocument,
  updateDocument,
  softDeleteDocument,
  getDocuments,
  getDocument,
  getDocumentsByField,
} from './firestoreService';
import { where } from 'firebase/firestore';
import { COLLECTIONS } from '@/utils/constants';
import type { Income } from '@/types';
import type { IncomeFormData } from '@/utils/validations';
import { auditLogService } from './auditLogService';

export const incomeService = {
  async create(data: IncomeFormData, userId: string): Promise<string> {
    const id = await createDocument<Record<string, unknown>>(COLLECTIONS.INCOMES, {
      ...data,
      createdBy: userId,
    });
    await auditLogService.log({
      userId,
      action: 'create',
      entityType: 'payment',
      entityId: id,
      newValue: data as unknown as Record<string, unknown>,
      description: `Gelir oluşturuldu: ${data.description} - ${data.amount} TL`,
    });
    return id;
  },

  async update(id: string, data: Partial<IncomeFormData>, userId: string, oldData: Income): Promise<void> {
    await updateDocument(COLLECTIONS.INCOMES, id, data);
    await auditLogService.log({
      userId,
      action: 'update',
      entityType: 'payment',
      entityId: id,
      oldValue: oldData as unknown as Record<string, unknown>,
      newValue: data as unknown as Record<string, unknown>,
      description: `Gelir güncellendi: ${oldData.description}`,
    });
  },

  async delete(id: string, userId: string, description: string): Promise<void> {
    await softDeleteDocument(COLLECTIONS.INCOMES, id);
    await auditLogService.log({
      userId,
      action: 'delete',
      entityType: 'payment',
      entityId: id,
      description: `Gelir silindi: ${description}`,
    });
  },

  async getAll(): Promise<Income[]> {
    return getDocuments<Income>(COLLECTIONS.INCOMES);
  },

  async getByApartment(apartmentId: string): Promise<Income[]> {
    return getDocumentsByField<Income>(COLLECTIONS.INCOMES, 'apartmentId', apartmentId);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Income[]> {
    return getDocuments<Income>(COLLECTIONS.INCOMES, [
      where('incomeDate', '>=', startDate),
      where('incomeDate', '<=', endDate),
    ]);
  },

  async getById(id: string): Promise<Income | null> {
    return getDocument<Income>(COLLECTIONS.INCOMES, id);
  },
};
