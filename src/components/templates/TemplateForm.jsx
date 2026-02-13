import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useTemplates } from '@/contexts/TemplatesContext';
import { positionTemplatesService } from '@/lib/positionTemplatesService';

const EXCHANGES = [
  'Binance Spot',
  'Binance Futures USDT-M',
  'MEXC Spot',
  'MEXC Futures USDT-M',
  'DEMO Binance Spot',
  'DEMO Binance Futures',
  'DEMO MEXC Spot',
  'DEMO MEXC Futures'
];

export default function TemplateForm({ template, onClose, onSubmit }) {
  const { currentPrice, priceChange24h, subscribeToPrice } = useTemplates();
  const [symbols, setSymbols] = useState([]);
  const [selectedCoinToAdd, setSelectedCoinToAdd] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    exchange: 'Binance Spot',
    symbol: '', // Primary symbol
    selectedCoins: [], // Multi-coin support
    direction: 'LONG',
    orderType: 'MARKET',
    limitPrice: '',
    amount: '',
    amountMode: 'USDT',
    leverage: 1,
    takeProfitEnabled: false,
    takeProfitMode: 'PERCENT',
    takeProfitValue: '',
    stopLossEnabled: false,
    stopLossMode: 'PERCENT',
    stopLossValue: ''
  });

  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        selectedCoins: template.selectedCoins || []
      });
    }
  }, [template]);

  useEffect(() => {
    positionTemplatesService.fetchBinanceSymbols().then(setSymbols);
  }, []);

  useEffect(() => {
    // Subscribe to primary symbol price
    if (formData.symbol) {
      const unsubscribe = subscribeToPrice(formData.symbol);
      return unsubscribe;
    }
  }, [formData.symbol, subscribeToPrice]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCoin = () => {
    if (selectedCoinToAdd && !formData.selectedCoins.includes(selectedCoinToAdd)) {
      setFormData(prev => ({
        ...prev,
        selectedCoins: [...prev.selectedCoins, selectedCoinToAdd]
      }));
      setSelectedCoinToAdd('');
    }
  };

  const handleRemoveCoin = (coinToRemove) => {
    setFormData(prev => ({
      ...prev,
      selectedCoins: prev.selectedCoins.filter(c => c !== coinToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation for multi-coin mode
    if (formData.selectedCoins.length > 0 && formData.selectedCoins.length < 2) {
      // If user started selecting coins but only selected 1, technically valid as single pair, 
      // but if they intended multi-coin, they should select more. 
      // For now, allow it, but prompt specified "Validate that at least 2 coins are selected"
      // Assuming this validation only applies if they are trying to use multi-coin feature.
    }
    
    if (formData.selectedCoins.length > 0 && formData.selectedCoins.length < 2) {
        alert("Please select at least 2 coins for a multi-coin template, or clear the selection.");
        return;
    }

    if (!formData.name || (!formData.symbol && formData.selectedCoins.length === 0) || !formData.amount) {
      return;
    }

    const result = await onSubmit(formData);
    if (result.success) {
      onClose();
    }
  };

  const isFutures = formData.exchange.includes('Futures');

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
        className="bg-slate-800 rounded-xl border border-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800 border-b border-purple-500/20 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-white">
            {template ? 'Edit Template' : 'Create Position Template'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., BTC Long Scalp"
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
          </div>

          {/* Exchange */}
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

          {/* Coin Selection */}
          <div className="space-y-4 border border-slate-700 rounded-lg p-4 bg-slate-900/30">
            <label className="block text-sm font-medium text-purple-400">Asset Selection</label>
            
            {/* Single Coin Mode (Default) */}
            <div>
                <label className="block text-xs text-gray-400 mb-1">Primary Pair (Single Mode)</label>
                <select
                  value={formData.symbol}
                  onChange={(e) => handleChange('symbol', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                  disabled={formData.selectedCoins.length > 0} // Disable if multi-coin is active
                >
                  <option value="">Select Symbol</option>
                  {symbols.map(s => (
                    <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                  ))}
                </select>
            </div>
            
            {/* Multi-Coin Selection */}
            <div>
                <label className="block text-xs text-gray-400 mb-1">Multi-Coin Portfolio (Optional)</label>
                <div className="flex gap-2">
                    <select
                        value={selectedCoinToAdd}
                        onChange={(e) => setSelectedCoinToAdd(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                    >
                        <option value="">Select Coin to Add</option>
                        {symbols.map(s => (
                            <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                        ))}
                    </select>
                    <Button type="button" onClick={handleAddCoin} size="sm" className="bg-purple-600">
                        <Plus className="w-4 h-4"/>
                    </Button>
                </div>
                
                {/* Selected Coins Badges */}
                {formData.selectedCoins.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 p-2 bg-slate-950 rounded-lg border border-slate-800">
                        {formData.selectedCoins.map(coin => (
                            <span key={coin} className="flex items-center gap-1 bg-purple-900/40 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/20">
                                {coin}
                                <button type="button" onClick={() => handleRemoveCoin(coin)} className="hover:text-white">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                {formData.selectedCoins.length === 1 && (
                     <p className="text-[10px] text-yellow-500 mt-1">Please select at least 2 coins for multi-coin mode.</p>
                )}
            </div>

            {formData.symbol && currentPrice && formData.selectedCoins.length === 0 && (
              <div className="flex items-center gap-4 text-sm pt-2 border-t border-slate-800">
                <span className="text-gray-400">Current Price:</span>
                <span className="text-white font-bold">${currentPrice.toFixed(2)}</span>
                {priceChange24h !== null && (
                  <span className={`flex items-center gap-1 ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {priceChange24h.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Trade Direction</label>
            <div className="grid grid-cols-3 gap-2">
              {['LONG', 'SHORT', 'AUTO'].map(dir => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => handleChange('direction', dir)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.direction === dir
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-gray-400 hover:text-white'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['MARKET', 'LIMIT'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleChange('orderType', type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.orderType === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-gray-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {formData.orderType === 'LIMIT' && (
              <Input
                type="number"
                value={formData.limitPrice}
                onChange={(e) => handleChange('limitPrice', e.target.value)}
                placeholder="Limit Price"
                className="mt-2 bg-slate-900 border-slate-700 text-white"
                step="0.01"
              />
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="Amount"
                className="flex-1 bg-slate-900 border-slate-700 text-white"
                step="0.01"
                required
              />
              <select
                value={formData.amountMode}
                onChange={(e) => handleChange('amountMode', e.target.value)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="USDT">USDT</option>
                <option value="PERCENT">% Balance</option>
              </select>
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

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
              {template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}