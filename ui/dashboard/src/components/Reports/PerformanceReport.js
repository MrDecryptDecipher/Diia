import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Divider, 
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

const PerformanceReport = ({ timeframe, startDate, endDate }) => {
  // Mock data for the report
  const performanceData = {
    totalReturn: '+24.8%',
    sharpeRatio: '2.87',
    maxDrawdown: '-8.2%',
    winRate: '72.4%',
    totalTrades: 128,
    profitFactor: '3.2',
    averageWin: '+2.1%',
    averageLoss: '-0.9%',
    bestTrade: '+8.7%',
    worstTrade: '-3.2%',
    averageHoldingTime: '3.2 days',
    tradingFrequency: '10.5/week'
  };
  
  const monthlyPerformance = [
    { month: 'January', return: '+3.2%', trades: 12, winRate: '75.0%' },
    { month: 'February', return: '+4.7%', trades: 15, winRate: '80.0%' },
    { month: 'March', return: '-1.2%', trades: 10, winRate: '60.0%' },
    { month: 'April', return: '+5.8%', trades: 18, winRate: '77.8%' },
    { month: 'May', return: '+2.9%', trades: 14, winRate: '71.4%' },
    { month: 'June', return: '+6.1%', trades: 20, winRate: '75.0%' }
  ];
  
  const assetPerformance = [
    { asset: 'BTC/USDT', return: '+18.7%', trades: 32, winRate: '75.0%' },
    { asset: 'ETH/USDT', return: '+22.3%', trades: 28, winRate: '78.6%' },
    { asset: 'SOL/USDT', return: '+31.5%', trades: 25, winRate: '80.0%' },
    { asset: 'BNB/USDT', return: '+15.2%', trades: 22, winRate: '68.2%' },
    { asset: 'ADA/USDT', return: '+12.8%', trades: 21, winRate: '66.7%' }
  ];
  
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, color: '#003366', fontWeight: 'bold' }}>
        Performance Report
      </Typography>
      
      <Typography variant="subtitle1" sx={{ mb: 3, color: '#666' }}>
        Generated on: {new Date().toLocaleDateString()} | 
        Timeframe: {timeframe}
        {startDate && endDate ? ` (${startDate} - ${endDate})` : ''}
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
        Executive Summary
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        This report provides a comprehensive analysis of the OMNI-ALPHA trading system's performance
        over the selected timeframe. The system has demonstrated robust performance with consistent
        profitability and risk management. The quantum components have significantly enhanced prediction
        accuracy, leading to improved trade execution and overall returns.
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Equity Curve Chart
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Monthly Returns Chart
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
        Key Performance Indicators
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
              {performanceData.totalReturn}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Return
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
              {performanceData.sharpeRatio}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sharpe Ratio
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
              {performanceData.maxDrawdown}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Max Drawdown
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#9C27B0', fontWeight: 'bold' }}>
              {performanceData.winRate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Win Rate
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
            Trading Statistics
          </Typography>
          
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">Total Trades</TableCell>
                  <TableCell align="right">{performanceData.totalTrades}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Profit Factor</TableCell>
                  <TableCell align="right">{performanceData.profitFactor}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Average Win</TableCell>
                  <TableCell align="right">{performanceData.averageWin}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Average Loss</TableCell>
                  <TableCell align="right">{performanceData.averageLoss}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Best Trade</TableCell>
                  <TableCell align="right">{performanceData.bestTrade}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Worst Trade</TableCell>
                  <TableCell align="right">{performanceData.worstTrade}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Average Holding Time</TableCell>
                  <TableCell align="right">{performanceData.averageHoldingTime}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Trading Frequency</TableCell>
                  <TableCell align="right">{performanceData.tradingFrequency}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Drawdown Chart
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
        Monthly Performance
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell align="right">Return</TableCell>
              <TableCell align="right">Trades</TableCell>
              <TableCell align="right">Win Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {monthlyPerformance.map((row) => (
              <TableRow key={row.month}>
                <TableCell component="th" scope="row">{row.month}</TableCell>
                <TableCell align="right" sx={{ 
                  color: row.return.startsWith('+') ? '#4CAF50' : '#F44336',
                  fontWeight: 'bold'
                }}>
                  {row.return}
                </TableCell>
                <TableCell align="right">{row.trades}</TableCell>
                <TableCell align="right">{row.winRate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
        Asset Performance
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell align="right">Return</TableCell>
                  <TableCell align="right">Trades</TableCell>
                  <TableCell align="right">Win Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assetPerformance.map((row) => (
                  <TableRow key={row.asset}>
                    <TableCell component="th" scope="row">{row.asset}</TableCell>
                    <TableCell align="right" sx={{ 
                      color: row.return.startsWith('+') ? '#4CAF50' : '#F44336',
                      fontWeight: 'bold'
                    }}>
                      {row.return}
                    </TableCell>
                    <TableCell align="right">{row.trades}</TableCell>
                    <TableCell align="right">{row.winRate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Asset Performance Chart
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
        Recommendations
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 1 }}>
        Based on the analysis, the following recommendations are provided:
      </Typography>
      
      <ul>
        <li>Increase allocation to the Quantum Pattern Recognition strategy by 5%</li>
        <li>Optimize the Hyperdimensional Correlator parameters for improved performance</li>
        <li>Implement additional risk management controls for volatile market conditions</li>
        <li>Consider expanding to additional asset classes for improved diversification</li>
      </ul>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
        This report was generated by the OMNI-ALPHA VΩ∞∞ system. 
        For more information, please contact the system administrator.
      </Typography>
    </Box>
  );
};

export default PerformanceReport;
