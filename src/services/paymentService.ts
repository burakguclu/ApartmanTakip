import {
  createDocument,
  getDocuments,
  getDocumentsByField,
  getDocument,
} from './firestoreService';
import { where, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '@/utils/constants';
import type { Payment, Due } from '@/types';
import type { PaymentFormData } from '@/utils/validations';
import { auditLogService } from './auditLogService';
import { dueService } from './dueService';
import { generateId } from '@/utils/helpers';

export const paymentService = {
  async create(data: PaymentFormData, due: Due, userId: string): Promise<string> {
    const receiptNumber = `RCP-${Date.now()}-${generateId().slice(0, 4).toUpperCase()}`;

    const id = await createDocument<Record<string, unknown>>(COLLECTIONS.PAYMENTS, {
      ...data,
      apartmentId: due.apartmentId,
      blockId: due.blockId,
      flatId: due.flatId,
      residentId: due.residentId,
      receiptNumber,
      createdBy: userId,
    });

    // Update due status
    const newPaidAmount = due.paidAmount + data.amount;
    const totalDue = due.amount + due.lateFee;
    let newStatus: Due['status'] = 'partial';
    if (newPaidAmount >= totalDue) {
      newStatus = 'paid';
    }

    await dueService.update(due.id, {
      paidAmount: newPaidAmount,
      status: newStatus,
    }, userId);

    await auditLogService.log({
      userId,
      action: 'create',
      entityType: 'payment',
      entityId: id,
      newValue: { ...data, receiptNumber } as unknown as Record<string, unknown>,
      description: `Ödeme kaydedildi: ${data.amount} TL - ${receiptNumber}`,
    });

    return id;
  },

  async getAll(): Promise<Payment[]> {
    return getDocuments<Payment>(COLLECTIONS.PAYMENTS, [orderBy('paymentDate', 'desc')]);
  },

  async getByDue(dueId: string): Promise<Payment[]> {
    return getDocumentsByField<Payment>(COLLECTIONS.PAYMENTS, 'dueId', dueId);
  },

  async getByResident(residentId: string): Promise<Payment[]> {
    return getDocumentsByField<Payment>(COLLECTIONS.PAYMENTS, 'residentId', residentId);
  },

  async getByFlat(flatId: string): Promise<Payment[]> {
    return getDocumentsByField<Payment>(COLLECTIONS.PAYMENTS, 'flatId', flatId);
  },

  async getByApartment(apartmentId: string): Promise<Payment[]> {
    return getDocumentsByField<Payment>(COLLECTIONS.PAYMENTS, 'apartmentId', apartmentId);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    return getDocuments<Payment>(COLLECTIONS.PAYMENTS, [
      where('paymentDate', '>=', startDate),
      where('paymentDate', '<=', endDate),
      orderBy('paymentDate', 'desc'),
    ]);
  },

  async getById(id: string): Promise<Payment | null> {
    return getDocument<Payment>(COLLECTIONS.PAYMENTS, id);
  },
};
