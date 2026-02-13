import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { positionTemplatesService } from '@/lib/positionTemplatesService';

const EXCHANGES = ['Binance', 'MEXC', 'DEMO Binance', 'DEMO MEXC'];
const SOURCES = ['Manual', 'Grid Bot', 'DCA Bot'];

export default function LimitOrderForm({ order, onClose, onSubmit }) {
  const [symbols, setSymbols] = useState([]);
  const [formData, setFormData] = useState({
    exchange: 'Binance',
    accountType: 'Spot',
    symbol: '',
    side: 'BUY',
    orderType: 'LIMIT',
    limitPrice: '',
    amount: '',
    leverage: 1,
    takeProfitEnabled: false,
    takeProfitMode: 'PERCENT',
    takeProfitValue: '',
    stopLossEnabled: false,
    stopLossMode: 'PERCENT',
    stopLossValue: '',
    source: 'Manual'
  });

  useEffect(() => {
    if (order) {
      setFormData(order);
    }
  }, [order]);

  useEffect(() => {
    positionTemplatesService.fetchBinanceSymbols().then(setSymbols);
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.limitPrice || !formData.amount) {
      return;
    }

    if (parseFloat(formData.limitPrice) <= 0 || parseFloat(formData.amount) <= 0) {
      return;
    }

    const result = await onSubmit(formData);
    if (result.success) {
      onClose();
    }
  };

  const isFutures = formData.accountType === 'Futures';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-800 rounded-xl border border-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800 border-b border-purple-500/20 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {order ? 'Edit Limit Order' : 'Create Limit Order'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Exchange & Account Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Exchange</label>
              <select
                value={formData.exchange}
                onChange={(e) => handleChange('exchange', e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                {EXCHANGES.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) => handleChange('accountType', e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="Spot">Spot</option>
                <option value="Futures">Futures</option>
              </select>
            </div>
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
            <select
              value={formData.symbol}
              onChange={(e) => handleChange('symbol', e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              required
            >
              <option value="">Select Symbol</option>
              {symbols.map(s => (
                <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
              ))}
            </select>
          </div>

          {/* Side */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Side</label>
            <div className="grid grid-cols-2 gap-2">
              {(isFutures ? ['LONG', 'SHORT'] : ['BUY', 'SELL']).map(side => (
                <button
                  key={side}
                  type="button"
                  onClick={() => handleChange('side', side)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.side === side
                      ? side === 'BUY' || side === 'LONG' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      : 'bg-slate-900 text-gray-400 hover:text-white'
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>

          {/* Limit Price & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Limit Price</label>
              <Input
                type="number"
                value={formData.limitPrice}
                onChange={(e) => handleChange('limitPrice', e.target.value)}
                placeholder="0.00"
                className="bg-slate-900 border-slate-700 text-white"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                className="bg-slate-900 border-slate-700 text-white"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Leverage (Futures only) */}
          {isFutures && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Leverage: {formData.leverage}x
              </label>
              <Slider
                value={[formData.leverage]}
                onValueChange={(val) => handleChange('leverage', val[0])}
                min={1}
                max={125}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Take Profit */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.takeProfitEnabled}
                onChange={(e) => handleChange('takeProfitEnabled', e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium text-gray-300">Take Profit</label>
            </div>
            
            {formData.takeProfitEnabled && (
              <div className="flex gap-2">
                <select
                  value={formData.takeProfitMode}
                  onChange={(e) => handleChange('takeProfitMode', e.target.value)}
                  className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="PERCENT">Percent</option>
                  <option value="PRICE">Price</option>
                  <option value="AMOUNT">Amount</option>
                </select>
                <Input
                  type="number"
                  value={formData.takeProfitValue}
                  onChange={(e) => handleChange('takeProfitValue', e.target.value)}
                  placeholder="TP Value"
                  className="flex-1 bg-slate-900 border-slate-700 text-white"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Stop Loss */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.stopLossEnabled}
                onChange={(e) => handleChange('stopLossEnabled', e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium text-gray-300">Stop Loss</label>
            </div>
            
            {formData.stopLossEnabled && (
              <div className="flex gap-2">
                <select
                  value={formData.stopLossMode}
                  onChange={(e) => handleChange('stopLossMode', e.target.value)}
                  className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="PERCENT">Percent</option>
                  <option value="PRICE">Price</option>
                  <option value="AMOUNT">Amount</option>
                </select>
                <Input
                  type="number"
                  value={formData.stopLossValue}
                  onChange={(e) => handleChange('stopLossValue', e.target.value)}
                  placeholder="SL Value"
                  className="flex-1 bg-slate-900 border-slate-700 text-white"
                  step="0.01"
                />
              </div>
            )}
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
            <select
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            >
              {SOURCES.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              {order ? 'Update Order' : 'Create Order'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}