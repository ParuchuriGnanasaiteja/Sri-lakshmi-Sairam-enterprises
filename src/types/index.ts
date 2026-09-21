export type UserRole = 'admin' | 'staff' | 'dealer';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  mobile: string;
  dealer_id?: string;
  avatar_url?: string;
}

export type DealerStatus = 'active' | 'inactive' | 'suspended';

export interface Dealer {
  id: string;
  dealer_code: string;
  name: string;
  shop_name: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  address: string;
  area: string;
  village_or_town: string;
  pincode: string;
  joining_date: string;
  status: DealerStatus;
  credit_limit: number;
  allow_overlimit_requests: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type ProductCategory = 
  | 'stb' 
  | 'smart_card' 
  | 'remote' 
  | 'adapter' 
  | 'dish_lnb' 
  | 'cable' 
  | 'connector' 
  | 'voucher' 
  | 'other';

export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  operator_id?: string;
  unit_price: number;
  mrp: number;
  dealer_price: number;
  min_stock_threshold: number;
  is_serialized: boolean;
  description?: string;
  created_at: string;
}

export interface Operator {
  id: string;
  code: 'TATAPLAY' | 'AIRTEL' | 'DISHTV' | 'SUNDIRECT' | 'D2H';
  name: string;
  logo_url?: string;
  is_active: boolean;
  commission_type: 'percentage' | 'fixed';
  default_commission_rate: number;
  support_number?: string;
}

export interface CommissionRule {
  id: string;
  operator_id: string;
  dealer_id?: string; // If null, applies globally
  min_amount: number;
  max_amount: number;
  commission_type: 'percentage' | 'fixed';
  commission_value: number; // e.g. 5 for 5% or 20 for ₹20
  notes?: string;
}

export type StockDirection = 'in' | 'out' | 'transfer';
export type StockTxType = 
  | 'purchase_in' 
  | 'dispatch_to_dealer' 
  | 'dealer_return' 
  | 'faulty_in' 
  | 'replacement_out' 
  | 'audit_adjustment';

export interface StockTransaction {
  id: string;
  transaction_no: string;
  transaction_type: StockTxType;
  product_id: string;
  product_name: string;
  dealer_id?: string;
  dealer_name?: string;
  quantity: number;
  serial_numbers?: string[];
  reference_no?: string;
  delivery_receipt_no?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export type SerialStatus = 'in_warehouse' | 'with_dealer' | 'installed' | 'faulty' | 'returned';

export interface SerialItem {
  id: string;
  serial_number: string;
  vc_number?: string;
  product_id: string;
  product_name: string;
  operator_code?: string;
  status: SerialStatus;
  current_dealer_id?: string;
  current_dealer_name?: string;
  customer_id?: string;
  customer_name?: string;
  customer_mobile?: string;
  installed_at?: string;
  history: Array<{
    status: SerialStatus;
    timestamp: string;
    details: string;
    actor: string;
  }>;
  created_at: string;
}

export interface DealerStockSummary {
  dealer_id: string;
  product_id: string;
  product_name: string;
  category: ProductCategory;
  quantity: number;
  faulty_quantity: number;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'SYSTEM' | 'OTHER';

export type LedgerTxType = 
  | 'BALANCE_ADDED' 
  | 'PAYMENT_RECEIVED' 
  | 'RECHARGE_DEDUCTION' 
  | 'REFUND' 
  | 'ADJUSTMENT' 
  | 'CREDIT' 
  | 'DEBIT' 
  | 'STOCK_PURCHASE';

export interface LedgerTransaction {
  id: string;
  transaction_no: string;
  dealer_id: string;
  dealer_name: string;
  date: string;
  amount: number; // Always positive
  type: 'CREDIT' | 'DEBIT'; // CREDIT increases balance/reduces outstanding; DEBIT decreases balance/increases outstanding
  transaction_type: LedgerTxType;
  balance_after: number;
  outstanding_after: number;
  description: string;
  payment_method?: PaymentMethod;
  reference_no?: string; // UTR or Chq no
  attachment_url?: string;
  is_reversal: boolean;
  original_transaction_id?: string;
  created_by: string;
  created_at: string;
}

export type PaymentVerificationStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentRecord {
  id: string;
  payment_no: string;
  dealer_id: string;
  dealer_name: string;
  amount: number;
  payment_method: PaymentMethod;
  utr_number?: string;
  date: string;
  notes?: string;
  screenshot_url?: string;
  status: PaymentVerificationStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  ledger_transaction_id?: string;
  created_at: string;
}

export type RechargeStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';

export interface RechargeRequest {
  id: string;
  request_no: string;
  dealer_id: string;
  dealer_name: string;
  customer_id: string;
  customer_name?: string;
  customer_mobile?: string;
  operator_id: string;
  operator_name: string;
  operator_code: string;
  plan_amount: number;
  commission_amount: number;
  net_amount: number; // plan_amount - commission_amount
  plan_description?: string;
  status: RechargeStatus;
  operator_ref_no?: string;
  failure_reason?: string;
  notes?: string;
  processed_by?: string;
  completed_at?: string;
  created_at: string;
}

export type IssueType = 
  | 'installation' 
  | 'stb_fault' 
  | 'remote_issue' 
  | 'channel_issue' 
  | 'shifting' 
  | 'replacement' 
  | 'customer_complaint' 
  | 'other';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export interface ServiceTicket {
  id: string;
  ticket_no: string;
  dealer_id: string;
  dealer_name: string;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  customer_address: string;
  area: string;
  issue_type: IssueType;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_technician_id?: string;
  assigned_technician_name?: string;
  resolution_notes?: string;
  photos?: string[];
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Technician {
  id: string;
  name: string;
  mobile: string;
  area: string;
  status: 'active' | 'busy' | 'inactive';
  completed_tickets_count: number;
}

export interface DealerStockRequest {
  id: string;
  request_no: string;
  dealer_id: string;
  dealer_name: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
  }>;
  reason: string;
  status: 'pending' | 'approved' | 'dispatched' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface AppNotification {
  id: string;
  user_id?: string;
  role: 'all' | 'admin' | 'dealer';
  target_dealer_id?: string;
  title: string;
  message: string;
  type: 'payment' | 'recharge' | 'stock' | 'ticket' | 'credit_warning' | 'system';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface BusinessSettings {
  business_name: string;
  tagline: string;
  proprietor: string;
  address: string;
  location: string;
  district: string;
  state: string;
  pincode: string;
  primary_mobile: string;
  support_mobile: string;
  email: string;
  gst_number: string;
  upi_id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string;
  default_credit_limit: number;
  lock_requests_on_limit_cross: boolean;
  low_stock_warning_level: number;
  eod_whatsapp_number: string;
}
