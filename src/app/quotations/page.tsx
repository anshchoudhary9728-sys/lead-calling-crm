'use client';

import React, { useState, useEffect } from 'react';
import { Quotation } from '@/types/quotation';
import QuotationModal from '@/components/crm/QuotationModal';
import { formatIST } from '@/lib/timezone';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Send,
  Eye,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  Building,
  Loader2,
} from 'lucide-react';

export default function QuotationsDirectoryPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/quotations?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      setQuotations(data.quotations || []);
    } catch (err) {
      console.error('Failed to load quotations:', err);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, [refreshKey]);

  // Filtered List
  const filteredQuotations = quotations.filter(q => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const match =
        q.quotation_number?.toLowerCase().includes(query) ||
        q.customer_name?.toLowerCase().includes(query) ||
        q.mobile_number?.includes(query) ||
        (q.company_name && q.company_name.toLowerCase().includes(query));
      if (!match) return false;
    }
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    return true;
  });

  const handleOpenQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedQuotation(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 bg-[#f4f6f9] min-h-screen">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-700 flex-shrink-0" /> QUOTATIONS &amp; PROFORMA INVOICES
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Complete database of commercial quotations generated for fabric buyers, with Whatsify WhatsApp delivery.
          </p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="flex-1 sm:flex-none bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center justify-center shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Refresh
          </button>
          <button
            onClick={handleCreateNew}
            className="flex-1 sm:flex-none bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl flex items-center justify-center shadow-md transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1" /> + CREATE QUOTATION
          </button>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Quote No, Customer Name, Phone, Company..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Quotation Statuses</option>
              <option value="SENT">SENT</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="DRAFT">DRAFT</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#250a42] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Quote No</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer / Buyer</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Items Count</th>
                <th className="py-3.5 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">WhatsApp</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    {loading ? 'Loading quotations...' : 'No quotations found. Click "+ CREATE NEW QUOTATION" or send a quotation directly from any lead!'}
                  </td>
                </tr>
              ) : (
                filteredQuotations.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                      {q.quotation_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {q.quotation_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{q.customer_name}</div>
                      {q.company_name && (
                        <div className="text-[11px] text-slate-500">{q.company_name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {q.mobile_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {q.items ? q.items.length : 0} Fabric Items
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-purple-950">
                      ₹{Number(q.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.status === 'SENT'
                          ? 'bg-blue-100 text-blue-800'
                          : q.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.whatsapp_status === 'SENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {q.whatsapp_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenQuotation(q)}
                        className="bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center mx-auto shadow-sm transition"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View / Send
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUOTATION MODAL */}
      {isModalOpen && (
        <QuotationModal
          initialQuotation={selectedQuotation}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedQuotation(null);
          }}
          onSuccess={() => {
            loadQuotations();
          }}
        />
      )}
    </div>
  );
}
