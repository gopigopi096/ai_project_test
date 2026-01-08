export interface Invoice {
  id: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  appointmentId?: number;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category: ItemCategory;
}

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type ItemCategory = 'CONSULTATION' | 'PROCEDURE' | 'MEDICATION' | 'LAB_TEST' | 'ROOM_CHARGE' | 'OTHER';

export interface InvoiceRequest {
  patientId: number;
  appointmentId?: number;
  items: InvoiceItem[];
  discountAmount?: number;
  dueDate: string;
  notes?: string;
}

export interface Payment {
  id?: number;
  invoiceId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  paymentDate: string;
  notes?: string;
}

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE' | 'BANK_TRANSFER' | 'CHECK';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

