'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/types';
import { api } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.getMe();
      setUser(userData as unknown as User);
    } catch {
      logout();
    }
  }, [logout]);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    const userData = await api.getMe();
    setUser(userData as unknown as User);
    
    // Redirect based on role
    const redirectPath = getDefaultPath((userData as unknown as User).role);
    router.push(redirectPath);
  };

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      
      if (!token) {
        setIsLoading(false);
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push('/login');
        }
        return;
      }

      try {
        const userData = await api.getMe();
        setUser(userData as unknown as User);
      } catch {
        api.logout();
        if (!PUBLIC_PATHS.includes(pathname)) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Redirect authenticated users from public paths
  useEffect(() => {
    if (!isLoading && user && PUBLIC_PATHS.includes(pathname)) {
      const redirectPath = getDefaultPath(user.role);
      router.push(redirectPath);
    }
  }, [isLoading, user, pathname, router]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get default path by role
function getDefaultPath(role: User['role']): string {
  switch (role) {
    case 'ceo':
      return '/executive';
    case 'rop':
      return '/team';
    case 'manager':
      return '/my';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}
