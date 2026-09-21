import React from 'react';
import { Wrench, Plus, Clock } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Badge } from '../../common/Badge';
import { formatDateTime } from '../../../utils/formatters';

interface DealerServicesViewProps {
  onOpenTicketModal: () => void;
}

export const DealerServicesView: React.FC<DealerServicesViewProps> = ({ onOpenTicketModal }) => {
  const { currentDealer } = useAuth();
  const { serviceTickets } = useData();

  if (!currentDealer) return null;

  const myTickets = serviceTickets
    .filter(t => t.dealer_id === currentDealer.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-600" />
            Service & Complaint Requests
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track technician assignments and customer resolution status
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={onOpenTicketModal}
        >
          Raise Service Request
        </Button>
      </div>

      <div className="space-y-3">
        {myTickets.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 text-xs">No service complaints raised yet.</Card>
        ) : (
          myTickets.map(t => (
            <Card key={t.id} className="p-4 border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-mono">{t.ticket_no}</span>
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded capitalize">
                    {t.issue_type.replace('_', ' ')}
                  </span>
                </div>
                <Badge variant={t.status === 'resolved' || t.status === 'closed' ? 'success' : 'warning'}>
                  {t.status.toUpperCase()}
                </Badge>
              </div>

              <p className="text-xs text-slate-800 font-medium">{t.description}</p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-1">
                <span>Customer: <strong>{t.customer_name}</strong> ({t.customer_mobile})</span>
                <span>Technician: <strong className="text-blue-700">{t.assigned_technician_name || 'Assignment in progress'}</strong></span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
