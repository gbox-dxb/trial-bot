import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SidebarNav from './SidebarNav';
import TopBar from './TopBar';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handlePairChange = useCallback((pair) => {
    setSelectedPair(pair);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1419] text-white transition-colors duration-300">
      
      <SidebarNav 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        handleLogout={handleLogout} 
      />

      {/* Main Content */}
      <div className="lg:ml-72 transition-all duration-300">
        <TopBar 
          selectedPair={selectedPair} 
          onPairChange={handlePairChange}
        />

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}