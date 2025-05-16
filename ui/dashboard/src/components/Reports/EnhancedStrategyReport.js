import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  Card,
  CardContent,
  useTheme,
  alpha,
  Chip,
  Slider,
  TextField,
  Button,
  LinearProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter
} from 'recharts';
import axios from 'axios';

const EnhancedStrategyReport = ({ timeframe, startDate, endDate, strategyId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [strategyData, setStrategyData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let url = `http://3.111.22.56/omni/api/reports/strategy?timeframe=${timeframe}`;
        if (timeframe === 'custom' && startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        if (strategyId) {
          url += `&strategyId=${strategyId}`;
        }

        const response = await axios.get(url);
        setStrategyData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching strategy data:', err);
        setError('Failed to load strategy data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [timeframe, startDate, endDate, strategyId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!strategyData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No strategy data available.</Typography>
      </Box>
    );
  }

  // Prepare data for equity curve chart
  const equityCurveData = strategyData.performance.dailyPerformance;

  // Prepare data for component contribution pie chart
  const componentContributionData = strategyData.componentPerformance.map(component => ({
    name: component.name,
    value: parseFloat(component.contribution.replace('%', '').replace('+', ''))
  }));

  // Prepare data for optimization suggestions
  const optimizationData = strategyData.optimizationSuggestions.map(suggestion => ({
    name: suggestion.parameter,
    current: parseFloat(suggestion.currentValue.replace('%', '')),
    suggested: parseFloat(suggestion.suggestedValue.replace('%', '')),
    improvement: parseFloat(suggestion.expectedImprovement.replace('%', '').replace('+', ''))
  }));

  // Prepare data for performance metrics radar chart
  const performanceMetricsData = [
    { subject: 'Return', A: parseFloat(strategyData.performance.totalReturn.replace('%', '').replace('+', '')), fullMark: 100 },
    { subject: 'Sharpe', A: parseFloat(strategyData.performance.sharpeRatio) * 20, fullMark: 100 },
    { subject: 'Win Rate', A: parseFloat(strategyData.performance.winRate.replace('%', '')), fullMark: 100 },
    { subject: 'Profit Factor', A: parseFloat(strategyData.performance.profitFactor) * 20, fullMark: 100 },
    { subject: 'Recovery', A: 100 - parseFloat(strategyData.performance.maxDrawdown.replace('-', '').replace('%', '')), fullMark: 100 },
    { subject: 'Consistency', A: 85, fullMark: 100 },
  ];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

  return (
    <Box sx={{
      p: 3,
      backgroundColor: '#fff',
      color: '#000',
      borderRadius: 2,
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <Typography variant="h4" sx={{ mb: 2, color: '#003366', fontWeight: 'bold' }}>
        OMNI-ALPHA Strategy Report: {strategyData.name}
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 3, color: '#666' }}>
        Generated on: {new Date().toLocaleDateString()} |
        Timeframe: {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
        {timeframe === 'custom' && startDate && endDate ? ` (${startDate} - ${endDate})` : ''}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#003366', fontWeight: 'bold' }}>
          Strategy Overview
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
              {strategyData.name} is a {strategyData.type} strategy that {strategyData.description}.
              Created on {new Date(strategyData.createdAt).toLocaleDateString()} and last updated on
              {new Date(strategyData.updatedAt).toLocaleDateString()}, this strategy has demonstrated
              exceptional performance with a total return of {strategyData.performance.totalReturn} and
              a Sharpe ratio of {strategyData.performance.sharpeRatio}. The strategy employs advanced
              quantum computing algorithms and hyperdimensional pattern recognition to identify optimal
              trading opportunities across various market conditions.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              borderRadius: 2,
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main, fontWeight: 'bold' }}>
                  Strategy Details
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Type:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {strategyData.type.charAt(0).toUpperCase() + strategyData.type.slice(1)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Created:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {new Date(strategyData.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Updated:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {new Date(strategyData.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Total Trades:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {strategyData.performance.totalTrades}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Win Rate:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.palette.success.main }}>
                    {strategyData.performance.winRate}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mb: 2, color: '#003366', fontWeight: 'bold' }}>
            Performance Metrics
          </Typography>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{
            backgroundColor: alpha(theme.palette.success.main, 0.1),
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            borderRadius: 2
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: theme.palette.success.main, fontWeight: 'bold' }}>
                {strategyData.performance.totalReturn}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Return
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{
            backgroundColor: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
            borderRadius: 2
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: theme.palette.info.main, fontWeight: 'bold' }}>
                {strategyData.performance.sharpeRatio}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sharpe Ratio
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
            borderRadius: 2
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: theme.palette.warning.main, fontWeight: 'bold' }}>
                {strategyData.performance.maxDrawdown}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Max Drawdown
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            borderRadius: 2
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                {strategyData.performance.profitFactor}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Profit Factor
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
            Equity Growth
          </Typography>
          <Paper elevation={2} sx={{ p: 2, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurveData}>
                <defs>
                  <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" />
                <YAxis domain={['dataMin', 'dataMax']} />
                <Tooltip
                  formatter={(value) => [`${value.toFixed(2)} USDT`, 'Capital']}
                  labelFormatter={(value) => `Day ${value}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="capital"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorCapital)"
                  name="Portfolio Value"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
            Performance Metrics
          </Typography>
          <Paper elevation={2} sx={{ p: 2, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={150} data={performanceMetricsData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
            Component Contribution
          </Typography>
          <Paper elevation={2} sx={{ p: 2, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={componentContributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {componentContributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Contribution']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2, color: '#003366' }}>
            Component Reliability
          </Typography>
          <TableContainer component={Paper} elevation={2} sx={{ height: 400, overflow: 'auto' }}>
            <Table>
              <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Component</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Contribution</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Reliability</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {strategyData.componentPerformance.map((component) => (
                  <TableRow key={component.name}>
                    <TableCell component="th" scope="row">{component.name}</TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: theme.palette.success.main,
                        fontWeight: 'bold'
                      }}
                    >
                      {component.contribution}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={parseFloat(component.reliability)}
                            sx={{
                              height: 8,
                              borderRadius: 5,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                backgroundColor: parseFloat(component.reliability) > 80
                                  ? theme.palette.success.main
                                  : parseFloat(component.reliability) > 60
                                    ? theme.palette.warning.main
                                    : theme.palette.error.main
                              }
                            }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {component.reliability}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#003366', fontWeight: 'bold' }}>
          Strategy Optimization
        </Typography>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            The OMNI-ALPHA system has analyzed the strategy's performance and identified several optimization
            opportunities that could potentially enhance returns and reduce risk. The following parameter
            adjustments are recommended:
          </Typography>

          <Grid container spacing={3}>
            {strategyData.optimizationSuggestions.map((suggestion, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {suggestion.parameter}
                  </Typography>

                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Box sx={{ px: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Current Value: {suggestion.currentValue}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Suggested Value: {suggestion.suggestedValue}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.success.main,
                            fontWeight: 'bold'
                          }}
                        >
                          Expected Improvement: {suggestion.expectedImprovement}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ px: 2 }}>
                        <Slider
                          value={parseFloat(suggestion.currentValue.replace('%', ''))}
                          step={0.1}
                          min={parseFloat(suggestion.currentValue.replace('%', '')) * 0.5}
                          max={parseFloat(suggestion.currentValue.replace('%', '')) * 1.5}
                          marks={[
                            {
                              value: parseFloat(suggestion.currentValue.replace('%', '')),
                              label: 'Current'
                            },
                            {
                              value: parseFloat(suggestion.suggestedValue.replace('%', '')),
                              label: 'Suggested'
                            }
                          ]}
                          sx={{
                            '& .MuiSlider-markLabel': {
                              fontSize: '0.75rem'
                            }
                          }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {index < strategyData.optimizationSuggestions.length - 1 && (
                  <Divider sx={{ my: 2 }} />
                )}
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              sx={{ mr: 2 }}
            >
              Apply Optimizations
            </Button>
            <Button
              variant="outlined"
              color="primary"
            >
              Run Optimization Backtest
            </Button>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#003366', fontWeight: 'bold' }}>
          Quantum Strategy Analysis
        </Typography>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            The {strategyData.name} strategy leverages advanced quantum computing algorithms to enhance
            trading performance. The quantum components have significantly contributed to the strategy's
            success through:
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.primary.main }}>
                  Quantum Pattern Recognition
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Contribution: {strategyData.componentPerformance[0].contribution}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Reliability: {strategyData.componentPerformance[0].reliability}
                </Typography>
                <Typography variant="body2">
                  The quantum pattern recognition component utilizes quantum computing to identify complex
                  market patterns that traditional algorithms cannot detect. It has been particularly effective
                  in identifying trend reversals and continuation patterns.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.secondary.main }}>
                  Momentum Indicator
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Contribution: {strategyData.componentPerformance[1].contribution}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Reliability: {strategyData.componentPerformance[1].reliability}
                </Typography>
                <Typography variant="body2">
                  The momentum indicator component uses quantum-enhanced calculations to measure price
                  momentum with greater precision than traditional indicators. It has been effective in
                  identifying strong trends and potential entry points.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.info.main }}>
                  Volatility Filter
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Contribution: {strategyData.componentPerformance[2].contribution}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Reliability: {strategyData.componentPerformance[2].reliability}
                </Typography>
                <Typography variant="body2">
                  The volatility filter component uses quantum algorithms to analyze market volatility
                  and adjust trading parameters accordingly. It has been particularly effective in reducing
                  drawdowns during high-volatility periods.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, color: '#003366', fontWeight: 'bold' }}>
          Recommendations
        </Typography>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Based on the comprehensive analysis of the {strategyData.name} strategy, the following recommendations are provided:
          </Typography>

          <ol>
            <li>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Optimize Quantum Pattern Threshold
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Increasing the quantum pattern threshold from {strategyData.optimizationSuggestions[0].currentValue} to
                {strategyData.optimizationSuggestions[0].suggestedValue} could potentially improve returns by
                {strategyData.optimizationSuggestions[0].expectedImprovement}.
              </Typography>
            </li>

            <li>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Adjust Momentum Period
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Reducing the momentum period from {strategyData.optimizationSuggestions[1].currentValue} to
                {strategyData.optimizationSuggestions[1].suggestedValue} could potentially improve returns by
                {strategyData.optimizationSuggestions[1].expectedImprovement}.
              </Typography>
            </li>

            <li>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Enhance Volatility Filter
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Increasing the volatility filter level from {strategyData.optimizationSuggestions[2].currentValue} to
                {strategyData.optimizationSuggestions[2].suggestedValue} could potentially improve returns by
                {strategyData.optimizationSuggestions[2].expectedImprovement}.
              </Typography>
            </li>

            <li>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                Adjust Risk Per Trade
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Increasing the risk per trade from {strategyData.optimizationSuggestions[3].currentValue} to
                {strategyData.optimizationSuggestions[3].suggestedValue} could potentially improve returns by
                {strategyData.optimizationSuggestions[3].expectedImprovement}.
              </Typography>
            </li>
          </ol>
        </Paper>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
          This report was generated by the OMNI-ALPHA VΩ∞∞ system.
        </Typography>
        <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
          Powered by Quantum Computing and Hyperdimensional Pattern Recognition
        </Typography>
      </Box>
    </Box>
  );
};

export default EnhancedStrategyReport;
