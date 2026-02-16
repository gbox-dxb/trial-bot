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
    let storedUser = storage.getUser(); // Get user from "database"
    const sessionToken = storage.getSession(); // Get active session token

    if (!storedUser) {
      // Initialize demo user and data (Database Seeding)
      const demoUser = {
        email: 'demo@mexc.com',
        passwordHash: CryptoJS.SHA256('demo123').toString(),
        createdAt: Date.now()
      };

      storage.setUser(demoUser);
      storedUser = demoUser; // Update local ref

      // Initialize a robust demo account with correct balance
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

    // Check Session: Only auto-login if we have a valid session token
    if (sessionToken && storedUser) {
      setUser(storedUser);
    } else {
      setUser(null); // No session, user must login
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
      // Successful Login
      setUser(storedUser);
      // Create and save session token
      const token = CryptoJS.SHA256(Date.now().toString() + email).toString();
      storage.setSession(token);
      return { success: true };
    }

    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    storage.clearSession(); // Destroy session
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