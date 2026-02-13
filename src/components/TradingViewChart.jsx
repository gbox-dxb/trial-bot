import React, { useEffect, useRef } from 'react';

let tvScriptLoadingPromise;

export default function TradingViewChart({ 
  symbol = 'BTCUSDT', 
  interval = '60',
  theme = 'Dark',
  autosize = true,
  studies = [],
  containerId = 'tradingview_widget',
  watchlist = [
    "BINANCE:BTCUSDT",
    "BINANCE:ETHUSDT",
    "BINANCE:BNBUSDT",
    "BINANCE:SOLUSDT",
    "BINANCE:XRPUSDT"
  ]
}) {
  const onLoadScriptRef = useRef();

  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-loading-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(() => onLoadScriptRef.current && onLoadScriptRef.current());

    return () => {
      onLoadScriptRef.current = null;
    };

    function createWidget() {
      if (document.getElementById(containerId) && 'TradingView' in window) {
        // Map common studies to TradingView study strings if needed, or pass directly
        const formattedStudies = studies.map(s => {
             // Handle simple names by mapping them to TV basic studies if they aren't already formatted
             if (s === 'RSI') return "RSI@tv-basicstudies";
             if (s === 'MACD') return "MACD@tv-basicstudies";
             if (s === 'MA') return "MASimple@tv-basicstudies";
             if (s === 'BB') return "BB@tv-basicstudies";
             if (s === 'Stoch') return "StochasticRSI@tv-basicstudies";
             return s;
        });

        new window.TradingView.widget({
          autosize: autosize,
          symbol: `BINANCE:${symbol}`,
          interval: interval,
          timezone: "Etc/UTC",
          theme: theme,
          style: "1", // 1 = Candles
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          allow_symbol_change: true, // Allow user to change inside widget too
          container_id: containerId,
          hide_side_toolbar: false, // Show drawing tools
          details: true, // Show details widget
          hotlist: true, // Show hotlist widget
          calendar: true, // Show calendar
          watchlist: watchlist,
          studies: formattedStudies,
          withdateranges: true,
          hide_volume: false,
          popup_width: "1000",
          popup_height: "650",
        });
      }
    }
  }, [symbol, interval, studies, theme, watchlist, containerId]);

  return (
    <div className='tradingview-widget-container w-full h-full' style={{ height: "100%", width: "100%" }}>
      <div id={containerId} className='h-full w-full' />
    </div>
  );
}