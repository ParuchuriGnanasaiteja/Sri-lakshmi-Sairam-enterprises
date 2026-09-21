import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dealer, LedgerTransaction, BusinessSettings } from '../types';
import { formatCurrency, formatDate } from './formatters';

export const generateDealerStatementPDF = (
  dealer: Dealer,
  transactions: LedgerTransaction[],
  settings: BusinessSettings,
  startDate?: string,
  endDate?: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(30, 58, 138); // Dark Navy Blue
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.business_name, 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${settings.address}, ${settings.location}, ${settings.state} - ${settings.pincode}`, 14, 22);
  doc.text(`Phone: ${settings.primary_mobile} | GSTIN: ${settings.gst_number}`, 14, 28);
  doc.text('STATEMENT OF ACCOUNT (DIGITAL KHATA)', 14, 34);

  // Statement info on right
  const periodText = `Period: ${startDate ? formatDate(startDate) : 'All Time'} - ${endDate ? formatDate(endDate) : formatDate(new Date().toISOString())}`;
  doc.text(periodText, pageWidth - 14, 22, { align: 'right' });
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 28, { align: 'right' });

  // Dealer Details Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DEALER DETAILS', 14, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dealer Code: ${dealer.dealer_code}`, 14, 55);
  doc.text(`Name: ${dealer.name}`, 14, 61);
  doc.text(`Shop: ${dealer.shop_name}`, 14, 67);
  doc.text(`Mobile: ${dealer.mobile}`, 14, 73);
  doc.text(`Area / Town: ${dealer.area}, ${dealer.village_or_town}`, 14, 79);

  // Financial summary box on top right
  const filteredTxns = transactions
    .filter(t => t.dealer_id === dealer.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let totalCredit = 0;
  let totalDebit = 0;
  filteredTxns.forEach(t => {
    if (t.type === 'CREDIT') totalCredit += t.amount;
    if (t.type === 'DEBIT') totalDebit += t.amount;
  });

  const lastTxn = filteredTxns[filteredTxns.length - 1];
  const finalBalance = lastTxn ? lastTxn.balance_after : 0;
  const finalOutstanding = lastTxn ? lastTxn.outstanding_after : 0;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 85, 45, 71, 38, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ACCOUNT SUMMARY', pageWidth - 80, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`Credit Limit: ${formatCurrency(dealer.credit_limit)}`, pageWidth - 80, 58);
  doc.text(`Total Payments/Credits: ${formatCurrency(totalCredit)}`, pageWidth - 80, 64);
  doc.text(`Total Recharges/Debits: ${formatCurrency(totalDebit)}`, pageWidth - 80, 70);
  
  doc.setFont('helvetica', 'bold');
  if (finalOutstanding > 0) {
    doc.setTextColor(225, 29, 72);
    doc.text(`Current Outstanding: ${formatCurrency(finalOutstanding)}`, pageWidth - 80, 77);
  } else {
    doc.setTextColor(16, 185, 129);
    doc.text(`Available Balance: ${formatCurrency(finalBalance)}`, pageWidth - 80, 77);
  }

  // Transactions Table
  doc.setTextColor(15, 23, 42);

  const tableRows = filteredTxns.map(t => [
    formatDate(t.date),
    t.transaction_no,
    t.description,
    t.type === 'CREDIT' ? formatCurrency(t.amount) : '-',
    t.type === 'DEBIT' ? formatCurrency(t.amount) : '-',
    t.outstanding_after > 0 ? `-${formatCurrency(t.outstanding_after)}` : formatCurrency(t.balance_after)
  ]);

  autoTable(doc, {
    startY: 88,
    head: [['Date', 'Txn No', 'Description', 'Credit (+)', 'Debit (-)', 'Balance']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    }
  });

  // Footer note
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('This is a computer generated statement from Sri Lakshmi Sairam Enterprises Digital Khata system.', 14, finalY + 12);
  doc.text('For queries or reconciliation, contact distributor office: ' + settings.primary_mobile, 14, finalY + 17);

  doc.save(`Statement_${dealer.dealer_code}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generatePaymentReceiptPDF = (
  dealer: Dealer,
  txn: LedgerTransaction,
  settings: BusinessSettings
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.business_name, 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${settings.address}, ${settings.location}, ${settings.state}`, 14, 22);
  doc.text(`Phone: ${settings.primary_mobile} | GSTIN: ${settings.gst_number}`, 14, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('OFFICIAL PAYMENT RECEIPT', pageWidth - 14, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`Receipt No: ${txn.transaction_no}`, pageWidth - 14, 27, { align: 'right' });

  // Receipt Content Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Received With Thanks From:`, 14, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`${dealer.shop_name} (${dealer.name})`, 14, 55);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dealer Code: ${dealer.dealer_code} | Mobile: ${dealer.mobile}`, 14, 62);
  doc.text(`Location: ${dealer.area}, ${dealer.village_or_town}`, 14, 68);

  // Amount Highlight
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 75, pageWidth - 28, 25, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AMOUNT RECEIVED:', 20, 86);
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(txn.amount), 20, 95);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: ${txn.payment_method || 'UPI'}`, pageWidth - 70, 86);
  doc.text(`Ref / UTR No: ${txn.reference_no || 'N/A'}`, pageWidth - 70, 92);
  doc.text(`Date: ${formatDate(txn.date)}`, pageWidth - 70, 98);

  // Balance status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ACCOUNT STATUS AFTER THIS TRANSACTION:', 14, 115);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Available Balance: ${formatCurrency(txn.balance_after)}`, 14, 123);
  doc.text(`Outstanding Balance: ${formatCurrency(txn.outstanding_after)}`, 14, 130);

  // Signature lines
  doc.line(14, 170, 64, 170);
  doc.text('Authorized Signatory', 14, 176);
  doc.text('For SRI LAKSHMI SAIRAM ENTERPRISES', 14, 181);

  doc.line(pageWidth - 64, 170, pageWidth - 14, 170);
  doc.text('Dealer Signature / Stamp', pageWidth - 64, 176);

  doc.save(`Receipt_${txn.transaction_no}.pdf`);
};
