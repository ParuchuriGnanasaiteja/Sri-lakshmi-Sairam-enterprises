import { LedgerTransaction, LedgerTxType, PaymentMethod } from '../types';

export interface DealerFinancialSummary {
  dealerId: string;
  totalCredits: number;
  totalDebits: number;
  calculatedBalance: number;
  calculatedOutstanding: number;
  creditLimit: number;
  creditUsedPercentage: number;
  isApproachingLimit: boolean; // >= 80%
  isExceededLimit: boolean; // >= 100%
  lastTransactionDate?: string;
  totalPayments: number;
  totalRecharges: number;
  totalStockPurchases: number;
}

/**
 * Computes the real-time financial balance of a dealer strictly from their immutable ledger entries.
 */
export const calculateDealerFinancials = (
  dealerId: string,
  transactions: LedgerTransaction[],
  creditLimit: number
): DealerFinancialSummary => {
  const dealerTxns = transactions
    .filter(t => t.dealer_id === dealerId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  let balance = 0;
  let totalCredits = 0;
  let totalDebits = 0;
  let totalPayments = 0;
  let totalRecharges = 0;
  let totalStockPurchases = 0;
  let lastDate: string | undefined = undefined;

  for (const txn of dealerTxns) {
    if (txn.type === 'CREDIT') {
      balance += txn.amount;
      totalCredits += txn.amount;
      if (txn.transaction_type === 'PAYMENT_RECEIVED' || txn.transaction_type === 'BALANCE_ADDED') {
        totalPayments += txn.amount;
      }
    } else if (txn.type === 'DEBIT') {
      balance -= txn.amount;
      totalDebits += txn.amount;
      if (txn.transaction_type === 'RECHARGE_DEDUCTION') {
        totalRecharges += txn.amount;
      } else if (txn.transaction_type === 'STOCK_PURCHASE') {
        totalStockPurchases += txn.amount;
      }
    }
    lastDate = txn.created_at;
  }

  // If balance is negative, that negative amount is the outstanding dues owed by dealer
  // If balance is positive, dealer has prepaid wallet balance
  const calculatedOutstanding = balance < 0 ? Math.abs(balance) : 0;
  const currentAvailableBalance = balance > 0 ? balance : 0;

  const creditUsedPercentage = creditLimit > 0 ? (calculatedOutstanding / creditLimit) * 100 : 0;

  return {
    dealerId,
    totalCredits,
    totalDebits,
    calculatedBalance: currentAvailableBalance,
    calculatedOutstanding,
    creditLimit,
    creditUsedPercentage,
    isApproachingLimit: creditUsedPercentage >= 80 && creditUsedPercentage < 100,
    isExceededLimit: creditUsedPercentage >= 100,
    lastTransactionDate: lastDate,
    totalPayments,
    totalRecharges,
    totalStockPurchases
  };
};

/**
 * Creates an immutable transaction payload with updated running balance.
 */
export const createLedgerEntry = (
  dealerId: string,
  dealerName: string,
  amount: number,
  type: 'CREDIT' | 'DEBIT',
  txType: LedgerTxType,
  description: string,
  currentBalance: number,
  currentOutstanding: number,
  options?: {
    paymentMethod?: PaymentMethod;
    referenceNo?: string;
    attachmentUrl?: string;
    createdBy?: string;
    isReversal?: boolean;
    originalTxId?: string;
  }
): LedgerTransaction => {
  const timestamp = new Date().toISOString();
  const txNo = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Calculate new balance
  let netBalance = (currentBalance > 0 ? currentBalance : -currentOutstanding);
  if (type === 'CREDIT') {
    netBalance += amount;
  } else {
    netBalance -= amount;
  }

  const balanceAfter = netBalance > 0 ? netBalance : 0;
  const outstandingAfter = netBalance < 0 ? Math.abs(netBalance) : 0;

  return {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    transaction_no: txNo,
    dealer_id: dealerId,
    dealer_name: dealerName,
    date: new Date().toISOString().split('T')[0],
    amount,
    type,
    transaction_type: txType,
    balance_after: balanceAfter,
    outstanding_after: outstandingAfter,
    description,
    payment_method: options?.paymentMethod || 'SYSTEM',
    reference_no: options?.referenceNo,
    attachment_url: options?.attachmentUrl,
    is_reversal: !!options?.isReversal,
    original_transaction_id: options?.originalTxId,
    created_by: options?.createdBy || 'Admin',
    created_at: timestamp
  };
};
