'use client';

import React, { useState } from 'react';
import { crmStore } from '@/lib/crm-store';
import { useFabrics } from '@/lib/useFabrics';
import { useAuth } from '@/context/AuthContext';
import {
  Settings,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Layers,
  RotateCcw,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'FABRICS' | 'ENGINE'>('FABRICS');
  
  // Call Engine Config State
  const [config, setConfig] = useState(crmStore.getSettings());
  const [savedMsg, setSavedMsg] = useState(false);

  // Fabrics Catalog State
  const { fabrics, isLoading, addFabric, removeFabric, resetToDefault } = useFabrics();
  const [newFabricInput, setNewFabricInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fabricSuccessMsg, setFabricSuccessMsg] = useState('');
  const [fabricErrorMsg, setFabricErrorMsg] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || !currentUser;

  const handleSaveEngine = (e: React.FormEvent) => {
    e.preventDefault();
    crmStore.updateSettings(config);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleAddFabric = async (e: React.FormEvent) => {
    e.preventDefault();
    setFabricErrorMsg('');
    setFabricSuccessMsg('');

    if (!newFabricInput.trim()) {
      setFabricErrorMsg('Please type a valid fabric name.');
      return;
    }

    setIsAdding(true);
    const res = await addFabric(newFabricInput.trim());
    setIsAdding(false);

    if (res.success) {
      setFabricSuccessMsg(res.message || 'Fabric added successfully!');
      setNewFabricInput('');
      setTimeout(() => setFabricSuccessMsg(''), 3500);
    } else {
      setFabricErrorMsg(res.message || 'Failed to add fabric.');
    }
  };

  const handleRemoveFabric = async (name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from the fabric suggestions catalog?`)) {
      const res = await removeFabric(name);
      if (res.success) {
        setFabricSuccessMsg(res.message || 'Fabric removed successfully!');
        setTimeout(() => setFabricSuccessMsg(''), 3000);
      }
    }
  };

  const handleResetFabrics = async () => {
    if (confirm('Are you sure you want to restore the default 200+ Master Fabric Catalog?')) {
      await resetToDefault();
      setFabricSuccessMsg('Master fabric catalog reset to defaults!');
      setTimeout(() => setFabricSuccessMsg(''), 3000);
    }
  };

  const filteredFabrics = React.useMemo(() => {
    if (!searchQuery.trim()) return fabrics;
    const q = searchQuery.toLowerCase().trim();
    return fabrics.filter(f => f.toLowerCase().includes(q));
  }, [fabrics, searchQuery]);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-purple-700" /> SYSTEM &amp; CRM SETTINGS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin management for Master Fabric Catalog, Call Scheduling Engine, and business rules.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('FABRICS')}
            className={`flex items-center px-4 py-2 rounded-lg transition ${
              activeTab === 'FABRICS'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            Fabric Catalog ({fabrics.length})
          </button>
          <button
            onClick={() => setActiveTab('ENGINE')}
            className={`flex items-center px-4 py-2 rounded-lg transition ${
              activeTab === 'ENGINE'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            Call Engine Rules
          </button>
        </div>
      </div>

      {/* Notifications */}
      {fabricSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center shadow-sm">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
          <span>{fabricSuccessMsg}</span>
        </div>
      )}

      {fabricErrorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center shadow-sm">
          <AlertCircle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
          <span>{fabricErrorMsg}</span>
        </div>
      )}

      {/* ================= TAB 1: MASTER FABRIC CATALOG ================= */}
      {activeTab === 'FABRICS' && (
        <div className="space-y-6">
          {/* Add New Fabric Form Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1.5 text-purple-700" />
                  MASTER FABRIC CATALOG MANAGEMENT (कपड़े की मास्टर सूची)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fabrics added or removed here immediately update live auto-suggestions in New Lead creation, Planned Calls, and Quotations.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFabrics}
                className="text-xs font-bold text-slate-500 hover:text-purple-700 flex items-center bg-slate-50 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore Default 200+ List
              </button>
            </div>

            {/* Add Fabric Form */}
            <form onSubmit={handleAddFabric} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={newFabricInput}
                  onChange={e => setNewFabricInput(e.target.value)}
                  placeholder="Enter new fabric variety name (e.g. Viscose Dobby Satin, Heavy Cotton Lycra)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={isAdding || !newFabricInput.trim()}
                className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center justify-center shadow-md transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                {isAdding ? 'Adding...' : '+ ADD FABRIC TO CATALOG'}
              </button>
            </form>
          </div>

          {/* Catalog Listing Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Varieties in Catalog:
                </span>
                <span className="bg-purple-100 text-purple-900 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-purple-200">
                  {fabrics.length} Varieties
                </span>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search fabric name..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Fabrics Grid */}
            <div className="max-h-[480px] overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50/50">
              {filteredFabrics.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-xs">
                  No fabric found matching "{searchQuery}". You can add it using the form above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {filteredFabrics.map((fabric, idx) => (
                    <div
                      key={fabric + idx}
                      className="bg-white border border-slate-200 hover:border-purple-300 p-2.5 rounded-xl flex items-center justify-between group shadow-sm transition"
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate" title={fabric}>
                          {fabric}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFabric(fabric)}
                        title={`Remove "${fabric}"`}
                        className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CALL SCHEDULING ENGINE RULES ================= */}
      {activeTab === 'ENGINE' && (
        <div className="space-y-6">
          {savedMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center shadow-sm">
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Settings updated successfully! All new call calculations will apply these rules immediately.
            </div>
          )}

          <form onSubmit={handleSaveEngine} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
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
                  className="w-full font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500"
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
                  className="w-full font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500"
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
                  className="w-full font-bold text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500"
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
                  className="w-4 h-4 text-purple-600 rounded"
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
                  className="w-4 h-4 text-purple-600 rounded"
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
                className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center shadow-md transition"
              >
                <Save className="w-4 h-4 mr-2" /> SAVE ENGINE SETTINGS
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
