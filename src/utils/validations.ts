import { z } from 'zod';

// ==========================================
// Login Schema
// ==========================================
export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// ==========================================
// Apartment Schema
// ==========================================
export const apartmentSchema = z.object({
  name: z.string().min(2, 'Apartman adı en az 2 karakter olmalıdır'),
  address: z.string().min(5, 'Adres en az 5 karakter olmalıdır'),
  city: z.string().min(2, 'Şehir girin'),
  district: z.string().min(2, 'İlçe girin'),
});
export type ApartmentFormData = z.infer<typeof apartmentSchema>;

// ==========================================
// Block Schema
// ==========================================
export const blockSchema = z.object({
  name: z.string().min(1, 'Blok adı girin'),
  totalFloors: z.number().min(1, 'En az 1 kat olmalıdır').max(100, 'En fazla 100 kat'),
  totalFlats: z.number().min(1, 'En az 1 daire olmalıdır').max(500, 'En fazla 500 daire'),
});
export type BlockFormData = z.infer<typeof blockSchema>;

// ==========================================
// Flat Schema
// ==========================================
export const flatSchema = z.object({
  flatNumber: z.string().min(1, 'Daire numarası girin'),
  floor: z.number().min(-5, 'Geçerli kat girin').max(100, 'Geçerli kat girin'),
  type: z.enum(['residential', 'commercial', 'office']),
  occupancyStatus: z.enum(['occupied', 'vacant', 'under-renovation']),
});
export type FlatFormData = z.infer<typeof flatSchema>;

// ==========================================
// Resident Schema
// ==========================================
export const residentSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli e-posta girin').or(z.literal('')),
  phone: z.string().min(10, 'Geçerli telefon numarası girin'),
  secondaryPhone: z.string(),
  emergencyContact: z.string(),
  emergencyPhone: z.string(),
  tcNo: z.string().length(11, 'TC Kimlik No 11 haneli olmalıdır').regex(/^\d+$/, 'Sadece rakam girin'),
  type: z.enum(['owner', 'tenant']),
  flatId: z.string().min(1, 'Daire seçin'),
  blockId: z.string().min(1, 'Blok seçin'),
  apartmentId: z.string().min(1, 'Apartman seçin'),
  moveInDate: z.string().min(1, 'Giriş tarihi girin'),
  moveOutDate: z.string(),
  notes: z.string(),
});
export type ResidentFormData = z.infer<typeof residentSchema>;

// ==========================================
// Due Schema
// ==========================================
export const dueSchema = z.object({
  flatId: z.string().min(1, 'Daire seçin'),
  amount: z.number().min(0.01, 'Tutar 0\'dan büyük olmalıdır'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2040),
  dueDate: z.string().min(1, 'Son ödeme tarihi girin'),
  description: z.string(),
});
export type DueFormData = z.infer<typeof dueSchema>;

// ==========================================
// Bulk Due Schema
// ==========================================
export const bulkDueSchema = z.object({
  apartmentId: z.string().min(1, 'Apartman seçin'),
  blockId: z.string(),
  amount: z.number().min(0.01, 'Tutar 0\'dan büyük olmalıdır'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2040),
  description: z.string(),
});
export type BulkDueFormData = z.infer<typeof bulkDueSchema>;

// ==========================================
// Income Schema
// ==========================================
export const incomeSchema = z.object({
  apartmentId: z.string().min(1, 'Apartman seçin'),
  category: z.enum(['rent', 'parking', 'advertising', 'event', 'interest', 'other']),
  amount: z.number().min(0.01, 'Tutar 0\'dan büyük olmalıdır'),
  description: z.string().min(3, 'Açıklama en az 3 karakter olmalıdır'),
  payer: z.string(),
  incomeDate: z.string().min(1, 'Gelir tarihi girin'),
});
export type IncomeFormData = z.infer<typeof incomeSchema>;

// ==========================================
// Payment Schema
// ==========================================
export const paymentSchema = z.object({
  dueId: z.string().min(1, 'Aidat seçin'),
  amount: z.number().min(0.01, 'Tutar 0\'dan büyük olmalıdır'),
  paymentDate: z.string().min(1, 'Ödeme tarihi girin'),
  paymentMethod: z.enum(['cash', 'bank-transfer', 'credit-card', 'check', 'other']),
  bankReference: z.string(),
  description: z.string(),
  installmentNumber: z.number().nullable(),
  totalInstallments: z.number().nullable(),
});
export type PaymentFormData = z.infer<typeof paymentSchema>;

// ==========================================
// Expense Schema
// ==========================================
export const expenseSchema = z.object({
  apartmentId: z.string().min(1, 'Apartman seçin'),
  category: z.enum([
    'maintenance', 'cleaning', 'electricity', 'water', 'gas',
    'elevator', 'security', 'insurance', 'garden', 'repair',
    'management', 'legal', 'other',
  ]),
  amount: z.number().min(0.01, 'Tutar 0\'dan büyük olmalıdır'),
  description: z.string().min(3, 'Açıklama en az 3 karakter olmalıdır'),
  vendor: z.string(),
  expenseDate: z.string().min(1, 'Gider tarihi girin'),
  isRecurring: z.boolean(),
  recurringPeriod: z.enum(['monthly', 'quarterly', 'yearly']).nullable(),
});
export type ExpenseFormData = z.infer<typeof expenseSchema>;
