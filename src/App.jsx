import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { PriceProvider } from '@/contexts/PriceContext';
import { LiveTradingProvider } from '@/contexts/LiveTradingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Exchanges from '@/pages/Exchanges';
import Terminal from '@/pages/Terminal';
import Positions from '@/pages/Positions';
import MyAnalytics from '@/pages/MyAnalytics';
import AdvancedView from '@/pages/AdvancedView'; 
import RSIBot from '@/pages/bots/RSIBot';
import GridBot from '@/pages/bots/GridBot';
import DCABot from '@/pages/bots/DCABot';
import CandleStrike from '@/pages/bots/CandleStrike';
import MomentumBot from '@/pages/bots/MomentumBot';
import LiquidityBotPage from '@/pages/LiquidityBotPage';
import Settings from '@/pages/Settings';
import { customCodeService } from '@/lib/customCodeService';

// Initialize services
customCodeService.init();

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LiveTradingProvider>
          <PriceProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/exchanges" element={<ProtectedRoute><Layout><Exchanges /></Layout></ProtectedRoute>} />
                <Route path="/terminal" element={<ProtectedRoute><Layout><Terminal /></Layout></ProtectedRoute>} />
                <Route path="/positions" element={<ProtectedRoute><Layout><Positions /></Layout></ProtectedRoute>} />
                
                {/* Advanced View Route */}
                <Route path="/chart" element={<ProtectedRoute><Layout><AdvancedView /></Layout></ProtectedRoute>} />
                
                <Route path="/analytics" element={<ProtectedRoute><Layout><MyAnalytics /></Layout></ProtectedRoute>} />
                
                {/* Trading Bots Routes */}
                <Route path="/bots/rsi" element={<ProtectedRoute><Layout><RSIBot /></Layout></ProtectedRoute>} />
                <Route path="/bots/grid" element={<ProtectedRoute><Layout><GridBot /></Layout></ProtectedRoute>} />
                <Route path="/bots/dca" element={<ProtectedRoute><Layout><DCABot /></Layout></ProtectedRoute>} />
                <Route path="/bots/candle-strike" element={<ProtectedRoute><Layout><CandleStrike /></Layout></ProtectedRoute>} />
                <Route path="/bots/momentum" element={<ProtectedRoute><Layout><MomentumBot /></Layout></ProtectedRoute>} />
                <Route path="/bots/liquidity" element={<ProtectedRoute><Layout><LiquidityBotPage /></Layout></ProtectedRoute>} />
                
                <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
                
                {/* Default Routes */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </PriceProvider>
        </LiveTradingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;