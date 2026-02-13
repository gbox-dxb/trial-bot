import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import { cn } from '@/lib/utils';

export default function PerformanceChart({ data, className, height = 300, type = 'area' }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: height,
      layout: { background: { color: 'transparent' }, textColor: '#9CA3AF' },
      grid: {
        vertLines: { color: 'rgba(139, 92, 246, 0.05)' },
        horzLines: { color: 'rgba(139, 92, 246, 0.05)' },
      },
      timeScale: { borderColor: 'rgba(139, 92, 246, 0.1)', timeVisible: true },
      rightPriceScale: { borderColor: 'rgba(139, 92, 246, 0.1)' },
      crosshair: { mode: 1 },
      handleScale: { mouseWheel: false },
    });

    chartRef.current = chart;

    let series;
    if (type === 'area') {
        series = chart.addAreaSeries({
            lineColor: '#8B5CF6',
            topColor: 'rgba(139, 92, 246, 0.4)',
            bottomColor: 'rgba(139, 92, 246, 0.0)',
        });
    } else {
        series = chart.addLineSeries({
            color: '#10B981',
            lineWidth: 2
        });
    }

    // Sort and ensure unique times for lightweight charts
    const sortedData = [...data]
        .sort((a, b) => a.time - b.time)
        .filter((item, index, self) => 
            index === self.findIndex((t) => t.time === item.time)
        );

    series.setData(sortedData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height, type]);

  return <div ref={containerRef} className={cn("w-full", className)} />;
}