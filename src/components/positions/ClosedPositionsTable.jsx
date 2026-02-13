import React from 'react';
import { Eye, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ClosedPositionsTable = ({ positions, onViewDetails, onReopen }) => {
  if (positions.length === 0) {
    return (
      <div className="text-center py-16 bg-[#1A1F26] rounded-xl border border-dashed border-[#2A3038]">
        <p className="text-[#A0A9B8]">No closed positions found in history.</p>
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
            <th className="px-6 py-4">Entry / Exit</th>
            <th className="px-6 py-4">Final P/L</th>
            <th className="px-6 py-4">Duration</th>
            <th className="px-6 py-4">Reason</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A3038]">
          {positions.map((pos) => {
            const isLong = pos.direction === 'LONG' || pos.direction === 'BUY';
            const durationMs = pos.exitTime - pos.timestamp;
            const durationMins = Math.floor(durationMs / 60000);
            const durationHours = Math.floor(durationMins / 60);

            let durationStr = `${durationMins}m`;
            if (durationHours > 0) durationStr = `${durationHours}h ${durationMins % 60}m`;

            return (
              <tr key={pos.id} className="hover:bg-[#252B33] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-white">{pos.symbol}</span>
                    <span className="text-xs text-[#A0A9B8]">{pos.type} Bot</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                    isLong ? 'bg-[#00FF41]/10 text-[#00FF41]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                  }`}>
                    {pos.direction}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#A0A9B8] text-xs">
                  {durationStr}
                </td>
                <td className="px-6 py-4 text-[#A0A9B8] text-xs">
                  <span className="px-2 py-1 bg-[#1A1F26] rounded border border-[#2A3038]">
                    {pos.exitReason || 'Manual'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-[#A0A9B8] hover:text-white hover:bg-[#252B33]"
                      onClick={() => onViewDetails(pos)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-[#9D4EDD] hover:text-[#9D4EDD] hover:bg-[#9D4EDD]/20"
                      onClick={() => onReopen(pos)}
                      title="Reopen Similar"
                    >
                      <RotateCw className="h-4 w-4" />
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

export default ClosedPositionsTable;