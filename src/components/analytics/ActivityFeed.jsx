import React from 'react';
import { format } from 'date-fns';
import { ShoppingCart, Bot, Zap, XCircle } from 'lucide-react';

export default function ActivityFeed({ activities }) {
  const getIcon = (type) => {
    if (['MARKET', 'LIMIT', 'ORDER'].includes(type)) return <ShoppingCart className="h-4 w-4 text-blue-400" />;
    if (['BOT', 'GRID', 'DCA', 'RSI'].includes(type)) return <Bot className="h-4 w-4 text-purple-400" />;
    return <Zap className="h-4 w-4 text-yellow-400" />;
  };

  return (
    <div className="space-y-4">
      {activities.map((item, i) => (
        <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
          <div className="mt-1 p-2 rounded-full bg-slate-900 border border-slate-700">
            {getIcon(item.type || 'ORDER')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {item.symbol || item.pair || 'System'} 
              <span className="text-slate-400 mx-2">•</span>
              <span className={item.side === 'BUY' || item.side === 'LONG' ? 'text-green-400' : 'text-red-400'}>
                {item.side || item.type || 'Action'}
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
               {item.status || 'Executed'} • {item.size ? `Size: ${item.size}` : ''} {item.pnl ? `• PnL: $${item.pnl.toFixed(2)}` : ''}
            </p>
          </div>
          <div className="text-xs text-slate-500 whitespace-nowrap">
            {format(new Date(item.timestamp || item.createdAt || Date.now()), 'MMM d, HH:mm')}
          </div>
        </div>
      ))}
      {activities.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">No recent activity</div>
      )}
    </div>
  );
}