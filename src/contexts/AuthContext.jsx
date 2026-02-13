import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage } from '@/lib/storage';
import CryptoJS from 'crypto-js';
import { demoExchange, demoBots, demoPositions, demoTrades, demoPnLHistory } from '@/lib/mockData';
import { keyManagement } from '@/lib/keyManagement';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initializeApp = useCallback(() => {
    const storedUser = storage.getUser();
    
    if (!storedUser) {
      // Initialize demo user and data
      const demoUser = {
        email: 'demo@mexc.com',
        passwordHash: CryptoJS.SHA256('demo123').toString(),
        createdAt: Date.now()
      };
      
      storage.setUser(demoUser);
      
      // Initialize a robust demo account with correct balance
      // We use keyManagement to ensure it's stored in the 'demoAccounts' or proper format
      const initializedDemoAccount = {
        id: 'demo-default-1',
        name: 'MEXC Demo Account',
        exchange: 'Mexc',
        type: 'Futures',
        mode: 'Demo',
        balance: 10000.00,
        leverage: 20,
        status: 'active',
        createdAt: Date.now(),
        isActive: true
      };

      // Check if demo accounts already exist, if not create one
      const existingDemos = keyManagement.getDemoAccounts();
      if (existingDemos.length === 0) {
        keyManagement.saveDemoAccount(initializedDemoAccount);
      }
      
      // Also set other mock data
      storage.setBots(demoBots);
      storage.setPositions(demoPositions);
      storage.setTrades(demoTrades);
      storage.setPnLHistory(demoPnLHistory);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const login = (email, password) => {
    const storedUser = storage.getUser();
    const passwordHash = CryptoJS.SHA256(password).toString();
    
    if (storedUser && storedUser.email === email && storedUser.passwordHash === passwordHash) {
      setUser(storedUser);
      return { success: true };
    }
    
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
  };

  const updatePassword = (currentPassword, newPassword) => {
    const storedUser = storage.getUser();
    const currentHash = CryptoJS.SHA256(currentPassword).toString();
    
    if (storedUser.passwordHash === currentHash) {
      const newHash = CryptoJS.SHA256(newPassword).toString();
      storedUser.passwordHash = newHash;
      storage.setUser(storedUser);
      setUser(storedUser);
      return { success: true };
    }
    
    return { success: false, error: 'Current password is incorrect' };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}