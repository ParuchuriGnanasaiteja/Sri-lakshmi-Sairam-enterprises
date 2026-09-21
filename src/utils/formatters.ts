export const formatCurrency = (amount: number, includeDecimals = true): string => {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals && amount % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d);
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
};

export const getStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'verified':
    case 'resolved':
    case 'closed':
    case 'approved':
    case 'installed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    
    case 'pending':
    case 'new':
    case 'in_warehouse':
    case 'with_dealer':
      return 'bg-amber-50 text-amber-700 border-amber-200';
      
    case 'processing':
    case 'in_progress':
    case 'assigned':
    case 'busy':
      return 'bg-blue-50 text-blue-700 border-blue-200';
      
    case 'failed':
    case 'rejected':
    case 'faulty':
    case 'suspended':
    case 'inactive':
    case 'returned':
      return 'bg-rose-50 text-rose-700 border-rose-200';
      
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};
