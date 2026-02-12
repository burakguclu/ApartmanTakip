import * as XLSX from 'xlsx';
import type { Due, Payment, Expense, AuditLog, Income, Block, Flat, Resident } from '@/types';
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

// Lookup helpers
interface LookupData {
  blocks: Block[];
  flats: Flat[];
  residents: Resident[];
}

function getBlockName(blockId: string, lookup: LookupData): string {
  return lookup.blocks.find((b) => b.id === blockId)?.name ?? '-';
}

function getFlatNumber(flatId: string, lookup: LookupData): string {
  const flat = lookup.flats.find((f) => f.id === flatId);
  return flat ? `Daire ${flat.flatNumber}` : '-';
}

function getResidentName(flatId: string, lookup: LookupData): string {
  const resident = lookup.residents.find((r) => r.flatId === flatId && r.isActive);
  return resident ? `${resident.firstName} ${resident.lastName}` : '-';
}

/**
 * Export dues to Excel (enriched with block/flat/resident)
 */
export function exportDuesToExcel(dues: Due[], lookup: LookupData, filename?: string): void {
  const data = dues.map((due) => ({
    'Blok': getBlockName(due.blockId, lookup),
    'Daire': getFlatNumber(due.flatId, lookup),
    'Sakin': getResidentName(due.flatId, lookup),
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
 * Export incomes to Excel (enriched)
 */
export function exportIncomesToExcel(incomes: Income[], filename?: string): void {
  const data = incomes.map((i) => ({
    'Tarih': formatDate(i.incomeDate),
    'Kategori': getStatusLabel(i.category),
    'Tutar': formatCurrency(i.amount),
    'Ödemeyi Yapan': i.payer || '-',
    'Açıklama': i.description,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  autoSizeColumns(worksheet, data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gelirler');

  const name = filename || `gelirler_${new Date().toISOString().split('T')[0]}.xlsx`;
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
 * Monthly dues status export — per-flat payment status for a specific month/year
 */
export function exportMonthlyDuesReport(
  dues: Due[],
  month: number,
  year: number,
  lookup: LookupData
): void {
  const monthDues = dues.filter((d) => d.month === month && d.year === year);

  // Build per-flat rows
  const data = lookup.flats
    .sort((a, b) => a.flatNumber.localeCompare(b.flatNumber, 'tr', { numeric: true }))
    .map((flat) => {
      const due = monthDues.find((d) => d.flatId === flat.id);
      const block = getBlockName(flat.blockId, lookup);
      const resident = getResidentName(flat.id, lookup);
      return {
        'Blok': block,
        'Daire No': flat.flatNumber,
        'Kat': flat.floor,
        'Sakin': resident,
        'Aidat Tutarı': due ? formatCurrency(due.amount) : '-',
        'Ödenen Tutar': due ? formatCurrency(due.paidAmount) : '-',
        'Gecikme Faizi': due && due.lateFee > 0 ? formatCurrency(due.lateFee) : '-',
        'Durum': due ? getStatusLabel(due.status) : 'Aidat Tanımlanmamış',
      };
    });

  // Summary
  const totalDue = monthDues.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = monthDues.filter((d) => d.status === 'paid').reduce((sum, d) => sum + d.paidAmount, 0);
  const paidCount = monthDues.filter((d) => d.status === 'paid').length;
  const pendingCount = monthDues.filter((d) => d.status === 'pending').length;
  const overdueCount = monthDues.filter((d) => d.status === 'overdue').length;

  const summaryData = [
    { 'Bilgi': 'Toplam Aidat', 'Değer': formatCurrency(totalDue) },
    { 'Bilgi': 'Toplam Tahsilat', 'Değer': formatCurrency(totalPaid) },
    { 'Bilgi': 'Tahsilat Oranı', 'Değer': monthDues.length > 0 ? `%${((paidCount / monthDues.length) * 100).toFixed(0)}` : '%0' },
    { 'Bilgi': 'Ödenen', 'Değer': `${paidCount} daire` },
    { 'Bilgi': 'Bekleyen', 'Değer': `${pendingCount} daire` },
    { 'Bilgi': 'Gecikmiş', 'Değer': `${overdueCount} daire` },
  ];

  const workbook = XLSX.utils.book_new();

  const mainSheet = XLSX.utils.json_to_sheet(data);
  autoSizeColumns(mainSheet, data);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Daire Detay');

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  autoSizeColumns(summarySheet, summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet');

  const monthName = getMonthName(month);
  downloadWorkbook(workbook, `aidat_raporu_${monthName}_${year}.xlsx`);
}

/**
 * Export multi-sheet financial report (enriched with monthly breakdown)
 */
export function exportFinancialReport(
  dues: Due[],
  incomes: Income[],
  expenses: Expense[],
  year: number,
  lookup?: LookupData
): void {
  const workbook = XLSX.utils.book_new();

  // Dues sheet (enriched)
  const dueData = dues.map((due) => ({
    ...(lookup ? {
      'Blok': getBlockName(due.blockId, lookup),
      'Daire': getFlatNumber(due.flatId, lookup),
      'Sakin': getResidentName(due.flatId, lookup),
    } : {}),
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

  // Incomes sheet (only paid/received)
  const incData = incomes.map((i) => ({
    'Tarih': formatDate(i.incomeDate),
    'Kategori': getStatusLabel(i.category),
    'Tutar': i.amount,
    'Ödemeyi Yapan': i.payer || '-',
    'Açıklama': i.description,
  }));
  const incSheet = XLSX.utils.json_to_sheet(incData);
  autoSizeColumns(incSheet, incData);
  XLSX.utils.book_append_sheet(workbook, incSheet, 'Gelirler');

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

  // Monthly breakdown sheet
  const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const mIncomes = incomes.filter((inc) => new Date(inc.incomeDate).getMonth() === i);
    const mExpenses = expenses.filter((e) => new Date(e.expenseDate).getMonth() === i);
    const mDues = dues.filter((d) => d.month === month);
    const mPaid = mDues.filter((d) => d.status === 'paid');
    const mIncome = mIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const mExpense = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      'Ay': getMonthName(month),
      'Gelir': mIncome,
      'Gider': mExpense,
      'Net': mIncome - mExpense,
      'Toplam Aidat': mDues.reduce((sum, d) => sum + d.amount, 0),
      'Tahsilat': mPaid.reduce((sum, d) => sum + d.paidAmount, 0),
      'Ödenen Daire': mPaid.length,
      'Toplam Daire': mDues.length,
      'Tahsilat %': mDues.length > 0 ? `%${((mPaid.length / mDues.length) * 100).toFixed(0)}` : '-',
    };
  });
  const monthlySheet = XLSX.utils.json_to_sheet(monthlyBreakdown);
  autoSizeColumns(monthlySheet, monthlyBreakdown);
  XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Aylık Özet');

  // Income by category breakdown
  const categoryMap = new Map<string, number>();
  incomes.forEach((i) => {
    categoryMap.set(i.category, (categoryMap.get(i.category) || 0) + i.amount);
  });
  const catData = Array.from(categoryMap.entries()).map(([cat, amount]) => ({
    'Kategori': getStatusLabel(cat),
    'Tutar': amount,
  }));
  if (catData.length > 0) {
    const catSheet = XLSX.utils.json_to_sheet(catData);
    autoSizeColumns(catSheet, catData);
    XLSX.utils.book_append_sheet(workbook, catSheet, 'Gelir Kategorileri');
  }

  // Summary sheet
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDue = dues.reduce((sum, d) => sum + d.amount, 0);
  const totalPaidDue = dues.filter((d) => d.status === 'paid').reduce((sum, d) => sum + d.paidAmount, 0);
  const summaryData = [
    { 'Özet': 'Toplam Gelir', 'Tutar': totalIncome },
    { 'Özet': 'Toplam Gider', 'Tutar': totalExpense },
    { 'Özet': 'Net Bakiye', 'Tutar': totalIncome - totalExpense },
    { 'Özet': 'Toplam Aidat Tutarı', 'Tutar': totalDue },
    { 'Özet': 'Tahsil Edilen Aidat', 'Tutar': totalPaidDue },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  autoSizeColumns(summarySheet, summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet');

  downloadWorkbook(workbook, `finansal_rapor_${year}.xlsx`);
}
