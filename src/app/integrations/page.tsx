'use client';

import React, { useState } from 'react';
import { crmStore } from '@/lib/crm-store';
import { LeadSource } from '@/types/crm';
import { FileSpreadsheet, Key, CheckCircle, RefreshCw, Send, AlertCircle } from 'lucide-react';

export default function IntegrationsPage() {
  const sources = crmStore.getSourceSettings();
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:3000/api/v1/integrations/google-sheets');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/v1/integrations/google-sheets`);
    }
  }, []);

  const handleSimulateWebhook = async (sourceName: LeadSource) => {
    setTestResult(null);
    try {
      const mockLead = {
        source: sourceName,
        source_lead_id: `${sourceName.substring(0, 2)}-${Math.floor(100000 + Math.random() * 900000)}`,
        customer_name: `Test Client ${Math.floor(100 + Math.random() * 900)}`,
        mobile_number: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        company_name: 'Simulated Business',
        city: 'Mumbai',
        state: 'Maharashtra',
        client_requirement: 'Need 1000 meters Polyester Fabric for uniforms.',
        enquiry_message: 'Simulated lead payload from integration test button.',
      };

      const res = await fetch('/api/v1/integrations/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockLead),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult(`Success! Lead Synced: ${data.unique_lead_id} (Lead ID: ${data.supabase_lead_id})`);
      } else {
        setTestResult(`Error: ${data.error}`);
      }
      setLogs([...crmStore.getIntegrationLogs()]);
    } catch (err: any) {
      setTestResult(`Error triggering integration test: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center">
          <FileSpreadsheet className="w-6 h-6 mr-2 text-sky-600" /> JUSTDIAL, INDIAMART & GOOGLE SHEETS INTEGRATIONS
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure API credentials, webhook endpoints, and monitor realtime lead ingestion logs.
        </p>
      </div>

      {/* WEBHOOK URL BANNER */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-2">
        <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Live Webhook Endpoint for Google Sheets / Justdial / IndiaMART</p>
        <div className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
          <span>POST</span>
          <span className="text-white font-bold">{webhookUrl}</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Configure your Google Apps Script or Webhook supplier to POST JSON payloads directly to this endpoint. Leads will be automatically normalized, deduplicated, assigned via Round-Robin, and scheduled for call in +10 minutes.
        </p>
      </div>

      {/* SIMULATE LEAD TEST BUTTONS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Simulate Incoming Integration Leads</h3>
        
        {testResult && (
          <div className="p-3 bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold rounded-lg flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-sky-600" />
            {testResult}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSimulateWebhook('JUSTDIAL')}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center"
          >
            <Send className="w-3.5 h-3.5 mr-2" /> Simulate Justdial Lead Ingestion
          </button>
          <button
            onClick={() => handleSimulateWebhook('INDIAMART')}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center"
          >
            <Send className="w-3.5 h-3.5 mr-2" /> Simulate IndiaMART Lead Ingestion
          </button>
        </div>
      </div>

      {/* INTEGRATION LOGS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Integration Ingestion Logs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Details / Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">No integration logs recorded yet. Click a simulate button above to test!</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</td>
                    <td className="py-3 px-4 font-bold text-sky-700">{log.source}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{log.error_message || 'Lead successfully processed'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
