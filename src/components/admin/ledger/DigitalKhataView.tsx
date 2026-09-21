import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Download, Filter, IndianRupee, ArrowUpRight, ArrowDownLeft, FileCheck } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { exportToCSV } from '../../../utils/export';
import { generatePaymentReceiptPDF } from '../../../utils/pdfGenerator';

interface DigitalKhataViewProps {
  onSelectDealer: (dealerId: string) => void;
}

export const DigitalKhataView: React.FC<DigitalKhataViewProps> = ({ onSelectDealer }) => {
  const { ledgerTransactions, dealers, settings } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dealerFilter, setDealerFilter] = useState<string>('all');

  const filteredTxns = useMemo(() => {
    return ledgerTransactions
      .filter(t => {
        const matchesQuery =
          t.transaction_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.dealer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.reference_no && t.reference_no.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType = typeFilter === 'all' || t.transaction_type === typeFilter || t.type === typeFilter;
        const matchesDealer = dealerFilter === 'all' || t.dealer_id === dealerFilter;

        return matchesQuery && matchesType && matchesDealer;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [ledgerTransactions, searchQuery, typeFilter, dealerFilter]);

  let totalCredit = 0;
  let totalDebit = 0;
  filteredTxns.forEach(t => {
    if (t.type === 'CREDIT') totalCredit += t.amount;
    if (t.type === 'DEBIT') totalDebit += t.amount;
  });

  const handleExportCSV = () => {
    const headers = ['Date', 'Txn No', 'Dealer', 'Type', 'Category', 'Description', 'Method', 'Ref No', 'Credit', 'Debit', 'Balance After', 'Outstanding After'];
    const rows = filteredTxns.map(t => [
      t.date,
      t.transaction_no,
      t.dealer_name,
      t.type,
      t.transaction_type,
      t.description,
      t.payment_method || 'SYSTEM',
      t.reference_no || '',
      t.type === 'CREDIT' ? t.amount : '',
      t.type === 'DEBIT' ? t.amount : '',
      t.balance_after,
      t.outstanding_after
    ]);
    exportToCSV(`Ledger_Transactions_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-700" />
            Digital Khata (Financial Ledger)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable transaction-based accounting for all 40 dealers
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExportCSV}
        >
          Export Ledger CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-emerald-50/40 border-emerald-100">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Credits Received</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(totalCredit)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Payments & Additions</p>
        </Card>

        <Card className="p-4 bg-rose-50/40 border-rose-100">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Debits Applied</span>
          <p className="text-2xl font-black text-rose-700 mt-1">{formatCurrency(totalDebit)}</p>
          <p className="text-[11px] text-rose-600 mt-0.5">Recharges & Stock purchases</p>
        </Card>

        <Card className="p-4 bg-blue-50/40 border-blue-100">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Filtered Records</span>
          <p className="text-2xl font-black text-blue-900 mt-1">{filteredTxns.length} <span className="text-xs font-normal text-slate-500">Transactions</span></p>
          <p className="text-[11px] text-blue-600 mt-0.5">Across selected filters</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search txn, dealer, UTR..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={dealerFilter}
              onChange={e => setDealerFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
            >
              <option value="all">All Dealers ({dealers.length})</option>
              {dealers.map(d => (
                <option key={d.id} value={d.id}>{d.shop_name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
            >
              <option value="all">All Transaction Types</option>
              <option value="PAYMENT_RECEIVED">Payments Received (Credit)</option>
              <option value="RECHARGE_DEDUCTION">Recharge Deductions (Debit)</option>
              <option value="STOCK_PURCHASE">Stock Purchases (Debit)</option>
              <option value="ADJUSTMENT">Adjustments / Reversals</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Txn No</th>
                <th className="px-4 py-3.5">Dealer</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Mode</th>
                <th className="px-4 py-3.5 text-right">Credit (+)</th>
                <th className="px-4 py-3.5 text-right">Debit (-)</th>
                <th className="px-4 py-3.5 text-right">Balance</th>
                <th className="px-4 py-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxns.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-slate-400">No transactions match the filter.</td></tr>
              ) : (
                filteredTxns.map(t => {
                  const d = dealers.find(item => item.id === t.dealer_id);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-slate-500">{formatDate(t.date)}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{t.transaction_no}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onSelectDealer(t.dealer_id)}
                          className="font-bold text-blue-700 hover:underline text-left truncate block max-w-[160px]"
                        >
                          {t.dealer_name}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{t.description}</p>
                        {t.reference_no && <span className="text-[10px] text-slate-400 font-mono">Ref: {t.reference_no}</span>}
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
                        {d && (
                          <button
                            onClick={() => generatePaymentReceiptPDF(d, t, settings)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Download PDF Receipt"
                          >
                            <FileCheck className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
