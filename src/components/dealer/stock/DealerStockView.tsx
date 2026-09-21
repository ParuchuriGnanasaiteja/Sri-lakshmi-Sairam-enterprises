import React, { useState } from 'react';
import { Boxes, Plus, Tv, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';

interface DealerStockViewProps {
  onOpenStockModal: () => void;
}

export const DealerStockView: React.FC<DealerStockViewProps> = ({ onOpenStockModal }) => {
  const { currentDealer } = useAuth();
  const { dealerStock, serials } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentDealer) return null;

  const myStock = dealerStock.filter(ds => ds.dealer_id === currentDealer.id);
  const mySerials = serials.filter(s => s.current_dealer_id === currentDealer.id && (
    s.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.vc_number && s.vc_number.toLowerCase().includes(searchQuery.toLowerCase()))
  ));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-700" />
            My Shop Inventory & Serial Numbers
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Hardware stock assigned to your shop by distributor
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={onOpenStockModal}
        >
          Request Stock
        </Button>
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {myStock.map(item => (
          <Card key={item.product_id} className="p-4 border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">{item.category}</span>
            <p className="font-bold text-sm text-slate-900 mt-0.5">{item.product_name}</p>
            <p className="text-2xl font-black text-blue-900 mt-2">{item.quantity} <span className="text-xs font-normal text-slate-500">Units</span></p>
          </Card>
        ))}
      </div>

      {/* Serials List */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Assigned STB Serial & VC Units</h3>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search serial / VC..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {mySerials.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No serialized equipment found.</p>
          ) : (
            mySerials.map(s => (
              <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{s.serial_number}</span>
                    {s.vc_number && <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 rounded font-mono">VC: {s.vc_number}</span>}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.product_name}</p>
                </div>
                <Badge variant={s.status === 'installed' ? 'success' : 'info'}>
                  {s.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
