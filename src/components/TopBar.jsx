import React, { memo } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { usePrice } from '@/contexts/PriceContext';
import { TRADING_PAIRS } from '@/lib/mockData';

const TickerDisplay = ({ selectedPair }) => {
  const { useTicker } = usePrice();
  const activeTicker = useTicker(selectedPair);

  if (!activeTicker) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-bold text-2xl text-white">${activeTicker.price.toFixed(2)}</span>
      <span className={`font-bold text-lg ${activeTicker.percent >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}`}>
        {activeTicker.percent >= 0 ? '↑' : '↓'} {activeTicker.percent.toFixed(2)}%
      </span>
    </div>
  );
};

const ConnectionStatus = () => {
  const { connectionStatus } = usePrice();
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2A3038] bg-[#1A1A1A]">
      {connectionStatus === 'Connected' ? (
        <>
          <Wifi className="w-4 h-4 text-[#00FF41]" />
          <span className="text-xs font-bold text-[#00FF41]">LIVE</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-[#FF3B30]" />
          <span className="text-xs font-bold text-[#FF3B30]">OFFLINE</span>
        </>
      )}
    </div>
  );
};

const TopBar = memo(({ selectedPair, onPairChange }) => {
  return (
    <div className="sticky top-0 z-30 border-b border-[#2A3038] backdrop-blur-xl bg-[#0F1419]/95 shadow-lg">
      <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <select
            value={selectedPair}
            onChange={(e) => onPairChange(e.target.value)}
            className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg border border-[#2A3038] focus:outline-none focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/30 font-bold transition-all"
          >
            {TRADING_PAIRS.map((pair) => (
              <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>
          <TickerDisplay selectedPair={selectedPair} />
        </div>
        <div className="flex items-center gap-4">
          <ConnectionStatus />
        </div>
      </div>
    </div>
  );
});

export default TopBar;