import React, { useState } from 'react';
import { CreditCard, QrCode } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { PaymentMethod } from '../../../types';

interface DealerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DealerPaymentModal: React.FC<DealerPaymentModalProps> = ({ isOpen, onClose }) => {
  const { currentDealer } = useAuth();
  const { settings, recordPayment } = useData();

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [utr, setUtr] = useState('');
  const [notes, setNotes] = useState('');

  if (!currentDealer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    recordPayment({
      dealerId: currentDealer.id,
      amount: Number(amount),
      paymentMethod: method,
      utrNumber: utr,
      notes,
      autoVerify: false // Needs admin verification
    });

    setAmount('');
    setUtr('');
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Payment Proof"
      subtitle="Upload your UPI UTR or Cash receipt for distributor verification"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Bank & UPI Information Box */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-1.5 text-blue-950">
          <div className="flex items-center justify-between">
            <span className="font-bold">Distributor UPI Payment Details:</span>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Official</span>
          </div>
          <p><strong>UPI ID:</strong> <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">{settings.upi_id}</span></p>
          <p><strong>Bank:</strong> {settings.bank_name} (A/C: {settings.account_number} • IFSC: {settings.ifsc_code})</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Amount Paid (₹) *</label>
          <input
            type="number"
            required
            min={1}
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 10000"
            className="w-full px-3 py-2 text-sm font-black rounded-xl border border-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value as any)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
          >
            <option value="UPI">UPI (PhonePe / Google Pay / Paytm)</option>
            <option value="BANK_TRANSFER">Bank NEFT / RTGS / IMPS</option>
            <option value="CASH">Cash handed to Distributor / Staff</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {method === 'UPI' ? '12-Digit UPI UTR Reference Number *' : 'Bank Reference Number'}
          </label>
          <input
            type="text"
            required={method === 'UPI'}
            placeholder="e.g. 492019482910"
            value={utr}
            onChange={e => setUtr(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Note</label>
          <input
            type="text"
            placeholder="e.g. Balance top-up for Sunday recharges"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="success" size="sm" type="submit">Submit for Verification</Button>
        </div>
      </form>
    </Modal>
  );
};
