'use client';

import React, { useState, useRef, useEffect } from 'react';
import { INDIAN_CITIES_SUGGESTIONS } from '@/constants/cities';
import { MapPin, Check } from 'lucide-react';

interface CityLocationInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CityLocationInput({
  value,
  onChange,
  placeholder = 'e.g. Surat, Delhi, Mumbai...',
  className = '',
}: CityLocationInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on 1 character input
  const filteredCities = React.useMemo(() => {
    if (!value || !value.trim()) {
      return INDIAN_CITIES_SUGGESTIONS.slice(0, 10);
    }
    const q = value.toLowerCase().trim();
    return INDIAN_CITIES_SUGGESTIONS.filter(c => c.toLowerCase().includes(q)).slice(0, 12);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: string) => {
    onChange(city);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition ${className}`}
        />
        <MapPin className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {isOpen && filteredCities.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-purple-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="p-1.5 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between text-[10px] font-bold text-purple-900">
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-purple-600" />
              City Suggestions ({filteredCities.length})
            </span>
            <span className="text-purple-600 font-normal">Click to select</span>
          </div>

          {filteredCities.map((city, idx) => {
            const isSelected = value.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city + idx}
                type="button"
                onClick={() => handleSelect(city)}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-purple-50 transition ${
                  isSelected ? 'bg-purple-100 font-bold text-purple-900' : 'text-slate-700'
                }`}
              >
                <span>{city}</span>
                {isSelected && <Check className="w-3 h-3 text-purple-700 font-bold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
