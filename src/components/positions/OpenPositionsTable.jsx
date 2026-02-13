import React from 'react';
import { XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OpenPositionsTable = ({ positions, prices, onClosePosition, onViewDetails }) => {
  if (positions.length === 0) {
    return (
      <div className="text-center py-16 bg-[#1A1F26] rounded-xl border border-dashed border-[#2A3038]">
        <p className="text-[#A0A9B8]">No active positions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#2A3038] bg-[#1A1F26] backdrop-blur-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#0F1419]/90 text-[#A0A9B8] uppercase text-xs font-bold border-b border-[#2A3038]">
          <tr>
            <th className="px-6 py-4">Pair / Type</th>
            <th className="px-6 py-4">Side</th>
            <th className="px-6 py-4">Size</th>
            <th className="px-6 py-4">Entry Price</th>
            <th className="px-6 py-4">Mark Price</th>
            <th className="px-6 py-4">P/L (USDT)</th>
            <th className="px-6 py-4">P/L %</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A3038]">
          {positions.map((pos) => {
            const currentPrice = prices[pos.symbol] || pos.entryPrice;
            const isLong = pos.direction === 'LONG' || pos.direction === 'BUY';
            const diff = isLong ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
            const pnlValue = diff * pos.size;
            const pnlPercent = (pnlValue / (pos.entryPrice * pos.size)) * 100;

            return (
              <tr key={pos.id} className="hover:bg-[#252B33] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">{pos.symbol}</span>
                    <span className="text-xs text-[#A0A9B8] flex items-center gap-1">
                      {pos.type} Bot
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    isLong ? 'bg-[#00FF41]/10 text-[#00FF41]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                  }`}>
                    {pos.direction}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#A0A9B8]">
                  {pos.size.toFixed(4)}
                </td>
                <td className="px-6 py-4 text-[#A0A9B8] font-mono">
                  ${pos.entryPrice.toFixed(4)}
                </td>
                <td className="px-6 py-4 text-[#A0A9B8] font-mono">
                  ${currentPrice.toFixed(4)}
                </td>
                <td className={`px-6 py-4 font-mono font-bold ${pnlValue >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}`}>
                  ${pnlValue.toFixed(2)}
                </td>
                <td className={`px-6 py-4 font-mono font-bold ${pnlPercent >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}`}>
                  {pnlPercent.toFixed(2)}%
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-[#A0A9B8] hover:text-white hover:bg-[#252B33]"
                      onClick={() => onViewDetails(pos)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-[#FF3B30] hover:text-[#FF3B30] hover:bg-[#FF3B30]/20"
                      onClick={() => onClosePosition(pos)}
                      title="Close Position"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OpenPositionsTable;