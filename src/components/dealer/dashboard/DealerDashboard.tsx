import React from 'react';
import { 
  Store, 
  IndianRupee, 
  Boxes, 
  RefreshCw, 
  Wrench, 
  Plus, 
  CreditCard, 
  ArrowUpRight, 
  Phone, 
  FileText,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { calculateDealerFinancials } from '../../../utils/accounting';
import { generateDealerStatementPDF } from '../../../utils/pdfGenerator';

interface DealerDashboardProps {
  onOpenRechargeModal: () => void;
  onOpenStockModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenTicketModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DealerDashboard: React.FC<DealerDashboardProps> = ({
  onOpenRechargeModal,
  onOpenStockModal,
  onOpenPaymentModal,
  onOpenTicketModal,
  onNavigateTab
}) => {
  const { currentDealer } = useAuth();
  const { 
    ledgerTransactions, 
    dealerStock, 
    rechargeRequests, 
    serviceTickets, 
    settings 
  } = useData();

  if (!currentDealer) {
    return <div className="p-8 text-center text-slate-500">Please select a dealer profile.</div>;
  }

  const financials = calculateDealerFinancials(currentDealer.id, ledgerTransactions, currentDealer.credit_limit);

  const myStock = dealerStock.filter(ds => ds.dealer_id === currentDealer.id);
  const myRecharges = rechargeRequests
    .filter(r => r.dealer_id === currentDealer.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const myTickets = serviceTickets
    .filter(t => t.dealer_id === currentDealer.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const myRecentTxns = ledgerTransactions
    .filter(t => t.dealer_id === currentDealer.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-5">
      
      {/* Dealer Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-xs mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {currentDealer.dealer_code} • {currentDealer.area}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {currentDealer.shop_name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Welcome back, {currentDealer.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 shadow-none text-xs"
              icon={<FileText className="w-4 h-4" />}
              onClick={() => generateDealerStatementPDF(currentDealer, ledgerTransactions, settings)}
            >
              My Statement
            </Button>
          </div>
        </div>

        {/* Balance Overview Card embedded */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Available Balance</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              {formatCurrency(financials.calculatedBalance)}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Outstanding Dues</span>
            <p className={`text-xl sm:text-2xl font-black mt-0.5 ${financials.calculatedOutstanding > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {formatCurrency(financials.calculatedOutstanding)}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Credit Limit</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {formatCurrency(currentDealer.credit_limit)}
            </p>
          </div>
        </div>

        {/* Warning if over limit */}
        {financials.isApproachingLimit && (
          <div className="mt-3 flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 p-2.5 rounded-xl text-xs text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>You have reached 80% of your credit limit. Please submit a payment soon.</span>
          </div>
        )}
      </div>

      {/* Quick Action Grid (Big Touch-Friendly Buttons) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenRechargeModal}
          className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl shadow-md shadow-blue-600/20 transition-all active:scale-[0.98]"
        >
          <div className="p-2.5 bg-white/15 rounded-xl mb-2">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xs sm:text-sm">Recharge Request</span>
          <span className="text-[10px] text-blue-100 mt-0.5">Instant credit</span>
        </button>

        <button
          onClick={onOpenPaymentModal}
          className="flex flex-col items-center justify-center p-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98]"
        >
          <div className="p-2.5 bg-white/15 rounded-xl mb-2">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xs sm:text-sm">Add Payment</span>
          <span className="text-[10px] text-emerald-100 mt-0.5">Upload UPI / Cash</span>
        </button>

        <button
          onClick={onOpenStockModal}
          className="flex flex-col items-center justify-center p-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
        >
          <div className="p-2.5 bg-white/15 rounded-xl mb-2">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xs sm:text-sm">Request Stock</span>
          <span className="text-[10px] text-indigo-100 mt-0.5">STBs & Remotes</span>
        </button>

        <button
          onClick={onOpenTicketModal}
          className="flex flex-col items-center justify-center p-4 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-2xl shadow-md shadow-amber-600/20 transition-all active:scale-[0.98]"
        >
          <div className="p-2.5 bg-white/15 rounded-xl mb-2">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xs sm:text-sm">Service Request</span>
          <span className="text-[10px] text-amber-100 mt-0.5">Signal & box fault</span>
        </button>
      </div>

      {/* My Shop Stock Row */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-700" />
            <h3 className="font-bold text-sm text-slate-900">My Stock in Shop</h3>
          </div>
          <button
            onClick={() => onNavigateTab('stock')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            View all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {myStock.length === 0 ? (
            <p className="col-span-4 text-center text-xs text-slate-400 py-3">No stock units allocated currently.</p>
          ) : (
            myStock.map(item => (
              <div key={item.product_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">{item.category}</span>
                <p className="font-bold text-xs text-slate-900 truncate mt-0.5">{item.product_name}</p>
                <p className="text-xl font-black text-blue-900 mt-1">{item.quantity} <span className="text-[10px] font-normal text-slate-500">Nos</span></p>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Recent Ledger Transactions & Recent Recharges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Recent Ledger Entries */}
        <Card className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Recent Khata Transactions</h3>
            </div>
            <button
              onClick={() => onNavigateTab('ledger')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Full Ledger
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {myRecentTxns.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">No transactions recorded yet.</p>
            ) : (
              myRecentTxns.map(t => (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{t.description}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(t.date)} • {t.payment_method || 'SYSTEM'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'CREDIT' ? '+' : '-'}{formatCurrency(t.amount)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">Bal: {formatCurrency(t.balance_after)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Recharges */}
        <Card className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Recent Recharge Requests</h3>
            </div>
            <button
              onClick={() => onNavigateTab('recharges')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {myRecharges.slice(0, 4).map(r => (
              <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{r.customer_id}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{r.operator_name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(r.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatCurrency(r.plan_amount)}</p>
                  <Badge variant={r.status === 'completed' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'}>
                    {r.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Distributor Contact Card */}
      <Card className="p-4 bg-slate-50 border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400">Distributor Office</span>
          <h4 className="font-bold text-sm text-slate-900">{settings.business_name}</h4>
          <p className="text-xs text-slate-500">{settings.address}, {settings.location} • UPI: <strong className="font-mono text-slate-700">{settings.upi_id}</strong></p>
        </div>
        <a
          href={`tel:${settings.primary_mobile}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-blue-800"
        >
          <Phone className="w-4 h-4" /> Call Distributor ({settings.primary_mobile})
        </a>
      </Card>

    </div>
  );
};
