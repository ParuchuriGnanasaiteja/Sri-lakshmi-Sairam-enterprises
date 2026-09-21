import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Dealer, 
  Product, 
  Operator, 
  LedgerTransaction, 
  PaymentRecord, 
  RechargeRequest, 
  ServiceTicket, 
  Technician, 
  DealerStockRequest, 
  SerialItem, 
  AppNotification, 
  AuditLogEntry, 
  BusinessSettings, 
  DealerStockSummary,
  PaymentMethod,
  LedgerTxType,
  RechargeStatus,
  TicketStatus
} from '../types';

import { 
  initialDealers, 
  initialProducts, 
  initialOperators, 
  initialWarehouseStock, 
  initialLedgerTransactions, 
  initialPayments, 
  initialRechargeRequests, 
  initialServiceTickets, 
  initialTechnicians, 
  initialSerials, 
  initialDealerStock, 
  initialStockRequests, 
  initialNotifications, 
  initialAuditLogs, 
  initialSettings 
} from '../db/seedData';

import { calculateDealerFinancials, createLedgerEntry } from '../utils/accounting';
import { useNotification } from './NotificationContext';

interface DataContextType {
  dealers: Dealer[];
  products: Product[];
  operators: Operator[];
  warehouseStock: Record<string, { quantity: number; faulty_quantity: number }>;
  dealerStock: DealerStockSummary[];
  ledgerTransactions: LedgerTransaction[];
  payments: PaymentRecord[];
  rechargeRequests: RechargeRequest[];
  serviceTickets: ServiceTicket[];
  technicians: Technician[];
  serials: SerialItem[];
  stockRequests: DealerStockRequest[];
  notifications: AppNotification[];
  auditLogs: AuditLogEntry[];
  settings: BusinessSettings;

  // Actions
  addDealer: (dealer: Omit<Dealer, 'id' | 'created_at'>) => Dealer;
  updateDealer: (id: string, data: Partial<Dealer>) => void;
  toggleDealerStatus: (id: string) => void;

  // Money & Ledger
  recordPayment: (data: {
    dealerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    utrNumber?: string;
    notes?: string;
    screenshotUrl?: string;
    autoVerify?: boolean;
    date?: string;
  }) => PaymentRecord;
  verifyPayment: (paymentId: string, isApproved: boolean, rejectionReason?: string) => void;
  addLedgerAdjustment: (data: {
    dealerId: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    txType: LedgerTxType;
    description: string;
    referenceNo?: string;
    reason: string;
  }) => LedgerTransaction;

  // Stock
  dispatchStock: (data: {
    dealerId: string;
    items: Array<{ productId: string; quantity: number }>;
    serials?: string[];
    notes?: string;
  }) => void;
  adjustWarehouseStock: (productId: string, quantityDelta: number, isFaulty?: boolean, notes?: string) => void;
  markSerialStatus: (serialId: string, status: SerialItem['status'], customerDetails?: { id: string; name: string; mobile: string }) => void;
  submitStockRequest: (dealerId: string, items: Array<{ productId: string; quantity: number }>, reason: string) => void;
  updateStockRequestStatus: (requestId: string, status: DealerStockRequest['status'], adminNotes?: string) => void;

  // Recharges
  submitRechargeRequest: (data: {
    dealerId: string;
    customerId: string;
    customerName?: string;
    customerMobile?: string;
    operatorId: string;
    planAmount: number;
    planDescription?: string;
    notes?: string;
  }) => RechargeRequest;
  processRecharge: (requestId: string, status: RechargeStatus, operatorRefNo?: string, failureReason?: string) => void;

  // Services
  createServiceTicket: (data: {
    dealerId: string;
    customerId: string;
    customerName: string;
    customerMobile: string;
    customerAddress: string;
    area: string;
    issueType: ServiceTicket['issue_type'];
    description: string;
    priority: ServiceTicket['priority'];
  }) => ServiceTicket;
  updateTicketStatus: (ticketId: string, status: TicketStatus, notes?: string) => void;
  assignTechnicianToTicket: (ticketId: string, technicianId: string) => void;

  // Settings & Notifications
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetToSeedData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(`sls_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Failed to load ${key} from storage`, err);
    return fallback;
  }
};

