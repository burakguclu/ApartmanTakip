// ==========================================
// Apartment & Block Types
// ==========================================
export interface Apartment {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  totalBlocks: number;
  totalFlats: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDeleted: boolean;
}

export interface Block {
  id: string;
  apartmentId: string;
  name: string;
  totalFloors: number;
  totalFlats: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Flat {
  id: string;
  apartmentId: string;
  blockId: string;
  flatNumber: string;
  floor: number;
  type: FlatType;
  ownerId: string | null;
  tenantId: string | null;
  occupancyStatus: OccupancyStatus;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export type FlatType = 'residential' | 'commercial' | 'office';
export type OccupancyStatus = 'occupied' | 'vacant' | 'under-renovation';

// ==========================================
// Resident Types
// ==========================================
export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  emergencyContact: string;
  emergencyPhone: string;
  tcNo: string;
  type: ResidentType;
  flatId: string;
  blockId: string;
  apartmentId: string;
  moveInDate: string;
  moveOutDate: string | null;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export type ResidentType = 'owner' | 'tenant';

// ==========================================
// Dues (Aidat) Types
// ==========================================
export interface Due {
  id: string;
  apartmentId: string;
  blockId: string;
  flatId: string;
  residentId: string;
  amount: number;
  month: number; // 1-12
  year: number;
  dueDate: string;
  status: DueStatus;
  paidAmount: number;
  lateFee: number;
  lateFeeApplied: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export type DueStatus = 'pending' | 'paid' | 'partial' | 'overdue';

// ==========================================
// Payment Types
// ==========================================
export interface Payment {
  id: string;
  dueId: string;
  apartmentId: string;
  blockId: string;
  flatId: string;
  residentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  bankReference: string;
  receiptNumber: string;
  description: string;
  installmentNumber: number | null;
  totalInstallments: number | null;
  createdAt: string;
  createdBy: string;
  isDeleted: boolean;
}

export type PaymentMethod = 'cash' | 'bank-transfer' | 'credit-card' | 'check' | 'other';

// ==========================================
// Income Types
// ==========================================
export interface Income {
  id: string;
  apartmentId: string;
  category: IncomeCategory;
  amount: number;
  description: string;
  incomeDate: string;
  payer: string;
  dueId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDeleted: boolean;
}

export type IncomeCategory = 'dues' | 'commonArea' | 'parking' | 'penalty' | 'interest' | 'other';

// ==========================================
// Expense Types
// ==========================================
export interface Expense {
  id: string;
  apartmentId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  vendor: string;
  expenseDate: string;
  isRecurring: boolean;
  recurringPeriod: RecurringPeriod | null;
  invoiceUrl: string;
  attachmentUrl: string;
  approvedBy: string;
  approvalDate: string | null;
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDeleted: boolean;
}

export type ExpenseCategory =
  | 'maintenance'
  | 'cleaning'
  | 'electricity'
  | 'water'
  | 'gas'
  | 'elevator'
  | 'security'
  | 'insurance'
  | 'garden'
  | 'repair'
  | 'management'
  | 'legal'
  | 'other';

export type RecurringPeriod = 'monthly' | 'quarterly' | 'yearly';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

// ==========================================
// Audit Log Types
// ==========================================
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  description: string;
  ipAddress: string;
  timestamp: string;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'approve' | 'reject';
export type EntityType = 'apartment' | 'block' | 'flat' | 'resident' | 'due' | 'payment' | 'expense' | 'admin' | 'system';

// ==========================================
// Notification Types
// ==========================================
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  entityType: EntityType;
  entityId: string;
  createdAt: string;
  readAt: string | null;
}

export type NotificationType = 'overdue' | 'reminder' | 'payment' | 'system' | 'alert';

// ==========================================
// Admin Types
// ==========================================
export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  lastLogin: string;
  createdAt: string;
  isActive: boolean;
}

export type AdminRole = 'admin' | 'super-admin';

// ==========================================
// Dashboard Types
// ==========================================
export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalResidents: number;
  totalFlats: number;
  occupiedFlats: number;
  vacantFlats: number;
  overdueCount: number;
  overdueAmount: number;
  monthlyIncome: MonthlyData[];
  monthlyExpense: MonthlyData[];
  expenseBreakdown: CategoryData[];
}

export interface MonthlyData {
  month: string;
  amount: number;
}

export interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

// ==========================================
// Generic Types
// ==========================================
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterParams {
  search: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  [key: string]: string;
}

export interface SelectOption {
  value: string;
  label: string;
}
