import {
  createDocument,
  updateDocument,
  softDeleteDocument,
  getDocuments,
  getDocument,
  getDocumentsByField,
} from './firestoreService';
import { COLLECTIONS } from '@/utils/constants';
import type { Apartment, Block, Flat } from '@/types';
import type { ApartmentFormData, BlockFormData, FlatFormData } from '@/utils/validations';
import { auditLogService } from './auditLogService';

// ==========================================
// Apartment Service
// ==========================================
export const apartmentService = {
  async create(data: ApartmentFormData, userId: string): Promise<string> {
    const id = await createDocument<Record<string, unknown>>(COLLECTIONS.APARTMENTS, {
      ...data,
      totalBlocks: 0,
      totalFlats: 0,
      createdBy: userId,
    });
    await auditLogService.log({
      userId,
      action: 'create',
      entityType: 'apartment',
      entityId: id,
      newValue: data as unknown as Record<string, unknown>,
      description: `Yeni apartman oluşturuldu: ${data.name}`,
    });
    return id;
  },

  async update(id: string, data: Partial<ApartmentFormData>, userId: string, oldData: Apartment): Promise<void> {
    await updateDocument(COLLECTIONS.APARTMENTS, id, data);
    await auditLogService.log({
      userId,
      action: 'update',
      entityType: 'apartment',
      entityId: id,
      oldValue: oldData as unknown as Record<string, unknown>,
      newValue: data as unknown as Record<string, unknown>,
      description: `Apartman güncellendi: ${oldData.name}`,
    });
  },

  async delete(id: string, userId: string, name: string): Promise<void> {
    await softDeleteDocument(COLLECTIONS.APARTMENTS, id);
    await auditLogService.log({
      userId,
      action: 'delete',
      entityType: 'apartment',
      entityId: id,
      description: `Apartman silindi: ${name}`,
    });
  },

  async getAll(): Promise<Apartment[]> {
    return getDocuments<Apartment>(COLLECTIONS.APARTMENTS);
  },

  async getById(id: string): Promise<Apartment | null> {
    return getDocument<Apartment>(COLLECTIONS.APARTMENTS, id);
  },
};

// ==========================================
// Block Service
// ==========================================
export const blockService = {
  async create(apartmentId: string, data: BlockFormData, userId: string): Promise<string> {
    const id = await createDocument<Record<string, unknown>>(COLLECTIONS.BLOCKS, {
      ...data,
      apartmentId,
    });
    await auditLogService.log({
      userId,
      action: 'create',
      entityType: 'block',
      entityId: id,
      newValue: { ...data, apartmentId } as unknown as Record<string, unknown>,
      description: `Yeni blok oluşturuldu: ${data.name}`,
    });
    return id;
  },

  async update(id: string, data: Partial<BlockFormData>, userId: string, oldData: Block): Promise<void> {
    await updateDocument(COLLECTIONS.BLOCKS, id, data);
    await auditLogService.log({
      userId,
      action: 'update',
      entityType: 'block',
      entityId: id,
      oldValue: oldData as unknown as Record<string, unknown>,
      newValue: data as unknown as Record<string, unknown>,
      description: `Blok güncellendi: ${oldData.name}`,
    });
  },

  async delete(id: string, userId: string, name: string): Promise<void> {
    await softDeleteDocument(COLLECTIONS.BLOCKS, id);
    await auditLogService.log({
      userId,
      action: 'delete',
      entityType: 'block',
      entityId: id,
      description: `Blok silindi: ${name}`,
    });
  },

  async getByApartment(apartmentId: string): Promise<Block[]> {
    return getDocumentsByField<Block>(COLLECTIONS.BLOCKS, 'apartmentId', apartmentId);
  },

  async getById(id: string): Promise<Block | null> {
    return getDocument<Block>(COLLECTIONS.BLOCKS, id);
  },
};

// ==========================================
// Flat Service
// ==========================================
export const flatService = {
  async create(apartmentId: string, blockId: string, data: FlatFormData, userId: string): Promise<string> {
    const id = await createDocument<Record<string, unknown>>(COLLECTIONS.FLATS, {
      ...data,
      apartmentId,
      blockId,
      ownerId: null,
      tenantId: null,
    });
    await auditLogService.log({
      userId,
      action: 'create',
      entityType: 'flat',
      entityId: id,
      newValue: { ...data, apartmentId, blockId } as unknown as Record<string, unknown>,
      description: `Yeni daire oluşturuldu: ${data.flatNumber}`,
    });
    return id;
  },

  async update(id: string, data: Partial<Flat>, userId: string, oldData: Flat): Promise<void> {
    await updateDocument(COLLECTIONS.FLATS, id, data as Record<string, unknown>);
    await auditLogService.log({
      userId,
      action: 'update',
      entityType: 'flat',
      entityId: id,
      oldValue: oldData as unknown as Record<string, unknown>,
      newValue: data as unknown as Record<string, unknown>,
      description: `Daire güncellendi: ${oldData.flatNumber}`,
    });
  },

  async delete(id: string, userId: string, flatNumber: string): Promise<void> {
    await softDeleteDocument(COLLECTIONS.FLATS, id);
    await auditLogService.log({
      userId,
      action: 'delete',
      entityType: 'flat',
      entityId: id,
      description: `Daire silindi: ${flatNumber}`,
    });
  },

  async getByBlock(blockId: string): Promise<Flat[]> {
    return getDocumentsByField<Flat>(COLLECTIONS.FLATS, 'blockId', blockId);
  },

  async getByApartment(apartmentId: string): Promise<Flat[]> {
    return getDocumentsByField<Flat>(COLLECTIONS.FLATS, 'apartmentId', apartmentId);
  },

  async getById(id: string): Promise<Flat | null> {
    return getDocument<Flat>(COLLECTIONS.FLATS, id);
  },

  async assignOwner(id: string, ownerId: string): Promise<void> {
    await updateDocument(COLLECTIONS.FLATS, id, { ownerId, occupancyStatus: 'occupied' });
  },

  async assignTenant(id: string, tenantId: string): Promise<void> {
    await updateDocument(COLLECTIONS.FLATS, id, { tenantId, occupancyStatus: 'occupied' });
  },
};
