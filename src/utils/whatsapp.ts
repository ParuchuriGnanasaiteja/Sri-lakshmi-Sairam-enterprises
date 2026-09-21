import { formatCurrency, formatDate } from './formatters';

interface PaymentReceiptData {
  dealerName: string;
  dealerMobile: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string;
  date: string;
  newBalance: number;
  newOutstanding: number;
}

export const createWhatsAppUrl = (mobile: string, text: string): string => {
  const cleanMobile = mobile.replace(/[^0-9]/g, '');
  const formattedMobile = cleanMobile.length === 10 ? `91${cleanMobile}` : cleanMobile;
  return `https://wa.me/${formattedMobile}?text=${encodeURIComponent(text)}`;
};

export const generatePaymentReceiptWhatsApp = (data: PaymentReceiptData): string => {
  const message = `*SRI LAKSHMI SAIRAM ENTERPRISES*
Cherukupalli, Andhra Pradesh
--------------------------------------
*PAYMENT RECEIPT*

Dear ${data.dealerName},
We have received and verified your payment.

*Amount Received:* ${formatCurrency(data.amount)}
*Payment Mode:* ${data.paymentMethod}
*Reference/UTR:* ${data.referenceNo || 'N/A'}
*Date:* ${formatDate(data.date)}

*Current Balance:* ${formatCurrency(data.newBalance)}
*Current Outstanding:* ${formatCurrency(data.newOutstanding)}

Thank you for your business!
_Sri Lakshmi Sairam Enterprises (Cherukupalli)_`;

  return createWhatsAppUrl(data.dealerMobile, message);
};

export const generateStockDispatchWhatsApp = (
  dealerName: string,
  dealerMobile: string,
  items: Array<{ name: string; quantity: number }>,
  challanNo: string
): string => {
  const itemsText = items.map((it, idx) => `${idx + 1}. ${it.name} - *${it.quantity} Nos*`).join('\n');

  const message = `*SRI LAKSHMI SAIRAM ENTERPRISES*
Cherukupalli, Andhra Pradesh
--------------------------------------
*STOCK DISPATCH ADVICE*

Dear ${dealerName},
Stock has been dispatched for your shop.

*Challan No:* ${challanNo}
*Date:* ${formatDate(new Date().toISOString())}

*Items Dispatched:*
${itemsText}

Please verify the count upon delivery and confirm.
_Sri Lakshmi Sairam Enterprises (Cherukupalli)_`;

  return createWhatsAppUrl(dealerMobile, message);
};

export const generateOutstandingReminderWhatsApp = (
  dealerName: string,
  dealerMobile: string,
  outstandingAmount: number,
  creditLimit: number
): string => {
  const message = `*SRI LAKSHMI SAIRAM ENTERPRISES*
Cherukupalli, Andhra Pradesh
--------------------------------------
*PAYMENT REMINDER*

Dear ${dealerName},
This is a gentle reminder regarding your current account balance.

*Current Outstanding Dues:* ${formatCurrency(outstandingAmount)}
*Credit Limit:* ${formatCurrency(creditLimit)}

Kindly arrange the payment via UPI / Bank Transfer at your earliest convenience to avoid any disruption in recharge and stock requests.

*UPI ID:* srilakshmisairam@sbi
*Bank:* SBI Cherukupalli Branch

Thank you!`;

  return createWhatsAppUrl(dealerMobile, message);
};

export const generateRechargeCompleteWhatsApp = (
  dealerMobile: string,
  customerNumber: string,
  operator: string,
  amount: number,
  refNo: string
): string => {
  const message = `*SRI LAKSHMI SAIRAM ENTERPRISES*
--------------------------------------
*RECHARGE COMPLETED*

*Customer ID:* ${customerNumber}
*Operator:* ${operator}
*Amount:* ${formatCurrency(amount)}
*Operator Ref:* ${refNo}
*Status:* Success

Your account balance has been deducted.
Thank you!`;

  return createWhatsAppUrl(dealerMobile, message);
};

export const generateEODWhatsApp = (
  ownerMobile: string,
  date: string,
  activeDealers: number,
  totalCollection: number,
  cash: number,
  upi: number,
  bank: number,
  rechargeCount: number,
  rechargeValue: number,
  openTickets: number,
  totalOutstanding: number
): string => {
  const message = `*SRI LAKSHMI SAIRAM ENTERPRISES*
Cherukupalli, Andhra Pradesh
--------------------------------------
*DAILY END-OF-DAY (EOD) REPORT*
*Date:* ${formatDate(date)}

*Active Dealers:* ${activeDealers}
*Total Money Collected:* ${formatCurrency(totalCollection)}
  - Cash: ${formatCurrency(cash)}
  - UPI: ${formatCurrency(upi)}
  - Bank: ${formatCurrency(bank)}

*Total Recharges:* ${rechargeCount}
*Recharge Turnover:* ${formatCurrency(rechargeValue)}

*Pending Service Tickets:* ${openTickets}
*Total Dealer Outstanding:* ${formatCurrency(totalOutstanding)}
--------------------------------------
_Generated automatically by DTH Management System_`;

  return createWhatsAppUrl(ownerMobile, message);
};
