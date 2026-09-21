import React, { useState } from 'react';
import { 
  Users, 
  IndianRupee, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Boxes, 
  RefreshCw, 
  Wrench, 
  AlertTriangle, 
  Share2, 
  Printer, 
  CheckCircle2, 
  FileText,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Modal } from '../../common/Modal';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { calculateDealerFinancials } from '../../../utils/accounting';
import { generateEODWhatsApp } from '../../../utils/whatsapp';

interface DashboardMetricsProps {
  onNavigateTab: (tab: string) => void;
  onSelectDealer: (dealerId: string) => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  onNavigateTab,
  onSelectDealer
}) => {
  const { 
    dealers, 
    ledgerTransactions, 
    payments, 
    rechargeRequests, 
    serviceTickets, 
    warehouseStock, 
    products, 
    settings 
  } = useData();

  const [isEodModalOpen, setIsEodModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Financial calculations
  let totalOutstanding = 0;
  let totalWalletBalance = 0;
  let activeDealersCount = 0;
  const criticalDealers: Array<{ dealer: any; financial: any }> = [];

  dealers.forEach(dealer => {
    if (dealer.status === 'active') activeDealersCount++;
    const fin = calculateDealerFinancials(dealer.id, ledgerTransactions, dealer.credit_limit);
    totalOutstanding += fin.calculatedOutstanding;
    totalWalletBalance += fin.calculatedBalance;

    if (fin.isApproachingLimit || fin.isExceededLimit) {
      criticalDealers.push({ dealer, financial: fin });
    }
  });

  // Today's Collection
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

  const todayTotalCollection = todayCash + todayUPI + todayBank;

  // Today's Recharges
  const todayRecharges = rechargeRequests.filter(
    r => r.created_at.startsWith(todayStr) || r.status === 'completed'
  );
  const todayRechargeValue = todayRecharges.reduce((acc, r) => acc + r.plan_amount, 0);

  // Stock Summary
  let totalStbStock = 0;
  let totalRemotesStock = 0;
  let lowStockProducts: any[] = [];

  products.forEach(p => {
    const wh = warehouseStock[p.id] || { quantity: 0, faulty_quantity: 0 };
    if (p.category === 'stb') totalStbStock += wh.quantity;
    if (p.category === 'remote') totalRemotesStock += wh.quantity;
    if (wh.quantity <= p.min_stock_threshold) {
      lowStockProducts.push({ product: p, quantity: wh.quantity });
    }
  });

  const pendingRecharges = rechargeRequests.filter(r => r.status === 'pending' || r.status === 'processing');
  const pendingTickets = serviceTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');

  // Recent Activity Feed
  const recentActivities = [
    ...payments.map(p => ({
      id: `p-${p.id}`,
      time: p.created_at,
      type: 'payment',
      title: `${p.dealer_name} paid ${formatCurrency(p.amount)}`,
      subtitle: `Via ${p.payment_method} ${p.utr_number ? `(${p.utr_number})` : ''}`,
      status: p.status,
      onClick: () => onNavigateTab('money')
    })),
    ...rechargeRequests.map(r => ({
      id: `r-${r.id}`,
      time: r.created_at,
      type: 'recharge',
      title: `${r.dealer_name} submitted ${r.operator_name} recharge`,
      subtitle: `Cust ID: ${r.customer_id} • Plan ${formatCurrency(r.plan_amount)}`,
      status: r.status,
      onClick: () => onNavigateTab('recharges')
    })),
    ...serviceTickets.map(t => ({
      id: `t-${t.id}`,
      time: t.created_at,
      type: 'service',
      title: `Service ticket for ${t.customer_name}`,
      subtitle: `${t.issue_type.toUpperCase()} • ${t.area} (${t.dealer_name})`,
      status: t.status,
      onClick: () => onNavigateTab('services')
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Live Distributor Operations
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {settings.business_name}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
              {settings.address}, {settings.location} • {formatDate(new Date().toISOString())}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="whatsapp"
              size="sm"
              icon={<Share2 className="w-4 h-4" />}
              onClick={() => setIsEodModalOpen(true)}
            >
              Daily EOD Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 border-white/20 shadow-none"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Summary
            </Button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Active Dealers */}
        <Card
          hoverable
          onClick={() => onNavigateTab('dealers')}
          className="border-blue-100 bg-linear-to-b from-blue-50/40 to-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Dealers</span>
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{activeDealersCount}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-blue-700 font-semibold">{dealers.length} Total Registered</span>
            </p>
          </div>
        </Card>

        {/* Total Outstanding */}
        <Card
          hoverable
          onClick={() => onNavigateTab('dealers')}
          className="border-rose-100 bg-linear-to-b from-rose-50/40 to-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-rose-600">{formatCurrency(totalOutstanding, false)}</p>
            <p className="text-xs text-slate-500 mt-1">
              Wallet Bal: <span className="font-semibold text-emerald-600">{formatCurrency(totalWalletBalance, false)}</span>
            </p>
          </div>
        </Card>

        {/* Today's Collection */}
        <Card
          hoverable
          onClick={() => onNavigateTab('money')}
          className="border-emerald-100 bg-linear-to-b from-emerald-50/40 to-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Collection</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-700">{formatCurrency(todayTotalCollection, false)}</p>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span>UPI: {formatCurrency(todayUPI, false)}</span>
              <span>• Cash: {formatCurrency(todayCash, false)}</span>
            </div>
          </div>
        </Card>

        {/* Warehouse Stock */}
        <Card
          hoverable
          onClick={() => onNavigateTab('stock')}
          className="border-indigo-100 bg-linear-to-b from-indigo-50/40 to-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Warehouse STBs</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalStbStock} <span className="text-xs font-normal text-slate-500">Boxes</span></p>
            <p className="text-xs text-slate-500 mt-1">
              Remotes: <span className="font-semibold text-slate-700">{totalRemotesStock} Nos</span>
            </p>
          </div>
        </Card>

      </div>

      {/* Secondary Quick Attention Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Pending Recharges Card */}
        <Card
          hoverable
          onClick={() => onNavigateTab('recharges')}
          className="flex items-center justify-between p-4 border-amber-100 bg-amber-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Recharges</p>
              <p className="text-lg font-black text-amber-900">{pendingRecharges.length} Requests</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
            Review
          </span>
        </Card>

        {/* Pending Service Tickets */}
        <Card
          hoverable
          onClick={() => onNavigateTab('services')}
          className="flex items-center justify-between p-4 border-rose-100 bg-rose-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Service Tickets</p>
              <p className="text-lg font-black text-rose-900">{pendingTickets.length} Active</p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full">
            Assign
          </span>
        </Card>

        {/* Low Stock Alert */}
        <Card
          hoverable
          onClick={() => onNavigateTab('stock')}
          className="flex items-center justify-between p-4 border-blue-100 bg-blue-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Warnings</p>
              <p className="text-lg font-black text-slate-900">{lowStockProducts.length} Items</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full">
            Check
          </span>
        </Card>

      </div>

      {/* Credit Limits & Today's Activity Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Today's Live Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Today's Live Activity Stream</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Auto-synced</span>
          </div>

          <Card className="divide-y divide-slate-100 p-0 overflow-hidden">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="text-sm">No activity recorded today yet.</p>
              </div>
            ) : (
              recentActivities.map(item => (
                <div
                  key={item.id}
                  onClick={item.onClick}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl mt-0.5 ${
                      item.type === 'payment' ? 'bg-emerald-100 text-emerald-800' :
                      item.type === 'recharge' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {item.type === 'payment' && <IndianRupee className="w-4 h-4" />}
                      {item.type === 'recharge' && <RefreshCw className="w-4 h-4" />}
                      {item.type === 'service' && <Wrench className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(item.time)}</p>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Right 1 Col: Dealers Approaching Credit Limit Warning */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Credit Limit Alerts</h3>
            </div>
            <span className="text-xs text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
              {criticalDealers.length} Alerts
            </span>
          </div>

          <Card className="space-y-3">
            {criticalDealers.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                <p className="text-xs">All dealers are within safe credit limits.</p>
              </div>
            ) : (
              criticalDealers.slice(0, 5).map(({ dealer, financial }) => (
                <div
                  key={dealer.id}
                  onClick={() => onSelectDealer(dealer.id)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-xs text-slate-900 truncate">{dealer.shop_name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      financial.isExceededLimit ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {financial.creditUsedPercentage.toFixed(0)}% Limit
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                    <span>Outstanding: <strong className="text-rose-600">{formatCurrency(financial.calculatedOutstanding)}</strong></span>
                    <span>Limit: {formatCurrency(dealer.credit_limit)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full ${financial.isExceededLimit ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, financial.creditUsedPercentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

      </div>

      {/* EOD Summary Report Modal */}
      <Modal
        isOpen={isEodModalOpen}
        onClose={() => setIsEodModalOpen(false)}
        title="Daily End-Of-Day (EOD) Summary Report"
        subtitle={`Generated for ${settings.business_name} • ${formatDate(new Date().toISOString())}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-slate-800">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-xs space-y-2 leading-relaxed">
            <p className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
              {settings.business_name} - EOD SUMMARY
            </p>
            <p><strong>Date:</strong> {formatDate(new Date().toISOString())}</p>
            <p><strong>Active Dealers:</strong> {activeDealersCount}</p>
            <p><strong>Total Money Collected Today:</strong> {formatCurrency(todayTotalCollection)}</p>
            <p className="pl-3 text-slate-600">├─ Cash: {formatCurrency(todayCash)}</p>
            <p className="pl-3 text-slate-600">├─ UPI: {formatCurrency(todayUPI)}</p>
            <p className="pl-3 text-slate-600">└─ Bank Transfer: {formatCurrency(todayBank)}</p>
            <p><strong>Recharges Done Today:</strong> {todayRecharges.length} (Turnover: {formatCurrency(todayRechargeValue)})</p>
            <p><strong>Pending Service Tickets:</strong> {pendingTickets.length}</p>
            <p><strong>Total Outstanding Dues:</strong> {formatCurrency(totalOutstanding)}</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEodModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="whatsapp"
              size="sm"
              icon={<Share2 className="w-4 h-4" />}
              onClick={() => {
                const url = generateEODWhatsApp(
                  settings.eod_whatsapp_number || settings.primary_mobile,
                  todayStr,
                  activeDealersCount,
                  todayTotalCollection,
                  todayCash,
                  todayUPI,
                  todayBank,
                  todayRecharges.length,
                  todayRechargeValue,
                  pendingTickets.length,
                  totalOutstanding
                );
                window.open(url, '_blank');
              }}
            >
              Share via WhatsApp
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
