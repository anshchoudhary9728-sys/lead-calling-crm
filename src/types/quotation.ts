export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type WhatsAppStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
export type TaxType = 'CGST_SGST' | 'IGST' | 'NONE';

export interface QuotationItem {
  id: string;
  name: string;
  description?: string;
  hsn_code?: string;
  quantity: number;
  unit: string; // 'Mtr' | 'Kg' | 'Pcs' | 'Roll' | 'Than' | 'Unit'
  rate: number;
  gst_rate: number; // e.g. 5, 12, 18, 0
  amount: number; // (quantity * rate)
}

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  ifsc_code: string;
  branch: string;
  upi_id?: string;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
  bank_details: BankDetails;
}

export interface Quotation {
  id: string;
  quotation_number: string; // e.g. QT-20260821-001
  lead_id?: string;
  lead_unique_id?: string;
  customer_name: string;
  company_name?: string;
  mobile_number: string;
  email?: string;
  billing_address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  
  quotation_date: string;
  valid_until_date: string;
  
  items: QuotationItem[];
  
  subtotal: number; // Taxable Amount
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  discount_amount: number;
  taxable_amount: number;
  
  tax_type: TaxType;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_tax: number;
  
  shipping_charges: number;
  round_off: number;
  grand_total: number;
  grand_total_words?: string;
  
  terms_and_conditions: string[];
  notes?: string;
  
  company_profile?: Partial<CompanyProfile>;
  
  status: QuotationStatus;
  whatsapp_status: WhatsAppStatus;
  whatsapp_sent_at?: string | null;
  whatsapp_message_id?: string | null;
  
  created_by_user_id?: string;
  created_by_user_name?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppSendPayload {
  recipient: string; // +919876543210
  message: string;
  type?: 'text' | 'document' | 'image';
  document_url?: string;
  caption?: string;
  priority?: number;
}
