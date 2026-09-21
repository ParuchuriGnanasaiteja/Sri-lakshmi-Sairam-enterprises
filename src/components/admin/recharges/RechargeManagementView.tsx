import React, { useState } from 'react';
import { 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Share2, 
  Plus, 
  Percent, 
  Check, 
  X,
  Tv,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { RechargeRequest, RechargeStatus } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { generateRechargeCompleteWhatsApp } from '../../../utils/whatsapp';

interface RechargeManagementViewProps {
  onSelectDealer: (dealerId: string) => void;
}

export const RechargeManagementView: React.FC<RechargeManagementViewProps> = ({ onSelectDealer }) => {
  const { 
    rechargeRequests, 
    dealers, 
    operators, 
    processRecharge, 
    submitRechargeRequest 
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'failed'>('all');
  
  const [completingRecharge, setCompletingRecharge] = useState<RechargeRequest | null>(null);
  const [operatorRefNo, setOperatorRefNo] = useState('');

  const [failingRecharge, setFailingRecharge] = useState<RechargeRequest | null>(null);
  const [failReason, setFailReason] = useState('');

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [formDealerId, setFormDealerId] = useState(dealers[0]?.id || '');
  const [formCustId, setFormCustId] = useState('');
  const [formCustName, setFormCustName] = useState('');
  const [formCustMobile, setFormCustMobile] = useState('');
  const [formOperatorId, setFormOperatorId] = useState(operators[0]?.id || '');
  const [formAmount, setFormAmount] = useState(399);

  const filteredRequests = rechargeRequests.filter(r => {
    const matchesQuery =
      r.customer_id.includes(searchQuery) ||
      r.dealer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.request_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customer_mobile && r.customer_mobile.includes(searchQuery)) ||
      (r.operator_ref_no && r.operator_ref_no.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesQuery && matchesStatus;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const pendingCount = rechargeRequests.filter(r => r.status === 'pending' || r.status === 'processing').length;
  const completedToday = rechargeRequests.filter(r => r.status === 'completed').length;
  const totalRechargeValue = rechargeRequests.reduce((acc, r) => r.status === 'completed' ? acc + r.plan_amount : acc, 0);

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingRecharge) return;
    const refNo = operatorRefNo || `OP-${Date.now().toString().slice(-6)}`;
    processRecharge(completingRecharge.id, 'completed', refNo);

    // Prompt WhatsApp confirmation
    const dealer = dealers.find(d => d.id === completingRecharge.dealer_id);
    if (dealer) {
      const url = generateRechargeCompleteWhatsApp(
        dealer.mobile,
        completingRecharge.customer_id,
        completingRecharge.operator_name,
        completingRecharge.plan_amount,
        refNo
      );
      window.open(url, '_blank');
    }

    setCompletingRecharge(null);
    setOperatorRefNo('');
  };

  const handleFailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!failingRecharge) return;
    processRecharge(failingRecharge.id, 'failed', undefined, failReason || 'Recharge failed at operator');
    setFailingRecharge(null);
    setFailReason('');
  };

  const handleManualRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustId || !formAmount) return;
    submitRechargeRequest({
      dealerId: formDealerId,
      customerId: formCustId,
      customerName: formCustName,
      customerMobile: formCustMobile,
      operatorId: formOperatorId,
      planAmount: Number(formAmount)
    });
    setFormCustId('');
    setFormCustName('');
    setFormCustMobile('');
    setIsSubmitModalOpen(false);
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-700" />
            DTH Recharge Queue & Commission
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Process dealer recharge requests, apply operator margins, and auto-debit balances
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsSubmitModalOpen(true)}
        >
          Submit New Recharge
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-amber-50/40 border-amber-200">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Queue</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">{pendingCount} <span className="text-xs font-normal text-slate-500">Requests</span></p>
          <p className="text-[10px] text-amber-700 mt-0.5">Awaiting operator processing</p>
        </Card>

        <Card className="p-4 bg-emerald-50/40 border-emerald-200">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Completed</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{completedToday} <span className="text-xs font-normal text-slate-500">Recharges</span></p>
          <p className="text-[10px] text-emerald-600 mt-0.5">Successfully credited</p>
        </Card>

        <Card className="p-4 bg-blue-50/40 border-blue-200">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Total Value</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{formatCurrency(totalRechargeValue)}</p>
          <p className="text-[10px] text-blue-600 mt-0.5">Turnover processed</p>
        </Card>

        <Card className="p-4 bg-indigo-50/40 border-indigo-200">
          <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Active Operators</span>
          <p className="text-2xl sm:text-3xl font-black text-indigo-900 mt-1">{operators.length} <span className="text-xs font-normal text-slate-500">Brands</span></p>
          <p className="text-[10px] text-indigo-600 mt-0.5">Tata Play, Airtel, Sun Direct, Dish</p>
        </Card>
      </div>

      {/* Operator Commission Summary Pills */}
      <Card className="p-3 bg-slate-50/80 border-slate-200">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Percent className="w-3.5 h-3.5 text-blue-600" />
          Configured Commission Rates:
        </div>
        <div className="flex flex-wrap gap-2">
          {operators.map(op => (
            <div key={op.id} className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-2xs">
              <span className="font-bold text-slate-900">{op.name}</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.2 rounded font-mono">
                {op.default_commission_rate}% Comm
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter Bar */}
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Subscriber ID, Dealer, Mobile, Ref No..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
            >
              <option value="all">All Request Status</option>
              <option value="pending">Pending Processing</option>
              <option value="processing">In Progress</option>
              <option value="completed">Completed Successfully</option>
              <option value="failed">Failed / Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Request No</th>
                <th className="px-4 py-3.5">Dealer</th>
                <th className="px-4 py-3.5">Customer / Subscriber ID</th>
                <th className="px-4 py-3.5">Operator</th>
                <th className="px-4 py-3.5 text-right">Plan Amount</th>
                <th className="px-4 py-3.5 text-right">Commission</th>
                <th className="px-4 py-3.5 text-right">Net Deducted</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-slate-400">No recharge requests found.</td></tr>
              ) : (
                filteredRequests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{r.request_no}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectDealer(r.dealer_id)}
                        className="font-bold text-blue-700 hover:underline text-left block"
                      >
                        {r.dealer_name}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-slate-900">{r.customer_id}</span>
                      {r.customer_name && <p className="text-[10px] text-slate-400">{r.customer_name}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.operator_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(r.plan_amount)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-bold">-{formatCurrency(r.commission_amount)}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">{formatCurrency(r.net_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : r.status === 'processing' ? 'info' : 'danger'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'pending' || r.status === 'processing' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="success"
                            size="sm"
                            icon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setCompletingRecharge(r);
                              setOperatorRefNo(`OP-${Date.now().toString().slice(-6)}`);
                            }}
                          >
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50 border-rose-200"
                            icon={<X className="w-3.5 h-3.5" />}
                            onClick={() => setFailingRecharge(r)}
                          >
                            Fail
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">
                          {r.operator_ref_no || '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Complete Recharge with Operator Ref */}
      <Modal
        isOpen={Boolean(completingRecharge)}
        onClose={() => setCompletingRecharge(null)}
        title="Mark Recharge as Completed"
        subtitle={`Subscriber ID: ${completingRecharge?.customer_id} (${completingRecharge?.operator_name})`}
        maxWidth="md"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p><strong>Dealer:</strong> {completingRecharge?.dealer_name}</p>
            <p><strong>Plan Amount:</strong> {completingRecharge && formatCurrency(completingRecharge.plan_amount)}</p>
            <p className="text-emerald-700"><strong>Commission ({completingRecharge && formatCurrency(completingRecharge.commission_amount)}):</strong> Credited to dealer</p>
            <p className="text-slate-900 font-bold"><strong>Net Deduction from Dealer Balance:</strong> {completingRecharge && formatCurrency(completingRecharge.net_amount)}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operator Reference / Transaction ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. TP/REC/9482019"
              value={operatorRefNo}
              onChange={e => setOperatorRefNo(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 font-bold"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setCompletingRecharge(null)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit">Confirm & Deduct Balance</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Fail Recharge */}
      <Modal
        isOpen={Boolean(failingRecharge)}
        onClose={() => setFailingRecharge(null)}
        title="Mark Recharge as Failed"
        maxWidth="sm"
      >
        <form onSubmit={handleFailSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Failure Reason *</label>
            <input
              type="text"
              required
              placeholder="e.g. Invalid Subscriber ID or Inactive Account"
              value={failReason}
              onChange={e => setFailReason(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setFailingRecharge(null)}>Cancel</Button>
            <Button variant="danger" size="sm" type="submit">Confirm Failed</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Submit New Recharge */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit New DTH Recharge"
      >
        <form onSubmit={handleManualRechargeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Dealer *</label>
            <select
              value={formDealerId}
              onChange={e => setFormDealerId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            >
              {dealers.map(d => (
                <option key={d.id} value={d.id}>{d.shop_name} ({d.name} • {d.area})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">DTH Operator *</label>
            <select
              value={formOperatorId}
              onChange={e => setFormOperatorId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            >
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.name} ({op.default_commission_rate}% Comm)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Subscriber ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. 1092839401"
                value={formCustId}
                onChange={e => setFormCustId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recharge Amount (₹) *</label>
              <input
                type="number"
                required
                min={10}
                value={formAmount}
                onChange={e => setFormAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsSubmitModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
