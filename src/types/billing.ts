import type { Booking } from './api';

export type InvoiceStatus = 'Unpaid' | 'PartiallyPaid' | 'Paid' | 'Overdue';

export interface Invoice {
  _id: string;
  bookingId: string | Booking;
  billingMonth: string; // Format: "YYYY-MM", e.g. "2026-10"
  rentAmount: number;
  totalDue: number;
  status: InvoiceStatus;
  refundedAmount?: number;
  disputeStatus?: string | null;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'Unpaid' | 'Paid' | 'Processing' | 'Failed';
export type PaymentMethod = 'Card' | 'Cash' | 'BankTransfer' | 'JazzCash' | 'EasyPaisa';

export interface Payment {
  _id: string;
  invoiceId: string | Invoice;
  hostelId: string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  stripeAccountId: string | null;
  refundedAmount?: number;
  disputedAmount?: number;
  disputeLossAmount?: number;
  disputeStatus?: string | null;
  recordedBy?: string | null;
  transactionReference?: string;
  transactionDate?: string;
  blockchainRef?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutResponse {
  paymentId: string;
  checkoutUrl: string;
}

export interface InvoiceReceipt {
  receiptNumber: string;
  invoiceId: string;
  billingMonth: string;
  status: 'Paid';
  currency: 'PKR';
  rentAmount: number;
  totalPaid: number;
  paidAt: string | null;
  refundedAmount?: number;
  paymentMethod: string;
  resident: {
    name: string;
    email: string;
    residentCode: string | null;
  } | null;
  hostel: { name: string; location: string } | null;
  roomNumber: string | null;
  transactions: Array<{
    amount: number;
    method: Payment['paymentMethod'];
    reference: string | null;
    paidAt: string;
  }>;
}

export interface CheckoutPayload {
  invoiceId: string;
}

