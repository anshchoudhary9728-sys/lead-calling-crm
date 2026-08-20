'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/crm';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('fabric_crm_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUserState(parsed);
      } else {
        // If not logged in and not on login page, redirect to login
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    } catch (e) {
      localStorage.removeItem('fabric_crm_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('fabric_crm_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fabric_crm_user');
    }
  };

  const switchRole = (role: UserRole) => {
    if (!currentUser) return;
    const updated = { ...currentUser, role };
    setCurrentUser(updated);
  };

  const logout = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, setCurrentUser, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
