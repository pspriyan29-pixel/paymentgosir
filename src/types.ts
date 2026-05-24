export type PaymentMethodId =
  | 'qris'
  | 'va_mandiri'
  | 'va_bri'
  | 'va_bni'
  | 'va_cimb'
  | 'va_permata'
  | 'va_maybank'
  | 'va_atm_bersama'
  | 'va_artha_graha'
  | 'va_sampoerna'
  | 'va_bnc';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  type: 'qris' | 'va';
  bankName?: string;
  logoUrl?: string;
  feeType: 'percent' | 'flat';
  feePercent?: number;
  feeFlat: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  apiKey: string;
  webhookUrl: string;
  redirectUrl: string;
  qrisOnly: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  method: PaymentMethodId;
  paymentCode: string; // Dynamic QR description or VA Number
  customerName?: string;
  customerEmail?: string;
  notes?: string;
  fee: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
  webhookSent: boolean;
  webhookStatus: 'idle' | 'success' | 'failed';
  webhookResponse?: string;
  url?: string;
}

export interface WebhookLog {
  id: string;
  transactionId: string;
  orderId: string;
  projectSlug: string;
  url: string;
  payload: string;
  response: string;
  status: number;
  success: boolean;
  timestamp: string;
}

export interface BalanceWithdrawal {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: 'PENDING' | 'SUCCESS';
  fee: number;
  createdAt: string;
}
