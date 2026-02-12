export const COLLECTIONS = {
  APARTMENTS: 'apartments',
  BLOCKS: 'blocks',
  FLATS: 'flats',
  RESIDENTS: 'residents',
  DUES: 'dues',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  INCOMES: 'incomes',
  ADMINS: 'admins',
  AUDIT_LOGS: 'auditLogs',
  NOTIFICATIONS: 'notifications',
} as const;

export const EXPENSE_CATEGORIES = [
  { value: 'maintenance', label: 'Bakım' },
  { value: 'cleaning', label: 'Temizlik' },
  { value: 'electricity', label: 'Elektrik' },
  { value: 'water', label: 'Su' },
  { value: 'gas', label: 'Doğalgaz' },
  { value: 'elevator', label: 'Asansör' },
  { value: 'security', label: 'Güvenlik' },
  { value: 'insurance', label: 'Sigorta' },
  { value: 'garden', label: 'Bahçe' },
  { value: 'repair', label: 'Onarım' },
  { value: 'management', label: 'Yönetim' },
  { value: 'legal', label: 'Hukuki' },
  { value: 'other', label: 'Diğer' },
] as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'bank-transfer', label: 'Havale/EFT' },
  { value: 'credit-card', label: 'Kredi Kartı' },
  { value: 'check', label: 'Çek' },
  { value: 'other', label: 'Diğer' },
] as const;

export const OCCUPANCY_STATUSES = [
  { value: 'occupied', label: 'Dolu' },
  { value: 'vacant', label: 'Boş' },
  { value: 'under-renovation', label: 'Tadilatta' },
] as const;

export const FLAT_TYPES = [
  { value: 'residential', label: 'Konut' },
  { value: 'commercial', label: 'Ticari' },
  { value: 'office', label: 'Ofis' },
] as const;

export const MONTHS = [
  { value: 1, label: 'Ocak' },
  { value: 2, label: 'Şubat' },
  { value: 3, label: 'Mart' },
  { value: 4, label: 'Nisan' },
  { value: 5, label: 'Mayıs' },
  { value: 6, label: 'Haziran' },
  { value: 7, label: 'Temmuz' },
  { value: 8, label: 'Ağustos' },
  { value: 9, label: 'Eylül' },
  { value: 10, label: 'Ekim' },
  { value: 11, label: 'Kasım' },
  { value: 12, label: 'Aralık' },
] as const;

export const INCOME_CATEGORIES = [
  { value: 'rent', label: 'Kira Geliri' },
  { value: 'parking', label: 'Otopark' },
  { value: 'advertising', label: 'Reklam Geliri' },
  { value: 'event', label: 'Etkinlik Geliri' },
  { value: 'interest', label: 'Faiz Geliri' },
  { value: 'other', label: 'Diğer' },
] as const;

export const PAGE_SIZES = [10, 25, 50, 100] as const;

export const LATE_FEE_RATE = 0.001; // 0.1% per day
export const DEFAULT_DUE_DAY = 15; // Due on 15th of each month
