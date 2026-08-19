'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types/crm';
import { crmStore } from '@/lib/crm-store';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Default logged in user: Rahul Verma (Sales Executive) or Rajesh Sharma (Admin)
    const users = crmStore.getUsers();
    if (users.length > 0) {
      setCurrentUser(users[0]); // Default Admin
    }
  }, []);

  const switchRole = (role: UserRole) => {
    const users = crmStore.getUsers();
    const userWithRole = users.find(u => u.role === role);
    if (userWithRole) {
      setCurrentUser(userWithRole);
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, switchRole, logout }}>
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
