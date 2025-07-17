import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  TrendingDown,
  ShowChart,
  Timeline,
  BarChart,
  Insights,
  Warning,
  ArrowRight,
} from '@mui/icons-material';

const TradingDocs = () => {
  const theme = useTheme();

  return (
    <Box>
      {/* Introduction */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Trading Documentation
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        This documentation provides detailed information about the trading capabilities of the Nija DiIa system,
        including supported strategies, risk management features, and optimization techniques.
      </Typography>

      {/* Trading Strategies */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Trading Strategies
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Nija DiIa supports multiple trading strategies that can be used individually or in combination:
      </Typography>

      <Accordion sx={{ mb: 1, background: alpha(theme.palette.background.paper, 0.1) }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 2, color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Trend Following</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Trend following strategies aim to capture gains by riding the momentum of existing market trends.
            These strategies enter long positions in uptrends and short positions in downtrends.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Key Indicators:</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Moving Averages (MA)" secondary="Simple, Exponential, and Weighted" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Moving Average Convergence Divergence (MACD)" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Average Directional Index (ADX)" />
            </ListItem>
          </List>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>Optimal Market Conditions:</Typography>
          <Typography variant="body2">
            Strong trending markets with clear directional movement and low volatility.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 1, background: alpha(theme.palette.background.paper, 0.1) }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Timeline sx={{ mr: 2, color: theme.palette.secondary.main }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Mean Reversion</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Mean reversion strategies are based on the concept that asset prices tend to revert to their historical average over time.
            These strategies buy assets when prices are below their historical average and sell when prices are above.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Key Indicators:</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Relative Strength Index (RSI)" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Bollinger Bands" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Stochastic Oscillator" />
            </ListItem>
          </List>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>Optimal Market Conditions:</Typography>
          <Typography variant="body2">
            Range-bound markets with clear support and resistance levels and high volatility.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 1, background: alpha(theme.palette.background.paper, 0.1) }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BarChart sx={{ mr: 2, color: theme.palette.info.main }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Breakout</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Breakout strategies aim to capture profits when an asset's price breaks through established support or resistance levels,
            potentially signaling the start of a new trend.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Key Indicators:</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Support and Resistance Levels" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Volume" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Average True Range (ATR)" />
            </ListItem>
          </List>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>Optimal Market Conditions:</Typography>
          <Typography variant="body2">
            Consolidating markets with decreasing volatility, often preceding significant price movements.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 3, background: alpha(theme.palette.background.paper, 0.1) }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Insights sx={{ mr: 2, color: theme.palette.success.main }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Quantum-Enhanced</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Quantum-Enhanced strategies leverage quantum-inspired algorithms to identify complex patterns and correlations
            that traditional strategies might miss. These strategies can adapt to changing market conditions in real-time.
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Key Components:</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Quantum Entanglement Analysis" secondary="Identifies hidden correlations between assets" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Hyperdimensional Computing" secondary="Processes market data in high-dimensional space" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ShowChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Quantum Neural Networks" secondary="Combines quantum algorithms with neural networks" />
            </ListItem>
          </List>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>Optimal Market Conditions:</Typography>
          <Typography variant="body2">
            All market conditions, as these strategies can adapt to changing environments.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Risk Management */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Risk Management
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Nija DilA incorporates sophisticated risk management features to protect your capital:
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 4, background: alpha(theme.palette.background.paper, 0.1) }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Configuration</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Stop Loss</TableCell>
              <TableCell>Automatically closes positions when losses reach a specified threshold</TableCell>
              <TableCell>Percentage or fixed amount</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Take Profit</TableCell>
              <TableCell>Automatically closes positions when profits reach a specified threshold</TableCell>
              <TableCell>Percentage or fixed amount</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Position Sizing</TableCell>
              <TableCell>Determines the amount of capital allocated to each trade</TableCell>
              <TableCell>Fixed, percentage, or Kelly criterion</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Drawdown Protection</TableCell>
              <TableCell>Reduces position sizes or pauses trading during significant drawdowns</TableCell>
              <TableCell>Percentage threshold and recovery rules</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Volatility Adjustment</TableCell>
              <TableCell>Adjusts position sizes based on market volatility</TableCell>
              <TableCell>ATR multiplier or volatility index</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Performance Metrics */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Performance Metrics
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Nija DilA tracks the following key performance metrics to help you evaluate your trading strategies:
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', background: alpha(theme.palette.background.paper, 0.1) }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Return Metrics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TrendingUp fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Total Return" secondary="Overall profit/loss as a percentage" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TrendingUp fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Annualized Return" secondary="Return normalized to a yearly rate" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TrendingUp fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Return on Investment (ROI)" secondary="Return relative to invested capital" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', background: alpha(theme.palette.background.paper, 0.1) }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Risk Metrics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TrendingDown fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary="Maximum Drawdown" secondary="Largest peak-to-trough decline" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TrendingDown fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary="Volatility" secondary="Standard deviation of returns" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TrendingDown fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary="Value at Risk (VaR)" secondary="Potential loss in value of portfolio" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', background: alpha(theme.palette.background.paper, 0.1) }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Ratio Metrics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ShowChart fontSize="small" color="info" />
                </ListItemIcon>
                <ListItemText primary="Sharpe Ratio" secondary="Return per unit of risk" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ShowChart fontSize="small" color="info" />
                </ListItemIcon>
                <ListItemText primary="Sortino Ratio" secondary="Return per unit of downside risk" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ShowChart fontSize="small" color="info" />
                </ListItemIcon>
                <ListItemText primary="Calmar Ratio" secondary="Return relative to maximum drawdown" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', background: alpha(theme.palette.background.paper, 0.1) }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Trade Metrics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BarChart fontSize="small" color="secondary" />
                </ListItemIcon>
                <ListItemText primary="Win Rate" secondary="Percentage of profitable trades" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BarChart fontSize="small" color="secondary" />
                </ListItemIcon>
                <ListItemText primary="Profit Factor" secondary="Gross profit divided by gross loss" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BarChart fontSize="small" color="secondary" />
                </ListItemIcon>
                <ListItemText primary="Average Trade" secondary="Average profit/loss per trade" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Best Practices */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Best Practices
      </Typography>
      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: alpha(theme.palette.background.paper, 0.1),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Warning color="warning" sx={{ mr: 2, mt: 0.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Important Trading Considerations
          </Typography>
        </Box>
        <List>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Start with small position sizes until you're comfortable with the system"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Always use stop losses to protect your capital"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Regularly review and adjust your trading strategies based on performance"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Diversify your strategies to reduce risk"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="Be aware of market conditions and how they affect your strategies"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default TradingDocs;
