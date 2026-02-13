import React, { useEffect, useState, useRef } from 'react';

const LiquidityOverlay = ({ chart, series, candles, liquidityData, showPriceLabels = true }) => {
  const [overlays, setOverlays] = useState([]);
  const canvasRef = useRef(null);
  
  // Use a canvas overlay instead of SVG for better performance on drag/zoom
  // Or SVG for ease of text rendering. Let's use SVG.
  
  useEffect(() => {
    if (!chart || !series || !candles || candles.length === 0 || !liquidityData) return;

    const updateOverlay = () => {
      const timeScale = chart.timeScale();
      const newOverlays = [];
      const visibleRange = timeScale.getVisibleRange();
      
      if (!visibleRange) return;

      // Current visible width in pixels (approximate if we don't have container width, but we are inside relative container)
      // Actually we need to just map logical indices or times to coordinates.
      
      const { zones, swingHighs, swingLows } = liquidityData;
      
      // 1. Render Zones
      zones.forEach(zone => {
        // Start coordinate
        const x1 = timeScale.timeToCoordinate(zone.time);
        
        // End coordinate - Extend to latest candle
        const latestCandle = candles[candles.length - 1];
        const x2 = timeScale.timeToCoordinate(latestCandle.time);

        // Price coordinates
        const yTop = series.priceToCoordinate(zone.upper);
        const yBottom = series.priceToCoordinate(zone.lower);

        if (x1 !== null && x2 !== null && yTop !== null && yBottom !== null) {
          // Check if partially visible
          // Simple visibility check handled by browser clipping usually, but logic helps
          newOverlays.push({
            type: 'zone',
            key: `zone-${zone.type}-${zone.swingIndex}`,
            x: x1,
            y: yTop, // SVG y is top-down
            width: Math.max(x2 - x1, 1), // Extend to right
            height: Math.abs(yBottom - yTop),
            fill: zone.color,
            lineY: zone.type === 'BSLQ' ? yBottom : yTop, // The swing level line
            lineColor: zone.color,
            lineWidth: x2 - x1
          });
        }
      });

      // 2. Render Labels (SH/SL)
      // We process both highs and lows
      const processLabel = (item, type) => {
        const x = timeScale.timeToCoordinate(item.time);
        const y = series.priceToCoordinate(item.price);
        
        if (x !== null && y !== null) {
           newOverlays.push({
             type: 'label',
             key: `label-${type}-${item.index}`,
             x: x,
             y: y,
             text: type === 'high' ? 'SH' : 'SL',
             price: item.price,
             isHigh: type === 'high'
           });
        }
      };

      swingHighs.forEach(h => processLabel(h, 'high'));
      swingLows.forEach(l => processLabel(l, 'low'));

      setOverlays(newOverlays);
    };

    // Subscribe to changes
    const handleTimeScaleChange = () => {
       requestAnimationFrame(updateOverlay);
    };

    chart.timeScale().subscribeVisibleTimeRangeChange(handleTimeScaleChange);
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleTimeScaleChange); // Better for zoom
    
    // Initial update
    setTimeout(updateOverlay, 100);

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleTimeScaleChange);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleTimeScaleChange);
    };
  }, [chart, series, candles, liquidityData]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <svg className="w-full h-full">
        {overlays.map((item) => {
          if (item.type === 'zone') {
            return (
              <g key={item.key}>
                {/* Zone Area */}
                <rect 
                  x={item.x} 
                  y={item.y} 
                  width={item.width} 
                  height={item.height} 
                  fill={item.fill}
                />
                {/* Dotted Line at Swing Level */}
                <line 
                  x1={item.x} 
                  y1={item.lineY} 
                  x2={item.x + item.lineWidth} 
                  y2={item.lineY} 
                  stroke={item.lineColor} 
                  strokeWidth="1" 
                  strokeDasharray="4 2" 
                />
              </g>
            );
          }
          
          if (item.type === 'label') {
            return (
              <g key={item.key}>
                 <text
                   x={item.x}
                   y={item.isHigh ? item.y - 10 : item.y + 20}
                   fill="white"
                   textAnchor="middle"
                   fontSize="10"
                   fontWeight="bold"
                   style={{ textShadow: '0px 1px 2px black' }}
                 >
                   {item.text}
                 </text>
                 {showPriceLabels && (
                   <text
                    x={item.x}
                    y={item.isHigh ? item.y - 22 : item.y + 32}
                    fill="#A0A9B8"
                    textAnchor="middle"
                    fontSize="9"
                   >
                     {item.price.toFixed(2)}
                   </text>
                 )}
              </g>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

export default LiquidityOverlay;