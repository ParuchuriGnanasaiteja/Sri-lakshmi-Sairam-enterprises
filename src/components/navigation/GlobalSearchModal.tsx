import React, { useState, useMemo } from 'react';
import { Search, X, Users, Tv, Receipt, Wrench, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDealer?: (dealerId: string) => void;
  onNavigate?: (tab: string, itemData?: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectDealer,
  onNavigate
}) => {
  const { dealers, serials, rechargeRequests, serviceTickets, ledgerTransactions } = useData();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return null;

    const matchedDealers = dealers.filter(
      d =>
        d.name.toLowerCase().includes(q) ||
        d.shop_name.toLowerCase().includes(q) ||
        d.dealer_code.toLowerCase().includes(q) ||
        d.mobile.includes(q) ||
        d.area.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedSerials = serials.filter(
      s =>
        s.serial_number.toLowerCase().includes(q) ||
        (s.vc_number && s.vc_number.toLowerCase().includes(q)) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        (s.customer_id && s.customer_id.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedRecharges = rechargeRequests.filter(
      r =>
        r.customer_id.includes(q) ||
        r.request_no.toLowerCase().includes(q) ||
        (r.customer_mobile && r.customer_mobile.includes(q)) ||
        (r.operator_ref_no && r.operator_ref_no.toLowerCase().includes(q))
    ).slice(0, 5);

    const matchedTickets = serviceTickets.filter(
      t =>
        t.ticket_no.toLowerCase().includes(q) ||
        t.customer_name.toLowerCase().includes(q) ||
        t.customer_mobile.includes(q) ||
        t.customer_id.toLowerCase().includes(q)
    ).slice(0, 5);

    const matchedTxns = ledgerTransactions.filter(
      t =>
        t.transaction_no.toLowerCase().includes(q) ||
        (t.reference_no && t.reference_no.toLowerCase().includes(q))
    ).slice(0, 5);

    return {
      dealers: matchedDealers,
      serials: matchedSerials,
      recharges: matchedRecharges,
      tickets: matchedTickets,
      txns: matchedTxns,
      totalCount:
        matchedDealers.length +
        matchedSerials.length +
        matchedRecharges.length +
        matchedTickets.length +
        matchedTxns.length
    };
  }, [query, dealers, serials, rechargeRequests, serviceTickets, ledgerTransactions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Dealer, Mobile, VC No, Serial No, Customer ID, Txn No..."
            className="w-full text-sm sm:text-base text-slate-900 placeholder-slate-400 bg-transparent border-none outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-lg">
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!results && (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm">Type at least 2 characters to search across everything in the system.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs">
                <span className="bg-slate-100 px-2.5 py-1 rounded-full">Ravi DTH</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-full">TP938472</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-full">Cherukupalli</span>
                <span className="bg-slate-100 px-2.5 py-1 rounded-full">1092839401</span>
              </div>
            </div>
          )}

          {results && results.totalCount === 0 && (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">No results found for "{query}".</p>
            </div>
          )}

          {/* Dealers */}
          {results && results.dealers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Dealers ({results.dealers.length})</span>
              </div>
              <div className="space-y-1">
                {results.dealers.map(d => (
                  <div
                    key={d.id}
                    onClick={() => {
                      if (onSelectDealer) onSelectDealer(d.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-700">{d.shop_name}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{d.dealer_code}</span>
                      </div>
                      <p className="text-xs text-slate-500">{d.name} • {d.mobile} • {d.area}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Serials & Hardware */}
          {results && results.serials.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Tv className="w-3.5 h-3.5 text-indigo-600" />
                <span>Serial / VC Numbers ({results.serials.length})</span>
              </div>
              <div className="space-y-1">
                {results.serials.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (onNavigate) onNavigate('stock', s);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50 cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-700">{s.serial_number}</span>
                        {s.vc_number && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">VC: {s.vc_number}</span>}
                      </div>
                      <p className="text-xs text-slate-500">{s.product_name} • Status: <span className="capitalize font-medium">{s.status.replace('_', ' ')}</span></p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recharge Requests */}
          {results && results.recharges.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Recharges ({results.recharges.length})</span>
              </div>
              <div className="space-y-1">
                {results.recharges.map(r => (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (onNavigate) onNavigate('recharges', r);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-emerald-700">Cust ID: {r.customer_id}</span>
                        <span className="text-xs text-slate-500 font-medium">{r.operator_name}</span>
                      </div>
                      <p className="text-xs text-slate-500">{r.dealer_name} • {formatCurrency(r.plan_amount)} • {formatDate(r.created_at)}</p>
                    </div>
                    <span className="text-xs capitalize font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Tickets */}
          {results && results.tickets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Service Tickets ({results.tickets.length})</span>
              </div>
              <div className="space-y-1">
                {results.tickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (onNavigate) onNavigate('services', t);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50 cursor-pointer group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 group-hover:text-amber-700">{t.ticket_no}</span>
                        <span className="text-xs capitalize bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{t.issue_type.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs text-slate-500">{t.customer_name} • {t.area} • {t.dealer_name}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
