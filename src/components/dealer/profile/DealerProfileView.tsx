import React from 'react';
import { Store, Phone, MapPin, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Badge } from '../../common/Badge';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { calculateDealerFinancials } from '../../../utils/accounting';

export const DealerProfileView: React.FC = () => {
  const { currentDealer } = useAuth();
  const { ledgerTransactions, settings } = useData();

  if (!currentDealer) return null;

  const financials = calculateDealerFinancials(currentDealer.id, ledgerTransactions, currentDealer.credit_limit);

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {currentDealer.shop_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{currentDealer.shop_name}</h2>
              <Badge variant="success">ACTIVE</Badge>
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">{currentDealer.name}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{currentDealer.dealer_code}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-700">
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Contact Mobile</span>
            <p className="font-mono font-bold text-sm text-slate-900 mt-0.5">{currentDealer.mobile}</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Shop Location</span>
            <p className="font-bold text-sm text-slate-900 mt-0.5">{currentDealer.address}, {currentDealer.area}</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Assigned Credit Limit</span>
            <p className="font-bold text-sm text-blue-900 mt-0.5">{formatCurrency(currentDealer.credit_limit)}</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px] block">Distributor</span>
            <p className="font-bold text-sm text-slate-900 mt-0.5">{settings.business_name} ({settings.location})</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
