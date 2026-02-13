import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveTrading } from '@/contexts/LiveTradingContext';
import { CheckCircle2, AlertCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExchangeAccountStatus({ mode }) {
  const { getActiveAccount, refreshAccounts } = useLiveTrading();
  const [account, setAccount] = useState(null);

  useEffect(() => {
      refreshAccounts();
      setAccount(getActiveAccount());
  }, [mode]);

  if (mode !== 'LIVE') return null;

  if (!account) {
    return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-bold">No Exchange Connected</span>
            </div>
            <Link to="/exchanges">
                <Button size="sm" variant="outline" className="h-8 border-red-500/50 text-red-400 hover:bg-red-950">
                    Connect
                </Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 mb-4 space-y-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Ready for Live Trading</span>
            </div>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-gray-400">
                {account.name}
            </span>
        </div>
        <div className="flex items-center justify-between text-xs pl-6">
            <span className="text-gray-500">Available Balance:</span>
            <span className="font-mono font-bold text-white flex items-center gap-1">
                <Wallet className="w-3 h-3 text-gray-500" />
                ${account.equity?.toFixed(2) || '0.00'}
            </span>
        </div>
    </div>
  );
}