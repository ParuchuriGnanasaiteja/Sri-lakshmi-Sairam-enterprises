import React, { useState } from 'react';
import { 
  IndianRupee, 
  Plus, 
  Check, 
  X, 
  Clock, 
  Share2, 
  FileCheck, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Smartphone,
  Banknote
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { PaymentRecord, PaymentMethod } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { generatePaymentReceiptWhatsApp } from '../../../utils/whatsapp';
import { generatePaymentReceiptPDF } from '../../../utils/pdfGenerator';
import { calculateDealerFinancials } from '../../../utils/accounting';

interface MoneyManagementViewProps {
  onSelectDealer: (dealerId: string) => void;
}

export const MoneyManagementView: React.FC<MoneyManagementViewProps> = ({ onSelectDealer }) => {
  const { 
    payments, 
    dealers, 
    ledgerTransactions, 
    settings, 
    recordPayment, 
    verifyPayment 
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Record Form
  const [selectedDealerId, setSelectedDealerId] = useState(dealers[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [utr, setUtr] = useState('');
  const [notes, setNotes] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Daily calculations
  let todayCash = 0;
  let todayUPI = 0;
  let todayBank = 0;

  payments
    .filter(p => p.status === 'verified' && (p.date === todayStr || p.created_at.startsWith(todayStr)))
    .forEach(p => {
      if (p.payment_method === 'CASH') todayCash += p.amount;
      else if (p.payment_method === 'UPI') todayUPI += p.amount;
      else todayBank += p.amount;
    });

  const todayTotal = todayCash + todayUPI + todayBank;

  // Pending queue
  const pendingPayments = payments.filter(p => p.status === 'pending');

  const filteredPayments = payments.filter(p => {
    const matchesQuery = 
      p.dealer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payment_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.utr_number && p.utr_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesQuery && matchesStatus;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    recordPayment({
      dealerId: selectedDealerId,
      amount: Number(amount),
      paymentMethod: method,
      utrNumber: utr,
      notes,
      date: payDate,
      autoVerify: true
    });

    setAmount('');
    setUtr('');
    setNotes('');
    setIsRecordModalOpen(false);
  };

  const handleConfirmReject = () => {
    if (!rejectingPayment) return;
    verifyPayment(rejectingPayment.id, false, rejectionReason || 'Payment verification failed');
    setRejectingPayment(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-5">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-emerald-600" />
            Money & Collections Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record dealer payments, verify UPI proofs, and maintain daily cash tallies
          </p>
        </div>

        <Button
          variant="success"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsRecordModalOpen(true)}
        >
          Record Direct Payment
        </Button>
      </div>

      {/* Today's Collection Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-emerald-50/40 border-emerald-200">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Total</span>
            <Banknote className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">{formatCurrency(todayTotal)}</p>
          <p className="text-[10px] text-emerald-600 mt-1 font-medium">{formatDate(todayStr)}</p>
        </Card>

        <Card className="p-4 bg-blue-50/40 border-blue-200">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's UPI (GPay/PhonePe)</span>
            <Smartphone className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">{formatCurrency(todayUPI)}</p>
          <p className="text-[10px] text-blue-600 mt-1 font-medium">Direct to UPI ID</p>
        </Card>

        <Card className="p-4 bg-amber-50/40 border-amber-200">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Cash</span>
            <IndianRupee className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-2">{formatCurrency(todayCash)}</p>
          <p className="text-[10px] text-amber-600 mt-1 font-medium">Counter cash</p>
        </Card>

        <Card className="p-4 bg-indigo-50/40 border-indigo-200">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Bank / NEFT</span>
            <Building2 className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-2">{formatCurrency(todayBank)}</p>
          <p className="text-[10px] text-indigo-600 mt-1 font-medium">SBI Account</p>
        </Card>
      </div>

      {/* Pending Payment Verification Queue (if any) */}
      {pendingPayments.length > 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-700" />
              <h3 className="font-bold text-sm sm:text-base text-amber-950">
                Dealer Payment Verification Queue ({pendingPayments.length} Pending)
              </h3>
            </div>
            <span className="text-xs bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              Action Required
            </span>
          </div>

          <div className="divide-y divide-amber-100">
            {pendingPayments.map(p => (
              <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{p.dealer_name}</span>
                    <span className="text-xs bg-white text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded font-mono">{p.payment_no}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Amount: <strong className="text-emerald-700 text-sm">{formatCurrency(p.amount)}</strong> via {p.payment_method}
                    {p.utr_number && <span className="font-mono ml-2 text-slate-500">UTR: {p.utr_number}</span>}
                  </p>
                  {p.notes && <p className="text-xs text-slate-500 italic mt-0.5">Note: "{p.notes}"</p>}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    icon={<Check className="w-4 h-4" />}
                    onClick={() => verifyPayment(p.id, true)}
                  >
                    Verify & Credit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 border-rose-200"
                    icon={<X className="w-4 h-4" />}
                    onClick={() => setRejectingPayment(p)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Bar */}
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by dealer, payment no, UTR..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
            >
              <option value="all">All Verification Status</option>
              <option value="verified">Verified Payments Only</option>
              <option value="pending">Pending Verification Only</option>
              <option value="rejected">Rejected Payments</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Payments History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Payment No</th>
                <th className="px-4 py-3.5">Dealer</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">UTR / Ref</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No payment records found.</td></tr>
              ) : (
                filteredPayments.map(p => {
                  const dealer = dealers.find(d => d.id === p.dealer_id);
                  const fin = dealer ? calculateDealerFinancials(dealer.id, ledgerTransactions, dealer.credit_limit) : null;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono">{formatDate(p.date)}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{p.payment_no}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onSelectDealer(p.dealer_id)}
                          className="font-bold text-blue-700 hover:underline text-left block"
                        >
                          {p.dealer_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">{p.payment_method}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.utr_number || '-'}</td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={p.status === 'verified' ? 'success' : p.status === 'pending' ? 'warning' : 'danger'}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === 'verified' && dealer && fin && (
                            <button
                              onClick={() => {
                                const url = generatePaymentReceiptWhatsApp({
                                  dealerName: dealer.shop_name,
                                  dealerMobile: dealer.mobile,
                                  amount: p.amount,
                                  paymentMethod: p.payment_method,
                                  referenceNo: p.utr_number,
                                  date: p.date,
                                  newBalance: fin.calculatedBalance,
                                  newOutstanding: fin.calculatedOutstanding
                                });
                                window.open(url, '_blank');
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Send WhatsApp Receipt"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Direct Payment */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Received Payment"
        subtitle="Credits payment directly to dealer balance & updates daily cash/UPI tally"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Dealer *</label>
            <select
              value={selectedDealerId}
              onChange={e => setSelectedDealerId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            >
              {dealers.map(d => (
                <option key={d.id} value={d.id}>{d.shop_name} ({d.name} • {d.area})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Received (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              >
                <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                <option value="CASH">Cash at Counter</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Bank Ref Number</label>
              <input
                type="text"
                placeholder="e.g. UPI/492019482910"
                value={utr}
                onChange={e => setUtr(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder="Optional notes or remarks"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsRecordModalOpen(false)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit">Credit & Generate Receipt</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Reject Reason */}
      <Modal
        isOpen={Boolean(rejectingPayment)}
        onClose={() => setRejectingPayment(null)}
        title="Reject Payment Verification"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Please enter the reason for rejecting payment of {rejectingPayment && formatCurrency(rejectingPayment.amount)} from {rejectingPayment?.dealer_name}:
          </p>
          <input
            type="text"
            required
            placeholder="e.g. UTR number not matching bank statement"
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setRejectingPayment(null)}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleConfirmReject}>Confirm Rejection</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
