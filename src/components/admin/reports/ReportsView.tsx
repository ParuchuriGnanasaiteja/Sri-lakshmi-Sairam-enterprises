import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  IndianRupee, 
  Boxes, 
  RefreshCw, 
  Users, 
  Share2 
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { calculateDealerFinancials } from '../../../utils/accounting';
import { exportToCSV } from '../../../utils/export';
import { generateEODWhatsApp } from '../../../utils/whatsapp';

export const ReportsView: React.FC = () => {
  const { 
    dealers, 
    ledgerTransactions, 
    payments, 
    rechargeRequests, 
    operators, 
    settings 
  } = useData();

  const [activeReport, setActiveReport] = useState<'financial' | 'outstanding' | 'operators' | 'dealers'>('financial');

  const todayStr = new Date().toISOString().split('T')[0];

  // Financial calculations
  let totalOutstanding = 0;
  let totalCredits = 0;
  let todayCash = 0;
  let todayUPI = 0;
  let todayBank = 0;

  payments.filter(p => p.status === 'verified').forEach(p => {
    if (p.date === todayStr || p.created_at.startsWith(todayStr)) {
      if (p.payment_method === 'CASH') todayCash += p.amount;
      else if (p.payment_method === 'UPI') todayUPI += p.amount;
      else todayBank += p.amount;
    }
  });

  const todayTotal = todayCash + todayUPI + todayBank;

  // Dealer financial ranking
  const dealerFinancials = dealers.map(d => {
    const fin = calculateDealerFinancials(d.id, ledgerTransactions, d.credit_limit);
    totalOutstanding += fin.calculatedOutstanding;
    totalCredits += fin.totalCredits;
    return { dealer: d, fin };
  }).sort((a, b) => b.fin.calculatedOutstanding - a.fin.calculatedOutstanding);

  // Operator share
  const operatorStats = operators.map(op => {
    const reqs = rechargeRequests.filter(r => r.operator_id === op.id && r.status === 'completed');
    const totalAmount = reqs.reduce((acc, r) => acc + r.plan_amount, 0);
    const totalComm = reqs.reduce((acc, r) => acc + r.commission_amount, 0);
    return {
      operator: op,
      count: reqs.length,
      totalAmount,
      totalComm
    };
  });

  const handleExportOutstandingCSV = () => {
    const headers = ['Dealer Code', 'Shop Name', 'Owner', 'Mobile', 'Area', 'Credit Limit', 'Available Balance', 'Outstanding Dues'];
    const rows = dealerFinancials.map(({ dealer, fin }) => [
      dealer.dealer_code,
      dealer.shop_name,
      dealer.name,
      dealer.mobile,
      dealer.area,
      dealer.credit_limit,
      fin.calculatedBalance,
      fin.calculatedOutstanding
    ]);
    exportToCSV(`Dealer_Outstanding_Report_${todayStr}`, headers, rows);
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-700" />
            Executive Reports & Analytics
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit-ready financial statements, dealer dues tracking, and operator performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print Report
          </Button>
          <Button
            variant="whatsapp"
            size="sm"
            icon={<Share2 className="w-4 h-4" />}
            onClick={() => {
              const url = generateEODWhatsApp(
                settings.eod_whatsapp_number || settings.primary_mobile,
                todayStr,
                dealers.length,
                todayTotal,
                todayCash,
                todayUPI,
                todayBank,
                rechargeRequests.length,
                rechargeRequests.reduce((acc, r) => acc + r.plan_amount, 0),
                0,
                totalOutstanding
              );
              window.open(url, '_blank');
            }}
          >
            Share EOD via WhatsApp
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'financial', label: 'Financial Summary' },
          { id: 'outstanding', label: 'Dealer Outstanding Dues' },
          { id: 'operators', label: 'Operator Recharge Share' },
          { id: 'dealers', label: 'Dealer Performance' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveReport(t.id as any)}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all shrink-0 ${
              activeReport === t.id
                ? 'bg-white border-t-2 border-t-blue-700 border-x border-slate-200 text-blue-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FINANCIAL SUMMARY */}
      {activeReport === 'financial' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-emerald-50/40 border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Today's Collection</span>
              <p className="text-3xl font-black text-emerald-700 mt-2">{formatCurrency(todayTotal)}</p>
              <div className="text-xs text-emerald-800 mt-2 space-y-0.5">
                <p>• UPI: {formatCurrency(todayUPI)}</p>
                <p>• Cash: {formatCurrency(todayCash)}</p>
                <p>• Bank: {formatCurrency(todayBank)}</p>
              </div>
            </Card>

            <Card className="p-4 bg-rose-50/40 border-rose-200">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Active Outstanding</span>
              <p className="text-3xl font-black text-rose-600 mt-2">{formatCurrency(totalOutstanding)}</p>
              <p className="text-xs text-rose-800 mt-2">Dues across all 40 dealers in network</p>
            </Card>

            <Card className="p-4 bg-blue-50/40 border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">All-Time Collections</span>
              <p className="text-3xl font-black text-blue-900 mt-2">{formatCurrency(totalCredits)}</p>
              <p className="text-xs text-blue-800 mt-2">Total verified dealer credits</p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: DEALER OUTSTANDING */}
      {activeReport === 'outstanding' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Dealer Outstanding Balance Rankings</h3>
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportOutstandingCSV}
            >
              Download Dues CSV
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3.5">Dealer</th>
                    <th className="px-4 py-3.5">Area</th>
                    <th className="px-4 py-3.5">Mobile</th>
                    <th className="px-4 py-3.5 text-right">Credit Limit</th>
                    <th className="px-4 py-3.5 text-right">Available Balance</th>
                    <th className="px-4 py-3.5 text-right">Outstanding Dues</th>
                    <th className="px-4 py-3.5 text-center">Exposure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dealerFinancials.map(({ dealer, fin }) => (
                    <tr key={dealer.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{dealer.shop_name}</p>
                        <p className="text-[10px] text-slate-400">{dealer.name} • {dealer.dealer_code}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">{dealer.area}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{dealer.mobile}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(dealer.credit_limit)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(fin.calculatedBalance)}</td>
                      <td className="px-4 py-3 text-right font-black text-rose-600">
                        {fin.calculatedOutstanding > 0 ? formatCurrency(fin.calculatedOutstanding) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          fin.isExceededLimit ? 'bg-rose-100 text-rose-800' :
                          fin.isApproachingLimit ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {fin.creditUsedPercentage.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OPERATORS */}
      {activeReport === 'operators' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {operatorStats.map(({ operator, count, totalAmount, totalComm }) => (
            <Card key={operator.id} className="p-4 border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">{operator.name}</h4>
                <span className="text-xs bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded font-mono">
                  {operator.default_commission_rate}% Comm
                </span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Completed Recharges:</span>
                  <strong className="text-slate-900">{count}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Gross Recharge Volume:</span>
                  <strong className="text-blue-700">{formatCurrency(totalAmount)}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span>Dealer Commissions Paid:</span>
                  <strong className="text-emerald-600">{formatCurrency(totalComm)}</strong>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 4: DEALER PERFORMANCE */}
      {activeReport === 'dealers' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Dealer</th>
                  <th className="px-4 py-3.5">Area</th>
                  <th className="px-4 py-3.5 text-right">Total Payments</th>
                  <th className="px-4 py-3.5 text-right">Recharge Turnover</th>
                  <th className="px-4 py-3.5 text-right">Stock Purchases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dealerFinancials.slice(0, 15).map(({ dealer, fin }) => (
                  <tr key={dealer.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-slate-900">{dealer.shop_name}</td>
                    <td className="px-4 py-3 text-slate-600">{dealer.area}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatCurrency(fin.totalPayments)}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{formatCurrency(fin.totalRecharges)}</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-700">{formatCurrency(fin.totalStockPurchases)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  );
};
