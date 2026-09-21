import React, { useState } from 'react';
import { 
  Wrench, 
  Search, 
  Plus, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MapPin, 
  AlertTriangle,
  Send
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { ServiceTicket, TicketStatus, IssueType } from '../../../types';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { Modal } from '../../common/Modal';
import { formatDate, formatDateTime } from '../../../utils/formatters';

interface ServiceTicketManagementViewProps {
  onSelectDealer: (dealerId: string) => void;
}

export const ServiceTicketManagementView: React.FC<ServiceTicketManagementViewProps> = ({ onSelectDealer }) => {
  const { 
    serviceTickets, 
    technicians, 
    dealers, 
    createServiceTicket, 
    updateTicketStatus, 
    assignTechnicianToTicket 
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  
  const [assigningTicket, setAssigningTicket] = useState<ServiceTicket | null>(null);
  const [selectedTechId, setSelectedTechId] = useState(technicians[0]?.id || '');

  const [closingTicket, setClosingTicket] = useState<ServiceTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formDealerId, setFormDealerId] = useState(dealers[0]?.id || '');
  const [custName, setCustName] = useState('');
  const [custMobile, setCustMobile] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [issueType, setIssueType] = useState<IssueType>('installation');
  const [description, setDescription] = useState('');

  const filteredTickets = serviceTickets.filter(t => {
    const matchesQuery =
      t.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer_mobile.includes(searchQuery) ||
      t.dealer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesQuery && matchesStatus;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTicket || !selectedTechId) return;
    assignTechnicianToTicket(assigningTicket.id, selectedTechId);
    setAssigningTicket(null);
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingTicket) return;
    updateTicketStatus(closingTicket.id, 'resolved', resolutionNotes || 'Resolved by field technician');
    setClosingTicket(null);
    setResolutionNotes('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custMobile) return;
    const dealer = dealers.find(d => d.id === formDealerId);
    createServiceTicket({
      dealerId: formDealerId,
      customerId: `CUST-${Date.now().toString().slice(-5)}`,
      customerName: custName,
      customerMobile: custMobile,
      customerAddress: custAddress || dealer?.area || 'Cherukupalli',
      area: dealer?.area || 'Cherukupalli',
      issueType,
      description,
      priority: 'medium'
    });
    setCustName('');
    setCustMobile('');
    setCustAddress('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-600" />
            Service Complaints & Technicians
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track customer complaints, dispatch field technicians, and log resolutions
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Raise Service Ticket
        </Button>
      </div>

      {/* Field Technicians Availability Row */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Field Technicians on Duty ({technicians.length})
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {technicians.map(tech => (
            <div key={tech.id} className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{tech.name}</span>
                <Badge variant={tech.status === 'active' ? 'success' : tech.status === 'busy' ? 'warning' : 'neutral'}>
                  {tech.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">{tech.area}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100 font-mono">
                <span>{tech.mobile}</span>
                <span className="text-blue-700 font-bold">{tech.completed_tickets_count} Fixed</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter Bar */}
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Ticket No, Customer, Mobile, Area..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none"
            >
              <option value="all">All Ticket Status</option>
              <option value="new">New (Unassigned)</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 text-xs">No service tickets found.</Card>
        ) : (
          filteredTickets.map(t => (
            <Card key={t.id} className="p-4 border-slate-200/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-mono">{t.ticket_no}</span>
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded capitalize">
                    {t.issue_type.replace('_', ' ')}
                  </span>
                  <Badge variant={t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : 'neutral'}>
                    {t.priority.toUpperCase()}
                  </Badge>
                  <Badge variant={t.status === 'resolved' || t.status === 'closed' ? 'success' : t.status === 'new' ? 'warning' : 'info'}>
                    {t.status.toUpperCase()}
                  </Badge>
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  {formatDateTime(t.created_at)}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {t.description}
              </p>

              {/* Customer & Tech Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                  <span className="font-bold text-slate-900">{t.customer_name}</span>
                  <p className="font-mono text-slate-500">{t.customer_mobile}</p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Location & Dealer</span>
                  <span className="font-medium text-slate-800">{t.area}</span>
                  <button
                    onClick={() => onSelectDealer(t.dealer_id)}
                    className="text-blue-700 hover:underline block text-[11px] font-semibold"
                  >
                    via {t.dealer_name}
                  </button>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Technician</span>
                  <span className="font-bold text-slate-900">{t.assigned_technician_name || 'Not assigned yet'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {t.status !== 'resolved' && t.status !== 'closed' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<UserCheck className="w-3.5 h-3.5" />}
                      onClick={() => setAssigningTicket(t)}
                    >
                      {t.assigned_technician_name ? 'Re-assign' : 'Assign Technician'}
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      onClick={() => setClosingTicket(t)}
                    >
                      Mark Resolved
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* MODAL: Assign Technician */}
      <Modal
        isOpen={Boolean(assigningTicket)}
        onClose={() => setAssigningTicket(null)}
        title={`Assign Technician - ${assigningTicket?.ticket_no}`}
        maxWidth="sm"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Technician *</label>
            <select
              value={selectedTechId}
              onChange={e => setSelectedTechId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            >
              {technicians.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} - {tech.area} ({tech.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setAssigningTicket(null)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Assign & Dispatch</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Resolve Ticket */}
      <Modal
        isOpen={Boolean(closingTicket)}
        onClose={() => setClosingTicket(null)}
        title={`Resolve Service Ticket ${closingTicket?.ticket_no}`}
        maxWidth="sm"
      >
        <form onSubmit={handleCloseSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Summary</label>
            <textarea
              rows={3}
              placeholder="e.g. Signal aligned to 85% dBuV. Dish LNB replaced."
              value={resolutionNotes}
              onChange={e => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setClosingTicket(null)}>Cancel</Button>
            <Button variant="success" size="sm" type="submit">Complete & Close Ticket</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Raise Ticket */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Raise New Service Ticket"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Originating Dealer *</label>
            <select
              value={formDealerId}
              onChange={e => setFormDealerId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            >
              {dealers.map(d => (
                <option key={d.id} value={d.id}>{d.shop_name} ({d.name} • {d.area})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                placeholder="Full name"
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
                placeholder="10 digit mobile"
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
                <option value="installation">New Installation</option>
                <option value="stb_fault">STB Box Fault / Red Light</option>
                <option value="remote_issue">Remote Issue</option>
                <option value="channel_issue">Signal Loss (Error 102)</option>
                <option value="shifting">Dish Shifting</option>
                <option value="replacement">Equipment Replacement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Address</label>
              <input
                type="text"
                placeholder="Village / Door No"
                value={custAddress}
                onChange={e => setCustAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide symptoms, error code on TV, etc."
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Create Ticket</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
