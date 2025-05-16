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
  TableRow,
  Chip
} from '@mui/material';

const TradeAnalysisReport = ({ timeframe, startDate, endDate }) => {
  // Mock data for the report
  const tradeStats = {
    totalTrades: 128,
    winningTrades: 93,
    losingTrades: 35,
    winRate: '72.7%',
    profitFactor: '3.2',
    expectancy: '1.8%',
    averageWin: '+2.1%',
    averageLoss: '-0.9%',
    largestWin: '+8.7%',
    largestLoss: '-3.2%',
    averageHoldingTime: '3.2 days',
    averageRiskReward: '2.3:1'
  };
  
  const recentTrades = [
    { id: 'T-128', asset: 'BTC/USDT', type: 'Long', entry: '42,150.00', exit: '43,250.00', pnl: '+2.61%', date: '2023-06-15', status: 'Win' },
    { id: 'T-127', asset: 'ETH/USDT', type: 'Long', entry: '2,250.00', exit: '2,310.00', pnl: '+2.67%', date: '2023-06-14', status: 'Win' },
    { id: 'T-126', asset: 'SOL/USDT', type: 'Short', entry: '95.20', exit: '92.10', pnl: '+3.26%', date: '2023-06-13', status: 'Win' },
    { id: 'T-125', asset: 'BNB/USDT', type: 'Long', entry: '320.50', exit: '318.20', pnl: '-0.72%', date: '2023-06-12', status: 'Loss' },
    { id: 'T-124', asset: 'ADA/USDT', type: 'Long', entry: '0.385', exit: '0.402', pnl: '+4.42%', date: '2023-06-11', status: 'Win' },
    { id: 'T-123', asset: 'XRP/USDT', type: 'Short', entry: '0.520', exit: '0.505', pnl: '+2.88%', date: '2023-06-10', status: 'Win' },
    { id: 'T-122', asset: 'DOT/USDT', type: 'Long', entry: '5.85', exit: '5.92', pnl: '+1.20%', date: '2023-06-09', status: 'Win' },
    { id: 'T-121', asset: 'AVAX/USDT', type: 'Short', entry: '14.80', exit: '15.20', pnl: '-2.70%', date: '2023-06-08', status: 'Loss' },
    { id: 'T-120', asset: 'LINK/USDT', type: 'Long', entry: '6.25', exit: '6.48', pnl: '+3.68%', date: '2023-06-07', status: 'Win' },
    { id: 'T-119', asset: 'MATIC/USDT', type: 'Long', entry: '0.72', exit: '0.75', pnl: '+4.17%', date: '2023-06-06', status: 'Win' }
  ];
  
  const tradeDistribution = [
    { timeOfDay: '00:00 - 04:00', trades: 18, winRate: '66.7%', avgReturn: '+1.2%' },
    { timeOfDay: '04:00 - 08:00', trades: 25, winRate: '72.0%', avgReturn: '+1.8%' },
    { timeOfDay: '08:00 - 12:00', trades: 32, winRate: '75.0%', avgReturn: '+2.1%' },
    { timeOfDay: '12:00 - 16:00', trades: 28, winRate: '78.6%', avgReturn: '+2.3%' },
    { timeOfDay: '16:00 - 20:00', trades: 15, winRate: '73.3%', avgReturn: '+1.9%' },
    { timeOfDay: '20:00 - 00:00', trades: 10, winRate: '60.0%', avgReturn: '+0.8%' }
  ];
  
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, color: '#003366', fontWeight: 'bold' }}>
        Trade Analysis Report
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
        This report provides a detailed analysis of all trades executed by the OMNI-ALPHA trading system
        during the selected timeframe. The system has maintained a high win rate with excellent risk management,
        resulting in consistent profitability. The quantum and hyperdimensional components have significantly
        enhanced trade selection and timing.
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Trade P&L Distribution Chart
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Cumulative P&L Chart
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
        Trade Statistics
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
              {tradeStats.winRate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Win Rate
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#2196F3', fontWeight: 'bold' }}>
              {tradeStats.profitFactor}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Profit Factor
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
              {tradeStats.expectancy}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Expectancy
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} md={3}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: '#9C27B0', fontWeight: 'bold' }}>
              {tradeStats.averageRiskReward}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Risk:Reward
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
            Detailed Statistics
          </Typography>
          
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" scope="row">Total Trades</TableCell>
                  <TableCell align="right">{tradeStats.totalTrades}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Winning Trades</TableCell>
                  <TableCell align="right">{tradeStats.winningTrades}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Losing Trades</TableCell>
                  <TableCell align="right">{tradeStats.losingTrades}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Average Win</TableCell>
                  <TableCell align="right">{tradeStats.averageWin}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Average Loss</TableCell>
                  <TableCell align="right">{tradeStats.averageLoss}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Largest Win</TableCell>
                  <TableCell align="right">{tradeStats.largestWin}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Largest Loss</TableCell>
                  <TableCell align="right">{tradeStats.largestLoss}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" scope="row">Average Holding Time</TableCell>
                  <TableCell align="right">{tradeStats.averageHoldingTime}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Win/Loss Ratio by Asset Chart
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
        Recent Trades
      </Typography>
      
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Asset</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Entry</TableCell>
              <TableCell align="right">Exit</TableCell>
              <TableCell align="right">P&L</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentTrades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{trade.id}</TableCell>
                <TableCell>{trade.asset}</TableCell>
                <TableCell>
                  <Chip 
                    label={trade.type} 
                    size="small" 
                    color={trade.type === 'Long' ? 'success' : 'error'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">{trade.entry}</TableCell>
                <TableCell align="right">{trade.exit}</TableCell>
                <TableCell 
                  align="right" 
                  sx={{ 
                    color: trade.pnl.startsWith('+') ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold'
                  }}
                >
                  {trade.pnl}
                </TableCell>
                <TableCell>{trade.date}</TableCell>
                <TableCell>
                  <Chip 
                    label={trade.status} 
                    size="small" 
                    color={trade.status === 'Win' ? 'success' : 'error'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
        Trade Distribution by Time
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time of Day</TableCell>
                  <TableCell align="right">Trades</TableCell>
                  <TableCell align="right">Win Rate</TableCell>
                  <TableCell align="right">Avg Return</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tradeDistribution.map((row) => (
                  <TableRow key={row.timeOfDay}>
                    <TableCell component="th" scope="row">{row.timeOfDay}</TableCell>
                    <TableCell align="right">{row.trades}</TableCell>
                    <TableCell align="right">{row.winRate}</TableCell>
                    <TableCell 
                      align="right" 
                      sx={{ 
                        color: row.avgReturn.startsWith('+') ? '#4CAF50' : '#F44336',
                        fontWeight: 'bold'
                      }}
                    >
                      {row.avgReturn}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Trade Distribution Chart
            </Typography>
          </Box>
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
        Recommendations
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 1 }}>
        Based on the trade analysis, the following recommendations are provided:
      </Typography>
      
      <ul>
        <li>Focus on trading during the 12:00 - 16:00 time period, which has shown the highest win rate and average return</li>
        <li>Consider increasing position sizes for SOL/USDT trades, which have demonstrated consistent profitability</li>
        <li>Implement tighter stop losses for BNB/USDT trades to reduce the average loss</li>
        <li>Optimize the Quantum Pattern Recognition algorithm to improve entry timing</li>
      </ul>
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
        This report was generated by the OMNI-ALPHA VΩ∞∞ system. 
        For more information, please contact the system administrator.
      </Typography>
    </Box>
  );
};

export default TradeAnalysisReport;
