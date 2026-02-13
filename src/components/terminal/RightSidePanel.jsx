import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Clock, Send, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ExchangeAccountSelector from '@/components/terminal/ExchangeAccountSelector';
import PairsMultiSelect from '@/components/terminal/PairsMultiSelect';
import DirectionToggle from '@/components/terminal/DirectionToggle';
import OrderTypeSelector from '@/components/terminal/OrderTypeSelector';
import LeverageSlider from '@/components/terminal/LeverageSlider';
import InvestmentSection from '@/components/terminal/InvestmentSection';
import RiskManagementPanel from '@/components/terminal/RiskManagementPanel';

export default function RightSidePanel({
  accountId, setAccountId,
  pairs, setPairs,
  direction, setDirection,
  directionApplyAll, setDirectionApplyAll,
  perCoinDirection, setPerCoinDirection,
  orderType, setOrderType,
  entryPrice, setEntryPrice,
  priceApplyAll, setPriceApplyAll,
  perCoinPrice, setPerCoinPrice,
  leverage, setLeverage,
  leverageApplyAll, setLeverageApplyAll,
  perCoinLeverage, setPerCoinLeverage,
  maxLeverage,
  baseOrderSize, setBaseOrderSize,
  sizeMode, setSizeMode,
  customAllocation, setCustomAllocation,
  perCoinSize, setPerCoinSize,
  availableBalance,
  requiredMargin,
  takeProfitEnabled, setTakeProfitEnabled,
  stopLossEnabled, setStopLossEnabled,
  takeProfitMode, setTakeProfitMode,
  stopLossMode, setStopLossMode,
  takeProfit, setTakeProfit,
  stopLoss, setStopLoss,
  applyTPToAll, setApplyTPToAll,
  applySLToAll, setApplySLToAll,
  perCoinTP, setPerCoinTP,
  perCoinSL, setPerCoinSL,
  onSaveTemplate,
  onSavePending,
  onPlaceOrder,
  loadedTemplateId 
}) {
  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] border border-custom shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-custom bg-[#0F1419] flex items-center justify-between">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
           Place Order
           {loadedTemplateId && <Badge className="bg-[#00FF41]/20 text-[#00FF41] border border-[#00FF41]/30 text-[10px] font-bold">Template Active</Badge>}
        </h2>
        {pairs.length > 0 && (
             <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-[#A0A9B8] hover:text-white hover:bg-[#252B33]"
                onClick={() => setPairs([])}
             >
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
             </Button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        
        {/* 1. Account Selection */}
        <section>
          <ExchangeAccountSelector 
            value={accountId}
            onChange={setAccountId}
            balance={availableBalance} // Passing the actual balance to selector for display
          />
        </section>

        {/* 2. Asset & Direction Grouped */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-px flex-1 bg-[#2A3038]"></span>
            <span className="text-[10px] font-bold text-[#A0A9B8] uppercase tracking-widest">Asset & Direction</span>
            <span className="h-px flex-1 bg-[#2A3038]"></span>
          </div>
          
          <PairsMultiSelect
            accountId={accountId}
            value={pairs}
            onChange={setPairs}
          />
          
          <DirectionToggle
            globalDirection={direction}
            onGlobalDirectionChange={setDirection}
            applyToAll={directionApplyAll}
            onApplyToAllChange={setDirectionApplyAll}
            perCoinDirection={perCoinDirection}
            onPerCoinDirectionChange={(pair, dir) => setPerCoinDirection({ ...perCoinDirection, [pair]: dir })}
            pairs={pairs}
          />
        </section>

        {/* 3. Order Type */}
        <section className="pt-2 border-t border-[#2A3038]">
          <OrderTypeSelector
            orderType={orderType}
            onOrderTypeChange={setOrderType}
            globalPrice={entryPrice}
            onGlobalPriceChange={setEntryPrice}
            applyToAll={priceApplyAll}
            onApplyToAllChange={setPriceApplyAll}
            perCoinPrice={perCoinPrice}
            onPerCoinPriceChange={(pair, price) => setPerCoinPrice({ ...perCoinPrice, [pair]: price })}
            pairs={pairs}
          />
        </section>

        {/* 4. Leverage */}
        <section className="pt-2 border-t border-[#2A3038]">
          <LeverageSlider
            globalLeverage={leverage}
            onGlobalLeverageChange={setLeverage}
            applyToAll={leverageApplyAll}
            onApplyToAllChange={setLeverageApplyAll}
            perCoinLeverage={perCoinLeverage}
            onPerCoinLeverageChange={(pair, lev) => setPerCoinLeverage({ ...perCoinLeverage, [pair]: lev })}
            pairs={pairs}
            maxLeverage={maxLeverage}
            entryPrice={entryPrice}
            perCoinPrice={perCoinPrice}
            direction={direction}
            perCoinDirection={perCoinDirection}
            orderSize={baseOrderSize}
            perCoinSize={perCoinSize}
          />
        </section>

        {/* 5. Investment */}
        <section className="pt-2 border-t border-[#2A3038]">
          <InvestmentSection
            availableBalance={availableBalance}
            baseOrderSize={baseOrderSize}
            onBaseOrderSizeChange={setBaseOrderSize}
            sizeMode={sizeMode}
            onSizeModeChange={setSizeMode}
            perCoinSize={perCoinSize}
            onPerCoinSizeChange={setPerCoinSize}
            pairs={pairs}
            customAllocation={customAllocation}
            onCustomAllocationChange={setCustomAllocation}
            requiredMargin={requiredMargin}
          />
        </section>

        {/* 6. Risk Management */}
        <section className="pt-2 border-t border-[#2A3038]">
          <RiskManagementPanel
            takeProfitEnabled={takeProfitEnabled}
            onTakeProfitEnabledChange={setTakeProfitEnabled}
            stopLossEnabled={stopLossEnabled}
            onStopLossEnabledChange={setStopLossEnabled}
            takeProfitMode={takeProfitMode}
            onTakeProfitModeChange={setTakeProfitMode}
            takeProfit={takeProfit}
            onTakeProfitChange={setTakeProfit}
            stopLossMode={stopLossMode}
            onStopLossModeChange={setStopLossMode}
            stopLoss={stopLoss}
            onStopLossChange={setStopLoss}
            applyTPToAll={applyTPToAll}
            onApplyTPToAllChange={setApplyTPToAll}
            applySLToAll={applySLToAll}
            onApplySLToAllChange={setApplySLToAll}
            perCoinTP={perCoinTP}
            onPerCoinTPChange={setPerCoinTP}
            perCoinSL={perCoinSL}
            onPerCoinSLChange={setPerCoinSL}
            pairs={pairs}
            entryPrice={entryPrice}
            perCoinPrice={perCoinPrice}
            direction={direction}
            perCoinDirection={perCoinDirection}
            orderSize={baseOrderSize}
            perCoinSize={perCoinSize}
            leverage={leverage}
            perCoinLeverage={perCoinLeverage}
          />
        </section>
        
        {/* Spacer for bottom actions */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Action Buttons (Fixed) */}
      <div className="p-4 border-t border-custom bg-[#0F1419]/95 space-y-3 z-10 backdrop-blur">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={onSaveTemplate}
            variant="outline" 
            className="w-full border-[#00FF41]/30 text-[#00FF41] hover:bg-[#00FF41]/10 hover:text-[#00FF41] transition-all font-bold"
            disabled={!direction} 
          >
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
          
          <Button 
            onClick={onSavePending}
            className="w-full bg-[#00D9FF] hover:bg-[#00B8E0] text-[#0F1419] font-bold transition-all shadow-glow-cyan"
            disabled={pairs.length === 0}
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending Order
          </Button>
        </div>
        
        <Button 
          onClick={onPlaceOrder}
          className={`w-full font-bold py-6 text-lg shadow-lg transition-all transform hover:scale-[1.01] ${
            direction === 'Long' ? 'bg-[#00FF41] hover:bg-[#00E039] text-[#0F1419] shadow-glow-green' : 'bg-[#FF3B30] hover:bg-[#E6342B] text-white shadow-glow-orange'
          }`}
          disabled={pairs.length === 0 || !accountId}
        >
          <Send className="w-5 h-5 mr-2" />
          {direction === 'Long' ? 'Place Long Order' : 'Place Short Order'}
        </Button>
      </div>
    </div>
  );
}