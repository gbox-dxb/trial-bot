import React from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from 'lucide-react';

const DetailRow = ({ label, value, valueClass = "text-white" }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
    <span className="text-slate-400 text-sm">{label}</span>
    <span className={`font-medium ${valueClass}`}>{value}</span>
  </div>
);

const PositionDetailsModal = ({ isOpen, onClose, position, currentPrice }) => {
  if (!position) return null;

  const isLong = position.direction === 'LONG';
  const price = currentPrice || position.exitPrice || position.entryPrice;
  const pnl = position.status === 'OPEN' 
    ? (isLong ? price - position.entryPrice : position.entryPrice - price) * position.size
    : position.pnl;
    
  const pnlPercent = (pnl / (position.entryPrice * position.size)) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {position.symbol} 
            <span className={`px-2 py-0.5 rounded text-xs border ${
              isLong ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10'
            }`}>
              {position.direction}
            </span>
            <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {position.type}
            </span>
          </DialogTitle>
          <DialogDescription>
             Position ID: {position.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Entry Info</h4>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <DetailRow label="Entry Price" value={`$${position.entryPrice.toFixed(4)}`} />
              <DetailRow label="Size/Amount" value={position.size} />
              <DetailRow label="Entry Time" value={new Date(position.timestamp).toLocaleString()} />
              <DetailRow label="Leverage" value={`${position.leverage}x`} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Current / Exit Info</h4>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <DetailRow 
                label={position.status === 'OPEN' ? 'Current Price' : 'Exit Price'} 
                value={`$${price.toFixed(4)}`} 
              />
              <DetailRow 
                label="P/L (USDT)" 
                value={`$${pnl.toFixed(2)}`} 
                valueClass={pnl >= 0 ? "text-green-400" : "text-red-400"} 
              />
              <DetailRow 
                label="P/L %" 
                value={`${pnlPercent.toFixed(2)}%`} 
                valueClass={pnlPercent >= 0 ? "text-green-400" : "text-red-400"} 
              />
              <DetailRow label="Status" value={position.status} />
              {position.exitReason && (
                <DetailRow label="Exit Reason" value={position.exitReason} />
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
            <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">Targets</h4>
             <div className="flex gap-4">
                 <div className="flex-1 bg-slate-800/50 p-3 rounded-lg border border-green-900/30">
                     <span className="text-xs text-slate-400 block">Take Profit</span>
                     <span className="text-green-400 font-mono">{position.tp ? `$${position.tp}` : 'Not Set'}</span>
                 </div>
                 <div className="flex-1 bg-slate-800/50 p-3 rounded-lg border border-red-900/30">
                     <span className="text-xs text-slate-400 block">Stop Loss</span>
                     <span className="text-red-400 font-mono">{position.sl ? `$${position.sl}` : 'Not Set'}</span>
                 </div>
             </div>
        </div>

        <DialogFooter className="mt-6">
           <Button variant="secondary" onClick={onClose}>Close View</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PositionDetailsModal;