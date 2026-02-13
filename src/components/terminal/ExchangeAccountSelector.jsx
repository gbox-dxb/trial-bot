import React, { useState, useEffect, useMemo } from 'react';
import { keyManagement } from '@/lib/keyManagement';
import { exchangeService } from '@/lib/exchangeService';
import { ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';

export default function ExchangeAccountSelector({ value, onChange, userId = 'user-1', balance }) {
  const [accounts, setAccounts] = useState([]);
  const [internalBalance, setInternalBalance] = useState(0);
  
  // Load accounts on mount - fetches both Live and Demo merged
  useEffect(() => {
    const loadAccounts = () => {
       try {
         const accts = keyManagement.getExchangeAccounts(userId);
         if (Array.isArray(accts)) {
            setAccounts(accts);
         }
       } catch (error) {
         console.error("Failed to load exchange accounts:", error);
       }
    };
    
    loadAccounts();
    const interval = setInterval(() => {
       // Refresh occasionally to sync with new accounts added elsewhere
       loadAccounts();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [userId]);
  
  const selectedAccount = useMemo(() => accounts.find(a => a.id === value), [accounts, value]);

  // Update internal balance when selection changes, if external balance not provided
  useEffect(() => {
    if (value && balance === undefined) {
      try {
        const bal = exchangeService.getAccountBalance(userId, value);
        setInternalBalance(bal?.available || 0);
      } catch (e) {
        console.error("Error fetching balance internally:", e);
        setInternalBalance(0);
      }
    }
  }, [value, userId, balance]);

  // Use external balance if available (passed from Terminal), otherwise use internal state
  const displayBalance = balance !== undefined ? balance : internalBalance;

  // Safely calculate leverage range
  const leverageRange = useMemo(() => {
    if (!value) return { min: 1, max: 20 };
    try {
      const range = exchangeService.getLeverageRange(value, userId);
      return range || { min: 1, max: 20 };
    } catch (err) {
      console.error("Failed to get leverage range", err);
      return { min: 1, max: 20 };
    }
  }, [value, userId]);

  const handleSelectionChange = (e) => {
    const newAccountId = e.target.value;
    const accountData = accounts.find(a => a.id === newAccountId);
    
    // Pass both ID and full account data to parent
    if (onChange) {
      onChange(newAccountId, accountData);
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exchange Account</label>
      <div className="relative">
        <select
          value={value || ''}
          onChange={handleSelectionChange}
          className="w-full bg-[#0b0b15] border border-slate-800 rounded-lg px-4 py-3 text-white text-sm appearance-none cursor-pointer hover:border-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all shadow-sm"
        >
          <option value="">Select Trading Account</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>
              {acc.name} — {acc.exchange?.toUpperCase()} {acc.mode === 'Demo' ? '(Demo)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>
      
      {selectedAccount && (
        <div className="bg-[#1e1e2d] rounded-lg p-3 space-y-3 border border-slate-700/50 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <span className="text-xs font-medium text-slate-400">Available Balance</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Status</span>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                {selectedAccount.mode === 'Demo' ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-yellow-500" />
                    <span className="text-yellow-500 font-medium">DEMO MODE</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">CONNECTED</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="text-right">
               <span className="text-[10px] text-slate-500 block">Leverage Cap</span>
               <span className="text-xs text-slate-300 font-mono">{leverageRange.max}x</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}