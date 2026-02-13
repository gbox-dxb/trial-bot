import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useLiveTrading } from '@/contexts/LiveTradingContext';

export default function LiveModeToggle({ mode, onModeChange }) {
  const { getActiveAccount } = useLiveTrading();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const account = getActiveAccount();

  const handleToggle = () => {
      if (mode === 'LIVE') {
          onModeChange('DEMO');
          setConfirmed(false);
      } else {
          // Check if account exists before allowing switch
          if (!account) {
              // Optionally handle this, but the parent form usually handles connection warning. 
              // We'll let them open the modal but the ExchangeAccountStatus component will warn them.
          }
          setShowConfirm(true);
      }
  };

  const confirmLive = () => {
      onModeChange('LIVE');
      setShowConfirm(false);
  };

  return (
    <>
      <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800 self-start">
        <button 
            onClick={() => mode === 'LIVE' && handleToggle()}
            className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${mode === 'DEMO' ? 'bg-yellow-500 text-black shadow' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <ShieldCheck className="w-3 h-3" /> DEMO
        </button>
        <button 
            onClick={() => mode === 'DEMO' && handleToggle()}
            className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${mode === 'LIVE' ? 'bg-red-600 text-white shadow animate-pulse' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <AlertTriangle className="w-3 h-3" /> LIVE
        </button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-slate-900 border-red-500/30 text-white sm:max-w-[425px]">
             <DialogHeader>
                 <DialogTitle className="flex items-center gap-2 text-red-500">
                     <AlertTriangle className="w-5 h-5" /> Enable Live Trading?
                 </DialogTitle>
                 <DialogDescription className="text-gray-400">
                     You are about to switch to LIVE mode. This will use your real funds on MEXC.
                 </DialogDescription>
             </DialogHeader>

             <div className="bg-red-950/30 border border-red-500/20 rounded-md p-4 space-y-3">
                 <p className="text-sm text-red-200">
                     Real orders will be placed. Losses can exceed your initial investment in Futures trading.
                 </p>
                 
                 {!account && (
                     <div className="text-xs bg-black/40 p-2 rounded text-yellow-400">
                         Note: You need to connect an exchange account before you can start a bot.
                     </div>
                 )}
                 
                 <div className="flex items-start gap-2 pt-2">
                     <Checkbox 
                        id="confirm-live" 
                        checked={confirmed} 
                        onCheckedChange={setConfirmed}
                        className="border-red-500 data-[state=checked]:bg-red-500 mt-1"
                     />
                     <label htmlFor="confirm-live" className="text-xs text-gray-300 cursor-pointer select-none">
                         I understand that this involves financial risk and I am responsible for all trades executed by this bot.
                     </label>
                 </div>
             </div>

             <DialogFooter>
                 <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
                 <Button 
                    className="bg-red-600 hover:bg-red-700" 
                    disabled={!confirmed}
                    onClick={confirmLive}
                 >
                    Enable LIVE Mode
                 </Button>
             </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}