'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFabrics } from '@/lib/useFabrics';
import { Sparkles, Check } from 'lucide-react';

interface FabricRequirementInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  rows?: number;
}

export default function FabricRequirementInput({
  value,
  onChange,
  placeholder = 'e.g. 100% Cotton, Cambric 60x60, Rayon 140gram...',
  required = false,
  className = '',
  rows = 2,
}: FabricRequirementInputProps) {
  const { fabrics } = useFabrics();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on dynamic fabrics list (triggers from 1 character onwards!)
  const filteredSuggestions = React.useMemo(() => {
    if (!value || !value.trim()) {
      return fabrics.slice(0, 12);
    }
    const query = value.toLowerCase().trim();
    const matches = fabrics.filter(f => f.toLowerCase().includes(query));
    return matches.slice(0, 15);
  }, [value, fabrics]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (fabric: string) => {
    onChange(fabric);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <textarea
          rows={rows}
          required={required}
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition ${className}`}
        />
        {value && (
          <span className="absolute right-2.5 top-2.5 text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded flex items-center">
            <Sparkles className="w-2.5 h-2.5 mr-0.5 text-purple-600" />
            Live Fabric Search
          </span>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-purple-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="p-2 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between text-[11px] font-bold text-purple-900">
            <span className="flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-600" />
              Fabric Suggestions ({filteredSuggestions.length} matches)
            </span>
            <span className="text-[10px] text-purple-600 font-normal">Click to auto-fill</span>
          </div>

          {filteredSuggestions.map((item, idx) => {
            const isSelected = value.toLowerCase() === item.toLowerCase();
            return (
              <button
                key={item + idx}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-purple-50 transition ${
                  isSelected ? 'bg-purple-100/70 font-bold text-purple-900' : 'text-slate-700'
                }`}
              >
                <span>{item}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-purple-700 font-bold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
