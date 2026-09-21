import React, { useState } from 'react';
import { Wrench } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { IssueType } from '../../../types';

interface DealerTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DealerTicketModal: React.FC<DealerTicketModalProps> = ({ isOpen, onClose }) => {
  const { currentDealer } = useAuth();
  const { createServiceTicket } = useData();

  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [issueType, setIssueType] = useState<IssueType>('installation');
  const [description, setDescription] = useState('');

  if (!currentDealer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custMobile) return;

    createServiceTicket({
      dealerId: currentDealer.id,
      customerId: `CUST-${Date.now().toString().slice(-5)}`,
      customerName: custName,
      customerMobile: custMobile,
      customerAddress: custAddress || currentDealer.area,
      area: currentDealer.area,
      issueType,
      description,
      priority: 'medium'
    });

    setCustName('');
    setCustMobile('');
    setCustAddress('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Raise Service / Complaint Ticket"
      subtitle="Distributor technician will be dispatched to customer location"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
            <input
              type="text"
              required
              placeholder="Customer full name"
              value={custName}
              onChange={e => setCustName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Mobile *</label>
            <input
              type="tel"
              required
              placeholder="10 digit phone"
              value={custMobile}
              onChange={e => setCustMobile(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category *</label>
            <select
              value={issueType}
              onChange={e => setIssueType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            >
              <option value="installation">New Connection Installation</option>
              <option value="stb_fault">STB Box Defect / No Power</option>
              <option value="remote_issue">Remote Replacement</option>
              <option value="channel_issue">Signal Lost / Error 102</option>
              <option value="shifting">Dish Shifting</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Village / Address</label>
            <input
              type="text"
              placeholder="Village or street name"
              value={custAddress}
              onChange={e => setCustAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Details</label>
          <textarea
            rows={2}
            placeholder="Describe the complaint symptoms"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" type="submit">Submit Service Ticket</Button>
        </div>
      </form>
    </Modal>
  );
};