const saveToStorage = <T,>(key: string, data: T) => {
  try {
    localStorage.setItem(`sls_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to storage`, err);
  }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useNotification();

  const [dealers, setDealers] = useState<Dealer[]>(() => loadFromStorage('dealers', initialDealers));
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage('products', initialProducts));
  const [operators, setOperators] = useState<Operator[]>(() => loadFromStorage('operators', initialOperators));
  const [warehouseStock, setWarehouseStock] = useState(() => loadFromStorage('warehouse_stock', initialWarehouseStock));
  const [dealerStock, setDealerStock] = useState<DealerStockSummary[]>(() => loadFromStorage('dealer_stock', initialDealerStock));
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>(() => loadFromStorage('ledger_txns', initialLedgerTransactions));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadFromStorage('payments', initialPayments));
  const [rechargeRequests, setRechargeRequests] = useState<RechargeRequest[]>(() => loadFromStorage('recharge_reqs', initialRechargeRequests));
  const [serviceTickets, setServiceTickets] = useState<ServiceTicket[]>(() => loadFromStorage('service_tickets', initialServiceTickets));
  const [technicians, setTechnicians] = useState<Technician[]>(() => loadFromStorage('technicians', initialTechnicians));
  const [serials, setSerials] = useState<SerialItem[]>(() => loadFromStorage('serials', initialSerials));
  const [stockRequests, setStockRequests] = useState<DealerStockRequest[]>(() => loadFromStorage('stock_reqs', initialStockRequests));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadFromStorage('notifs', initialNotifications));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadFromStorage('audit_logs', initialAuditLogs));
  const [settings, setSettings] = useState<BusinessSettings>(() => loadFromStorage('settings', initialSettings));

  // Sync to localStorage
  useEffect(() => saveToStorage('dealers', dealers), [dealers]);
  useEffect(() => saveToStorage('products', products), [products]);
  useEffect(() => saveToStorage('operators', operators), [operators]);
  useEffect(() => saveToStorage('warehouse_stock', warehouseStock), [warehouseStock]);
  useEffect(() => saveToStorage('dealer_stock', dealerStock), [dealerStock]);
  useEffect(() => saveToStorage('ledger_txns', ledgerTransactions), [ledgerTransactions]);
  useEffect(() => saveToStorage('payments', payments), [payments]);
  useEffect(() => saveToStorage('recharge_reqs', rechargeRequests), [rechargeRequests]);
  useEffect(() => saveToStorage('service_tickets', serviceTickets), [serviceTickets]);
  useEffect(() => saveToStorage('technicians', technicians), [technicians]);
  useEffect(() => saveToStorage('serials', serials), [serials]);
  useEffect(() => saveToStorage('stock_reqs', stockRequests), [stockRequests]);
  useEffect(() => saveToStorage('notifs', notifications), [notifications]);
  useEffect(() => saveToStorage('audit_logs', auditLogs), [auditLogs]);
  useEffect(() => saveToStorage('settings', settings), [settings]);

  const addAuditLog = (action: string, entityType: string, entityId: string, details: string) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: 'usr-admin-1',
      user_name: 'Distributor Admin',
      user_role: 'admin',
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addNotification = (role: 'all' | 'admin' | 'dealer', title: string, message: string, type: AppNotification['type'], link?: string, targetDealerId?: string) => {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      role,
      target_dealer_id: targetDealerId,
      title,
      message,
      type,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // DEALER MANAGEMENT
  const addDealer = (dealerData: Omit<Dealer, 'id' | 'created_at'>): Dealer => {
    const newId = `dealer-${Date.now()}`;
    const newDealer: Dealer = {
      ...dealerData,
      id: newId,
      created_at: new Date().toISOString()
    };
    setDealers(prev => [newDealer, ...prev]);
    addAuditLog('CREATE_DEALER', 'dealers', newId, `Added new dealer ${newDealer.name} (${newDealer.shop_name}) in ${newDealer.area}`);
    showToast('success', 'Dealer Created', `${newDealer.shop_name} has been added successfully.`);
    return newDealer;
  };

  const updateDealer = (id: string, data: Partial<Dealer>) => {
    setDealers(prev => prev.map(d => d.id === id ? { ...d, ...data, updated_at: new Date().toISOString() } : d));
    addAuditLog('UPDATE_DEALER', 'dealers', id, `Updated profile details for dealer ID ${id}`);
    showToast('success', 'Dealer Updated', 'Dealer information was saved.');
  };

  const toggleDealerStatus = (id: string) => {
    const d = dealers.find(item => item.id === id);
    if (!d) return;
    const newStatus = d.status === 'active' ? 'inactive' : 'active';
    updateDealer(id, { status: newStatus });
    showToast('info', 'Status Changed', `${d.shop_name} marked as ${newStatus}.`);
  };

  // MONEY & LEDGER
  const recordPayment = (data: {
    dealerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    utrNumber?: string;
    notes?: string;
    screenshotUrl?: string;
    autoVerify?: boolean;
    date?: string;
  }): PaymentRecord => {
    const dealer = dealers.find(d => d.id === data.dealerId);
    const dealerName = dealer ? dealer.shop_name : 'Unknown Dealer';
    const payNo = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const paymentId = `pay-${Date.now()}`;

    let ledgerTxnId: string | undefined = undefined;

    if (data.autoVerify) {
      const financials = calculateDealerFinancials(data.dealerId, ledgerTransactions, dealer?.credit_limit || 20000);
      const ledgerEntry = createLedgerEntry(
        data.dealerId,
        dealerName,
        data.amount,
        'CREDIT',
        'PAYMENT_RECEIVED',
        `Payment received via ${data.paymentMethod}${data.utrNumber ? ` (Ref: ${data.utrNumber})` : ''}`,
        financials.calculatedBalance,
        financials.calculatedOutstanding,
        {
          paymentMethod: data.paymentMethod,
          referenceNo: data.utrNumber,
          createdBy: 'Admin'
        }
      );
      setLedgerTransactions(prev => [...prev, ledgerEntry]);
      ledgerTxnId = ledgerEntry.id;
    }

    const newPayment: PaymentRecord = {
      id: paymentId,
      payment_no: payNo,
      dealer_id: data.dealerId,
      dealer_name: dealerName,
      amount: data.amount,
      payment_method: data.paymentMethod,
      utr_number: data.utrNumber,
      date: data.date || new Date().toISOString().split('T')[0],
      notes: data.notes,
      screenshot_url: data.screenshotUrl,
      status: data.autoVerify ? 'verified' : 'pending',
      verified_by: data.autoVerify ? 'Admin' : undefined,
      verified_at: data.autoVerify ? new Date().toISOString() : undefined,
      ledger_transaction_id: ledgerTxnId,
      created_at: new Date().toISOString()
    };

    setPayments(prev => [newPayment, ...prev]);

    if (!data.autoVerify) {
      addNotification('admin', 'New Payment Submitted', `${dealerName} submitted payment of ₹${data.amount} for verification.`, 'payment', '/admin/money');
      showToast('info', 'Payment Submitted', 'Your payment proof was uploaded and is pending distributor verification.');
    } else {
      addAuditLog('RECORD_PAYMENT', 'payments', paymentId, `Recorded and verified ₹${data.amount} for ${dealerName}`);
      addNotification('dealer', 'Payment Verified', `Your payment of ₹${data.amount} has been credited to your account.`, 'payment', undefined, data.dealerId);
      showToast('success', 'Payment Recorded', `₹${data.amount} credited to ${dealerName}.`);
    }

    return newPayment;
  };

  const verifyPayment = (paymentId: string, isApproved: boolean, rejectionReason?: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;

    if (isApproved) {
      const dealer = dealers.find(d => d.id === payment.dealer_id);
      const financials = calculateDealerFinancials(payment.dealer_id, ledgerTransactions, dealer?.credit_limit || 20000);
      
      const ledgerEntry = createLedgerEntry(
        payment.dealer_id,
        payment.dealer_name,
        payment.amount,
        'CREDIT',
        'PAYMENT_RECEIVED',
        `Payment verified via ${payment.payment_method}${payment.utr_number ? ` (Ref: ${payment.utr_number})` : ''}`,
        financials.calculatedBalance,
        financials.calculatedOutstanding,
        {
          paymentMethod: payment.payment_method,
          referenceNo: payment.utr_number,
          createdBy: 'Admin'
        }
      );

      setLedgerTransactions(prev => [...prev, ledgerEntry]);

      setPayments(prev => prev.map(p => p.id === paymentId ? {
        ...p,
        status: 'verified',
        verified_by: 'Admin',
        verified_at: new Date().toISOString(),
        ledger_transaction_id: ledgerEntry.id
      } : p));

      addAuditLog('VERIFY_PAYMENT', 'payments', paymentId, `Verified ₹${payment.amount} for ${payment.dealer_name}`);
      addNotification('dealer', 'Payment Verified', `Your payment of ₹${payment.amount} has been verified and added to your balance.`, 'payment', undefined, payment.dealer_id);
      showToast('success', 'Payment Verified', `₹${payment.amount} added to ${payment.dealer_name} ledger.`);
    } else {
      setPayments(prev => prev.map(p => p.id === paymentId ? {
        ...p,
        status: 'rejected',
        rejection_reason: rejectionReason || 'Payment verification failed',
        verified_by: 'Admin',
        verified_at: new Date().toISOString()
      } : p));

      addAuditLog('REJECT_PAYMENT', 'payments', paymentId, `Rejected payment proof for ${payment.dealer_name}: ${rejectionReason}`);
      addNotification('dealer', 'Payment Rejected', `Payment verification rejected: ${rejectionReason}`, 'payment', undefined, payment.dealer_id);
      showToast('error', 'Payment Rejected', 'Payment request was marked rejected.');
    }
  };

  const addLedgerAdjustment = (data: {
    dealerId: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    txType: LedgerTxType;
    description: string;
    referenceNo?: string;
    reason: string;
  }): LedgerTransaction => {
    const dealer = dealers.find(d => d.id === data.dealerId);
    const dealerName = dealer ? dealer.shop_name : 'Dealer';
    const financials = calculateDealerFinancials(data.dealerId, ledgerTransactions, dealer?.credit_limit || 20000);

    const ledgerEntry = createLedgerEntry(
      data.dealerId,
      dealerName,
      data.amount,
      data.type,
      data.txType,
      `${data.description} (Reason: ${data.reason})`,
      financials.calculatedBalance,
      financials.calculatedOutstanding,
      {
        referenceNo: data.referenceNo,
        createdBy: 'Admin',
        isReversal: data.txType === 'ADJUSTMENT'
      }
    );

    setLedgerTransactions(prev => [...prev, ledgerEntry]);
    addAuditLog('LEDGER_ADJUSTMENT', 'ledger_transactions', ledgerEntry.id, `${data.type} adjustment of ₹${data.amount} for ${dealerName}`);
    showToast('success', 'Adjustment Recorded', `Ledger adjustment for ₹${data.amount} was saved.`);
    return ledgerEntry;
  };

  // STOCK & DISPATCH
  const dispatchStock = (data: {
    dealerId: string;
    items: Array<{ productId: string; quantity: number }>;
    serials?: string[];
    notes?: string;
  }) => {
    const dealer = dealers.find(d => d.id === data.dealerId);
    if (!dealer) return;

    let totalAmount = 0;
    const newWarehouseStock = { ...warehouseStock };
    const newDealerStock = [...dealerStock];

    for (const item of data.items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) continue;
      
      // Calculate financial cost
      totalAmount += prod.dealer_price * item.quantity;

      // Decrement warehouse
      const currentWh = newWarehouseStock[item.productId] || { quantity: 0, faulty_quantity: 0 };
      newWarehouseStock[item.productId] = {
        ...currentWh,
        quantity: Math.max(0, currentWh.quantity - item.quantity)
      };

      // Increment dealer
      const existingIdx = newDealerStock.findIndex(ds => ds.dealer_id === data.dealerId && ds.product_id === item.productId);
      if (existingIdx >= 0) {
        newDealerStock[existingIdx] = {
          ...newDealerStock[existingIdx],
          quantity: newDealerStock[existingIdx].quantity + item.quantity
        };
      } else {
        newDealerStock.push({
          dealer_id: data.dealerId,
          product_id: item.productId,
          product_name: prod.name,
          category: prod.category,
          quantity: item.quantity,
          faulty_quantity: 0
        });
      }
    }

    setWarehouseStock(newWarehouseStock);
    setDealerStock(newDealerStock);

    // Update serials if any
    if (data.serials && data.serials.length > 0) {
      setSerials(prev => prev.map(s => {
        if (data.serials?.includes(s.serial_number)) {
          return {
            ...s,
            status: 'with_dealer',
            current_dealer_id: data.dealerId,
            current_dealer_name: dealer.shop_name,
            history: [
              ...s.history,
              {
                status: 'with_dealer',
                timestamp: new Date().toISOString(),
                details: `Dispatched to ${dealer.shop_name}`,
                actor: 'Admin'
              }
            ]
          };
        }
        return s;
      }));
    }

    // Create stock debit ledger entry
    const financials = calculateDealerFinancials(data.dealerId, ledgerTransactions, dealer.credit_limit);
    const itemSummary = data.items.map(it => {
      const p = products.find(prod => prod.id === it.productId);
      return `${it.quantity} x ${p?.name || 'Item'}`;
    }).join(', ');

    const ledgerEntry = createLedgerEntry(
      data.dealerId,
      dealer.shop_name,
      totalAmount,
      'DEBIT',
      'STOCK_PURCHASE',
      `Stock Dispatch: ${itemSummary}`,
      financials.calculatedBalance,
      financials.calculatedOutstanding,
      {
        createdBy: 'Admin',
        referenceNo: `DSP-${Date.now().toString().slice(-6)}`
      }
    );

    setLedgerTransactions(prev => [...prev, ledgerEntry]);
    addAuditLog('DISPATCH_STOCK', 'warehouse_stock', data.dealerId, `Dispatched stock (${itemSummary}) worth ₹${totalAmount} to ${dealer.shop_name}`);
    addNotification('dealer', 'Stock Dispatched', `${itemSummary} has been dispatched to your shop.`, 'stock', undefined, data.dealerId);
    showToast('success', 'Stock Dispatched', `Successfully transferred stock to ${dealer.shop_name}.`);
  };

  const adjustWarehouseStock = (productId: string, quantityDelta: number, isFaulty = false, notes?: string) => {
    const prod = products.find(p => p.id === productId);
    setWarehouseStock(prev => {
      const current = prev[productId] || { quantity: 0, faulty_quantity: 0 };
      if (isFaulty) {
        return { ...prev, [productId]: { ...current, faulty_quantity: Math.max(0, current.faulty_quantity + quantityDelta) } };
      }
      return { ...prev, [productId]: { ...current, quantity: Math.max(0, current.quantity + quantityDelta) } };
    });
    addAuditLog('ADJUST_STOCK', 'warehouse_stock', productId, `Adjusted ${prod?.name}: delta ${quantityDelta} (${notes || 'No note'})`);
    showToast('info', 'Warehouse Stock Updated', `${prod?.name} inventory was adjusted.`);
  };

  const markSerialStatus = (serialId: string, status: SerialItem['status'], customerDetails?: { id: string; name: string; mobile: string }) => {
    setSerials(prev => prev.map(s => {
      if (s.id === serialId) {
        return {
          ...s,
          status,
          customer_id: customerDetails?.id || s.customer_id,
          customer_name: customerDetails?.name || s.customer_name,
          customer_mobile: customerDetails?.mobile || s.customer_mobile,
          installed_at: status === 'installed' ? new Date().toISOString() : s.installed_at,
          history: [
            ...s.history,
            {
              status,
              timestamp: new Date().toISOString(),
              details: `Status changed to ${status}${customerDetails ? ` for customer ${customerDetails.name}` : ''}`,
              actor: 'System'
            }
          ]
        };
      }
      return s;
    }));
    showToast('success', 'Serial Updated', 'Equipment status was updated.');
  };

  const submitStockRequest = (dealerId: string, items: Array<{ productId: string; quantity: number }>, reason: string) => {
    const dealer = dealers.find(d => d.id === dealerId);
    const reqNo = `SR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    
    const requestItems = items.map(it => {
      const p = products.find(prod => prod.id === it.productId);
      return {
        product_id: it.productId,
        product_name: p?.name || 'Product',
        quantity: it.quantity
      };
    });

    const newReq: DealerStockRequest = {
      id: `sr-${Date.now()}`,
      request_no: reqNo,
      dealer_id: dealerId,
      dealer_name: dealer?.shop_name || 'Dealer',
      items: requestItems,
      reason,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    setStockRequests(prev => [newReq, ...prev]);
    addNotification('admin', 'New Stock Request', `${dealer?.shop_name} requested stock replenishment.`, 'stock', '/admin/stock');
    showToast('success', 'Request Sent', 'Your stock request has been submitted to the distributor.');
  };

  const updateStockRequestStatus = (requestId: string, status: DealerStockRequest['status'], adminNotes?: string) => {
    setStockRequests(prev => prev.map(r => r.id === requestId ? { ...r, status, admin_notes: adminNotes, updated_at: new Date().toISOString() } : r));
    const req = stockRequests.find(r => r.id === requestId);
    if (req) {
      addNotification('dealer', `Stock Request ${status.toUpperCase()}`, `Your stock request ${req.request_no} was marked ${status}.`, 'stock', undefined, req.dealer_id);
    }
    showToast('info', 'Status Updated', `Stock request marked as ${status}.`);
  };

  // RECHARGES
  const submitRechargeRequest = (data: {
    dealerId: string;
    customerId: string;
    customerName?: string;
    customerMobile?: string;
    operatorId: string;
    planAmount: number;
    planDescription?: string;
    notes?: string;
  }): RechargeRequest => {
    const dealer = dealers.find(d => d.id === data.dealerId);
    const op = operators.find(o => o.id === data.operatorId) || operators[0];
    const reqNo = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    
    const commissionPercent = op.default_commission_rate;
    const commissionAmount = Number(((data.planAmount * commissionPercent) / 100).toFixed(2));
    const netAmount = Number((data.planAmount - commissionAmount).toFixed(2));

    const newReq: RechargeRequest = {
      id: `rec-${Date.now()}`,
      request_no: reqNo,
      dealer_id: data.dealerId,
      dealer_name: dealer?.shop_name || 'Dealer',
      customer_id: data.customerId,
      customer_name: data.customerName,
      customer_mobile: data.customerMobile,
      operator_id: data.operatorId,
      operator_name: op.name,
      operator_code: op.code,
      plan_amount: data.planAmount,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      plan_description: data.planDescription,
      status: 'pending',
      notes: data.notes,
      created_at: new Date().toISOString()
    };

    setRechargeRequests(prev => [newReq, ...prev]);
    addNotification('admin', 'New Recharge Request', `${dealer?.shop_name} submitted ₹${data.planAmount} ${op.name} recharge for ${data.customerId}.`, 'recharge', '/admin/recharges');
    showToast('success', 'Recharge Submitted', `Recharge request for ${op.name} (₹${data.planAmount}) created.`);
    return newReq;
  };

  const processRecharge = (requestId: string, status: RechargeStatus, operatorRefNo?: string, failureReason?: string) => {
    const req = rechargeRequests.find(r => r.id === requestId);
    if (!req) return;

    if (status === 'completed') {
      const dealer = dealers.find(d => d.id === req.dealer_id);
      const financials = calculateDealerFinancials(req.dealer_id, ledgerTransactions, dealer?.credit_limit || 20000);

      // Create ledger deduction
      const ledgerEntry = createLedgerEntry(
        req.dealer_id,
        req.dealer_name,
        req.net_amount,
        'DEBIT',
        'RECHARGE_DEDUCTION',
        `${req.operator_name} Recharge for ${req.customer_id} (Plan ₹${req.plan_amount}, Comm ₹${req.commission_amount})`,
        financials.calculatedBalance,
        financials.calculatedOutstanding,
        {
          referenceNo: operatorRefNo || `OP-${Date.now().toString().slice(-6)}`,
          createdBy: 'Admin'
        }
      );

      setLedgerTransactions(prev => [...prev, ledgerEntry]);

      setRechargeRequests(prev => prev.map(r => r.id === requestId ? {
        ...r,
        status: 'completed',
        operator_ref_no: operatorRefNo,
        processed_by: 'Admin',
        completed_at: new Date().toISOString()
      } : r));

      addAuditLog('COMPLETE_RECHARGE', 'recharge_requests', requestId, `Processed ${req.operator_name} ₹${req.plan_amount} for ${req.dealer_name}. Deducted ₹${req.net_amount}`);
      addNotification('dealer', 'Recharge Successful', `Recharge of ₹${req.plan_amount} for ${req.customer_id} completed.`, 'recharge', undefined, req.dealer_id);
      showToast('success', 'Recharge Completed', `₹${req.net_amount} deducted from ${req.dealer_name} balance.`);
    } else {
      setRechargeRequests(prev => prev.map(r => r.id === requestId ? {
        ...r,
        status,
        operator_ref_no: operatorRefNo,
        failure_reason: failureReason,
        processed_by: 'Admin'
      } : r));

      if (status === 'failed' || status === 'rejected') {
        addNotification('dealer', `Recharge ${status}`, `Recharge of ₹${req.plan_amount} for ${req.customer_id} was marked ${status}. Reason: ${failureReason || 'Failed'}`, 'recharge', undefined, req.dealer_id);
      }
      showToast('info', 'Recharge Updated', `Status changed to ${status}.`);
    }
  };

  // SERVICE TICKETS
  const createServiceTicket = (data: {
    dealerId: string;
    customerId: string;
    customerName: string;
    customerMobile: string;
    customerAddress: string;
    area: string;
    issueType: ServiceTicket['issue_type'];
    description: string;
    priority: ServiceTicket['priority'];
  }): ServiceTicket => {
    const dealer = dealers.find(d => d.id === data.dealerId);
    const tktNo = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: ServiceTicket = {
      id: `tkt-${Date.now()}`,
      ticket_no: tktNo,
      dealer_id: data.dealerId,
      dealer_name: dealer?.shop_name || 'Dealer',
      customer_id: data.customerId,
      customer_name: data.customerName,
      customer_mobile: data.customerMobile,
      customer_address: data.customerAddress,
      area: data.area,
      issue_type: data.issueType,
      description: data.description,
      priority: data.priority,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setServiceTickets(prev => [newTicket, ...prev]);
    addNotification('admin', 'New Service Ticket', `${dealer?.shop_name} raised ticket for ${data.customerName} (${data.issueType}).`, 'ticket', '/admin/services');
    showToast('success', 'Ticket Raised', `Service ticket ${tktNo} has been registered.`);
    return newTicket;
  };

  const updateTicketStatus = (ticketId: string, status: TicketStatus, notes?: string) => {
    setServiceTickets(prev => prev.map(t => t.id === ticketId ? {
      ...t,
      status,
      resolution_notes: notes || t.resolution_notes,
      resolved_at: status === 'resolved' ? new Date().toISOString() : t.resolved_at,
      closed_at: status === 'closed' ? new Date().toISOString() : t.closed_at,
      updated_at: new Date().toISOString()
    } : t));
    showToast('info', 'Ticket Status Updated', `Ticket marked as ${status}.`);
  };

  const assignTechnicianToTicket = (ticketId: string, technicianId: string) => {
    const tech = technicians.find(t => t.id === technicianId);
    setServiceTickets(prev => prev.map(t => t.id === ticketId ? {
      ...t,
      status: 'assigned',
      assigned_technician_id: technicianId,
      assigned_technician_name: tech?.name,
      updated_at: new Date().toISOString()
    } : t));
    showToast('success', 'Technician Assigned', `Ticket assigned to ${tech?.name}.`);
  };

  // SETTINGS & NOTIFICATIONS
  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog('UPDATE_SETTINGS', 'settings', 'default', 'Updated business profile & global parameters');
    showToast('success', 'Settings Saved', 'Business configurations updated.');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const resetToSeedData = () => {
    setDealers(initialDealers);
    setProducts(initialProducts);
    setOperators(initialOperators);
    setWarehouseStock(initialWarehouseStock);
    setDealerStock(initialDealerStock);
    setLedgerTransactions(initialLedgerTransactions);
    setPayments(initialPayments);
    setRechargeRequests(initialRechargeRequests);
    setServiceTickets(initialServiceTickets);
    setTechnicians(initialTechnicians);
    setSerials(initialSerials);
    setStockRequests(initialStockRequests);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    setSettings(initialSettings);
    localStorage.clear();
    showToast('info', 'Reset Complete', 'Demo database re-seeded with 40 dealers and sample transactions.');
  };

  return (
    <DataContext.Provider
      value={{
        dealers,
        products,
        operators,
        warehouseStock,
        dealerStock,
        ledgerTransactions,
        payments,
        rechargeRequests,
        serviceTickets,
        technicians,
        serials,
        stockRequests,
        notifications,
        auditLogs,
        settings,

        addDealer,
        updateDealer,
        toggleDealerStatus,
        recordPayment,
        verifyPayment,
        addLedgerAdjustment,
        dispatchStock,
        adjustWarehouseStock,
        markSerialStatus,
        submitStockRequest,
        updateStockRequestStatus,
        submitRechargeRequest,
        processRecharge,
        createServiceTicket,
        updateTicketStatus,
        assignTechnicianToTicket,
        updateSettings,
        markNotificationRead,
        markAllNotificationsRead,
        resetToSeedData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
