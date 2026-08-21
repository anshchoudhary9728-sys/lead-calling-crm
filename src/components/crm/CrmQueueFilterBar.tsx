'use client';

import React from 'react';
import { Search, Calendar, RotateCcw, Filter, X } from 'lucide-react';
import { useSources } from '@/lib/useSources';

export interface FilterValues {
  search: string;
  date: string; // YYYY-MM-DD or ''
  datePreset: 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'CUSTOM';
  source: string;
}

interface CrmQueueFilterBarProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  totalCount: number;
  filteredCount: number;
  placeholder?: string;
  dateLabel?: string;
}

export default function CrmQueueFilterBar({
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
  placeholder = 'Search by Client Name, Mobile, Unique ID...',
  dateLabel = 'Filter by Date (Calendar)',
}: CrmQueueFilterBarProps) {
  const { sources } = useSources();

  const todayStr = new Date().toISOString().substring(0, 10);
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

  const handlePreset = (preset: FilterValues['datePreset']) => {
    if (preset === 'ALL') {
      onFilterChange({ ...filters, datePreset: 'ALL', date: '' });
    } else if (preset === 'TODAY') {
      onFilterChange({ ...filters, datePreset: 'TODAY', date: todayStr });
    } else if (preset === 'YESTERDAY') {
      onFilterChange({ ...filters, datePreset: 'YESTERDAY', date: yesterdayStr });
    } else if (preset === 'THIS_WEEK') {
      onFilterChange({ ...filters, datePreset: 'THIS_WEEK', date: '' });
    }
  };

  const handleClear = () => {
    onFilterChange({
      search: '',
      date: '',
      datePreset: 'ALL',
      source: 'ALL',
    });
  };

  const hasActiveFilters = Boolean(
    filters.search || filters.date || filters.datePreset !== 'ALL' || (filters.source && filters.source !== 'ALL')
  );

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* 1. Name & Mobile Search Input */}
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={e => onFilterChange({ ...filters, search: e.target.value })}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 2. Calendar Date Picker */}
        <div className="lg:col-span-4 relative flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="date"
              value={filters.date}
              onChange={e => {
                const val = e.target.value;
                onFilterChange({
                  ...filters,
                  date: val,
                  datePreset: val ? 'CUSTOM' : 'ALL',
                });
              }}
              title={dateLabel}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold space-x-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => handlePreset('TODAY')}
              className={`px-2 py-1 rounded-lg transition ${
                filters.datePreset === 'TODAY' || filters.date === todayStr
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePreset('ALL')}
              className={`px-2 py-1 rounded-lg transition ${
                filters.datePreset === 'ALL' && !filters.date
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* 3. Lead Source Dropdown */}
        <div className="lg:col-span-3">
          <select
            value={filters.source || 'ALL'}
            onChange={e => onFilterChange({ ...filters, source: e.target.value })}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-purple-900 focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Lead Sources</option>
            {sources.map((s, idx) => (
              <option key={idx} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Stats & Reset */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center space-x-2">
          <span>
            Showing <strong className="text-slate-900 font-extrabold">{filteredCount}</strong> of {totalCount} records
          </span>
          {hasActiveFilters && (
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
              Filters Active
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center hover:underline"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
