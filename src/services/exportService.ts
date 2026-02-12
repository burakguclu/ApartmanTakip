import * as XLSX from 'xlsx';
import type { Due, Payment, Expense, AuditLog } from '@/types';
import { formatCurrency, formatDate, getStatusLabel, getMonthName } from '@/utils/helpers';

/**
 * Create and download an Excel workbook
 */
function downloadWorkbook(workbook: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(workbook, filename);
}

/**
 * Auto-size columns based on content
 */
function autoSizeColumns(worksheet: XLSX.WorkSheet, data: Record<string, unknown>[]): void {
  if (data.length === 0) return;
  const colWidths = Object.keys(data[0]).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  worksheet['!cols'] = colWidths;
}

/**
 * Export dues to Excel
 */
export function exportDuesToExcel(dues: Due[], filename?: string): void {
  const data = dues.map((due) => ({
    'Ay': getMonthName(due.month),
    'Yıl': due.year,
    'Tutar': formatCurrency(due.amount),
    'Ödenen': formatCurrency(due.paidAmount),
    'Gecikme Faizi': formatCurrency(due.lateFee),
    'Durum': getStatusLabel(due.status),
    'Son Ödeme': formatDate(due.dueDate),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  autoSizeColumns(worksheet, data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Aidatlar');

  const name = filename || `aidatlar_${new Date().toISOString().split('T')[0]}.xlsx`;
  downloadWorkbook(workbook, name);
}

/**
 * Export payments to Excel
 */
export function exportPaymentsToExcel(payments: Payment[], filename?: string): void {
  const data = payments.map((payment) => ({
    'Tarih': formatDate(payment.paymentDate),
    'Tutar': formatCurrency(payment.amount),
    'Ödeme Yöntemi': getStatusLabel(payment.paymentMethod),
    'Banka Referans': payment.bankReference || '-',
    'Makbuz No': payment.receiptNumber,
    'Açıklama': payment.description || '-',
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  autoSizeColumns(worksheet, data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ödemeler');

  const name = filename || `odemeler_${new Date().toISOString().split('T')[0]}.xlsx`;
  downloadWorkbook(workbook, name);
}

/**
 * Export expenses to Excel
 */
export function exportExpensesToExcel(expenses: Expense[], filename?: string): void {
  const data = expenses.map((expense) => ({
    'Tarih': formatDate(expense.expenseDate),
    'Kategori': getStatusLabel(expense.category),
    'Tutar': formatCurrency(expense.amount),
    'Açıklama': expense.description,
    'Tedarikçi': expense.vendor || '-',
    'Durum': getStatusLabel(expense.status),
    'Tekrarlayan': expense.isRecurring ? 'Evet' : 'Hayır',
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  autoSizeColumns(worksheet, data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Giderler');

  const name = filename || `giderler_${new Date().toISOString().split('T')[0]}.xlsx`;
  downloadWorkbook(workbook, name);
}

/**
 * Export audit logs to Excel
 */
export function exportLogsToExcel(logs: AuditLog[], filename?: string): void {
  const data = logs.map((log) => ({
    'Tarih': formatDate(log.timestamp),
    'Kullanıcı': log.userEmail || log.userId,
    'İşlem': log.action,
    'Varlık Tipi': log.entityType,
    'Açıklama': log.description,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  autoSizeColumns(worksheet, data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'İşlem Kayıtları');

  const name = filename || `islem_kayitlari_${new Date().toISOString().split('T')[0]}.xlsx`;
  downloadWorkbook(workbook, name);
}

/**
 * Export multi-sheet financial report
 */
export function exportFinancialReport(
  dues: Due[],
  payments: Payment[],
  expenses: Expense[],
  year: number
): void {
  const workbook = XLSX.utils.book_new();

  // Dues sheet
  const dueData = dues.map((due) => ({
    'Ay': getMonthName(due.month),
    'Yıl': due.year,
    'Tutar': due.amount,
    'Ödenen': due.paidAmount,
    'Gecikme Faizi': due.lateFee,
    'Durum': getStatusLabel(due.status),
  }));
  const dueSheet = XLSX.utils.json_to_sheet(dueData);
  autoSizeColumns(dueSheet, dueData);
  XLSX.utils.book_append_sheet(workbook, dueSheet, 'Aidatlar');

  // Payments sheet
  const payData = payments.map((p) => ({
    'Tarih': formatDate(p.paymentDate),
    'Tutar': p.amount,
    'Yöntem': getStatusLabel(p.paymentMethod),
    'Makbuz': p.receiptNumber,
  }));
  const paySheet = XLSX.utils.json_to_sheet(payData);
  autoSizeColumns(paySheet, payData);
  XLSX.utils.book_append_sheet(workbook, paySheet, 'Ödemeler');

  // Expenses sheet
  const expData = expenses.map((e) => ({
    'Tarih': formatDate(e.expenseDate),
    'Kategori': getStatusLabel(e.category),
    'Tutar': e.amount,
    'Açıklama': e.description,
    'Durum': getStatusLabel(e.status),
  }));
  const expSheet = XLSX.utils.json_to_sheet(expData);
  autoSizeColumns(expSheet, expData);
  XLSX.utils.book_append_sheet(workbook, expSheet, 'Giderler');

  // Summary sheet
  const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const summaryData = [
    { 'Özet': 'Toplam Gelir', 'Tutar': totalIncome },
    { 'Özet': 'Toplam Gider', 'Tutar': totalExpense },
    { 'Özet': 'Net Bakiye', 'Tutar': totalIncome - totalExpense },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  autoSizeColumns(summarySheet, summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet');

  downloadWorkbook(workbook, `finansal_rapor_${year}.xlsx`);
}
