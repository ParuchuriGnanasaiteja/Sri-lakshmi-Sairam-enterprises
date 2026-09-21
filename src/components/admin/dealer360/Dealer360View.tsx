import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Store, 
  Phone, 
  MapPin, 
  Calendar, 
  Share2, 
  Download, 
  Plus, 
  CreditCard, 
  Boxes, 
  RefreshCw, 
  Wrench, 
  FileText, 
  Clock, 
  ShieldAlert, 
  CheckCircle2,
  Tv,
  FileCheck,
  IndianRupee
} from 'lucide-react';

import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { calculateDealerFinancials } from '../../../utils/accounting';
import { generateDealerStatementPDF, generatePaymentReceiptPDF } from '../../../utils/pdfGenerator';
import { generateOutstandingReminderWhatsApp } from '../../../utils/whatsapp';

interface Dealer360ViewProps {
  dealerId: string;
  onBack: () => void;
}

export const Dealer360View: React.FC<Dealer360ViewProps> = ({ dealerId, onBack }) => {
  const { 
    dealers, 
    products, 
    operators, 
    warehouseStock, 
    dealerStock, 
    ledgerTransactions, 
    payments, 
    rechargeRequests, 
    serviceTickets, 
    serials, 
    settings,
    recordPayment,
    dispatchStock,
    submitRechargeRequest,
    createServiceTicket,
    addLedgerAdjustment,
    toggleDealerStatus
  } = useData();

  const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'money' | 'stock' | 'recharges' | 'services' | 'timeline'>('overview');

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // Form states
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');
  const [payUtr, setPayUtr] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [stockProductId, setStockProductId] = useState(products[0]?.id || '');
  const [stockQuantity, setStockQuantity] = useState(10);
  const [stockNotes, setStockNotes] = useState('');

  const [recCustomerId, setRecCustomerId] = useState('');
  const [recCustName, setRecCustName] = useState('');
  const [recCustMobile, setRecCustMobile] = useState('');
  const [recOperatorId, setRecOperatorId] = useState(operators[0]?.id || '');
  const [recAmount, setRecAmount] = useState(399);

  const [tktCustName, setTktCustName] = useState('');
  const [tktCustMobile, setTktCustMobile] = useState('');
  const [tktCustAddress, setTktCustAddress] = useState('');
  const [tktCustId, setTktCustId] = useState('');
  const [tktIssueType, setTktIssueType] = useState<any>('installation');
  const [tktDesc, setTktDesc] = useState('');

  const [adjAmount, setAdjAmount] = useState('');
  const [adjType, setAdjType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjReason, setAdjReason] = useState('');

  const dealer = dealers.find(d => d.id === dealerId);
  if (!dealer) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Dealer not found.</p>
        <Button onClick={onBack} className="mt-4">Back to Dealers</Button>
      </div>
    );
  }

  const financials = calculateDealerFinancials(dealer.id, ledgerTransactions, dealer.credit_limit);

  // Dealer specific data
  const dealerTxns = ledgerTransactions
    .filter(t => t.dealer_id === dealer.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const dealerPayments = payments
    .filter(p => p.dealer_id === dealer.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const dealerStockItems = dealerStock.filter(ds => ds.dealer_id === dealer.id);
  const dealerSerials = serials.filter(s => s.current_dealer_id === dealer.id);
  const dealerRecharges = rechargeRequests.filter(r => r.dealer_id === dealer.id);
  const dealerTickets = serviceTickets.filter(t => t.dealer_id === dealer.id);

  // Submit Handlers
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;
    recordPayment({
      dealerId: dealer.id,
      amount: Number(payAmount),
      paymentMethod: payMethod,
      utrNumber: payUtr,
      notes: payNotes,
      autoVerify: true
    });
    setPayAmount('');
    setPayUtr('');
    setPayNotes('');
    setIsPaymentModalOpen(false);
  };

  const handleDispatchStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProductId || stockQuantity <= 0) return;
    dispatchStock({
      dealerId: dealer.id,
      items: [{ productId: stockProductId, quantity: stockQuantity }],
      notes: stockNotes
    });
    setStockQuantity(10);
    setStockNotes('');
    setIsStockModalOpen(false);
  };

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recCustomerId || !recAmount) return;
    submitRechargeRequest({
      dealerId: dealer.id,
      customerId: recCustomerId,
      customerName: recCustName,
      customerMobile: recCustMobile,
      operatorId: recOperatorId,
      planAmount: Number(recAmount)
    });
    setRecCustomerId('');
    setRecCustName('');
    setRecCustMobile('');
    setIsRechargeModalOpen(false);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktCustName || !tktCustMobile) return;
    createServiceTicket({
      dealerId: dealer.id,
      customerId: tktCustId || `CUST-${Date.now().toString().slice(-5)}`,
      customerName: tktCustName,
      customerMobile: tktCustMobile,
      customerAddress: tktCustAddress || dealer.area,
      area: dealer.area,
      issueType: tktIssueType,
      description: tktDesc,
      priority: 'medium'
    });
    setTktCustName('');
    setTktCustMobile('');
    setTktDesc('');
    setIsTicketModalOpen(false);
  };

  const handleAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjAmount || !adjReason) return;
    addLedgerAdjustment({
      dealerId: dealer.id,
      amount: Number(adjAmount),
      type: adjType,
      txType: 'ADJUSTMENT',
      description: `Manual Correction: ${adjReason}`,
      reason: adjReason
    });
    setAdjAmount('');
    setAdjReason('');
    setIsAdjustmentModalOpen(false);
  };

  return (
    <div className="space-y-5">
      
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dealer List
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => generateDealerStatementPDF(dealer, ledgerTransactions, settings)}
          >
            PDF Statement
          </Button>
          {financials.calculatedOutstanding > 0 && (
            <Button
              variant="whatsapp"
              size="sm"
              icon={<Share2 className="w-4 h-4" />}
              onClick={() => {
                const url = generateOutstandingReminderWhatsApp(
                  dealer.shop_name,
                  dealer.mobile,
                  financials.calculatedOutstanding,
                  dealer.credit_limit
                );
                window.open(url, '_blank');
              }}
            >
              WhatsApp Reminder
            </Button>
          )}
        </div>
      </div>

      {/* Dealer 360 Header Profile Card */}
      <Card className="p-5 sm:p-6 bg-linear-to-b from-blue-50/30 to-white border-blue-100 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          
          {/* Details */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-900/20 shrink-0">
              {dealer.shop_name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{dealer.shop_name}</h2>
                <Badge variant={dealer.status === 'active' ? 'success' : 'neutral'}>
                  {dealer.status.toUpperCase()}
                </Badge>
                <span className="text-xs bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-md font-semibold">
                  {dealer.dealer_code}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-1">{dealer.name}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1 font-mono"><Phone className="w-3.5 h-3.5 text-slate-400" /> {dealer.mobile}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {dealer.area}, {dealer.village_or_town}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined {formatDate(dealer.joining_date)}</span>
              </div>
            </div>
          </div>

          {/* Quick Financial Snapshot */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Available Bal</span>
              <p className="text-lg font-black text-emerald-600">{formatCurrency(financials.calculatedBalance)}</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Outstanding</span>
              <p className={`text-lg font-black ${financials.calculatedOutstanding > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {formatCurrency(financials.calculatedOutstanding)}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Credit Limit</span>
              <p className="text-lg font-black text-slate-800">{formatCurrency(dealer.credit_limit)}</p>
            </div>
          </div>

        </div>

        {/* Credit Limit Usage Warning Bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
            <span>
              Credit Exposure: <strong>{financials.creditUsedPercentage.toFixed(1)}%</strong>
              {financials.isApproachingLimit && <span className="ml-2 text-amber-700 font-bold">(Approaching 80% limit warning)</span>}
              {financials.isExceededLimit && <span className="ml-2 text-rose-700 font-bold">(Exceeded 100% credit limit)</span>}
            </span>
            <span className="text-slate-400">{formatCurrency(financials.calculatedOutstanding)} / {formatCurrency(dealer.credit_limit)}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                financials.isExceededLimit ? 'bg-rose-500' : financials.isApproachingLimit ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, financials.creditUsedPercentage)}%` }}
            />
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="success"
            size="sm"
            icon={<IndianRupee className="w-4 h-4" />}
            onClick={() => setIsPaymentModalOpen(true)}
          >
            Record Payment
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Boxes className="w-4 h-4" />}
            onClick={() => setIsStockModalOpen(true)}
          >
            Dispatch Stock
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => setIsRechargeModalOpen(true)}
          >
            New Recharge
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Wrench className="w-4 h-4" />}
            onClick={() => setIsTicketModalOpen(true)}
          >
            Service Ticket
          </Button>
        </div>

      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'ledger', label: `Digital Khata (${dealerTxns.length})` },
          { id: 'money', label: `Payments (${dealerPayments.length})` },
          { id: 'stock', label: `Stock & Serials (${dealerStockItems.length})` },
          { id: 'recharges', label: `Recharges (${dealerRecharges.length})` },
          { id: 'services', label: `Services (${dealerTickets.length})` },
          { id: 'timeline', label: 'Activity Timeline' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all shrink-0 ${
              activeTab === t.id
                ? 'bg-white border-t-2 border-t-blue-700 border-x border-slate-200 text-blue-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Financial Summary</h4>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Total Payments Recorded:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(financials.totalPayments)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-500">Total Recharge Value:</span>
                <span className="font-bold text-blue-700">{formatCurrency(financials.totalRecharges)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-500">Total Stock Purchases:</span>
                <span className="font-bold text-indigo-700">{formatCurrency(financials.totalStockPurchases)}</span>
              </div>
              <div className="flex justify-between pt-1.5">
                <span className="text-slate-500">Last Transaction Date:</span>
                <span className="font-mono text-slate-700">{formatDate(financials.lastTransactionDate)}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Current Stock in Shop</h4>
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              {dealerStockItems.length === 0 ? (
                <p className="text-slate-400 py-2">No stock items assigned yet.</p>
              ) : (
                dealerStockItems.map(ds => (
                  <div key={ds.product_id} className="flex justify-between pt-1.5">
                    <span className="text-slate-600 font-medium truncate">{ds.product_name}</span>
                    <span className="font-bold text-slate-900 shrink-0 ml-2">{ds.quantity} Nos</span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Recent Operations</h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                <span>Completed Recharges</span>
                <strong className="text-blue-700">{dealerRecharges.filter(r => r.status === 'completed').length}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                <span>Open Service Tickets</span>
                <strong className="text-amber-700">{dealerTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                <span>Tracked STB Units</span>
                <strong className="text-indigo-700">{dealerSerials.length}</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: DIGITAL KHATA (LEDGER) */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Immutable Digital Khata</h3>
              <p className="text-xs text-slate-500">Every credit and debit transaction is permanently audited.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAdjustmentModalOpen(true)}
              >
                + Adjustment / Correction
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={() => generateDealerStatementPDF(dealer, ledgerTransactions, settings)}
              >
                Download Statement
              </Button>
            </div>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Txn No</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">Credit (+)</th>
                    <th className="px-4 py-3 text-right">Debit (-)</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dealerTxns.length === 0 ? (
                    <tr><td colSpan={8} className="p-6 text-center text-slate-400">No transactions recorded yet.</td></tr>
                  ) : (
                    dealerTxns.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono text-slate-600">{formatDate(t.date)}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">{t.transaction_no}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{t.description}</p>
                          {t.reference_no && <p className="text-[10px] text-slate-400 font-mono">Ref: {t.reference_no}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {t.payment_method || 'SYSTEM'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">
                          {t.type === 'CREDIT' ? formatCurrency(t.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          {t.type === 'DEBIT' ? formatCurrency(t.amount) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {t.outstanding_after > 0 ? (
                            <span className="text-rose-600">-{formatCurrency(t.outstanding_after)}</span>
                          ) : (
                            <span className="text-emerald-600">{formatCurrency(t.balance_after)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => generatePaymentReceiptPDF(dealer, t, settings)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Generate PDF Receipt"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: MONEY / PAYMENTS */}
      {activeTab === 'money' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Payment Submissions & Receipts</h3>
            <Button
              variant="success"
              size="sm"
              icon={<IndianRupee className="w-4 h-4" />}
              onClick={() => setIsPaymentModalOpen(true)}
            >
              Record Payment
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Payment No</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">UTR / Ref</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dealerPayments.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-slate-400">No payment records found.</td></tr>
                  ) : (
                    dealerPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono">{formatDate(p.date)}</td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-900">{p.payment_no}</td>
                        <td className="px-4 py-3 font-medium">{p.payment_method}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{p.utr_number || 'N/A'}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={p.status === 'verified' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: STOCK & SERIALS */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Stock Inventory & Serial Numbers</h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Boxes className="w-4 h-4" />}
              onClick={() => setIsStockModalOpen(true)}
            >
              Dispatch Stock to Dealer
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {dealerStockItems.map(ds => (
              <Card key={ds.product_id} className="p-4 border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">{ds.category}</span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">{ds.product_name}</p>
                <p className="text-2xl font-black text-blue-900 mt-2">{ds.quantity} <span className="text-xs font-normal text-slate-500">Units</span></p>
              </Card>
            ))}
          </div>

          {/* Serials List */}
          <Card className="p-0 overflow-hidden mt-4">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Tracked Serial / VC Units with Dealer
            </div>
            <div className="divide-y divide-slate-100">
              {dealerSerials.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">No active serialized units assigned to this dealer.</div>
              ) : (
                dealerSerials.map(s => (
                  <div key={s.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-900">{s.serial_number}</span>
                        {s.vc_number && <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-mono">VC: {s.vc_number}</span>}
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{s.product_name}</p>
                    </div>
                    <Badge variant={s.status === 'installed' ? 'success' : s.status === 'with_dealer' ? 'info' : 'danger'}>
                      {s.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: RECHARGES */}
      {activeTab === 'recharges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Recharge History</h3>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => setIsRechargeModalOpen(true)}
            >
              Submit Recharge
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Request No</th>
                    <th className="px-4 py-3">Customer ID</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3 text-right">Plan Amount</th>
                    <th className="px-4 py-3 text-right">Commission</th>
                    <th className="px-4 py-3 text-right">Net Deducted</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dealerRecharges.length === 0 ? (
                    <tr><td colSpan={7} className="p-6 text-center text-slate-400">No recharges recorded.</td></tr>
                  ) : (
                    dealerRecharges.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono font-semibold">{r.request_no}</td>
                        <td className="px-4 py-3 font-mono text-slate-900">{r.customer_id}</td>
                        <td className="px-4 py-3 font-medium">{r.operator_name}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(r.plan_amount)}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatCurrency(r.commission_amount)}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(r.net_amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : 'info'}>
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 6: SERVICES */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Service & Complaint Tickets</h3>
            <Button
              variant="outline"
              size="sm"
              icon={<Wrench className="w-4 h-4" />}
              onClick={() => setIsTicketModalOpen(true)}
            >
              Raise Service Ticket
            </Button>
          </div>

          <div className="space-y-3">
            {dealerTickets.length === 0 ? (
              <Card className="p-6 text-center text-slate-400 text-xs">No service tickets recorded for this dealer.</Card>
            ) : (
              dealerTickets.map(t => (
                <Card key={t.id} className="p-4 border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{t.ticket_no}</span>
                      <span className="text-xs capitalize bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                        {t.issue_type.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant={t.status === 'resolved' || t.status === 'closed' ? 'success' : 'warning'}>
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 mt-2">{t.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    <span>Customer: <strong>{t.customer_name}</strong> ({t.customer_mobile})</span>
                    <span>Tech: {t.assigned_technician_name || 'Unassigned'}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: TIMELINE */}
      {activeTab === 'timeline' && (
        <Card className="p-5">
          <h4 className="font-bold text-sm text-slate-900 mb-4">Chronological Activity Stream</h4>
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {dealerTxns.slice(0, 8).map(t => (
              <div key={t.id} className="relative">
                <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                <div className="text-xs">
                  <span className="font-bold text-slate-900">{t.description}</span>
                  <span className={`ml-2 font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ({t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount)})
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatDateTime(t.created_at)} • Logged by {t.created_by}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL: Record Payment */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment - ${dealer.shop_name}`}
        subtitle="Credits amount directly to dealer ledger"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Received (₹) *</label>
            <input
              type="number"
              required
              min={1}
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
            <select
              value={payMethod}
              onChange={e => setPayMethod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            >
              <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
              <option value="CASH">Cash at Counter</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Reference Number</label>
            <input
              type="text"
              placeholder="e.g. UPI/492019283920"
              value={payUtr}
              onChange={e => setPayUtr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder="Optional notes"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit">Credit Payment</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Dispatch Stock */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Dispatch Stock - ${dealer.shop_name}`}
        subtitle="Decrements warehouse stock and creates stock purchase debit in ledger"
      >
        <form onSubmit={handleDispatchStock} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
            <select
              value={stockProductId}
              onChange={e => setStockProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            >
              {products.map(p => {
                const wh = warehouseStock[p.id]?.quantity || 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} - ₹{p.dealer_price} (Warehouse Stock: {wh} Units)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Dispatch *</label>
            <input
              type="number"
              required
              min={1}
              value={stockQuantity}
              onChange={e => setStockQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dispatch Notes / Challan Ref</label>
            <input
              type="text"
              placeholder="e.g. Dispatched with shop boy"
              value={stockNotes}
              onChange={e => setStockNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsStockModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Confirm Dispatch</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Submit Recharge */}
      <Modal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        title={`Submit Recharge - ${dealer.shop_name}`}
        subtitle="Instant recharge request creation"
      >
        <form onSubmit={handleRecharge} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">DTH Operator *</label>
            <select
              value={recOperatorId}
              onChange={e => setRecOperatorId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            >
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.name} (Comm: {op.default_commission_rate}%)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Subscriber ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. 1092839401"
              value={recCustomerId}
              onChange={e => setRecCustomerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recharge Amount (₹) *</label>
            <input
              type="number"
              required
              min={10}
              value={recAmount}
              onChange={e => setRecAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRechargeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Submit Recharge</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Service Ticket */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title={`New Service Ticket - ${dealer.shop_name}`}
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              placeholder="Customer Full Name"
              value={tktCustName}
              onChange={e => setTktCustName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Mobile *</label>
            <input
              type="tel"
              required
              placeholder="10 digit mobile"
              value={tktCustMobile}
              onChange={e => setTktCustMobile(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Type *</label>
            <select
              value={tktIssueType}
              onChange={e => setTktIssueType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            >
              <option value="installation">New Installation</option>
              <option value="stb_fault">STB Box Fault / Red Light</option>
              <option value="remote_issue">Remote Controller Issue</option>
              <option value="channel_issue">Signal Loss / Error 102</option>
              <option value="shifting">Dish Shifting</option>
              <option value="replacement">Equipment Replacement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Description</label>
            <textarea
              rows={2}
              value={tktDesc}
              onChange={e => setTktDesc(e.target.value)}
              placeholder="Details about the customer issue"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsTicketModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Create Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Ledger Adjustment */}
      <Modal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        title="Create Ledger Adjustment / Reversal"
        subtitle="Adds an audited correcting transaction without overwriting history"
      >
        <form onSubmit={handleAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type *</label>
            <select
              value={adjType}
              onChange={e => setAdjType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            >
              <option value="CREDIT">CREDIT (+) - Add to dealer balance / reduce dues</option>
              <option value="DEBIT">DEBIT (-) - Deduct from balance / add dues</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              min={1}
              value={adjAmount}
              onChange={e => setAdjAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Reason *</label>
            <input
              type="text"
              required
              placeholder="e.g. Reversal for failed recharge #REC-492"
              value={adjReason}
              onChange={e => setAdjReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAdjustmentModalOpen(false)}>Cancel</Button>
            <Button variant="danger" size="sm" type="submit">Post Adjustment</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
