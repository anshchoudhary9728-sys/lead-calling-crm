'use client';

import { useState, useEffect } from 'react';
import { FABRIC_SUGGESTIONS as DEFAULT_FABRICS } from '@/constants/fabrics';

const STORAGE_KEY = 'ft_crm_fabrics_catalog_v1';
const FABRICS_UPDATED_EVENT = 'ft_fabrics_updated';

export function getCachedFabrics(): string[] {
  if (typeof window === 'undefined') return DEFAULT_FABRICS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_FABRICS;
}

export function saveCachedFabrics(fabrics: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fabrics));
    window.dispatchEvent(new CustomEvent(FABRICS_UPDATED_EVENT, { detail: fabrics }));
  } catch (e) {}
}

export function useFabrics() {
  const [fabrics, setFabrics] = useState<string[]>(getCachedFabrics);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFabrics = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/fabrics?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.fabrics) && data.fabrics.length > 0) {
        setFabrics(data.fabrics);
        saveCachedFabrics(data.fabrics);
      }
    } catch (e) {
      // Keep cached
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFabrics();

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setFabrics(e.detail);
      }
    };

    window.addEventListener(FABRICS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(FABRICS_UPDATED_EVENT, handleUpdate);
  }, []);

  const addFabric = async (name: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'Fabric name cannot be empty' };

    if (fabrics.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: `Fabric "${trimmed}" already exists!` };
    }

    const updated = [trimmed, ...fabrics];
    setFabrics(updated);
    saveCachedFabrics(updated);

    try {
      const res = await fetch('/api/v1/fabrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.fabrics)) {
        setFabrics(data.fabrics);
        saveCachedFabrics(data.fabrics);
      }
      return { success: true, message: `Added "${trimmed}" successfully!` };
    } catch (e: any) {
      return { success: true, message: `Added "${trimmed}" locally.` };
    }
  };

  const removeFabric = async (name: string): Promise<{ success: boolean; message?: string }> => {
    const trimmed = name.trim();
    const updated = fabrics.filter(f => f.toLowerCase() !== trimmed.toLowerCase());
    setFabrics(updated);
    saveCachedFabrics(updated);

    try {
      const res = await fetch(`/api/v1/fabrics?name=${encodeURIComponent(trimmed)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.fabrics)) {
        setFabrics(data.fabrics);
        saveCachedFabrics(data.fabrics);
      }
      return { success: true, message: `Removed "${trimmed}" successfully!` };
    } catch (e: any) {
      return { success: true, message: `Removed "${trimmed}" locally.` };
    }
  };

  const resetToDefault = async () => {
    setFabrics(DEFAULT_FABRICS);
    saveCachedFabrics(DEFAULT_FABRICS);

    try {
      await fetch('/api/v1/fabrics', { method: 'PUT' });
    } catch (e) {}
  };

  return {
    fabrics,
    isLoading,
    addFabric,
    removeFabric,
    resetToDefault,
    refreshFabrics: fetchFabrics,
  };
}
