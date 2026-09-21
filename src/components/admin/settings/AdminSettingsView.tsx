import React, { useState } from 'react';
import { Settings, Building, Percent, Shield, Bell, Save, IndianRupee } from 'lucide-react';

import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';

export const AdminSettingsView: React.FC = () => {
  const { settings, updateSettings, operators } = useData();

  const [formData, setFormData] = useState({
    business_name: settings.business_name,
    tagline: settings.tagline,
    proprietor: settings.proprietor,
    address: settings.address,
    location: settings.location,
    state: settings.state,
    pincode: settings.pincode,
    primary_mobile: settings.primary_mobile,
    support_mobile: settings.support_mobile,
    email: settings.email,
    gst_number: settings.gst_number,
    upi_id: settings.upi_id,
    bank_name: settings.bank_name,
    account_number: settings.account_number,
    ifsc_code: settings.ifsc_code,
    branch: settings.branch,
    default_credit_limit: settings.default_credit_limit,
    lock_requests_on_limit_cross: settings.lock_requests_on_limit_cross,
    low_stock_warning_level: settings.low_stock_warning_level,
    eod_whatsapp_number: settings.eod_whatsapp_number
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          Business Profile & System Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure business details, banking/UPI endpoints, and distributor rules
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Business Identity */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-700" />
            Distributor Enterprise Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Proprietor / Owner Name</label>
              <input
                type="text"
                value={formData.proprietor}
                onChange={e => setFormData({ ...formData, proprietor: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Mandal *</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
              <input
                type="text"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Mobile (WhatsApp) *</label>
              <input
                type="text"
                value={formData.primary_mobile}
                onChange={e => setFormData({ ...formData, primary_mobile: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={formData.gst_number}
                onChange={e => setFormData({ ...formData, gst_number: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-mono"
              />
            </div>
          </div>
        </Card>

        {/* Banking & UPI Payment Endpoints */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            Payment Collection Endpoints
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID (PhonePe/GPay) *</label>
              <input
                type="text"
                value={formData.upi_id}
                onChange={e => setFormData({ ...formData, upi_id: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-200 text-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.account_number}
                onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifsc_code}
                onChange={e => setFormData({ ...formData, ifsc_code: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
              <input
                type="text"
                value={formData.branch}
                onChange={e => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </Card>

        {/* Global Policy Thresholds */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-indigo-700" />
            Credit & Inventory Thresholds
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Dealer Credit Limit (₹)</label>
              <input
                type="number"
                value={formData.default_credit_limit}
                onChange={e => setFormData({ ...formData, default_credit_limit: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Low Stock Warning Level</label>
              <input
                type="number"
                value={formData.low_stock_warning_level}
                onChange={e => setFormData({ ...formData, low_stock_warning_level: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<Save className="w-4 h-4" />}
          >
            Save All Settings
          </Button>
        </div>

      </form>

    </div>
  );
};
