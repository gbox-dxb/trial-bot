import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { usePrice } from '@/contexts/PriceContext';
import { exchangeService } from '@/lib/exchangeService';
import { orderValidationUtils } from '@/lib/orderValidationUtils';
import { orderDraftService } from '@/lib/orderDraftService';
import { templateService } from '@/lib/templateService';
import RightSidePanel from '@/components/terminal/RightSidePanel';
import OrderConfirmationModal from '@/components/terminal/OrderConfirmationModal';
import TemplateSaveDialog from '@/components/terminal/TemplateSaveDialog';
import SavedTemplatesSection from '@/components/terminal/SavedTemplatesSection';
import PendingOrdersSection from '@/components/terminal/PendingOrdersSection';
import ActiveOrdersSection from '@/components/terminal/ActiveOrdersSection';
import Chart from '@/components/Chart';

export default function Terminal() {
  const { prices } = usePrice();
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Account & Pairs
  const [accountId, setAccountId] = useState('');
  const [pairs, setPairs] = useState([]);

  // Direction
  const [direction, setDirection] = useState('LONG');
  const [directionApplyAll, setDirectionApplyAll] = useState(true);
  const [perCoinDirection, setPerCoinDirection] = useState({});

  // Order Type & Price
  const [orderType, setOrderType] = useState('Market');
  const [entryPrice, setEntryPrice] = useState(0);
  const [priceApplyAll, setPriceApplyAll] = useState(true);
  const [perCoinPrice, setPerCoinPrice] = useState({});

  // Leverage
  const [leverage, setLeverage] = useState(10);
  const [leverageApplyAll, setLeverageApplyAll] = useState(true);
  const [perCoinLeverage, setPerCoinLeverage] = useState({});
  const [maxLeverage, setMaxLeverage] = useState(125);

  // Investment
  const [baseOrderSize, setBaseOrderSize] = useState(500);
  const [sizeMode, setSizeMode] = useState('USDT');
  const [customAllocation, setCustomAllocation] = useState(false);
  const [perCoinSize, setPerCoinSize] = useState({});
  const [availableBalance, setAvailableBalance] = useState(0);

  // Risk Management
  const [takeProfitEnabled, setTakeProfitEnabled] = useState(true);
  const [stopLossEnabled, setStopLossEnabled] = useState(true);
  const [takeProfitMode, setTakeProfitMode] = useState('PROFIT');
  const [stopLossMode, setStopLossMode] = useState('LOSS');
  const [takeProfit, setTakeProfit] = useState({ profit: 0, percent: 10, price: 0 });
  const [stopLoss, setStopLoss] = useState({ loss: 0, percent: 1, price: 0 });
  const [applyTPToAll, setApplyTPToAll] = useState(true);
  const [applySLToAll, setApplySLToAll] = useState(true);
  const [perCoinTP, setPerCoinTP] = useState({});
  const [perCoinSL, setPerCoinSL] = useState({});

  // Modals & UI State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [loadedTemplateId, setLoadedTemplateId] = useState(null);

  // Custom handler for account selection to update balance immediately
  const handleAccountChange = (newAccountId, accountData) => {
    setAccountId(newAccountId);

    // If we have the full account data with balance, use it immediately
    if (accountData && accountData.balance !== undefined) {
      setAvailableBalance(parseFloat(accountData.balance));

      // Update max leverage if available
      if (accountData.exchange) {
        const config = exchangeService.getExchangeConfig(accountData.exchange);
        setMaxLeverage(config.maxLeverage);
      }
    } else {
      // Fallback to service fetch
      const balance = exchangeService.getAccountBalance('user-1', newAccountId);
      setAvailableBalance(balance.available);

      const leverageRange = exchangeService.getLeverageRange(newAccountId);
      setMaxLeverage(leverageRange.max);
    }
  };

  // Sync effect as backup and for leverage checks
  useEffect(() => {
    if (accountId) {
      // We only fetch if balance is 0 to avoid overwriting the immediate update
      // or if we need to refresh fresh data
      if (availableBalance === 0) {
        const balance = exchangeService.getAccountBalance('user-1', accountId);
        setAvailableBalance(balance.available);
      }

      const leverageRange = exchangeService.getLeverageRange(accountId);
      setMaxLeverage(leverageRange.max);

      if (leverage > leverageRange.max) {
        setLeverage(leverageRange.max);
      }
    }
  }, [accountId, leverage]);

  // Auto-update entry price for market orders
  useEffect(() => {
    if (orderType === 'Market' && pairs.length > 0) {
      setEntryPrice(prices[pairs[0]] || 0);
    }
  }, [orderType, pairs, prices]);

  // Calculate required margin
  const requiredMargin = useMemo(() => {
    return orderValidationUtils.calculateTotalMargin({
      pairs,
      baseOrderSize,
      leverage,
      entryPrice,
      perCoinPrice,
      perCoinSize,
      perCoinLeverage
    }, prices);
  }, [pairs, baseOrderSize, leverage, entryPrice, perCoinPrice, perCoinSize, perCoinLeverage, prices]);

  // Load configuration from Template or Pending Order
  const loadConfiguration = (inputData, type = 'template') => {
    // Extract config object
    let config = {};
    let selectedCoins = [];

    if (type === 'template') {
      config = inputData.config || {};
      selectedCoins = inputData.selectedCoins || [];
      setLoadedTemplateId(inputData.id);
    } else {
      config = inputData;
      selectedCoins = inputData.pairs || [];
      setLoadedTemplateId(null);
    }

    // Restore Selected Coins (if any)
    if (selectedCoins && selectedCoins.length > 0) {
      setPairs(selectedCoins);
    }

    // Common fields
    if (config.direction) setDirection(config.direction);
    if (config.directionApplyAll !== undefined) setDirectionApplyAll(config.directionApplyAll);
    if (config.perCoinDirection) setPerCoinDirection(config.perCoinDirection);

    if (config.orderType) setOrderType(config.orderType);
    if (config.entryPrice) setEntryPrice(config.entryPrice);
    if (config.priceApplyAll !== undefined) setPriceApplyAll(config.priceApplyAll);
    if (config.perCoinPrice) setPerCoinPrice(config.perCoinPrice);

    if (config.leverage) setLeverage(config.leverage);
    if (config.leverageApplyAll !== undefined) setLeverageApplyAll(config.leverageApplyAll);
    if (config.perCoinLeverage) setPerCoinLeverage(config.perCoinLeverage);

    if (config.sizeMode) setSizeMode(config.sizeMode);
    if (config.baseOrderSize) setBaseOrderSize(config.baseOrderSize);
    if (config.perCoinSize) setPerCoinSize(config.perCoinSize);

    if (config.takeProfitEnabled !== undefined) setTakeProfitEnabled(config.takeProfitEnabled);
    if (config.stopLossEnabled !== undefined) setStopLossEnabled(config.stopLossEnabled);
    if (config.takeProfitMode) setTakeProfitMode(config.takeProfitMode);
    if (config.stopLossMode) setStopLossMode(config.stopLossMode);
    if (config.takeProfit) setTakeProfit(config.takeProfit);
    if (config.stopLoss) setStopLoss(config.stopLoss);
    if (config.applyTPToAll !== undefined) setApplyTPToAll(config.applyTPToAll);
    if (config.applySLToAll !== undefined) setApplySLToAll(config.applySLToAll);
    if (config.perCoinTP) setPerCoinTP(config.perCoinTP);
    if (config.perCoinSL) setPerCoinSL(config.perCoinSL);

    // Pending Order specific
    if (type === 'pending') {
      if (config.accountId) {
        setAccountId(config.accountId);
        // Trigger balance fetch for this account
        const balance = exchangeService.getAccountBalance('user-1', config.accountId);
        setAvailableBalance(balance.available);
      }

      toast({
        title: "Pending Order Loaded",
        description: "Configuration loaded from pending order.",
        className: "bg-purple-900 border-custom text-white"
      });
    } else {
      toast({
        title: "Template Loaded",
        description: `"${inputData.name || 'Template'}" applied successfully.`,
        className: "bg-emerald-900 border-custom text-white"
      });
    }
  };

  const handleSelectTemplate = (template) => {
    loadConfiguration(template, 'template');
  };

  const handleEditPendingOrder = (order) => {
    loadConfiguration(order, 'pending');
  };

  const handleExecutePendingOrder = (order) => {
    loadConfiguration(order, 'pending');
    setTimeout(() => setShowConfirmModal(true), 100);
  };

  const handleSaveTemplate = ({ name, description, selectedCoins }) => {
    const template = {
      name,
      description,
      selectedCoins, // Save coins at top level
      config: {
        direction, directionApplyAll, perCoinDirection,
        orderType, entryPrice, priceApplyAll, perCoinPrice,
        leverage, leverageApplyAll, perCoinLeverage,
        sizeMode, baseOrderSize, perCoinSize,
        takeProfitEnabled, stopLossEnabled,
        takeProfitMode, stopLossMode,
        takeProfit, stopLoss,
        applyTPToAll, applySLToAll, perCoinTP, perCoinSL
      }
    };

    templateService.saveTemplate(template);
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Template Saved',
      description: `"${name}" saved successfully`,
      className: "bg-emerald-900 border-custom text-white"
    });
    setShowTemplateDialog(false);
  };

  const handleSavePendingOrder = () => {
    if (!accountId) {
      toast({ variant: 'destructive', title: 'Account Required', description: 'Please select an exchange account.' });
      return;
    }
    if (pairs.length === 0) {
      toast({ variant: 'destructive', title: 'Pairs Required', description: 'Please select at least one trading pair.' });
      return;
    }

    const draft = {
      accountId, pairs, direction, directionApplyAll, perCoinDirection,
      orderType, entryPrice, priceApplyAll, perCoinPrice,
      leverage, leverageApplyAll, perCoinLeverage,
      baseOrderSize, sizeMode, perCoinSize,
      takeProfitEnabled, stopLossEnabled, takeProfit, stopLoss,
      perCoinTP, perCoinSL, priceSnapshot: { ...prices }
    };

    orderDraftService.saveDraft(draft);
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: 'Pending Order Saved',
      description: 'Order saved for later execution',
      className: "bg-blue-900 border-custom text-white"
    });
  };

  const handlePlaceOrder = () => {
    const validation = orderValidationUtils.validateOrderConfig({
      accountId, pairs, baseOrderSize, leverage, perCoinLeverage,
      entryPrice, perCoinPrice, takeProfitEnabled, stopLossEnabled,
      takeProfit, stopLoss, perCoinTP, perCoinSL
    }, availableBalance, prices);

    if (!validation.valid) {
      toast({ variant: 'destructive', title: 'Validation Failed', description: validation.errors.join(', ') });
      return;
    }
    setShowConfirmModal(true);
  };

  const orderConfig = {
    accountId, pairs, direction, perCoinDirection, orderType, entryPrice, perCoinPrice,
    leverage, perCoinLeverage, baseOrderSize, perCoinSize,
    takeProfitEnabled, stopLossEnabled, takeProfit, stopLoss, perCoinTP, perCoinSL, requiredMargin
  };

  return (
    <div className="flex flex-col bg-[#0F1419] overflow-hidden">
      <Helmet>
        <title>Terminal - Pro Trading</title>
        <meta name="description" content="Professional trading terminal with multi-pair order execution" />
      </Helmet>

      <div className="flex-1 flex flex-col gap-4 p-4 min-h-0 overflow-y-auto">
        {/* Top Section: Charts & Order Form */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[500px]">
          {/* Left Side: Chart & Templates */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="flex-1 bg-slate-900/30 rounded-xl overflow-hidden shadow-xl border border-custom relative min-h-[300px]">
              <div className="absolute top-4 left-4 z-10 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-md border border-custom">
                <span className="text-slate-400 text-xs mr-2">Market Price</span>
                <span className="text-white font-bold font-mono">
                  ${pairs[0] && prices[pairs[0]] ? prices[pairs[0]].toFixed(2) : '---'}
                </span>
              </div>
              <Chart
                symbol={pairs[0] || 'BTCUSDT'}
                coins={pairs}
                onRemoveCoin={(coin) => setPairs(prev => prev.filter(p => p !== coin))}
              />
            </div>

            <div className="flex-none h-[200px] grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
              <SavedTemplatesSection
                onSelectTemplate={handleSelectTemplate}
                refreshTrigger={refreshTrigger}
              />
              <PendingOrdersSection
                onEditOrder={handleEditPendingOrder}
                onExecuteOrder={handleExecutePendingOrder}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>

          {/* Right Side: Place Order Panel */}
          <div className="w-full lg:w-[380px] xl:w-[420px] flex-none rounded-xl overflow-hidden border border-custom shadow-xl bg-slate-900/50 flex flex-col h-full">
            <RightSidePanel
              accountId={accountId} setAccountId={handleAccountChange}
              pairs={pairs} setPairs={setPairs}
              direction={direction} setDirection={setDirection}
              directionApplyAll={directionApplyAll} setDirectionApplyAll={setDirectionApplyAll}
              perCoinDirection={perCoinDirection} setPerCoinDirection={setPerCoinDirection}
              orderType={orderType} setOrderType={setOrderType}
              entryPrice={entryPrice} setEntryPrice={setEntryPrice}
              priceApplyAll={priceApplyAll} setPriceApplyAll={setPriceApplyAll}
              perCoinPrice={perCoinPrice} setPerCoinPrice={setPerCoinPrice}
              leverage={leverage} setLeverage={setLeverage}
              leverageApplyAll={leverageApplyAll} setLeverageApplyAll={setLeverageApplyAll}
              perCoinLeverage={perCoinLeverage} setPerCoinLeverage={setPerCoinLeverage}
              maxLeverage={maxLeverage}
              baseOrderSize={baseOrderSize} setBaseOrderSize={setBaseOrderSize}
              sizeMode={sizeMode} setSizeMode={setSizeMode}
              customAllocation={customAllocation} setCustomAllocation={setCustomAllocation}
              perCoinSize={perCoinSize} setPerCoinSize={setPerCoinSize}
              availableBalance={availableBalance}
              requiredMargin={requiredMargin}
              takeProfitEnabled={takeProfitEnabled} setTakeProfitEnabled={setTakeProfitEnabled}
              stopLossEnabled={stopLossEnabled} setStopLossEnabled={setStopLossEnabled}
              takeProfitMode={takeProfitMode} setTakeProfitMode={setTakeProfitMode}
              stopLossMode={stopLossMode} setStopLossMode={setStopLossMode}
              takeProfit={takeProfit} setTakeProfit={setTakeProfit}
              stopLoss={stopLoss} setStopLoss={setStopLoss}
              applyTPToAll={applyTPToAll} setApplyTPToAll={setApplyTPToAll}
              applySLToAll={applySLToAll} setApplySLToAll={setApplySLToAll}
              perCoinTP={perCoinTP} setPerCoinTP={setPerCoinTP}
              perCoinSL={perCoinSL} setPerCoinSL={setPerCoinSL}
              onSaveTemplate={() => setShowTemplateDialog(true)}
              onSavePending={handleSavePendingOrder}
              onPlaceOrder={handlePlaceOrder}
              loadedTemplateId={loadedTemplateId}
            />
          </div>
        </div>

        {/* Bottom Section: Active Orders */}
        <div className="flex-none h-[350px] min-h-[250px] w-full">
          <ActiveOrdersSection
            refreshTrigger={refreshTrigger}
            className="h-full"
          />
        </div>
      </div>

      <OrderConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        orderConfig={orderConfig}
        prices={prices}
        onSuccess={() => {
          setPairs([]);
          setLoadedTemplateId(null);
          setRefreshTrigger(prev => prev + 1); // Trigger refresh for Active Orders
          toast({
            title: "Orders Executed",
            description: "Your positions have been opened successfully.",
            className: "bg-emerald-900 border-custom text-white"
          });
        }}
      />

      <TemplateSaveDialog
        isOpen={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSave={handleSaveTemplate}
        selectedCoins={pairs}
      />
    </div>
  );
}