'use client';

import React from 'react';
import { Quotation } from '@/types/quotation';
import { DEFAULT_COMPANY_PROFILE, numberToIndianRupeesWords } from '@/lib/quotation-defaults';
import { Building, Phone, Mail, Globe, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';

interface QuotationTemplateProps {
  quotation: Quotation;
  id?: string;
}

export default function QuotationTemplate({ quotation, id = 'quotation-printable-area' }: QuotationTemplateProps) {
  const company = quotation.company_profile ? { ...DEFAULT_COMPANY_PROFILE, ...quotation.company_profile } : DEFAULT_COMPANY_PROFILE;
  const bank = company.bank_details || DEFAULT_COMPANY_PROFILE.bank_details;

  return (
    <div
      id={id}
      className="bg-white text-slate-900 font-sans p-8 sm:p-10 max-w-4xl mx-auto shadow-sm border border-slate-200 rounded-2xl print:p-0 print:border-none print:shadow-none print:max-w-none print:rounded-none"
      style={{ minHeight: '1050px' }}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-purple-900/20 pb-6 gap-6">
        
        {/* Company Identity */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-800 via-indigo-700 to-pink-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              F
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-purple-950 uppercase flex items-center">
                {company.name}
                <span className="ml-2 text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Textiles &amp; Wholesale
                </span>
              </h1>
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 italic">{company.tagline}</p>
          
          <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
            <p>{company.address_line1}, {company.address_line2}</p>
            <p>{company.city} - {company.pincode}, {company.state}, India</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 font-medium text-slate-700">
              <span className="flex items-center"><Phone className="w-3 h-3 mr-1 text-purple-700" /> {company.phone}</span>
              <span className="flex items-center"><Mail className="w-3 h-3 mr-1 text-purple-700" /> {company.email}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 pt-0.5 text-[11px] font-mono text-purple-900 font-bold">
              <span>GSTIN: {company.gstin}</span>
              <span>PAN: {company.pan}</span>
            </div>
          </div>
        </div>

        {/* Quotation Details Box */}
        <div className="sm:text-right bg-gradient-to-br from-purple-50 to-indigo-50/50 p-4 rounded-xl border border-purple-200/60 min-w-[240px]">
          <div className="inline-block bg-purple-900 text-white px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest mb-2 shadow-sm">
            PROFORMA QUOTATION
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-mono text-purple-950 font-black text-sm">
              Ref No: <span className="text-purple-700">{quotation.quotation_number}</span>
            </p>
            <p className="text-slate-600 font-medium">
              Quote Date: <strong className="text-slate-900 font-mono">{quotation.quotation_date}</strong>
            </p>
            <p className="text-slate-600 font-medium">
              Valid Until: <strong className="text-purple-800 font-mono">{quotation.valid_until_date}</strong>
            </p>
            {quotation.lead_unique_id && (
              <p className="text-[11px] text-slate-500 font-mono">
                Lead ID: {quotation.lead_unique_id}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* BILL TO / CUSTOMER INFO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200 text-xs">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
          <p className="font-black text-purple-950 uppercase tracking-wider text-[10px] flex items-center">
            <Building className="w-3.5 h-3.5 mr-1 text-purple-700" /> QUOTATION PREPARED FOR (BUYER):
          </p>
          <p className="font-black text-slate-900 text-sm">{quotation.customer_name}</p>
          {quotation.company_name && (
            <p className="font-bold text-slate-700 text-xs">{quotation.company_name}</p>
          )}
          <p className="font-mono font-semibold text-slate-700 flex items-center pt-0.5">
            <Phone className="w-3 h-3 mr-1 text-slate-400" /> {quotation.mobile_number}
          </p>
          {quotation.email && (
            <p className="text-slate-600 flex items-center">
              <Mail className="w-3 h-3 mr-1 text-slate-400" /> {quotation.email}
            </p>
          )}
          {(quotation.billing_address || quotation.city) && (
            <p className="text-slate-600 pt-0.5">
              {quotation.billing_address ? `${quotation.billing_address}, ` : ''}{quotation.city || ''} {quotation.state ? `, ${quotation.state}` : ''}
            </p>
          )}
          {quotation.gstin && (
            <p className="font-mono text-[11px] font-bold text-purple-900 pt-0.5">
              Buyer GSTIN: {quotation.gstin}
            </p>
          )}
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
          <p className="font-black text-purple-950 uppercase tracking-wider text-[10px] flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-700" /> ORDER / COMMERCIAL TERMS:
          </p>
          <div className="space-y-1 text-slate-700 text-[11px] pt-0.5">
            <p><strong>Payment Terms:</strong> 50% Advance with Order Confirmation</p>
            <p><strong>Dispatch Location:</strong> Surat Textile Hub, Gujarat</p>
            <p><strong>Delivery Timeframe:</strong> Ready Stock: 2-3 Days | Fresh Dye: 7-10 Days</p>
            <p><strong>Transport / Freight:</strong> To-Pay (Borne by Consignee/Buyer)</p>
            <p><strong>Sales Representative:</strong> {quotation.created_by_user_name || 'Fabric Traders Sales Team'}</p>
          </div>
        </div>
      </div>

      {/* LINE ITEMS TABLE */}
      <div className="py-5">
        <div className="overflow-x-auto rounded-xl border border-purple-900/20 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e0a38] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Item / Fabric Description</th>
                <th className="py-3 px-3 w-20 text-center">HSN</th>
                <th className="py-3 px-3 w-24 text-right">Quantity</th>
                <th className="py-3 px-3 w-24 text-right">Rate (₹)</th>
                <th className="py-3 px-3 w-16 text-center">GST</th>
                <th className="py-3 px-3 w-28 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {quotation.items && quotation.items.length > 0 ? (
                quotation.items.map((item, index) => (
                  <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-3 px-3 text-center font-bold text-slate-500">{index + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">{item.hsn_code || '5208'}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {item.quantity} <span className="text-[10px] font-normal text-slate-500">{item.unit || 'Mtr'}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      ₹{Number(item.rate).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {item.gst_rate || 5}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-purple-950">
                      ₹{(Number(item.amount) || Number(item.quantity) * Number(item.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400 italic">No line items added to quotation.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTALS & SUMMARY SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-b border-slate-200 text-xs">
        
        {/* Amount in Words & Notes */}
        <div className="space-y-3">
          <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200">
            <p className="text-[10px] font-black uppercase tracking-wider text-purple-950">Amount in Words:</p>
            <p className="font-bold text-purple-900 text-xs mt-0.5 italic">
              {quotation.grand_total_words || numberToIndianRupeesWords(quotation.grand_total)}
            </p>
          </div>

          {quotation.notes && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Special Notes:</p>
              <p className="text-slate-700 text-xs mt-0.5">{quotation.notes}</p>
            </div>
          )}

          {/* BANK ACCOUNT DETAILS */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-black text-purple-950 uppercase tracking-wider text-[10px] flex items-center">
              <CreditCard className="w-3.5 h-3.5 mr-1 text-purple-700" /> BANK TRANSFER &amp; UPI PAYMENT DETAILS:
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-700 font-medium pt-1">
              <div>Bank Name: <strong className="text-slate-900">{bank.bank_name}</strong></div>
              <div>Account Name: <strong className="text-slate-900">{bank.account_name}</strong></div>
              <div className="font-mono">Account No: <strong className="text-slate-900 font-bold">{bank.account_number}</strong></div>
              <div className="font-mono">IFSC Code: <strong className="text-purple-900 font-bold">{bank.ifsc_code}</strong></div>
              <div className="col-span-2">Branch: {bank.branch}</div>
              {bank.upi_id && (
                <div className="col-span-2 font-mono text-purple-800 font-bold">
                  UPI ID: {bank.upi_id}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calculation Table */}
        <div className="space-y-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Subtotal (Taxable Value):</span>
              <span className="font-mono">₹{Number(quotation.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {quotation.discount_amount > 0 && (
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>Discount ({quotation.discount_type === 'PERCENTAGE' ? `${quotation.discount_value}%` : 'Flat'}):</span>
                <span className="font-mono">- ₹{Number(quotation.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {quotation.tax_type === 'CGST_SGST' ? (
              <>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>CGST ({quotation.cgst_rate || 2.5}%):</span>
                  <span className="font-mono">₹{Number(quotation.cgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>SGST ({quotation.sgst_rate || 2.5}%):</span>
                  <span className="font-mono">₹{Number(quotation.sgst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </>
            ) : quotation.tax_type === 'IGST' ? (
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>IGST ({quotation.igst_rate || 5}%):</span>
                <span className="font-mono">₹{Number(quotation.igst_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            ) : null}

            {quotation.shipping_charges > 0 && (
              <div className="flex justify-between text-slate-700">
                <span>Freight / Packing Charges:</span>
                <span className="font-mono">₹{Number(quotation.shipping_charges).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {quotation.round_off !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Round Off:</span>
                <span className="font-mono">{quotation.round_off > 0 ? `+₹${quotation.round_off.toFixed(2)}` : `-₹${Math.abs(quotation.round_off).toFixed(2)}`}</span>
              </div>
            )}

            {/* GRAND TOTAL BOX */}
            <div className="pt-2 border-t-2 border-purple-900/30 flex justify-between items-center">
              <div>
                <p className="font-black text-purple-950 uppercase text-xs">GRAND TOTAL (INR):</p>
                <p className="text-[10px] text-slate-500">(Inclusive of all stated taxes)</p>
              </div>
              <span className="font-mono text-xl font-black text-purple-950 bg-purple-100 px-3 py-1 rounded-lg border border-purple-200">
                ₹{Number(quotation.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* TERMS & CONDITIONS + SIGNATURE FOOTER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 text-xs">
        
        {/* Terms list */}
        <div className="sm:col-span-2 space-y-1">
          <p className="font-black text-purple-950 uppercase tracking-wider text-[10px]">
            TERMS &amp; CONDITIONS OF SUPPLY:
          </p>
          <ol className="list-decimal list-inside text-[10.5px] text-slate-600 space-y-0.5 leading-tight">
            {(quotation.terms_and_conditions && quotation.terms_and_conditions.length > 0
              ? quotation.terms_and_conditions
              : [
                  'Prices quoted are net ex-mill / ex-godown Surat.',
                  'Goods dispatched upon receipt of confirmed advance payment.',
                  'Transit insurance and freight to be borne by buyer.',
                  'Quotation valid for 15 days from date of issue.',
                  'Subject to Surat Jurisdiction only.',
                ]
            ).map((term, i) => (
              <li key={i}>{term}</li>
            ))}
          </ol>
        </div>

        {/* Signatory Box */}
        <div className="flex flex-col justify-end items-center sm:items-end text-center sm:text-right pt-4 sm:pt-0">
          <div className="border border-slate-300 rounded-xl p-4 w-full max-w-[220px] bg-slate-50/50 space-y-8">
            <p className="text-[10px] font-bold text-slate-600 uppercase">For {company.name}</p>
            <div className="pt-6 border-t border-dashed border-slate-400">
              <p className="text-[11px] font-black text-purple-950">Authorized Signatory</p>
              <p className="text-[9px] text-slate-500">Sales &amp; Dispatch Dept.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Print Footer Notice */}
      <div className="pt-6 mt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 print:block">
        This is a computer-generated commercial quotation issued by {company.name}.
      </div>
    </div>
  );
}
