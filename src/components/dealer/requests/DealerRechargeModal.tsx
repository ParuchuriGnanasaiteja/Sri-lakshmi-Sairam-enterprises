import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { formatCurrency } from '../../../utils/formatters';

interface DealerRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DealerRechargeModal: React.FC<DealerRechargeModalProps> = ({ isOpen, onClose }) => {
  const { currentDealer } = useAuth();
  const { operators, submitRechargeRequest } = useData();

  const [operatorId, setOperatorId] = useState(operators[0]?.id || '');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [planAmount, setPlanAmount] = useState(399);
  const [planDesc, setPlanDesc] = useState('');

  if (!currentDealer) return null;

  const selectedOp = operators.find(o => o.id === operatorId) || operators[0];
  const commission = Number(((planAmount * selectedOp.default_commission_rate) / 100).toFixed(2));
  const netAmount = Number((planAmount - commission).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !planAmount) return;

    submitRechargeRequest({
      dealerId: currentDealer.id,
      customerId,
      customerName,
      customerMobile,
      operatorId,
      planAmount: Number(planAmount),
      planDescription: planDesc
    });

    setCustomerId('');
    setCustomerName('');
    setCustomerMobile('');
    setPlanDesc('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit DTH Recharge Request"
      subtitle="Commission is calculated instantly; balance deducted after completion."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Operator Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select DTH Operator *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {operators.map(op => (
              <button
                key={op.id}
                type="button"
                onClick={() => setOperatorId(op.id)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  operatorId === op.id
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <p>{op.name}</p>
                <span className="text-[10px] text-emerald-600 font-mono font-normal">
                  {op.default_commission_rate}% Comm
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Customer ID & Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subscriber / Customer ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. 1092839401"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Mobile</label>
            <input
              type="tel"
              placeholder="10 digit mobile"
              value={customerMobile}
              onChange={e => setCustomerMobile(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200"
            />
          </div>
        </div>

        {/* Plan Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Recharge Amount (₹) *</label>
          <input
            type="number"
            required
            min={10}
            value={planAmount}
            onChange={e => setPlanAmount(Number(e.target.value))}
            className="w-full px-3 py-2 text-base font-black rounded-xl border border-slate-200 text-blue-950"
          />
          {/* Quick amount chips */}
          <div className="flex gap-2 mt-2">
            {[199, 299, 399, 499, 599, 999].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setPlanAmount(amt)}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Price & Commission Calculation Box */}
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-600">Plan MRP:</span>
            <span className="font-bold text-slate-900">{formatCurrency(planAmount)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Your Commission ({selectedOp.default_commission_rate}%):</span>
            <span className="font-bold">+{formatCurrency(commission)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-emerald-200 font-black text-slate-900 text-sm">
            <span>Net Cost to You:</span>
            <span>{formatCurrency(netAmount)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" type="submit">Submit Recharge Request</Button>
        </div>
      </form>
    </Modal>
  );
};
