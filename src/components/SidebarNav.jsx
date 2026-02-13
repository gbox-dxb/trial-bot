import React, { useState, useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Building2, BarChart3, Briefcase, 
  Terminal as TerminalIcon, Bot, TrendingUp, Grid3x3, 
  Target, Repeat, Activity, Settings, LogOut, ChevronDown, 
  X, Menu, LineChart, Zap, Sparkles, Droplets
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NavItem = memo(({ item, locationPath, onItemClick }) => {
  if (item.type === 'header') {
    return (
      <div className="px-4 mt-6 mb-3 text-xs font-bold text-[#6B7280] uppercase tracking-wider">
        {item.name}
      </div>
    );
  }

  if (item.isGroup) {
    return (
      <div className="mb-1">
        <button 
          onClick={item.toggle} 
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 transition-all rounded-lg group",
            "text-[#A0A9B8] hover:bg-[#1A1F26] hover:text-white"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5 text-[#A0A9B8] group-hover:text-white transition-colors" />
            <span className="font-medium">{item.name}</span>
          </div>
          <ChevronDown 
            className={cn(
              "w-4 h-4 transition-transform duration-200 text-[#6B7280]",
              item.isOpen && "rotate-180 text-white"
            )} 
          />
        </button>
        <AnimatePresence>
          {item.isOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              transition={{ duration: 0.2 }} 
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children.map(child => {
                  const isActive = locationPath === child.href;
                  return (
                    <Link 
                      key={child.href} 
                      to={child.href} 
                      onClick={onItemClick} 
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ml-2 relative",
                        isActive 
                          ? "bg-[#9D4EDD] text-white shadow-[0_0_15px_rgba(157,78,221,0.5)]" 
                          : "text-[#A0A9B8] hover:bg-[#1A1F26] hover:text-white"
                      )}
                    >
                      <child.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#A0A9B8]")} />
                      <span className="text-sm font-medium">{child.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const isActive = locationPath === item.href;
  return (
    <Link 
      to={item.href} 
      onClick={onItemClick} 
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-1",
        isActive 
          ? "bg-[#9D4EDD] text-white shadow-[0_0_15px_rgba(157,78,221,0.5)] font-medium" 
          : "text-[#A0A9B8] hover:bg-[#1A1F26] hover:text-white"
      )}
    >
      <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-[#A0A9B8] group-hover:text-white")} />
      <span className="font-medium">{item.name}</span>
    </Link>
  );
});

const ProPlanCard = () => (
  <div className="mt-6 mx-4 p-4 rounded-xl bg-gradient-to-br from-[#1A1F26] to-[#0F1419] border border-[#2A3038] relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
      <Zap className="w-16 h-16 text-[#9D4EDD]" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-[#9D4EDD]/20 text-[#9D4EDD]">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-bold text-white text-sm">Pro Plan</span>
      </div>
      <p className="text-xs text-[#A0A9B8] mb-3 leading-relaxed">
        Unlock unlimited bots, advanced analytics, and priority support.
      </p>
      <Button 
        size="sm" 
        className="w-full bg-[#9D4EDD] hover:bg-[#8B3FCC] text-white font-bold text-xs h-8 shadow-glow-purple"
      >
        Upgrade Now
      </Button>
    </div>
  </div>
);

const SidebarNav = memo(({ isSidebarOpen, setIsSidebarOpen, handleLogout }) => {
  const location = useLocation();
  const [isTradingBotsOpen, setIsTradingBotsOpen] = useState(true);
  const [isManualTradingOpen, setIsManualTradingOpen] = useState(true);
  
  const toggleTradingBots = useCallback(() => setIsTradingBotsOpen(prev => !prev), []);
  const toggleManualTrading = useCallback(() => setIsManualTradingOpen(prev => !prev), []);
  const handleItemClick = useCallback(() => setIsSidebarOpen(false), [setIsSidebarOpen]);
  
  const navigation = [
    { type: 'header', name: 'Platform' },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Exchanges', href: '/exchanges', icon: Building2 },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Positions', href: '/positions', icon: Briefcase },
    
    { type: 'header', name: 'Trading Engine' },
    {
      name: 'Manual Trading',
      icon: TerminalIcon,
      isGroup: true,
      isOpen: isManualTradingOpen,
      toggle: toggleManualTrading,
      children: [
        { name: 'Terminal', href: '/terminal', icon: TerminalIcon },
        { name: 'Advanced Chart', href: '/chart', icon: LineChart }
      ]
    },
    {
      name: 'Bot Strategies',
      icon: Bot,
      isGroup: true,
      isOpen: isTradingBotsOpen,
      toggle: toggleTradingBots,
      children: [
        { name: 'Liquidity', href: '/bots/liquidity', icon: Droplets },
        { name: 'Price Momentum', href: '/bots/momentum', icon: TrendingUp },
        { name: 'Grid Strategy', href: '/bots/grid', icon: Grid3x3 },
        { name: 'Candle Strike', href: '/bots/candle-strike', icon: Target },
        { name: 'DCA Strategy', href: '/bots/dca', icon: Repeat },
        { name: 'RSI Strategy', href: '/bots/rsi', icon: Activity }
      ]
    },
    
    { type: 'header', name: 'Configuration' },
    { name: 'Settings', href: '/settings', icon: Settings }
  ];
  
  return (
    <>
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#9D4EDD] text-white shadow-glow-purple"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside 
            initial={{ x: -280 }} 
            animate={{ x: 0 }} 
            exit={{ x: -280 }} 
            transition={{ type: 'spring', damping: 20, stiffness: 100 }} 
            className="fixed left-0 top-0 h-full w-72 border-r border-[#2A3038] z-40 bg-[#0F1419] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-2 flex-none">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00D9FF] to-[#9D4EDD] bg-clip-text text-transparent filter drop-shadow-[0_0_10px_rgba(0,217,255,0.3)]">
                GBOX Bot
              </h1>
            </div>

            {/* Scrollable Navigation */}
            <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
              <nav>
                {navigation.map((item, index) => (
                  <NavItem 
                    key={item.name || index} 
                    item={item} 
                    locationPath={location.pathname} 
                    onItemClick={handleItemClick} 
                  />
                ))}
              </nav>
              
              <ProPlanCard />
            </div>

            {/* Footer / Logout */}
            <div className="p-4 flex-none border-t border-[#2A3038] bg-[#0F1419]">
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-3 px-4 py-3 text-[#FF3B30] hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] transition-all rounded-lg font-medium group"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Sign out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30" onClick={() => setIsSidebarOpen(false)} />
      )}
    </>
  );
});

export default SidebarNav;