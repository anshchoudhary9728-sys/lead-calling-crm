'use client';

import React, { useState } from 'react';
import { crmStore } from '@/lib/crm-store';
import { Settings, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [config, setConfig] = useState(crmStore.getSettings());
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    crmStore.updateSettings(config);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-black text-slate-900 flex items-center">
          <Settings className="w-6 h-6 mr-2 text-sky-600" /> AUTOMATIC CALL PLANNING ENGINE SETTINGS
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business rules for call scheduling delays, retry intervals, and timezone.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center shadow-sm">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Settings updated successfully! All new call calculations will apply these rules immediately.
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
        
        {/* Rule 1: First Call Delay */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b border-slate-100 pb-4">
          <div>
            <label className="block font-extrabold text-slate-900 text-sm">
              New Lead First Call Delay (Minutes)
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Time added to lead received timestamp for initial planned call (REQ 9).
            </p>
          </div>
          <div>
            <input
              type="number"
              value={config.new_lead_call_delay_minutes}
              onChange={e => setConfig({ ...config, new_lead_call_delay_minutes: parseInt(e.target.value) || 10 })}
              className="w-full font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Rule 2: Not Reachable Retry Interval */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b border-slate-100 pb-4">
          <div>
            <label className="block font-extrabold text-slate-900 text-sm">
              Not Reachable Retry Interval (Hours)
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Hours added to actual call time when status is Not Reachable (REQ 10).
            </p>
          </div>
          <div>
            <input
              type="number"
              value={config.not_reachable_retry_hours}
              onChange={e => setConfig({ ...config, not_reachable_retry_hours: parseInt(e.target.value) || 4 })}
              className="w-full font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Rule 3: Busy Retry Interval */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b border-slate-100 pb-4">
          <div>
            <label className="block font-extrabold text-slate-900 text-sm">
              Busy Disposition Retry (Minutes)
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Minutes added to call time when status is Busy (REQ 36).
            </p>
          </div>
          <div>
            <input
              type="number"
              value={config.busy_retry_minutes}
              onChange={e => setConfig({ ...config, busy_retry_minutes: parseInt(e.target.value) || 30 })}
              className="w-full font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Business Timezone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b border-slate-100 pb-4">
          <div>
            <label className="block font-extrabold text-slate-900 text-sm">
              Business Operating Timezone
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Default business timezone for all dynamic time delay calculations.
            </p>
          </div>
          <div>
            <input
              type="text"
              readOnly
              value={config.timezone}
              className="w-full font-bold text-sm bg-slate-100 border border-slate-300 text-slate-700 rounded-lg p-2.5"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="remarks_mandatory"
              checked={config.remarks_mandatory}
              onChange={e => setConfig({ ...config, remarks_mandatory: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded"
            />
            <label htmlFor="remarks_mandatory" className="font-bold text-slate-800 cursor-pointer">
              Mandatory Call Remarks Enforcement
            </label>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="auto_assignment"
              checked={config.auto_assignment_enabled}
              onChange={e => setConfig({ ...config, auto_assignment_enabled: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded"
            />
            <label htmlFor="auto_assignment" className="font-bold text-slate-800 cursor-pointer">
              Automatic Round-Robin Lead Assignment
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center shadow-md transition"
          >
            <Save className="w-4 h-4 mr-2" /> SAVE ENGINE SETTINGS
          </button>
        </div>
      </form>
    </div>
  );
}
