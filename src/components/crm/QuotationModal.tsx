'use client';

import React, { useState, useMemo } from 'react';
import { QuotationItem } from '@/types/quotation';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  FileText,
  Printer,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Building,
  User,
  Phone,
  MapPin,
  DollarSign,
} from 'lucide-react';

import { Lead, Quotation } from '@/types/crm';

interface QuotationModalProps {
  lead?: Lead | null;
  initialQuotation?: Quotation | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuotationModal({ lead, initialQuotation, onClose, onSuccess }: QuotationModalProps) {
  const { currentUser } = useAuth();

  // Quotation Metadata
  const todayStr = new Date().toISOString().substring(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  
  const generatedQuoteNumber = useMemo(() => {
    const dStr = todayStr.replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `QT-${dStr}-${rand}`;
  }, []);

  const quoteNumber = initialQuotation?.quotation_number || generatedQuoteNumber;

  const [customerName, setCustomerName] = useState(initialQuotation?.customer_name || lead?.customer_name || '');
  const [companyName, setCompanyName] = useState(initialQuotation?.company_name || lead?.company_name || '');
  const [mobileNumber, setMobileNumber] = useState(initialQuotation?.mobile_number || lead?.mobile_number || '');
  const [city, setCity] = useState(initialQuotation?.city || lead?.city || 'Surat');
  const [quotationDate, setQuotationDate] = useState(initialQuotation?.quotation_date || todayStr);
  const [validUntil, setValidUntil] = useState(initialQuotation?.valid_until_date || nextWeek);
  const [taxType, setTaxType] = useState<'CGST_SGST' | 'IGST'>(
    initialQuotation?.tax_type === 'IGST' ? 'IGST' : 'CGST_SGST'
  );

  // Items List
  const [items, setItems] = useState<QuotationItem[]>(
    initialQuotation?.items && initialQuotation.items.length > 0
      ? initialQuotation.items
      : [
          {
            id: 'item-1',
            name: lead?.client_requirement || '100% Cotton 60x60 Cambric Fabric',
            hsn_code: '5208',
            quantity: 500,
            unit: 'Mtr',
            rate: 85,
            gst_rate: 5,
            amount: 42500,
          },
        ]
  );

  // Terms & Conditions
  const [terms, setTerms] = useState<string[]>([
    'Payment Terms: 30% Advance along with Order Confirmation, balance before dispatch.',
    'Delivery: Dispatch within 3-5 working days from our Surat warehouse.',
    'Freight / Transport: Extra at actuals on TO-PAY basis.',
    'GST: Rates mentioned are subject to applicable GST taxes.',
    'Quotation Validity: Valid for 7 days from the date of issuance.',
  ]);

  const [notes, setNotes] = useState('Thank you for your inquiry. Quality sample swatches can be dispatched on request.');

  // WhatsApp Sending & Save States
  const [isSaving, setIsSaving] = useState(false);
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppSuccessMsg, setWhatsAppSuccessMsg] = useState('');
  const [whatsAppErrorMsg, setWhatsAppErrorMsg] = useState('');
  const [activeView, setActiveView] = useState<'EDIT' | 'PREVIEW'>('EDIT');

  // Calculate Totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate) || 0), 0);
  }, [items]);

  const totalGst = useMemo(() => {
    return items.reduce((sum, item) => {
      const itemTotal = Number(item.quantity) * Number(item.rate) || 0;
      return sum + (itemTotal * (Number(item.gst_rate) / 100) || 0);
    }, 0);
  }, [items]);

  const grandTotal = Math.round(subtotal + totalGst);

  // Number to Indian Words Helper
  const inWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString() as any).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
    str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
    str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
    str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
    str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) + 'Only ' : 'Only';
    return 'Rupees ' + str;
  };

  // Item List handlers
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        name: '',
        hsn_code: '5208',
        quantity: 100,
        unit: 'Mtr',
        rate: 50,
        gst_rate: 5,
        amount: 5000,
      },
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof QuotationItem, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'rate') {
      const q = field === 'quantity' ? Number(val) : updated[index].quantity;
      const r = field === 'rate' ? Number(val) : updated[index].rate;
      updated[index].amount = (q || 0) * (r || 0);
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Generate WhatsApp Message Text
  // Generate Clean WhatsApp Message Text (PDF Attached Directly)
  const formatWhatsAppMessage = (): string => {
    const itemListText = items
      .map((item, idx) => `*${idx + 1}. ${item.name}*\n   Qty: ${item.quantity} ${item.unit} @ ₹${item.rate}/${item.unit} (+${item.gst_rate}% GST) = *₹${item.amount.toLocaleString('en-IN')}*`)
      .join('\n\n');

    return `*PRICE QUOTATION: ${quoteNumber}*\n*FABRIC TRADERS TEXTILES (SURAT)*\n━━━━━━━━━━━━━━━━━━━━━\n👤 *Dear ${customerName}${companyName ? ' (' + companyName + ')' : ''},*\nThank you for your inquiry. Please find attached our official price quotation PDF.\n\n📋 *ITEMS & RATES:*\n${itemListText}\n\n━━━━━━━━━━━━━━━━━━━━━\n💵 *Taxable Subtotal:* ₹${subtotal.toLocaleString('en-IN')}\n📊 *GST Tax:* ₹${totalGst.toLocaleString('en-IN')}\n💰 *GRAND TOTAL:* *₹${grandTotal.toLocaleString('en-IN')}*\n_(${inWords(grandTotal)})_\n━━━━━━━━━━━━━━━━━━━━━\n\n📌 *Terms & Delivery:*\n• Dispatch in 3-5 days from Surat Warehouse\n• Payment: 30% Advance, balance before dispatch\n• Valid until: ${validUntil}\n\n📞 *Representative:* ${currentUser?.full_name || 'Rajesh Sharma'} (+91 9876543210)\n🌐 *FabricTraders CRM* | Ring Road Market, Surat`;
  };

  // 1. Save Quotation to Supabase Database
  const handleSaveQuotation = async () => {
    if (!customerName.trim()) {
      alert('Please enter Customer Name');
      return;
    }
    if (!mobileNumber.trim()) {
      alert('Please enter WhatsApp Mobile Number');
      return;
    }

    setIsSaving(true);
    setWhatsAppErrorMsg('');
    setWhatsAppSuccessMsg('');

    try {
      const res = await fetch('/api/v1/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotation_number: quoteNumber,
          lead_id: lead?.id,
          lead_unique_id: lead?.unique_lead_id,
          customer_name: customerName.trim(),
          company_name: companyName.trim(),
          mobile_number: mobileNumber.trim(),
          city: city.trim(),
          quotation_date: quotationDate,
          valid_until_date: validUntil,
          items: items,
          subtotal: subtotal,
          tax_type: taxType,
          total_tax: totalGst,
          grand_total: grandTotal,
          grand_total_words: inWords(grandTotal),
          terms_and_conditions: terms,
          notes: notes,
          status: 'SAVED',
          whatsapp_status: 'PENDING',
          created_by_user_id: currentUser?.id,
          created_by_user_name: currentUser?.full_name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save quotation to database.');
      }

      // Show confirmation prompt: "Do you want to send on WhatsApp?"
      setShowWhatsAppPrompt(true);
    } catch (err: any) {
      setWhatsAppErrorMsg(err.message || 'Quotation saving failed. Please check network.');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Confirmed: Send WhatsApp via Whatsify API
  const handleConfirmSendWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    setWhatsAppErrorMsg('');
    setWhatsAppSuccessMsg('');

    try {
      const message = formatWhatsAppMessage();
      const firstItem = items[0] || { name: 'Fabric Order', quantity: 100, unit: 'Mtr', rate: 50, gst_rate: 5, amount: 5000 };
      const directPdfDownloadUrl = `https://lead-calling-crm.vercel.app/api/v1/quotations/pdf?quote=${quoteNumber}&name=${encodeURIComponent(customerName)}&company=${encodeURIComponent(companyName)}&mobile=${encodeURIComponent(mobileNumber)}&city=${encodeURIComponent(city)}&item=${encodeURIComponent(firstItem.name)}&qty=${encodeURIComponent(firstItem.quantity + ' ' + firstItem.unit)}&rate=${firstItem.rate}&total=${grandTotal.toLocaleString('en-IN')}&rep=${encodeURIComponent(currentUser?.full_name || 'Rajesh Sharma')}`;

      const res = await fetch('/api/v1/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: mobileNumber,
          message: message,
          type: 'document',
          document_url: directPdfDownloadUrl,
          url: directPdfDownloadUrl,
          document_name: `Quotation-${quoteNumber}.pdf`,
          filename: `Quotation-${quoteNumber}.pdf`,
          priority: 1,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send WhatsApp message via Whatsify API.');
      }

      setWhatsAppSuccessMsg(`Quotation sent to WhatsApp (${data.recipient}) successfully! 🎉`);
      setTimeout(() => {
        setShowWhatsAppPrompt(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setWhatsAppErrorMsg(err.message || 'WhatsApp sending failed. Please check number.');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // 3. Denied: Skip WhatsApp, just keep saved in CRM
  const handleSkipWhatsApp = () => {
    setShowWhatsAppPrompt(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  // Direct WhatsApp Web fallback
  const handleOpenWhatsAppWeb = () => {
    const message = encodeURIComponent(formatWhatsAppMessage());
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCode}?text=${message}`, '_blank');
  };

  // Print PDF Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Quotation Dialog Container */}
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-purple-900/30">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#1e0a38] via-[#280c4a] to-[#140426] text-white px-6 py-4 flex items-center justify-between border-b border-purple-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white">GENERATE QUOTATION &amp; WHATSAPP</h2>
                <span className="bg-purple-500/30 text-purple-300 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-400/30">
                  {quoteNumber}
                </span>
              </div>
              <p className="text-[11px] text-purple-200 mt-0.5">
                Client: <strong>{customerName}</strong> {lead?.unique_lead_id ? `(${lead.unique_lead_id})` : ''}
              </p>
            </div>
          </div>

          {/* Toggle Edit / Preview & Close */}
          <div className="flex items-center space-x-2">
            <div className="bg-purple-950/80 p-1 rounded-xl border border-purple-800/60 flex text-xs font-bold">
              <button
                onClick={() => setActiveView('EDIT')}
                className={`px-3 py-1 rounded-lg transition ${activeView === 'EDIT' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'}`}
              >
                Edit Form
              </button>
              <button
                onClick={() => setActiveView('PREVIEW')}
                className={`px-3 py-1 rounded-lg transition ${activeView === 'PREVIEW' ? 'bg-purple-600 text-white shadow' : 'text-purple-300 hover:text-white'}`}
              >
                PDF Template Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-purple-300 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* WhatsApp Notification Alerts */}
        {whatsAppSuccessMsg && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{whatsAppSuccessMsg}</span>
            </div>
            <button onClick={() => setWhatsAppSuccessMsg('')} className="text-emerald-600 hover:underline">Dismiss</button>
          </div>
        )}

        {whatsAppErrorMsg && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{whatsAppErrorMsg}</span>
            </div>
            <button onClick={() => setWhatsAppErrorMsg('')} className="text-rose-600 hover:underline">Dismiss</button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 print:bg-white print:p-0">
          
          {/* ================= VIEW 1: EDIT FORM ================= */}
          {activeView === 'EDIT' && (
            <div className="space-y-5">
              
              {/* Customer & Quote Information Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
                  <User className="w-4 h-4 mr-1.5 text-purple-700" /> Customer &amp; Quotation Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Customer / Client Name *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Firm Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Ramesh Textiles"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp Mobile Number *</label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={e => setMobileNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City / Location</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quotation Date</label>
                    <input
                      type="date"
                      value={quotationDate}
                      onChange={e => setQuotationDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Valid Until Date</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GST Tax Format</label>
                    <select
                      value={taxType}
                      onChange={e => setTaxType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-purple-800"
                    >
                      <option value="CGST_SGST">Intra-State (CGST + SGST)</option>
                      <option value="IGST">Inter-State (IGST)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items & Pricing Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center">
                    <DollarSign className="w-4 h-4 mr-1.5 text-purple-700" /> Quotation Fabric Items &amp; Pricing
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center transition border border-purple-200"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> + Add Another Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3 w-2/5">Item / Fabric Description</th>
                        <th className="py-2.5 px-3">HSN</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Rate (₹)</th>
                        <th className="py-2.5 px-3">GST %</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Cotton Cambric 60x60"
                              value={item.name}
                              onChange={e => handleUpdateItem(idx, 'name', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-semibold text-slate-900"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.hsn_code}
                              onChange={e => handleUpdateItem(idx, 'hsn_code', e.target.value)}
                              className="w-16 bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-center"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                              className="w-20 bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold text-center"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.unit}
                              onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold"
                            >
                              <option value="Mtr">Mtr</option>
                              <option value="Kg">Kg</option>
                              <option value="Pcs">Pcs</option>
                              <option value="Roll">Roll</option>
                              <option value="Than">Than</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.rate}
                              onChange={e => handleUpdateItem(idx, 'rate', e.target.value)}
                              className="w-20 bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold text-right text-emerald-700"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={item.gst_rate}
                              onChange={e => handleUpdateItem(idx, 'gst_rate', e.target.value)}
                              className="bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-bold"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900 font-mono">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary Box */}
                <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-xs text-purple-900 font-medium">
                    <p className="font-bold">Amount in Words:</p>
                    <p className="italic">{inWords(grandTotal)}</p>
                  </div>
                  <div className="space-y-1.5 text-xs text-right min-w-[200px]">
                    <div className="flex justify-between text-slate-600 font-semibold">
                      <span>Subtotal (Taxable):</span>
                      <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-purple-700 font-semibold">
                      <span>GST Amount:</span>
                      <span className="font-mono">+ ₹{totalGst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-purple-950 pt-1.5 border-t border-purple-200">
                      <span>Grand Total:</span>
                      <span className="font-mono text-base text-emerald-700">₹{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Notes Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Remarks &amp; Notes
                </h3>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
                />
              </div>

            </div>
          )}

          {/* ================= VIEW 2: BRANDED PRINTABLE PDF TEMPLATE ================= */}
          {activeView === 'PREVIEW' && (
            <div id="quotation-print-area" className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md text-slate-900 space-y-6 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0">
              
              {/* Template Top Header */}
              <div className="flex justify-between items-start border-b-2 border-[#250a42] pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-[#250a42] text-white font-black flex items-center justify-center text-base">
                      F
                    </div>
                    <h1 className="text-xl font-black text-[#250a42] tracking-tight">FabricTraders</h1>
                  </div>
                  <p className="text-xs font-bold text-slate-600 mt-1">Textile Mills &amp; Premium Fabric Wholesaler</p>
                  <p className="text-[11px] text-slate-500">Ring Road Textile Market, Surat, Gujarat - 395002</p>
                  <p className="text-[11px] text-slate-500 font-mono">GSTIN: 24AABCF1234F1Z9 | Phone: +91 98765 43210</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="bg-[#250a42] text-white text-xs font-black px-3 py-1 rounded-md uppercase tracking-wider">
                    PRICE QUOTATION
                  </span>
                  <p className="text-xs font-bold font-mono text-[#250a42] pt-2">{quoteNumber}</p>
                  <p className="text-[11px] text-slate-600">Date: <strong>{quotationDate}</strong></p>
                  <p className="text-[11px] text-slate-600">Valid Until: <strong>{validUntil}</strong></p>
                </div>
              </div>

              {/* Bill To Customer Card */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">QUOTATION PREPARED FOR:</p>
                  <p className="font-extrabold text-sm text-slate-900 mt-1">{customerName}</p>
                  {companyName && <p className="font-bold text-purple-900">{companyName}</p>}
                  <p className="text-slate-600 font-mono mt-0.5">{mobileNumber}</p>
                  <p className="text-slate-600">{city}, India</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">REPRESENTATIVE / CALLER:</p>
                  <p className="font-bold text-slate-900 mt-1">{currentUser?.full_name || 'Rajesh Sharma'}</p>
                  <p className="text-slate-600">{currentUser?.email || 'sales@fabrictraders.com'}</p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">Verified Supplier Direct Rate</p>
                </div>
              </div>

              {/* Items Table in PDF */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase">
                      <th className="py-2.5 px-3 border border-purple-900">#</th>
                      <th className="py-2.5 px-3 border border-purple-900">Item Description</th>
                      <th className="py-2.5 px-3 border border-purple-900 text-center">HSN</th>
                      <th className="py-2.5 px-3 border border-purple-900 text-center">Quantity</th>
                      <th className="py-2.5 px-3 border border-purple-900 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-3 border border-purple-900 text-center">GST</th>
                      <th className="py-2.5 px-3 border border-purple-900 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 border border-slate-200 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-900">{item.name}</td>
                        <td className="py-2.5 px-3 border border-slate-200 text-center font-mono">{item.hsn_code}</td>
                        <td className="py-2.5 px-3 border border-slate-200 text-center font-bold">{item.quantity} {item.unit}</td>
                        <td className="py-2.5 px-3 border border-slate-200 text-right font-mono">₹{Number(item.rate).toFixed(2)}</td>
                        <td className="py-2.5 px-3 border border-slate-200 text-center">{item.gst_rate}%</td>
                        <td className="py-2.5 px-3 border border-slate-200 text-right font-black font-mono">₹{item.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-between items-start pt-2">
                <div className="max-w-md text-xs space-y-1">
                  <p className="font-bold text-slate-800">Amount In Words:</p>
                  <p className="text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">
                    {inWords(grandTotal)}
                  </p>
                </div>
                <div className="w-64 space-y-1 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST Tax ({taxType === 'CGST_SGST' ? 'CGST+SGST' : 'IGST'}):</span>
                    <span className="font-mono font-bold">+ ₹{totalGst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#250a42] pt-2 border-t-2 border-[#250a42]">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-emerald-700">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Box */}
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800 uppercase">Standard Terms &amp; Conditions:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {terms.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>

              {/* Signatory Footer */}
              <div className="pt-6 flex justify-between items-end text-xs text-slate-600">
                <div>
                  <p className="font-bold text-slate-800">Bank Details for RTGS / NEFT:</p>
                  <p className="font-mono text-[11px]">A/C: FabricTraders Textiles | HDFC Bank</p>
                  <p className="font-mono text-[11px]">A/C No: 50200012345678 | IFSC: HDFC0001234</p>
                </div>
                <div className="text-center">
                  <div className="w-36 h-12 border-b border-slate-400 mb-1"></div>
                  <p className="font-bold text-slate-900">For FabricTraders</p>
                  <p className="text-[10px] text-slate-500">Authorized Signatory</p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Action Footer Bar */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          
          {/* WhatsApp Direct Fallback Link */}
          <button
            type="button"
            onClick={handleOpenWhatsAppWeb}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Open in WhatsApp Web &rarr;</span>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center shadow-sm transition"
            >
              <Printer className="w-4 h-4 mr-1.5 text-slate-600" /> Print / Save PDF
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveQuotation}
              className="bg-purple-900 hover:bg-purple-950 text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center shadow-md transition transform active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Quotation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" />
                  Save Quotation (सेव करें)
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Interactive WhatsApp Confirmation Dialog (After Saving) */}
      {showWhatsAppPrompt && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Quotation Saved Successfully! 💾</h3>
              <p className="text-xs text-slate-600">
                Quotation <strong className="text-purple-950 font-mono font-bold">{quoteNumber}</strong> for <strong>{customerName}</strong> has been saved.
              </p>
            </div>

            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200/80 text-xs text-left space-y-1">
              <p className="text-[11px] text-purple-900 font-bold uppercase tracking-wider">Send on WhatsApp?</p>
              <p className="text-slate-700 font-medium">
                Do you want to send this official PDF Quotation to <strong className="text-slate-900">{mobileNumber}</strong> on WhatsApp now?
              </p>
            </div>

            {whatsAppErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
                {whatsAppErrorMsg}
              </div>
            )}

            {whatsAppSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl text-center">
                {whatsAppSuccessMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkipWhatsApp}
                disabled={isSendingWhatsApp}
                className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition disabled:opacity-50"
              >
                NO, JUST SAVE (नहीं)
              </button>

              <button
                type="button"
                disabled={isSendingWhatsApp}
                onClick={handleConfirmSendWhatsApp}
                className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-lg transition transform active:scale-95 disabled:opacity-50"
              >
                {isSendingWhatsApp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1.5" />
                    YES, SEND (हाँ भेजें)
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
