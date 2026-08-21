'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, Download, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

function QuotationViewContent() {
  const searchParams = useSearchParams();

  const quoteNumber = searchParams.get('quote') || 'QT-20260821-3478';
  const customerName = searchParams.get('name') || 'Valued Customer';
  const companyName = searchParams.get('company') || '';
  const mobileNumber = searchParams.get('mobile') || '';
  const city = searchParams.get('city') || 'Surat';
  const quotationDate = searchParams.get('date') || new Date().toISOString().substring(0, 10);
  const validUntil = searchParams.get('valid') || new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10);
  const representative = searchParams.get('rep') || 'Pooja Choudhary';
  
  // Items decoded or fallback
  let items = [
    {
      name: searchParams.get('item') || '100% Cotton Fabric 60x60 Cambric',
      hsn: '5208',
      qty: Number(searchParams.get('qty')) || 500,
      unit: searchParams.get('unit') || 'Mtr',
      rate: Number(searchParams.get('rate')) || 85,
      gst: Number(searchParams.get('gst')) || 5,
      amount: Number(searchParams.get('amount')) || 42500,
    },
  ];

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalGst = items.reduce((sum, item) => sum + (item.amount * (item.gst / 100)), 0);
  const grandTotal = Math.round(subtotal + totalGst);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white">
      
      {/* Top Action Bar (Hidden on print/PDF export) */}
      <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-700">Official Digital Quotation &bull; {quoteNumber}</span>
        </div>
        <button
          onClick={handlePrint}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center shadow-md transition"
        >
          <Download className="w-4 h-4 mr-1.5" /> Download / Print PDF
        </button>
      </div>

      {/* Printable Quotation Paper */}
      <div id="quotation-print-area" className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl max-w-3xl mx-auto text-slate-900 space-y-6 print:border-none print:shadow-none print:p-0 print:rounded-none">
        
        {/* Template Top Header */}
        <div className="flex justify-between items-start border-b-2 border-[#250a42] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-[#250a42] text-white font-black flex items-center justify-center text-lg shadow-sm">
                F
              </div>
              <h1 className="text-2xl font-black text-[#250a42] tracking-tight">FabricTraders</h1>
            </div>
            <p className="text-xs font-bold text-slate-700 mt-1">Textile Mills &amp; Premium Fabric Wholesaler</p>
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
        <div className="grid grid-cols-2 gap-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QUOTATION PREPARED FOR:</p>
            <p className="font-extrabold text-sm text-slate-900 mt-1">{customerName}</p>
            {companyName && <p className="font-bold text-purple-900">{companyName}</p>}
            {mobileNumber && <p className="text-slate-600 font-mono mt-0.5">{mobileNumber}</p>}
            <p className="text-slate-600">{city}, India</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REPRESENTATIVE / CALLER:</p>
            <p className="font-bold text-slate-900 mt-1">{representative}</p>
            <p className="text-slate-600">sales@fabrictraders.com</p>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">Verified Supplier Direct Mill Rate</p>
          </div>
        </div>

        {/* Items Table */}
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
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 border border-slate-200 font-bold">{idx + 1}</td>
                  <td className="py-2.5 px-3 border border-slate-200 font-bold text-slate-900">{item.name}</td>
                  <td className="py-2.5 px-3 border border-slate-200 text-center font-mono">{item.hsn}</td>
                  <td className="py-2.5 px-3 border border-slate-200 text-center font-bold">{item.qty} {item.unit}</td>
                  <td className="py-2.5 px-3 border border-slate-200 text-right font-mono">₹{Number(item.rate).toFixed(2)}</td>
                  <td className="py-2.5 px-3 border border-slate-200 text-center">{item.gst}%</td>
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
            <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {inWords(grandTotal)}
            </p>
          </div>
          <div className="w-64 space-y-1 text-xs text-right">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Subtotal:</span>
              <span className="font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST Tax:</span>
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
            <li>Payment Terms: 30% Advance along with Order Confirmation, balance before dispatch.</li>
            <li>Delivery: Dispatch within 3-5 working days from our Surat warehouse.</li>
            <li>Freight / Transport: Extra at actuals on TO-PAY basis.</li>
            <li>GST: Rates mentioned are subject to applicable GST taxes.</li>
            <li>Quotation Validity: Valid for 7 days from the date of issuance.</li>
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
    </div>
  );
}

export default function QuotationViewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading Quotation Document...</div>}>
      <QuotationViewContent />
    </Suspense>
  );
}
