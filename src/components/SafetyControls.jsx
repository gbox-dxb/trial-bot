import React, { useState } from 'react';
import { useLiveTrading } from '@/contexts/LiveTradingContext';
import { AlertOctagon, PauseCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

export default function SafetyControls() {
  const { pauseAllTrading, globalSafetySettings, setGlobalSafetySettings } = useLiveTrading();
  const [showPanicModal, setShowPanicModal] = useState(false);

  const handlePanic = () => {
      pauseAllTrading();
      setShowPanicModal(false);
  };

  const toggleMasterSwitch = () => {
      setGlobalSafetySettings(prev => ({ ...prev, tradingEnabled: !prev.tradingEnabled }));
  };

  return (
    <div className="flex items-center gap-2">
        <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 border-red-500/50 text-red-400 hover:bg-red-950/50 ${!globalSafetySettings.tradingEnabled && 'opacity-50'}`}
            onClick={() => setShowPanicModal(true)}
            disabled={!globalSafetySettings.tradingEnabled}
        >
            <AlertOctagon className="w-4 h-4 mr-1" /> Panic Stop
        </Button>

        <Dialog open={showPanicModal} onOpenChange={setShowPanicModal}>
            <DialogContent className="bg-slate-900 border-red-500 text-white">
                <DialogHeader>
                    <DialogTitle className="text-red-500 flex items-center gap-2">
                        <AlertOctagon className="w-6 h-6"/> EMERGENCY STOP
                    </DialogTitle>
                    <DialogDescription className="text-gray-300">
                        This will immediately <strong>PAUSE ALL LIVE BOTS</strong>. 
                        Open positions will remain open but no new orders will be placed.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowPanicModal(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handlePanic}>CONFIRM STOP</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}