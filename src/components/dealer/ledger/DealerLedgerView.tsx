import React from 'react';
import { BookOpen, Download, FileCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { calculateDealerFinancials } from '../../../utils/accounting';
import { generateDealerStatementPDF, generatePaymentReceiptPDF } from '../../../utils/pdfGenerator';

export const DealerLedgerView: React.FC = () => {
  const { currentDealer } = useAuth();
  const { ledgerTransactions, settings } = useData();

  if (!currentDealer) return null;

  const financials = calculateDealerFinancials(currentDealer.id, ledgerTransactions, currentDealer.credit_limit);

  const myTxns = ledgerTransactions
    .filter(t => t.dealer_id === currentDealer.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-700" />
            My Digital Khata & Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time balance statement with Sri Lakshmi Sairam Enterprises
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={() => generateDealerStatementPDF(currentDealer, ledgerTransactions, settings)}
        >
          Download PDF Statement
        </Button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-emerald-50/40 border-emerald-200">
          <span className="text-[10px] uppercase font-bold text-emerald-800">Available Balance</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(financials.calculatedBalance)}</p>
        </Card>

        <Card className="p-4 bg-rose-50/40 border-rose-200">
          <span className="text-[10px] uppercase font-bold text-rose-800">Current Outstanding</span>
          <p className={`text-2xl font-black mt-1 ${financials.calculatedOutstanding > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {formatCurrency(financials.calculatedOutstanding)}
          </p>
        </Card>

        <Card className="col-span-2 sm:col-span-1 p-4 bg-slate-50 border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400">Credit Limit</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(currentDealer.credit_limit)}</p>
        </Card>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Txn No</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5 text-right">Credit (+)</th>
                <th className="px-4 py-3.5 text-right">Debit (-)</th>
                <th className="px-4 py-3.5 text-right">Balance</th>
                <th className="px-4 py-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myTxns.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">No transactions recorded yet.</td></tr>
              ) : (
                myTxns.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">{t.transaction_no}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{t.description}</p>
                      {t.reference_no && <span className="text-[10px] text-slate-400 font-mono">Ref: {t.reference_no}</span>}
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
                        onClick={() => generatePaymentReceiptPDF(currentDealer, t, settings)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Download Receipt"
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
      </div>
    </div>
  );
};
