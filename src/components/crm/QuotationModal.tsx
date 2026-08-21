'use client';

import React, { useState, useEffect, useId } from 'react';
import { Lead } from '@/types/crm';
import { Quotation, QuotationItem, TaxType } from '@/types/quotation';
import {
  DEFAULT_COMPANY_PROFILE,
  DEFAULT_TERMS_AND_CONDITIONS,
  POPULAR_FABRIC_PRESETS,
  numberToIndianRupeesWords,
} from '@/lib/quotation-defaults';
import QuotationTemplate from './QuotationTemplate';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Plus,
  Trash2,
  Send,
  Download,
  Printer,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  Building,
  Calendar,
  CreditCard,
  Layers,
  Sparkles,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface QuotationModalProps {
  lead?: Lead | null;
  initialQuotation?: Quotation | null;
  onClose: () => void;
  onSuccess?: (quotation: Quotation) => void;
}

export default function QuotationModal({
  lead,
  initialQuotation,
  onClose,
  onSuccess,
}: QuotationModalProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize Quotation State
  const todayStr = new Date().toISOString().substring(0, 10);
  const validUntilStr = new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const defaultQuoteNo = `QT-${todayStr.replace(/-/g, '')}-${randomSuffix}`;

  const [quotationNumber, setQuotationNumber] = useState(initialQuotation?.quotation_number || defaultQuoteNo);
  const [customerName, setCustomerName] = useState(initialQuotation?.customer_name || lead?.customer_name || '');
  const [companyName, setCompanyName] = useState(initialQuotation?.company_name || lead?.company_name || '');
  const [mobileNumber, setMobileNumber] = useState(initialQuotation?.mobile_number || lead?.mobile_number || '');
  const [email, setEmail] = useState(initialQuotation?.email || lead?.email || '');
  const [city, setCity] = useState(initialQuotation?.city || lead?.city || '');
  const [state, setState] = useState(initialQuotation?.state || lead?.state || 'Gujarat');
  const [billingAddress, setBillingAddress] = useState(initialQuotation?.billing_address || '');
  const [gstin, setGstin] = useState(initialQuotation?.gstin || '');
  
  const [quotationDate, setQuotationDate] = useState(initialQuotation?.quotation_date || todayStr);
  const [validUntilDate, setValidUntilDate] = useState(initialQuotation?.valid_until_date || validUntilStr);

  // Line items
  const initialItems: QuotationItem[] = initialQuotation?.items || [
    {
      id: `item-${Date.now()}-1`,
      name: lead?.client_requirement ? lead.client_requirement.slice(0, 50) : 'Pure Cotton 60s Cambric (Grey/RFD)',
      description: lead?.client_requirement || 'Premium grade fabric for garment and textile processing',
      hsn_code: '5208',
      quantity: 500,
      unit: 'Mtr',
      rate: 85,
      gst_rate: 5,
      amount: 42500,
    },
  ];
  const [items, setItems] = useState<QuotationItem[]>(initialItems);

  // Taxes & Discounts
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>(initialQuotation?.discount_type || 'PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(initialQuotation?.discount_value || 0);
  const [taxType, setTaxType] = useState<TaxType>(initialQuotation?.tax_type || 'CGST_SGST');
  const [shippingCharges, setShippingCharges] = useState<number>(initialQuotation?.shipping_charges || 0);
  const [notes, setNotes] = useState(initialQuotation?.notes || 'Thank you for your business inquiry with Fabric Traders!');
  const [terms, setTerms] = useState<string[]>(initialQuotation?.terms_and_conditions || DEFAULT_TERMS_AND_CONDITIONS);

  // Add Item
  const handleAddItem = (preset?: typeof POPULAR_FABRIC_PRESETS[0]) => {
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      name: preset ? preset.name : '',
      description: '',
      hsn_code: preset ? preset.hsn_code : '5208',
      quantity: 100,
      unit: preset ? preset.defaultUnit : 'Mtr',
      rate: preset ? preset.defaultRate : 100,
      gst_rate: preset ? preset.gst_rate : 5,
      amount: (preset ? preset.defaultRate : 100) * 100,
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof QuotationItem, val: any) => {
    setItems(
      items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === 'quantity' || field === 'rate') {
            const q = field === 'quantity' ? parseFloat(val) || 0 : item.quantity;
            const r = field === 'rate' ? parseFloat(val) || 0 : item.rate;
            updated.amount = q * r;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setFeedback({ type: 'error', message: 'At least one line item is required.' });
      return;
    }
    setItems(items.filter(i => i.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = (subtotal * (Number(discountValue) || 0)) / 100;
  } else {
    discountAmount = Number(discountValue) || 0;
  }
  
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  
  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;
  
  if (taxType === 'CGST_SGST') {
    cgstRate = 2.5;
    sgstRate = 2.5;
    cgstAmount = (taxableAmount * cgstRate) / 100;
    sgstAmount = (taxableAmount * sgstRate) / 100;
  } else if (taxType === 'IGST') {
    igstRate = 5.0;
    igstAmount = (taxableAmount * igstRate) / 100;
  }
  
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const rawGrandTotal = taxableAmount + totalTax + Number(shippingCharges || 0);
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));
  const grandTotalWords = numberToIndianRupeesWords(grandTotal);

  // Build Full Quotation Object
  const currentQuotation: Quotation = {
    id: initialQuotation?.id || `qt-${Date.now()}`,
    quotation_number: quotationNumber,
    lead_id: lead?.id,
    lead_unique_id: lead?.unique_lead_id,
    customer_name: customerName,
    company_name: companyName,
    mobile_number: mobileNumber,
    email,
    billing_address: billingAddress,
    city,
    state,
    gstin,
    quotation_date: quotationDate,
    valid_until_date: validUntilDate,
    items,
    subtotal,
    discount_type: discountType,
    discount_value: discountValue,
    discount_amount: discountAmount,
    taxable_amount: taxableAmount,
    tax_type: taxType,
    cgst_rate: cgstRate,
    cgst_amount: cgstAmount,
    sgst_rate: sgstRate,
    sgst_amount: sgstAmount,
    igst_rate: igstRate,
    igst_amount: igstAmount,
    total_tax: totalTax,
    shipping_charges: Number(shippingCharges) || 0,
    round_off: roundOff,
    grand_total: grandTotal,
    grand_total_words: grandTotalWords,
    terms_and_conditions: terms,
    notes,
    company_profile: DEFAULT_COMPANY_PROFILE,
    status: 'SENT',
    whatsapp_status: 'PENDING',
    created_by_user_id: currentUser?.id,
    created_by_user_name: currentUser?.full_name || 'Fabric Traders Sales Team',
    created_at: initialQuotation?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Generate Structured WhatsApp Message text
  const generateWhatsAppMessage = () => {
    let msg = `*FABRIC TRADERS - PROFORMA QUOTATION*\n`;
    msg += `------------------------------------\n`;
    msg += `📄 *Quote No:* ${currentQuotation.quotation_number}\n`;
    msg += `📅 *Date:* ${currentQuotation.quotation_date}\n`;
    msg += `⏳ *Valid Until:* ${currentQuotation.valid_until_date}\n\n`;
    msg += `👤 *Customer:* ${currentQuotation.customer_name}${currentQuotation.company_name ? ` (${currentQuotation.company_name})` : ''}\n`;
    msg += `📱 *Phone:* ${currentQuotation.mobile_number}\n`;
    if (currentQuotation.city) msg += `📍 *City:* ${currentQuotation.city}\n`;
    msg += `\n*ITEMS & SPECIFICATIONS:*\n`;
    
    currentQuotation.items.forEach((item, index) => {
      msg += `${index + 1}. *${item.name}*\n`;
      msg += `   Qty: ${item.quantity} ${item.unit} @ ₹${item.rate}/${item.unit} = ₹${item.amount.toLocaleString('en-IN')}\n`;
    });

    msg += `\n------------------------------------\n`;
    msg += `*Subtotal:* ₹${currentQuotation.subtotal.toLocaleString('en-IN')}\n`;
    if (currentQuotation.discount_amount > 0) {
      msg += `*Discount:* -₹${currentQuotation.discount_amount.toLocaleString('en-IN')}\n`;
    }
    if (currentQuotation.tax_type === 'CGST_SGST') {
      msg += `*GST (CGST+SGST 5%):* ₹${currentQuotation.total_tax.toLocaleString('en-IN')}\n`;
    } else if (currentQuotation.tax_type === 'IGST') {
      msg += `*GST (IGST 5%):* ₹${currentQuotation.total_tax.toLocaleString('en-IN')}\n`;
    }
    if (currentQuotation.shipping_charges > 0) {
      msg += `*Freight:* ₹${currentQuotation.shipping_charges.toLocaleString('en-IN')}\n`;
    }
    msg += `\n💰 *GRAND TOTAL: ₹${currentQuotation.grand_total.toLocaleString('en-IN')}*\n`;
    msg += `_${currentQuotation.grand_total_words}_\n\n`;

    msg += `*BANK DETAILS FOR ADVANCE:*\n`;
    msg += `🏦 *Bank:* ${DEFAULT_COMPANY_PROFILE.bank_details.bank_name}\n`;
    msg += `👤 *A/C Name:* ${DEFAULT_COMPANY_PROFILE.bank_details.account_name}\n`;
    msg += `🔢 *A/C No:* ${DEFAULT_COMPANY_PROFILE.bank_details.account_number}\n`;
    msg += `🏛️ *IFSC:* ${DEFAULT_COMPANY_PROFILE.bank_details.ifsc_code}\n`;
    if (DEFAULT_COMPANY_PROFILE.bank_details.upi_id) {
      msg += `📲 *UPI:* ${DEFAULT_COMPANY_PROFILE.bank_details.upi_id}\n`;
    }

    msg += `\n📞 *Contact Sales:* ${DEFAULT_COMPANY_PROFILE.phone}\n`;
    msg += `🏢 *Fabric Traders, Surat, Gujarat*`;
    return msg;
  };

  // Save Quotation to Supabase
  const saveQuotationToDatabase = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentQuotation),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save quotation.');
      }
      return data.quotation || currentQuotation;
    } catch (err: any) {
      console.error('Error saving quotation:', err);
      return currentQuotation;
    } finally {
      setIsSaving(false);
    }
  };

  // Send WhatsApp via Whatsify API
  const handleSendWhatsify = async () => {
    if (!mobileNumber.trim()) {
      setFeedback({ type: 'error', message: 'Customer Mobile Number is required for WhatsApp.' });
      return;
    }

    setIsSendingWhatsApp(true);
    setFeedback(null);

    try {
      // 1. Save quotation first
      const saved = await saveQuotationToDatabase();

      // 2. Send via Whatsify API
      const whatsappMsg = generateWhatsAppMessage();
      const res = await fetch('/api/v1/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: mobileNumber,
          message: whatsappMsg,
          lead_id: lead?.id,
          quotation_id: saved.id || quotationNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to send WhatsApp message via Whatsify.');
      }

      setFeedback({
        type: 'success',
        message: `✅ Quotation ${quotationNumber} sent successfully to ${mobileNumber} via Whatsify WhatsApp!`,
      });

      if (onSuccess) {
        onSuccess({ ...saved, whatsapp_status: 'SENT' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `WhatsApp API Error: ${err.message}. You can also use the direct 'Open WhatsApp' button below.`,
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Open Direct WhatsApp Web Chat
  const handleOpenWhatsAppWeb = () => {
    const cleanDigits = mobileNumber.replace(/\D/g, '');
    const phoneWith91 = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const msgEncoded = encodeURIComponent(generateWhatsAppMessage());
    const waUrl = `https://wa.me/${phoneWith91}?text=${msgEncoded}`;
    window.open(waUrl, '_blank');
  };

  // Direct Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#1e0a38] via-[#280c4a] to-[#140426] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-purple-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-md">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center">
                FABRIC QUOTATION &amp; PROFORMA INVOICE
                <span className="ml-2 text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Whatsify Connected
                </span>
              </h2>
              <p className="text-[11px] text-purple-200">
                {lead ? `For Lead: ${lead.customer_name} (${lead.unique_lead_id})` : 'Create Custom Quotation'}
              </p>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center space-x-1 bg-purple-950/80 p-1 rounded-xl border border-purple-800/60 text-xs">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center ${
                activeTab === 'edit'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> 1. Quotation Form
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center ${
                activeTab === 'preview'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" /> 2. Branded PDF Template
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`px-6 py-3 text-xs font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          
          {activeTab === 'edit' ? (
            <div className="space-y-6">
              
              {/* 1. CUSTOMER & QUOTE META ROW */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                  <Building className="w-4 h-4 mr-1.5 text-purple-700" /> Buyer / Customer Information &amp; Validity
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer / Client Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp / Mobile *</label>
                    <input
                      type="text"
                      required
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-semibold focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Firm Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Goyal Fabrics Ltd"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City / State</label>
                    <input
                      type="text"
                      placeholder="e.g. Surat, Gujarat"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quotation Number</label>
                    <input
                      type="text"
                      value={quotationNumber}
                      onChange={e => setQuotationNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-purple-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quote Date</label>
                    <input
                      type="date"
                      value={quotationDate}
                      onChange={e => setQuotationDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Valid Until Date</label>
                    <input
                      type="date"
                      value={validUntilDate}
                      onChange={e => setValidUntilDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-purple-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Buyer GSTIN (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 24AAAAA0000A1Z5"
                      value={gstin}
                      onChange={e => setGstin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* 2. FAST FABRIC PRESETS BAR */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" /> Quick Add Fabric Presets (1-Click):
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_FABRIC_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddItem(p)}
                      className="text-[11px] font-bold bg-white text-purple-900 hover:bg-purple-700 hover:text-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-sm transition flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" /> {p.name} (₹{p.defaultRate}/{p.defaultUnit})
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. DYNAMIC LINE ITEMS BUILDER */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center">
                    <Layers className="w-4 h-4 mr-1.5 text-purple-700" /> Quotation Line Items ({items.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Custom Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase">
                        <th className="py-2.5 px-3">Fabric / Item Name</th>
                        <th className="py-2.5 px-3 w-20">HSN</th>
                        <th className="py-2.5 px-3 w-24">Quantity</th>
                        <th className="py-2.5 px-3 w-20">Unit</th>
                        <th className="py-2.5 px-3 w-24">Rate (₹)</th>
                        <th className="py-2.5 px-3 w-20">GST %</th>
                        <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-2 w-10 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Pure Cotton 60s Cambric"
                              value={item.name}
                              onChange={e => handleUpdateItem(item.id, 'name', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-semibold text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Optional description/specifications..."
                              value={item.description || ''}
                              onChange={e => handleUpdateItem(item.id, 'description', e.target.value)}
                              className="w-full bg-transparent text-[11px] text-slate-500 placeholder-slate-400 p-0.5 mt-1 border-none focus:ring-0"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={item.hsn_code || '5208'}
                              onChange={e => handleUpdateItem(item.id, 'hsn_code', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-xs text-center"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleUpdateItem(item.id, 'quantity', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={item.unit}
                              onChange={e => handleUpdateItem(item.id, 'unit', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-semibold"
                            >
                              <option value="Mtr">Mtr</option>
                              <option value="Kg">Kg</option>
                              <option value="Pcs">Pcs</option>
                              <option value="Roll">Roll</option>
                              <option value="Than">Than</option>
                              <option value="Unit">Unit</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={e => handleUpdateItem(item.id, 'rate', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono font-bold text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={item.gst_rate}
                              onChange={e => handleUpdateItem(item.id, 'gst_rate', Number(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-mono text-center"
                            >
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="0">0%</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-purple-950">
                            ₹{(Number(item.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. TOTALS & TAX ENGINE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Notes & Terms */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <h4 className="font-black text-slate-900 uppercase tracking-wider">
                    Notes &amp; Custom Instructions
                  </h4>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add special notes for client..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
                  />
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Standard Terms &amp; Conditions (Editable):</label>
                    <textarea
                      rows={4}
                      value={terms.join('\n')}
                      onChange={e => setTerms(e.target.value.split('\n').filter(Boolean))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-[11px] font-mono leading-relaxed"
                    />
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <h4 className="font-black text-slate-900 uppercase tracking-wider">
                    Commercials &amp; Tax Calculation
                  </h4>

                  <div className="space-y-2.5">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Subtotal (Gross Item Amount):</span>
                      <span className="font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Discount */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <span className="font-semibold text-slate-700">Discount:</span>
                      <select
                        value={discountType}
                        onChange={e => setDiscountType(e.target.value as any)}
                        className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-semibold"
                      >
                        <option value="PERCENTAGE">% Percentage</option>
                        <option value="FIXED">₹ Flat Amount</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-right"
                      />
                    </div>

                    {/* Tax Type */}
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <span className="font-semibold text-slate-700">GST Tax Option:</span>
                      <select
                        value={taxType}
                        onChange={e => setTaxType(e.target.value as any)}
                        className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-bold text-purple-900"
                      >
                        <option value="CGST_SGST">CGST (2.5%) + SGST (2.5%) = 5%</option>
                        <option value="IGST">IGST (5% Interstate)</option>
                        <option value="NONE">No GST (0%)</option>
                      </select>
                    </div>

                    {/* Freight */}
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <span className="font-semibold text-slate-700">Freight / Shipping (₹):</span>
                      <input
                        type="number"
                        min="0"
                        value={shippingCharges}
                        onChange={e => setShippingCharges(parseFloat(e.target.value) || 0)}
                        className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-right"
                      />
                    </div>

                    {/* GRAND TOTAL ROW */}
                    <div className="pt-3 border-t-2 border-purple-900/20 flex justify-between items-center bg-purple-50 p-3 rounded-xl">
                      <div>
                        <p className="font-black text-purple-950 text-xs">GRAND TOTAL (INR):</p>
                        <p className="text-[10px] text-purple-700 font-semibold">{grandTotalWords}</p>
                      </div>
                      <span className="font-mono text-xl font-black text-purple-950">
                        ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / Save as PDF
                </button>
              </div>
              
              {/* PRINTABLE TEMPLATE RENDER */}
              <QuotationTemplate quotation={currentQuotation} />
            </div>
          )}

        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Whatsify WhatsApp Gateway Active</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsAppWeb}
              className="bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3.5 py-2.5 rounded-xl flex items-center shadow-sm transition"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open WhatsApp Web
            </button>

            <button
              type="button"
              onClick={handleSendWhatsify}
              disabled={isSendingWhatsApp || isSaving}
              className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center shadow-lg shadow-emerald-700/30 transition transform active:scale-95 disabled:opacity-50"
            >
              {isSendingWhatsApp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  SENDING VIA WHATSIFY...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  SEND ON WHATSAPP (WHATSIFY API)
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
