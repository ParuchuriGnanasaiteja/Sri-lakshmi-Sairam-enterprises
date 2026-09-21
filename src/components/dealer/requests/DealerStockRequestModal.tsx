import React, { useState } from 'react';
import { Boxes } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';

interface DealerStockRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DealerStockRequestModal: React.FC<DealerStockRequestModalProps> = ({ isOpen, onClose }) => {
  const { currentDealer } = useAuth();
  const { products, submitStockRequest } = useData();

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(10);
  const [reason, setReason] = useState('');

  if (!currentDealer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) return;

    submitStockRequest(
      currentDealer.id,
      [{ productId, quantity: Number(quantity) }],
      reason || 'Stock replenishment for shop sales'
    );

    setQuantity(10);
    setReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Hardware Stock from Distributor"
      subtitle="Distributor will dispatch from main warehouse"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Equipment *</label>
          <select
            value={productId}
            onChange={e => setProductId(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (₹{p.dealer_price})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Needed *</label>
          <input
            type="number"
            required
            min={1}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Note</label>
          <input
            type="text"
            placeholder="e.g. Village installation orders pending"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" type="submit">Submit Stock Request</Button>
        </div>
      </form>
    </Modal>
  );
};
