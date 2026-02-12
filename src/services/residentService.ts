import {
  createDocument,
  updateDocument,
  softDeleteDocument,
  getDocuments,
  getDocument,
  getDocumentsByField,
} from './firestoreService';
import { COLLECTIONS } from '@/utils/constants';
import type { Resident } from '@/types';
import type { ResidentFormData } from '@/utils/validations';
import { auditLogService } from './auditLogService';

export const residentService = {
  async create(data: ResidentFormData, userId: string): Promise<string> {
    const id = await createDocument<Record<string, unknown>>(COLLECTIONS.RESIDENTS, {
      ...data,
      isActive: true,
      moveOutDate: data.moveOutDate || null,
    });
    await auditLogService.log({
      userId,
      action: 'create',
      entityType: 'resident',
      entityId: id,
      newValue: data as unknown as Record<string, unknown>,
      description: `Yeni sakin eklendi: ${data.firstName} ${data.lastName}`,
    });
    return id;
  },

  async update(id: string, data: Partial<ResidentFormData>, userId: string, oldData: Resident): Promise<void> {
    await updateDocument(COLLECTIONS.RESIDENTS, id, data);
    await auditLogService.log({
      userId,
      action: 'update',
      entityType: 'resident',
      entityId: id,
      oldValue: oldData as unknown as Record<string, unknown>,
      newValue: data as unknown as Record<string, unknown>,
      description: `Sakin güncellendi: ${oldData.firstName} ${oldData.lastName}`,
    });
  },

  async delete(id: string, userId: string, name: string): Promise<void> {
    await softDeleteDocument(COLLECTIONS.RESIDENTS, id);
    await auditLogService.log({
      userId,
      action: 'delete',
      entityType: 'resident',
      entityId: id,
      description: `Sakin silindi: ${name}`,
    });
  },

  async moveOut(id: string, moveOutDate: string, userId: string, name: string): Promise<void> {
    await updateDocument(COLLECTIONS.RESIDENTS, id, {
      isActive: false,
      moveOutDate,
    });
    await auditLogService.log({
      userId,
      action: 'update',
      entityType: 'resident',
      entityId: id,
      description: `Sakin taşındı: ${name} - ${moveOutDate}`,
    });
  },

  async getAll(): Promise<Resident[]> {
    return getDocuments<Resident>(COLLECTIONS.RESIDENTS);
  },

  async getActive(): Promise<Resident[]> {
    return getDocumentsByField<Resident>(COLLECTIONS.RESIDENTS, 'isActive', true);
  },

  async getByFlat(flatId: string): Promise<Resident[]> {
    return getDocumentsByField<Resident>(COLLECTIONS.RESIDENTS, 'flatId', flatId);
  },

  async getByApartment(apartmentId: string): Promise<Resident[]> {
    return getDocumentsByField<Resident>(COLLECTIONS.RESIDENTS, 'apartmentId', apartmentId);
  },

  async getById(id: string): Promise<Resident | null> {
    return getDocument<Resident>(COLLECTIONS.RESIDENTS, id);
  },

  async getHistory(flatId: string): Promise<Resident[]> {
    return getDocumentsByField<Resident>(COLLECTIONS.RESIDENTS, 'flatId', flatId);
  },
};
