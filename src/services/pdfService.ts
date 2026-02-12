import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Payment, Due } from '@/types';
import { formatCurrency, formatDate, getStatusLabel, getMonthName } from '@/utils/helpers';

/**
 * Generate payment receipt PDF
 */
export function generateReceiptPDF(payment: Payment, flatNumber: string, residentName: string): void {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('ODEME MAKBUZU', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Makbuz No: ${payment.receiptNumber}`, 105, 30, { align: 'center' });
  doc.text(`Tarih: ${formatDate(payment.paymentDate)}`, 105, 36, { align: 'center' });

  // Line
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);

  // Details
  doc.setFontSize(12);
  let y = 55;

  doc.text('Daire No:', 25, y);
  doc.text(flatNumber, 80, y);
  y += 10;

  doc.text('Sakin:', 25, y);
  doc.text(residentName, 80, y);
  y += 10;

  doc.text('Odeme Tutari:', 25, y);
  doc.text(formatCurrency(payment.amount), 80, y);
  y += 10;

  doc.text('Odeme Yontemi:', 25, y);
  doc.text(getStatusLabel(payment.paymentMethod), 80, y);
  y += 10;

  if (payment.bankReference) {
    doc.text('Banka Referans:', 25, y);
    doc.text(payment.bankReference, 80, y);
    y += 10;
  }

  if (payment.description) {
    doc.text('Aciklama:', 25, y);
    doc.text(payment.description, 80, y);
    y += 10;
  }

  // Line
  y += 5;
  doc.setLineWidth(0.3);
  doc.line(20, y, 190, y);

  // Footer
  y += 15;
  doc.setFontSize(10);
  doc.text('Bu makbuz elektronik olarak olusturulmustur.', 105, y, { align: 'center' });
  doc.text(`Olusturulma: ${new Date().toLocaleString('tr-TR')}`, 105, y + 7, { align: 'center' });

  doc.save(`makbuz_${payment.receiptNumber}.pdf`);
}

/**
 * Generate financial summary PDF
 */
export function generateFinancialSummaryPDF(
  dues: Due[],
  totalIncome: number,
  totalExpense: number,
  period: string
): void {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text('FINANSAL OZET RAPORU', 105, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Donem: ${period}`, 105, 28, { align: 'center' });
  doc.text(`Olusturulma: ${new Date().toLocaleString('tr-TR')}`, 105, 34, { align: 'center' });

  // Summary Table
  autoTable(doc, {
    startY: 45,
    head: [['Kalem', 'Tutar']],
    body: [
      ['Toplam Gelir', formatCurrency(totalIncome)],
      ['Toplam Gider', formatCurrency(totalExpense)],
      ['Net Bakiye', formatCurrency(totalIncome - totalExpense)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  });

  // Dues detail table
  if (dues.length > 0) {
    const currentY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80;

    doc.setFontSize(14);
    doc.text('Aidat Detaylari', 14, currentY + 15);

    autoTable(doc, {
      startY: currentY + 20,
      head: [['Ay', 'Tutar', 'Odenen', 'Durum']],
      body: dues.map((due) => [
        `${getMonthName(due.month)} ${due.year}`,
        formatCurrency(due.amount),
        formatCurrency(due.paidAmount),
        getStatusLabel(due.status),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] },
    });
  }

  doc.save(`finansal_ozet_${period.replace(/\s/g, '_')}.pdf`);
}
