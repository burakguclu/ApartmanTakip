import {
  createDocument,
  updateDocument,
  softDeleteDocument,
  getDocuments,
  getDocument,
  getDocumentsByField,
} from './firestoreService';
import { where, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '@/utils/constants';
import type { Expense } from '@/types';
import type { ExpenseFormData } from '@/utils/validations';
import { auditLogService } from './auditLogService';

export const expenseService = {
  async create(data: ExpenseFormData, userId: string): Promise<string> {
    const id = await createDocument<Record<string, unknown>>(COLLECTIONS.EXPENSES, {
      ...data,
      invoiceUrl: '',
      attachmentUrl: '',
      approvedBy: '',
      approvalDate: null,
      status: 'pending',
      createdBy: userId,
    });
    await auditLogService.log({
      userId,
      action: 'create',
      entityType: 'expense',
      entityId: id,
      newValue: data as unknown as Record<string, unknown>,
      description: `Gider oluşturuldu: ${data.description} - ${data.amount} TL`,
    });
    return id;
  },

  async update(id: string, data: Partial<ExpenseFormData>, userId: string, oldData: Expense): Promise<void> {
    await updateDocument(COLLECTIONS.EXPENSES, id, data);
    await auditLogService.log({
      userId,
      action: 'update',
      entityType: 'expense',
      entityId: id,
      oldValue: oldData as unknown as Record<string, unknown>,
      newValue: data as unknown as Record<string, unknown>,
      description: `Gider güncellendi: ${oldData.description}`,
    });
  },

  async delete(id: string, userId: string, description: string): Promise<void> {
    await softDeleteDocument(COLLECTIONS.EXPENSES, id);
    await auditLogService.log({
      userId,
      action: 'delete',
      entityType: 'expense',
      entityId: id,
      description: `Gider silindi: ${description}`,
    });
  },

  async approve(id: string, userId: string): Promise<void> {
    await updateDocument(COLLECTIONS.EXPENSES, id, {
      status: 'approved',
      approvedBy: userId,
      approvalDate: new Date().toISOString(),
    });
    await auditLogService.log({
      userId,
      action: 'approve',
      entityType: 'expense',
      entityId: id,
      description: `Gider onaylandı`,
    });
  },

  async reject(id: string, userId: string): Promise<void> {
    await updateDocument(COLLECTIONS.EXPENSES, id, {
      status: 'rejected',
      approvedBy: userId,
      approvalDate: new Date().toISOString(),
    });
    await auditLogService.log({
      userId,
      action: 'reject',
      entityType: 'expense',
      entityId: id,
      description: `Gider reddedildi`,
    });
  },

  async getAll(): Promise<Expense[]> {
    return getDocuments<Expense>(COLLECTIONS.EXPENSES, [orderBy('expenseDate', 'desc')]);
  },

  async getByApartment(apartmentId: string): Promise<Expense[]> {
    return getDocumentsByField<Expense>(COLLECTIONS.EXPENSES, 'apartmentId', apartmentId);
  },

  async getByCategory(category: string): Promise<Expense[]> {
    return getDocumentsByField<Expense>(COLLECTIONS.EXPENSES, 'category', category);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    return getDocuments<Expense>(COLLECTIONS.EXPENSES, [
      where('expenseDate', '>=', startDate),
      where('expenseDate', '<=', endDate),
      orderBy('expenseDate', 'desc'),
    ]);
  },

  async getRecurring(): Promise<Expense[]> {
    return getDocumentsByField<Expense>(COLLECTIONS.EXPENSES, 'isRecurring', true);
  },

  async getById(id: string): Promise<Expense | null> {
    return getDocument<Expense>(COLLECTIONS.EXPENSES, id);
  },

  async getMonthlySummary(apartmentId: string, year: number, month: number): Promise<Expense[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    return getDocuments<Expense>(COLLECTIONS.EXPENSES, [
      where('apartmentId', '==', apartmentId),
      where('expenseDate', '>=', startDate),
      where('expenseDate', '<=', endDate),
    ]);
  },
};
