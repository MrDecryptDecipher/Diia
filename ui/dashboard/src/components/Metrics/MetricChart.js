import React from 'react';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const MetricChart = ({ 
  title, 
  data, 
  type = 'line', 
  dataKey, 
  xAxisKey = 'date',
  color,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  legendPosition = 'bottom',
  gradientColor = false,
  stacked = false,
  description
}) => {
  const theme = useTheme();
  const chartColor = color || theme.palette.primary.main;
  
  // Prepare gradient if needed
  const getGradient = (id) => {
    if (!gradientColor) return chartColor;
    
    return (
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
          <stop offset="95%" stopColor={chartColor} stopOpacity={0.1}/>
        </linearGradient>
      </defs>
    );
  };
  
  // Render appropriate chart type
  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {gradientColor && getGradient('colorGradient')}
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
              />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend align="center" verticalAlign={legendPosition} />}
              <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={chartColor} 
                fillOpacity={1} 
                fill={gradientColor ? "url(#colorGradient)" : chartColor}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
              />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend align="center" verticalAlign={legendPosition} />}
              <Bar 
                dataKey={dataKey} 
                fill={chartColor} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: theme.palette.divider }}
              />
              {showTooltip && <Tooltip />}
              {showLegend && <Legend align="center" verticalAlign={legendPosition} />}
              <Line 
                type="monotone" 
                dataKey={dataKey} 
                stroke={chartColor} 
                strokeWidth={2}
                dot={{ r: 3, fill: chartColor, strokeWidth: 1 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        {title}
      </Typography>
      
      {renderChart()}
      
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
};

export default MetricChart;
