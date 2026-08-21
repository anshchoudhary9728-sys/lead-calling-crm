'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_LEAD_SOURCES } from '@/constants/sources';

const STORAGE_KEY = 'ft_crm_sources_catalog_v1';
const SOURCES_UPDATED_EVENT = 'ft_sources_updated';

export function getCachedSources(): string[] {
  if (typeof window === 'undefined') return DEFAULT_LEAD_SOURCES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_LEAD_SOURCES;
}

export function saveCachedSources(sources: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
    window.dispatchEvent(new CustomEvent(SOURCES_UPDATED_EVENT, { detail: sources }));
  } catch (e) {}
}

export function useSources() {
  const [sources, setSources] = useState<string[]>(getCachedSources);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/sources?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.sources) && data.sources.length > 0) {
        setSources(data.sources);
        saveCachedSources(data.sources);
      }
    } catch (e) {
      // fallback to cached
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSources(e.detail);
      }
    };

    window.addEventListener(SOURCES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(SOURCES_UPDATED_EVENT, handleUpdate);
  }, []);

  const addSource = async (name: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'Source name cannot be empty' };

    if (sources.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: `Source "${trimmed}" already exists!` };
    }

    const updated = [...sources, trimmed];
    setSources(updated);
    saveCachedSources(updated);

    try {
      const res = await fetch('/api/v1/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.sources)) {
        setSources(data.sources);
        saveCachedSources(data.sources);
      }
      return { success: true, message: `Source "${trimmed}" added successfully!` };
    } catch (e: any) {
      return { success: true, message: `Source "${trimmed}" added locally.` };
    }
  };

  const removeSource = async (name: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = name.trim();
    const updated = sources.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
    setSources(updated);
    saveCachedSources(updated);

    try {
      const res = await fetch(`/api/v1/sources?name=${encodeURIComponent(trimmed)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.sources)) {
        setSources(data.sources);
        saveCachedSources(data.sources);
      }
      return { success: true, message: `Source "${trimmed}" removed successfully!` };
    } catch (e: any) {
      return { success: true, message: `Source "${trimmed}" removed locally.` };
    }
  };

  const resetToDefault = async () => {
    setSources(DEFAULT_LEAD_SOURCES);
    saveCachedSources(DEFAULT_LEAD_SOURCES);

    try {
      await fetch('/api/v1/sources', { method: 'PUT' });
    } catch (e) {}
  };

  return {
    sources,
    isLoading,
    addSource,
    removeSource,
    resetToDefault,
    refreshSources: fetchSources,
  };
}
