import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  ArrowRightLeft, 
  AlertTriangle, 
  Tv, 
  Check, 
  X, 
  Clock, 
  Share2, 
  Download,
  ShieldCheck,
  History
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Product, SerialItem, DealerStockRequest } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { generateStockDispatchWhatsApp } from '../../../utils/whatsapp';

interface StockManagementViewProps {
  onSelectDealer: (dealerId: string) => void;
}

export const StockManagementView: React.FC<StockManagementViewProps> = ({ onSelectDealer }) => {
  const { 
    products, 
    warehouseStock, 
    dealers, 
    serials, 
    stockRequests, 
    dispatchStock, 
    adjustWarehouseStock, 
    markSerialStatus,
    updateStockRequestStatus 
  } = useData();

  const [activeTab, setActiveTab] = useState<'warehouse' | 'serials' | 'requests' | 'low_stock'>('warehouse');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isSerialStatusModalOpen, setIsSerialStatusModalOpen] = useState<SerialItem | null>(null);

  // Dispatch form
  const [selectedDealerId, setSelectedDealerId] = useState(dealers[0]?.id || '');
  const [dispatchItems, setDispatchItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: products[0]?.id || '', quantity: 10 }
  ]);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Adjust form
  const [adjustProductId, setAdjustProductId] = useState(products[0]?.id || '');
  const [adjustDelta, setAdjustDelta] = useState(10);
  const [adjustIsFaulty, setAdjustIsFaulty] = useState(false);
  const [adjustReason, setAdjustReason] = useState('');

  // Serial status update form
  const [newSerialStatus, setNewSerialStatus] = useState<SerialItem['status']>('installed');
  const [custName, setCustName] = useState('');
  const [custId, setCustId] = useState('');
  const [custMobile, setCustMobile] = useState('');

  // Calculations
  let totalStockCount = 0;
  let totalFaultyCount = 0;
  const lowStockItems: Array<{ product: Product; quantity: number }> = [];

  products.forEach(p => {
    const wh = warehouseStock[p.id] || { quantity: 0, faulty_quantity: 0 };
    totalStockCount += wh.quantity;
    totalFaultyCount += wh.faulty_quantity;
    if (wh.quantity <= p.min_stock_threshold) {
      lowStockItems.push({ product: p, quantity: wh.quantity });
    }
  });

  const pendingRequests = stockRequests.filter(r => r.status === 'pending');

  const filteredSerials = serials.filter(s => {
    return (
      s.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.vc_number && s.vc_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.current_dealer_name && s.current_dealer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealerId || dispatchItems.length === 0) return;

    dispatchStock({
      dealerId: selectedDealerId,
      items: dispatchItems,
      serials: selectedSerials,
      notes: dispatchNotes
    });

    // Generate WhatsApp notice
    const targetDealer = dealers.find(d => d.id === selectedDealerId);
    if (targetDealer) {
      const summaryItems = dispatchItems.map(it => {
        const prod = products.find(p => p.id === it.productId);
        return { name: prod?.name || 'Item', quantity: it.quantity };
      });
      const url = generateStockDispatchWhatsApp(
        targetDealer.shop_name,
        targetDealer.mobile,
        summaryItems,
        `DSP-${Date.now().toString().slice(-6)}`
      );
      window.open(url, '_blank');
    }

    setIsDispatchModalOpen(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) return;
    adjustWarehouseStock(adjustProductId, adjustDelta, adjustIsFaulty, adjustReason);
    setIsAdjustModalOpen(false);
  };

  const handleSerialStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSerialStatusModalOpen) return;

    markSerialStatus(
      isSerialStatusModalOpen.id,
      newSerialStatus,
      newSerialStatus === 'installed'
        ? { id: custId || `CUST-${Date.now().toString().slice(-5)}`, name: custName, mobile: custMobile }
        : undefined
    );

    setIsSerialStatusModalOpen(null);
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-700" />
            Stock & Equipment Inventory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Main warehouse hardware stock, serial number tracking, and dealer dispatches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdjustModalOpen(true)}
          >
            Adjust / Receive Stock
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowRightLeft className="w-4 h-4" />}
            onClick={() => setIsDispatchModalOpen(true)}
          >
            Dispatch to Dealer
          </Button>
        </div>
      </div>

      {/* High-level Stock Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-indigo-50/40 border-indigo-200">
          <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Total Warehouse Stock</span>
          <p className="text-2xl sm:text-3xl font-black text-indigo-950 mt-1">{totalStockCount} <span className="text-xs font-normal text-slate-500">Units</span></p>
          <p className="text-[10px] text-indigo-600 mt-0.5">Across all product lines</p>
        </Card>

        <Card className="p-4 bg-amber-50/40 border-amber-200">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Low Stock Warnings</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">{lowStockItems.length} <span className="text-xs font-normal text-slate-500">Products</span></p>
          <p className="text-[10px] text-amber-700 mt-0.5">Below re-order threshold</p>
        </Card>

        <Card className="p-4 bg-rose-50/40 border-rose-200">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Faulty / Defective</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{totalFaultyCount} <span className="text-xs font-normal text-slate-500">Units</span></p>
          <p className="text-[10px] text-rose-600 mt-0.5">Returned from dealers</p>
        </Card>

        <Card className="p-4 bg-blue-50/40 border-blue-200">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Tracked Serials</span>
          <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{serials.length} <span className="text-xs font-normal text-slate-500">STB Units</span></p>
          <p className="text-[10px] text-blue-600 mt-0.5">With full lifecycle history</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'warehouse', label: 'Warehouse Catalog' },
          { id: 'serials', label: `Track Serial / VC Numbers (${serials.length})` },
          { id: 'requests', label: `Dealer Stock Requests (${pendingRequests.length})` },
          { id: 'low_stock', label: `Low Stock Alerts (${lowStockItems.length})` }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-xl transition-all shrink-0 ${
              activeTab === t.id
                ? 'bg-white border-t-2 border-t-indigo-700 border-x border-slate-200 text-indigo-950 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: WAREHOUSE PRODUCTS */}
      {activeTab === 'warehouse' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-right">Dealer Price</th>
                  <th className="px-4 py-3.5 text-right">MRP</th>
                  <th className="px-4 py-3.5 text-right">Warehouse Stock</th>
                  <th className="px-4 py-3.5 text-right">Faulty</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => {
                  const wh = warehouseStock[p.id] || { quantity: 0, faulty_quantity: 0 };
                  const isLow = wh.quantity <= p.min_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                      </td>
                      <td className="px-4 py-3 uppercase font-semibold text-[10px] text-slate-500">
                        {p.category}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(p.dealer_price)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatCurrency(p.mrp)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-sm text-slate-900">
                        {wh.quantity} Nos
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">
                        {wh.faulty_quantity > 0 ? `${wh.faulty_quantity} Nos` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <Badge variant="warning">Low (Min: {p.min_stock_threshold})</Badge>
                        ) : (
                          <Badge variant="success">In Stock</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SERIAL / VC NUMBER TRACKING */}
      {activeTab === 'serials' && (
        <div className="space-y-4">
          <Card className="p-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Serial Number, VC Number, Dealer, Customer..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
              />
            </div>
          </Card>

          <div className="space-y-3">
            {filteredSerials.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 text-xs">No serial numbers found.</Card>
            ) : (
              filteredSerials.map(s => (
                <Card key={s.id} className="p-4 border-slate-200/80 hover:border-indigo-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-sm font-mono text-slate-900">{s.serial_number}</span>
                        {s.vc_number && (
                          <span className="text-xs bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-mono font-semibold">
                            VC: {s.vc_number}
                          </span>
                        )}
                        <Badge variant={s.status === 'installed' ? 'success' : s.status === 'with_dealer' ? 'info' : s.status === 'faulty' ? 'danger' : 'neutral'}>
                          {s.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{s.product_name} • {s.operator_code}</p>
                      {s.current_dealer_name && (
                        <p className="text-xs text-slate-500 mt-0.5">Dealer: <strong>{s.current_dealer_name}</strong></p>
                      )}
                      {s.customer_name && (
                        <p className="text-xs text-emerald-700 mt-0.5">Customer: <strong>{s.customer_name}</strong> ({s.customer_mobile})</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSerialStatusModalOpen(s)}
                      >
                        Update Status
                      </Button>
                    </div>
                  </div>

                  {/* Lifecycle History */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Lifecycle Trail</p>
                    <div className="flex flex-wrap gap-2">
                      {s.history.map((h, i) => (
                        <div key={i} className="text-[11px] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                          <span className="font-bold text-slate-700 capitalize">{h.status.replace('_', ' ')}:</span> {h.details}
                          <span className="text-slate-400 text-[9px] ml-1 font-mono">({formatDate(h.timestamp)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DEALER STOCK REPLENISHMENT REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {stockRequests.length === 0 ? (
            <Card className="p-8 text-center text-slate-400 text-xs">No stock requests from dealers.</Card>
          ) : (
            stockRequests.map(r => (
              <Card key={r.id} className="p-4 border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{r.dealer_name}</span>
                      <span className="text-xs font-mono text-slate-400">({r.request_no})</span>
                      <Badge variant={r.status === 'dispatched' || r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'danger'}>
                        {r.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-700 mt-2 space-y-1">
                      {r.items.map((it, idx) => (
                        <p key={idx}>• {it.quantity} × {it.product_name}</p>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 italic mt-1">Reason: "{r.reason}"</p>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Check className="w-4 h-4" />}
                        onClick={() => updateStockRequestStatus(r.id, 'approved', 'Approved for immediate dispatch')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 border-rose-200"
                        icon={<X className="w-4 h-4" />}
                        onClick={() => updateStockRequestStatus(r.id, 'rejected', 'Stock temporarily unavailable')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 4: LOW STOCK ALERTS */}
      {activeTab === 'low_stock' && (
        <div className="space-y-3">
          {lowStockItems.length === 0 ? (
            <Card className="p-8 text-center text-slate-400 text-xs">All products have sufficient warehouse inventory.</Card>
          ) : (
            lowStockItems.map(({ product, quantity }) => (
              <Card key={product.id} className="p-4 border-amber-200 bg-amber-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{product.name}</h4>
                    <p className="text-xs text-amber-900 font-medium">
                      Current Stock: <strong>{quantity} Units</strong> (Minimum Threshold: {product.min_stock_threshold})
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setAdjustProductId(product.id);
                    setIsAdjustModalOpen(true);
                  }}
                >
                  Receive Stock
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* MODAL: Dispatch Stock to Dealer */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Dispatch Hardware Stock to Dealer"
        subtitle="Deducts from warehouse, assigns to dealer, and debits dealer ledger"
        maxWidth="lg"
      >
        <form onSubmit={handleDispatchSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Dealer *</label>
            <select
              value={selectedDealerId}
              onChange={e => setSelectedDealerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            >
              {dealers.map(d => (
                <option key={d.id} value={d.id}>{d.shop_name} ({d.name} • {d.area})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
            <select
              value={dispatchItems[0]?.productId}
              onChange={e => setDispatchItems([{ productId: e.target.value, quantity: dispatchItems[0]?.quantity || 10 }])}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            >
              {products.map(p => {
                const wh = warehouseStock[p.id]?.quantity || 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} - ₹{p.dealer_price} (In Warehouse: {wh} Units)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Dispatch *</label>
            <input
              type="number"
              required
              min={1}
              value={dispatchItems[0]?.quantity}
              onChange={e => setDispatchItems([{ productId: dispatchItems[0]?.productId, quantity: Number(e.target.value) }])}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Delivery Challan Ref</label>
            <input
              type="text"
              placeholder="e.g. Sent via delivery boy with Challan #882"
              value={dispatchNotes}
              onChange={e => setDispatchNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsDispatchModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Confirm & Dispatch</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Adjust Warehouse Stock */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Adjust / Receive Warehouse Stock"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product *</label>
            <select
              value={adjustProductId}
              onChange={e => setAdjustProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Positive to add, Negative to subtract) *</label>
            <input
              type="number"
              required
              value={adjustDelta}
              onChange={e => setAdjustDelta(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="faulty_check"
              checked={adjustIsFaulty}
              onChange={e => setAdjustIsFaulty(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <label htmlFor="faulty_check" className="text-xs font-semibold text-slate-700">Mark as Faulty / Defective Stock</label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Reason</label>
            <input
              type="text"
              placeholder="e.g. Received new shipment from distributor"
              value={adjustReason}
              onChange={e => setAdjustReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Stock</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Update Serial Status */}
      <Modal
        isOpen={Boolean(isSerialStatusModalOpen)}
        onClose={() => setIsSerialStatusModalOpen(null)}
        title={`Update Equipment Status (${isSerialStatusModalOpen?.serial_number})`}
      >
        <form onSubmit={handleSerialStatusSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
            <select
              value={newSerialStatus}
              onChange={e => setNewSerialStatus(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
            >
              <option value="installed">Installed at Customer</option>
              <option value="with_dealer">With Dealer</option>
              <option value="in_warehouse">In Warehouse</option>
              <option value="faulty">Mark Faulty / Defective</option>
              <option value="returned">Returned to Company</option>
            </select>
          </div>

          {newSerialStatus === 'installed' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ch. Anjaneyulu"
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer ID / VC No</label>
                  <input
                    type="text"
                    placeholder="e.g. 1092839401"
                    value={custId}
                    onChange={e => setCustId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    placeholder="10 digit mobile"
                    value={custMobile}
                    onChange={e => setCustMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsSerialStatusModalOpen(null)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Update Serial</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
