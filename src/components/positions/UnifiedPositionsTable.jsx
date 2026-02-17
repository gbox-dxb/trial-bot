import React, { useState, useMemo, useEffect } from 'react';
import { useUnifiedPositions } from '@/hooks/useUnifiedPositions';
import { usePrice } from '@/contexts/PriceContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  XCircle, PauseCircle, PlayCircle, Search, Filter,
  ArrowUpDown, MoreHorizontal, Edit, Trash2, Layers, Bot, FileText, Info
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { storage } from '@/lib/storage';
import { orderPlacementService } from '@/lib/orderPlacementService';
import { calculateUnrealizedPnL } from '@/lib/pnlUtils';
import { motion, AnimatePresence } from 'framer-motion';
import RSIBotOrderDetailsModal from '@/components/bots/RSIBotOrderDetailsModal';

export default function UnifiedPositionsTable({ defaultFilter = 'All', showHistory = false }) {
  const { positions, loading, refresh } = useUnifiedPositions();
  const { prices } = usePrice();
  const { toast } = useToast();

  // State
  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupByType, setGroupByType] = useState(false);
  const [sortBy, setSortBy] = useState({ key: 'timestamp', direction: 'desc' });
  const [expandedMenu, setExpandedMenu] = useState(null);

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Persist preferences
  useEffect(() => {
    const saved = localStorage.getItem('unifiedTablePrefs');
    if (saved) {
      const prefs = JSON.parse(saved);
      if (prefs.activeFilter) setActiveFilter(prefs.activeFilter);
      if (prefs.groupByType !== undefined) setGroupByType(prefs.groupByType);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('unifiedTablePrefs', JSON.stringify({ activeFilter, groupByType }));
  }, [activeFilter, groupByType]);

  // Calculations
  const getPnL = (pos) => {
    if (pos.type === 'LIMIT' || pos.entryPrice === 0) return { pnl: 0, percent: 0 };

    const currentPrice = prices[pos.symbol] || pos.entryPrice;

    if (pos.type === 'MARKET' || pos.type === 'DCA') {
      const isLong = pos.side === 'LONG' || pos.side === 'BUY' || pos.side === 'Long';
      const diff = isLong ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
      const sizeCoins = pos.size / pos.entryPrice;
      const pnl = diff * sizeCoins;
      const invested = pos.invested || 1;
      const percent = (pnl / invested) * 100;
      return { pnl, percent };
    }

    return { pnl: 0, percent: 0 };
  };

  // Filtering & Sorting
  const filteredPositions = useMemo(() => {
    let filtered = positions.filter(p => {
      // 1. History Filter
      const isHistory = ['CLOSED', 'FILLED', 'CANCELLED', 'EXPIRED'].includes(p.status);
      if (showHistory && !isHistory) return false;
      if (!showHistory && isHistory) return false;

      // 2. Type Filter
      if (activeFilter !== 'All') {
        if (activeFilter === 'Market Orders' && p.type !== 'MARKET') return false;
        if (activeFilter === 'Limit Orders' && p.type !== 'LIMIT') return false;
        if (activeFilter === 'Bot Orders' && !p.botId) return false;
        if (activeFilter === 'Manual Orders' && p.botId) return false;

        // Specific Bot types
        if (activeFilter === 'Grid Bots' && p.type !== 'GRID') return false;
        if (activeFilter === 'DCA Bots' && p.type !== 'DCA') return false;
      }

      // 3. Search
      if (searchQuery) {
        return p.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      let valA, valB;
      switch (sortBy.key) {
        case 'symbol': valA = a.symbol; valB = b.symbol; break;
        case 'type': valA = a.type; valB = b.type; break;
        case 'pnl':
          valA = getPnL(a).pnl;
          valB = getPnL(b).pnl;
          break;
        case 'entryPrice': valA = a.entryPrice; valB = b.entryPrice; break;
        case 'status': valA = a.status; valB = b.status; break;
        default: valA = a.timestamp; valB = b.timestamp;
      }

      if (typeof valA === 'string') {
        return sortBy.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortBy.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [positions, activeFilter, searchQuery, sortBy, prices, showHistory]);

  // Grouping
  const groupedPositions = useMemo(() => {
    if (!groupByType) return { 'All': filteredPositions };

    return filteredPositions.reduce((groups, pos) => {
      const group = pos.botId ? 'Bot Orders' : pos.type;
      if (!groups[group]) groups[group] = [];
      groups[group].push(pos);
      return groups;
    }, {});
  }, [filteredPositions, groupByType]);

  // Actions
  const handleClosePosition = async (pos) => {
    if (!confirm(`Are you sure you want to close this ${pos.symbol} position?`)) return;

    if (pos.type === 'MARKET') {
      const currentPrice = prices[pos.symbol] || pos.entryPrice;
      const pnlData = getPnL(pos);

      const closedOrder = {
        ...pos.originalData,
        exitPrice: currentPrice,
        closedAt: Date.now(),
        finalPnL: pnlData.pnl,
        status: 'CLOSED',
        exitReason: 'Manual Close'
      };

      storage.saveClosedOrder(closedOrder);
      storage.deleteActiveOrder(pos.id);
      toast({ title: "Position Closed", description: `Closed ${pos.symbol} with PnL: $${pnlData.pnl.toFixed(2)}` });
    } else if (pos.type === 'DCA') {
      const bots = storage.getDCABots();
      const bot = bots.find(b => b.id === pos.id);
      if (bot) {
        bot.status = 'closed';
        bot.closedAt = Date.now();
        storage.saveDCABots(bots.map(b => b.id === pos.id ? bot : b));
        toast({ title: "DCA Bot Closed", description: "Bot has been stopped and marked as closed." });
      }
    }
    refresh();
  };

  const handleCancelOrder = (pos) => {
    if (!confirm(`Cancel this ${pos.type} order?`)) return;

    if (pos.type === 'LIMIT') {
      storage.deleteActiveOrder(pos.id);
      toast({ title: "Order Cancelled", description: "Limit order removed." });
    } else if (['GRID', 'DCA', 'RSI', 'MOMENTUM', 'CANDLE_STRIKE'].includes(pos.type)) {
      if (pos.type === 'GRID') storage.deleteGridBot(pos.id);
      if (pos.type === 'DCA') storage.deleteDCABot(pos.id);
      if (pos.type === 'RSI') storage.deleteRSIBot(pos.id);
      if (pos.type === 'MOMENTUM') storage.deleteMomentumBot(pos.id);
      if (pos.type === 'CANDLE_STRIKE') storage.deleteCandleStrikeBot(pos.id);
      toast({ title: "Bot Deleted", description: `${pos.type} Bot removed.` });
    }
    refresh();
  };

  const handleToggleBot = (pos) => {
    toast({ title: "Status Updated", description: `${pos.type} bot status toggled (Simulation)` });
  };

  const handleSort = (key) => {
    setSortBy(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleViewDetails = (pos) => {
    // Check if it's an RSI order (manual or bot) or any other supported type
    const original = pos.originalData || pos;
    if (original.rsiMetadata || original.templateMetadata) {
      setSelectedOrder(original);
      setIsDetailsModalOpen(true);
    } else {
      toast({ title: "Details", description: "Standard order details not implemented yet." });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/20 shadow-glow-green';
      case 'PENDING': return 'bg-[#00D9FF]/10 text-[#00D9FF] border-[#00D9FF]/20 shadow-glow-cyan';
      case 'STOPPED': case 'PAUSED': return 'bg-[#FF6B35]/10 text-[#FF6B35] border-[#FF6B35]/20';
      case 'CLOSED': case 'FILLED': return 'bg-[#252B33]/50 text-[#A0A9B8] border-custom';
      case 'CANCELLED': return 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20';
      default: return 'bg-[#252B33] text-[#A0A9B8]';
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'MARKET': return 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30';
      case 'LIMIT': return 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30';
      case 'GRID': return 'bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/30';
      case 'DCA': return 'bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/30';
      default: return 'bg-[#252B33] text-[#A0A9B8] border border-custom';
    }
  };

  if (loading) return <div className="p-8 text-center text-[#A0A9B8]">Loading positions...</div>;

  return (
    <>
      <RSIBotOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={selectedOrder}
      />

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#0F1419]/50 p-4 rounded-xl border border-custom">
          <div className="flex flex-wrap gap-2">
            {['All', 'Market Orders', 'Bot Orders', 'Manual Orders'].map(filter => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className={activeFilter === filter ? 'bg-[#9D4EDD] text-white hover:bg-[#8B3FCC] shadow-glow-purple font-bold' : 'text-[#A0A9B8] hover:text-white'}
              >
                {filter}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#A0A9B8]" />
              <Input
                placeholder="Search symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#1A1F26] border-custom h-9 text-white focus:border-[#00D9FF]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 border-custom ${groupByType ? 'bg-[#9D4EDD]/20 border-[#9D4EDD]/50 text-[#9D4EDD]' : 'bg-[#1A1F26] text-[#A0A9B8]'} hover:text-white hover:bg-[#252B33]`}
              onClick={() => setGroupByType(!groupByType)}
              title="Group by Type"
            >
              <Layers className="h-4 w-4 mr-2" /> Group
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="space-y-6">
          {Object.entries(groupedPositions).map(([groupName, groupData]) => (
            groupData.length > 0 && (
              <div key={groupName} className="space-y-2">
                {groupByType && (
                  <div className="flex items-center gap-2 px-2">
                    <span className={`h-2 w-2 rounded-full ${getTypeBadgeColor(groupName).split(' ')[0]}`}></span>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{groupName}</h3>
                    <Badge variant="secondary" className="text-[10px] h-5 bg-[#252B33] text-[#A0A9B8]">{groupData.length}</Badge>
                  </div>
                )}

                <div className="rounded-xl border border-custom overflow-hidden bg-[#1A1F26] backdrop-blur-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#0F1419]/90 text-xs uppercase text-[#A0A9B8] font-bold">
                      <tr>
                        <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('symbol')}>Pair <ArrowUpDown className="inline w-3 h-3 ml-1" /></th>
                        <th className="px-4 py-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('type')}>Type <ArrowUpDown className="inline w-3 h-3 ml-1" /></th>
                        <th className="px-4 py-3">Source & Template</th>
                        <th className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('size')}>Size <ArrowUpDown className="inline w-3 h-3 ml-1" /></th>
                        <th className="px-4 py-3">TP / SL</th>
                        <th className="px-4 py-3 text-right">Prices</th>
                        <th className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pnl')}>PnL <ArrowUpDown className="inline w-3 h-3 ml-1" /></th>
                        <th className="px-4 py-3 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>Status <ArrowUpDown className="inline w-3 h-3 ml-1" /></th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-custom">
                      <AnimatePresence>
                        {groupData.map((pos, index) => {
                          //console.log('pos', pos);

                          const { pnl, percent } = getPnL(pos);
                          const currentPrice = prices[pos.symbol] || pos.entryPrice;
                          const sourceLabel = orderPlacementService.getOrderSource(pos.originalData || pos);
                          const original = pos.originalData || pos;

                          let rowKey = pos.uniqueId;
                          if (!rowKey || rowKey.includes('undefined')) {
                            rowKey = pos.id || `${pos.type}-${pos.symbol}-${pos.entryPrice}-${pos.timestamp || index}`;
                          }

                          return (
                            <motion.tr
                              key={rowKey}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-[#252B33] transition-colors group"
                            >
                              <td className="px-4 py-3 font-medium text-white">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    {pos.symbol}
                                    {pos.side && pos.side !== 'Neutral' && (
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] px-1.5 py-0 border ${['LONG', 'BUY', 'Long'].includes(pos.side)
                                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                                          : "border-red-500/30 text-red-400 bg-red-500/10"
                                          }`}
                                      >
                                        {pos.side} {pos.leverage}x
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getTypeBadgeColor(pos.type)}`}>
                                  {pos.type}
                                </span>
                              </td>

                              {/* Source / Template Column */}
                              <td className="px-4 py-3">
                                <div
                                  className="flex flex-col gap-0.5 cursor-pointer hover:bg-[#252B33] p-1 -ml-1 rounded transition-colors"
                                  onClick={() => handleViewDetails(pos)}
                                >
                                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                                    {pos.botId ? <Bot className="w-3 h-3 text-[#00D9FF]" /> : <FileText className="w-3 h-3 text-[#9D4EDD]" />}
                                    <span className="truncate max-w-[120px] font-medium">{sourceLabel}</span>
                                  </div>
                                  {original.templateMetadata && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#A0A9B8]">
                                      <Layers className="w-2.5 h-2.5" />
                                      <span className="truncate max-w-[120px]">{original.templateMetadata.name}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-3 text-right font-mono">
                                <div className="flex flex-col">
                                  <span className="text-white">${pos.size ? pos.size.toFixed(2) : '0.00'}</span>
                                  <span className="text-[10px] text-slate-500">
                                    Margin used: ${(pos.size / (pos.leverage || 1)).toFixed(2)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-mono font-medium text-slate-200 text-xs">
                                    {pos.tp && Object.entries(pos.tp).map(([key, value]) => (
                                      <span key={key} className="mr-1">
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {pos.sl && Object.entries(pos.sl).map(([key, value]) => (
                                      <span key={key} className="mr-1">
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-[#A0A9B8]">
                                <div className="flex flex-col text-xs font-mono">
                                  <div className="flex justify-between w-24 ml-auto">
                                    <span className="text-slate-500">Entry:</span>
                                    <span className="text-slate-200">${pos.entryPrice > 0 ? pos.entryPrice.toFixed(2) : '-'}</span>
                                  </div>
                                  <div className="flex justify-between w-24 ml-auto">
                                    <span className="text-slate-500">Curr:</span>
                                    <span className={pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                                      ${currentPrice ? currentPrice.toFixed(2) : '-'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {pos.type === 'MARKET' || pos.type === 'DCA' ? (
                                  <div className={`flex flex-col items-end ${pnl >= 0 ? 'text-[#00FF41]' : 'text-[#FF3B30]'}`}>
                                    <span className="font-bold font-mono">${pnl.toFixed(2)}</span>
                                    <span className="text-[10px] opacity-80 font-mono">{percent.toFixed(2)}%</span>
                                  </div>
                                ) : (
                                  <span className="text-[#A0A9B8]">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(pos.status)}`}>
                                  {pos.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  {(pos.status === 'ACTIVE' || pos.status === 'PENDING' || pos.status === 'STOPPED') && (
                                    <>
                                      {pos.status === 'STOPPED' || pos.status === 'PAUSED' ? (
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-[#00FF41] hover:bg-[#00FF41]/10 hover:text-[#00FF41]" onClick={() => handleToggleBot(pos)} title="Resume">
                                          <PlayCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      ) : (
                                        (pos.type !== 'MARKET' && pos.type !== 'LIMIT') && (
                                          <Button size="icon" variant="ghost" className="h-7 w-7 text-[#FF6B35] hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]" onClick={() => handleToggleBot(pos)} title="Pause">
                                            <PauseCircle className="h-3.5 w-3.5" />
                                          </Button>
                                        )
                                      )}
                                      {pos.type === 'MARKET' ? (
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-[#FF3B30] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]" onClick={() => handleClosePosition(pos)} title="Close Position">
                                          <XCircle className="h-3.5 w-3.5" />
                                        </Button>
                                      ) : (
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-[#FF3B30] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]" onClick={() => handleCancelOrder(pos)} title={pos.type === 'LIMIT' ? 'Cancel Order' : 'Delete Bot'}>
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </>
                                  )}
                                  <div className="relative">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-[#00D9FF] hover:text-[#00D9FF] hover:bg-[#00D9FF]/10"
                                      onClick={() => handleViewDetails(pos)}
                                      title="View Details"
                                    >
                                      <Info className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ))}

          {filteredPositions.length === 0 && (
            <div className="text-center py-12 bg-[#1A1F26] rounded-xl border border-dashed border-custom">
              <Filter className="mx-auto h-8 w-8 text-[#A0A9B8] mb-2" />
              <p className="text-[#A0A9B8]">No positions found matching your filters.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}