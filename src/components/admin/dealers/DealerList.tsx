import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  MapPin, 
  ArrowUpRight, 
  CreditCard, 
  MoreVertical, 
  Share2, 
  Edit3, 
  Power, 
  ChevronRight,
  Download
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Dealer, DealerStatus } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { calculateDealerFinancials } from '../../../utils/accounting';
import { generateOutstandingReminderWhatsApp } from '../../../utils/whatsapp';
import { exportToCSV } from '../../../utils/export';

interface DealerListProps {
  onSelectDealer: (dealerId: string) => void;
}

export const DealerList: React.FC<DealerListProps> = ({ onSelectDealer }) => {
  const { dealers, ledgerTransactions, addDealer, updateDealer, toggleDealerStatus } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    dealer_code: '',
    name: '',
    shop_name: '',
    mobile: '',
    alternate_mobile: '',
    email: '',
    address: '',
    area: '',
    village_or_town: '',
    pincode: '522309',
    credit_limit: 20000,
    allow_overlimit_requests: false,
    notes: ''
  });

  // Extract unique areas
  const areas = useMemo(() => {
    const set = new Set(dealers.map(d => d.area));
    return Array.from(set).sort();
  }, [dealers]);

  // Filtered dealers
  const filteredDealers = useMemo(() => {
    return dealers.filter(d => {
      const matchesQuery = 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.dealer_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.mobile.includes(searchQuery) ||
        d.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.village_or_town.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesArea = areaFilter === 'all' || d.area === areaFilter;

      return matchesQuery && matchesStatus && matchesArea;
    });
  }, [dealers, searchQuery, statusFilter, areaFilter]);

  const handleOpenAdd = () => {
    const nextCode = `DLR-${String(dealers.length + 1).padStart(3, '0')}`;
    setFormData({
      dealer_code: nextCode,
      name: '',
      shop_name: '',
      mobile: '',
      alternate_mobile: '',
      email: '',
      address: '',
      area: 'Cherukupalli Town',
      village_or_town: 'Cherukupalli',
      pincode: '522309',
      credit_limit: 25000,
      allow_overlimit_requests: false,
      notes: ''
    });
    setEditingDealer(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (dealer: Dealer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDealer(dealer);
    setFormData({
      dealer_code: dealer.dealer_code,
      name: dealer.name,
      shop_name: dealer.shop_name,
      mobile: dealer.mobile,
      alternate_mobile: dealer.alternate_mobile || '',
      email: dealer.email || '',
      address: dealer.address,
      area: dealer.area,
      village_or_town: dealer.village_or_town,
      pincode: dealer.pincode,
      credit_limit: dealer.credit_limit,
      allow_overlimit_requests: dealer.allow_overlimit_requests,
      notes: dealer.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.shop_name || !formData.mobile) {
      alert('Please fill in Name, Shop Name, and Mobile Number.');
      return;
    }

    if (editingDealer) {
      updateDealer(editingDealer.id, {
        ...formData,
        credit_limit: Number(formData.credit_limit)
      });
    } else {
      addDealer({
        ...formData,
        status: 'active',
        joining_date: new Date().toISOString().split('T')[0],
        credit_limit: Number(formData.credit_limit)
      });
    }
    setIsAddModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Dealer Code', 'Shop Name', 'Owner Name', 'Mobile', 'Area', 'Town', 'Status', 'Credit Limit', 'Balance', 'Outstanding'];
    const rows = filteredDealers.map(d => {
      const fin = calculateDealerFinancials(d.id, ledgerTransactions, d.credit_limit);
      return [
        d.dealer_code,
        d.shop_name,
        d.name,
        d.mobile,
        d.area,
        d.village_or_town,
        d.status,
        d.credit_limit,
        fin.calculatedBalance,
        fin.calculatedOutstanding
      ];
    });
    exportToCSV(`Dealers_List_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-700" />
            Dealer Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Managing {dealers.length} registered dealers in Cherukupalli & Guntur/Bapatla region
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add New Dealer
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by shop, name, mobile, area..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          {/* Area Filter */}
          <div>
            <select
              value={areaFilter}
              onChange={e => setAreaFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">All Areas ({areas.length})</option>
              {areas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Paused</option>
            </select>
          </div>

        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Showing <strong>{filteredDealers.length}</strong> of {dealers.length} dealers</span>
          {(searchQuery || statusFilter !== 'all' || areaFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setAreaFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Dealer</th>
                <th className="px-4 py-3.5">Area / Town</th>
                <th className="px-4 py-3.5">Mobile</th>
                <th className="px-4 py-3.5 text-right">Available Balance</th>
                <th className="px-4 py-3.5 text-right">Outstanding</th>
                <th className="px-4 py-3.5 text-right">Credit Limit</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDealers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No dealers match the search filters.
                  </td>
                </tr>
              ) : (
                filteredDealers.map(dealer => {
                  const fin = calculateDealerFinancials(dealer.id, ledgerTransactions, dealer.credit_limit);
                  return (
                    <tr
                      key={dealer.id}
                      onClick={() => onSelectDealer(dealer.id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {dealer.shop_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-700">{dealer.shop_name}</p>
                            <p className="text-[11px] text-slate-400">{dealer.name} • <span className="font-mono">{dealer.dealer_code}</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{dealer.area}</p>
                        <p className="text-[10px] text-slate-400">{dealer.village_or_town}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {dealer.mobile}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {formatCurrency(fin.calculatedBalance)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {fin.calculatedOutstanding > 0 ? (
                          <span className="text-rose-600 flex items-center justify-end gap-1">
                            {formatCurrency(fin.calculatedOutstanding)}
                            {fin.isApproachingLimit && <Badge variant="warning">80%</Badge>}
                            {fin.isExceededLimit && <Badge variant="danger">100%</Badge>}
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-600">
                        {formatCurrency(dealer.credit_limit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={dealer.status === 'active' ? 'success' : 'neutral'}>
                          {dealer.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {fin.calculatedOutstanding > 0 && (
                            <button
                              onClick={() => {
                                const url = generateOutstandingReminderWhatsApp(
                                  dealer.shop_name,
                                  dealer.mobile,
                                  fin.calculatedOutstanding,
                                  dealer.credit_limit
                                );
                                window.open(url, '_blank');
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Send WhatsApp Reminder"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={e => handleOpenEdit(dealer, e)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            title="Edit Dealer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (Optimized for Android / Phone screens) */}
      <div className="md:hidden space-y-3">
        {filteredDealers.map(dealer => {
          const fin = calculateDealerFinancials(dealer.id, ledgerTransactions, dealer.credit_limit);
          return (
            <Card
              key={dealer.id}
              onClick={() => onSelectDealer(dealer.id)}
              className="p-4 border-slate-200 active:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">{dealer.shop_name}</span>
                    <Badge variant={dealer.status === 'active' ? 'success' : 'neutral'}>
                      {dealer.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{dealer.name} • {dealer.dealer_code}</p>
                </div>
                
                {fin.calculatedOutstanding > 0 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const url = generateOutstandingReminderWhatsApp(
                        dealer.shop_name,
                        dealer.mobile,
                        fin.calculatedOutstanding,
                        dealer.credit_limit
                      );
                      window.open(url, '_blank');
                    }}
                    className="p-2 text-emerald-700 bg-emerald-50 rounded-xl"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Area & Phone */}
              <div className="flex items-center justify-between text-xs text-slate-600 mt-2.5 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {dealer.area}</span>
                <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-slate-400" /> {dealer.mobile}</span>
              </div>

              {/* Financial Numbers Row */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 bg-slate-50/60 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Balance</span>
                  <p className="text-sm font-black text-emerald-600">{formatCurrency(fin.calculatedBalance)}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Outstanding</span>
                  <p className={`text-sm font-black ${fin.calculatedOutstanding > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatCurrency(fin.calculatedOutstanding)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Dealer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingDealer ? `Edit ${editingDealer.shop_name}` : 'Register New Dealer'}
        subtitle="SRI LAKSHMI SAIRAM ENTERPRISES Dealer Network"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dealer Code *</label>
              <input
                type="text"
                required
                value={formData.dealer_code}
                onChange={e => setFormData({ ...formData, dealer_code: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shop / Firm Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sri Balaji DTH Services"
                value={formData.shop_name}
                onChange={e => setFormData({ ...formData, shop_name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner / Dealer Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. K. Srinivas"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Mobile (WhatsApp) *</label>
              <input
                type="tel"
                required
                placeholder="10 digit mobile"
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area / Mandal *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cherukupalli Rural"
                value={formData.area}
                onChange={e => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Village / Town *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cherukupalli"
                value={formData.village_or_town}
                onChange={e => setFormData({ ...formData, village_or_town: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Address</label>
              <input
                type="text"
                placeholder="Shop number, street, landmark"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Limit (₹) *</label>
              <input
                type="number"
                required
                min={0}
                step={1000}
                value={formData.credit_limit}
                onChange={e => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/20 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
            >
              {editingDealer ? 'Save Changes' : 'Register Dealer'}
            </Button>
          </div>

        </form>
      </Modal>

    </div>
  );
};
