import React, { useEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/material';
import { createChart } from 'lightweight-charts';

const CapitalChart = ({ performance = [] }) => {
  const theme = useTheme();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Check if performance is an array
    const performanceData = Array.isArray(performance) ? performance : [];

    // If no data, generate some default data
    const defaultData = performanceData.length === 0 ? [
      { date: '2025-05-01', capital: 12 },
      { date: '2025-05-02', capital: 14.2 },
      { date: '2025-05-03', capital: 16.4 },
      { date: '2025-05-04', capital: 18.6 },
      { date: '2025-05-05', capital: 20.8 }
    ] : performanceData;

    // Clear previous chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: theme.palette.text.primary,
        fontFamily: 'Rajdhani, sans-serif',
      },
      grid: {
        vertLines: { color: alpha(theme.palette.divider, 0.1) },
        horzLines: { color: alpha(theme.palette.divider, 0.1) },
      },
      rightPriceScale: {
        borderColor: theme.palette.divider,
      },
      timeScale: {
        borderColor: theme.palette.divider,
        timeVisible: true,
      },
      crosshair: {
        vertLine: {
          color: alpha(theme.palette.primary.main, 0.5),
          width: 1,
          style: 1,
          visible: true,
          labelVisible: true,
        },
        horzLine: {
          color: alpha(theme.palette.primary.main, 0.5),
          width: 1,
          style: 1,
          visible: true,
          labelVisible: true,
        },
        mode: 1,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
    });

    // Add area series
    const areaSeries = chart.addAreaSeries({
      topColor: alpha(theme.palette.primary.main, 0.4),
      bottomColor: alpha(theme.palette.primary.main, 0.0),
      lineColor: theme.palette.primary.main,
      lineWidth: 2,
    });

    // Format data for the chart
    const formattedData = defaultData.map(item => ({
      time: item.date,
      value: item.capital,
    }));

    // Set data
    areaSeries.setData(formattedData);

    // Fit content
    chart.timeScale().fitContent();

    // Save chart reference
    chartRef.current = chart;

    // Resize handler
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [performance, theme]);

  // Helper function for alpha
  function alpha(color, value) {
    return color + Math.round(value * 255).toString(16).padStart(2, '0');
  }

  return (
    <Box
      ref={chartContainerRef}
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    />
  );
};

export default CapitalChart;
