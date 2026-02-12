import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Turkish Lira
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date to Turkish locale
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get month name in Turkish
 */
export function getMonthName(month: number): string {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  return months[month - 1] || '';
}

/**
 * Validate Turkish phone number
 */
export function isValidTurkishPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^(\+90|0)?5\d{9}$/.test(cleaned);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate Turkish ID (TC Kimlik No)
 */
export function isValidTCNo(tc: string): boolean {
  if (tc.length !== 11 || !/^\d{11}$/.test(tc)) return false;
  if (tc[0] === '0') return false;

  const digits = tc.split('').map(Number);
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const check10 = (oddSum * 7 - evenSum) % 10;
  if (check10 !== digits[9]) return false;

  const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (totalSum % 10 !== digits[10]) return false;

  return true;
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Calculate late fee
 */
export function calculateLateFee(amount: number, daysLate: number, ratePerDay: number = 0.001): number {
  if (daysLate <= 0) return 0;
  return Math.round(amount * ratePerDay * daysLate * 100) / 100;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'bg-success-50 text-success-700',
    pending: 'bg-warning-50 text-warning-600',
    partial: 'bg-primary-50 text-primary-700',
    overdue: 'bg-danger-50 text-danger-700',
    occupied: 'bg-success-50 text-success-700',
    vacant: 'bg-warning-50 text-warning-600',
    'under-renovation': 'bg-primary-50 text-primary-700',
    approved: 'bg-success-50 text-success-700',
    rejected: 'bg-danger-50 text-danger-700',
    active: 'bg-success-50 text-success-700',
    inactive: 'bg-gray-100 text-gray-600',
    dues: 'bg-emerald-50 text-emerald-700',
    commonArea: 'bg-blue-50 text-blue-700',
    parking: 'bg-cyan-50 text-cyan-700',
    penalty: 'bg-orange-50 text-orange-700',
    interest: 'bg-indigo-50 text-indigo-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

/**
 * Get status label in Turkish
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'Ödendi',
    pending: 'Bekliyor',
    partial: 'Kısmi Ödeme',
    overdue: 'Gecikmiş',
    occupied: 'Dolu',
    vacant: 'Boş',
    'under-renovation': 'Tadilatta',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    active: 'Aktif',
    inactive: 'Pasif',
    dues: 'Aidat Tahsilatı',
    commonArea: 'Ortak Alan Geliri',
    parking: 'Otopark Geliri',
    penalty: 'Gecikme Cezası',
    interest: 'Faiz Geliri',
    owner: 'Mal Sahibi',
    tenant: 'Kiracı',
    cash: 'Nakit',
    'bank-transfer': 'Havale/EFT',
    'credit-card': 'Kredi Kartı',
    check: 'Çek',
    other: 'Diğer',
    maintenance: 'Bakım',
    cleaning: 'Temizlik',
    electricity: 'Elektrik',
    water: 'Su',
    gas: 'Doğalgaz',
    elevator: 'Asansör',
    security: 'Güvenlik',
    insurance: 'Sigorta',
    garden: 'Bahçe',
    repair: 'Onarım',
    management: 'Yönetim',
    legal: 'Hukuki',
  };
  return labels[status] || status;
}
