import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Button,
  IconButton,
  useTheme,
  alpha,
  Tooltip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Search,
  FilterList,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';

const Trades = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { activeTrades, tradeHistory } = useData();
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
  };
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  // Handle filter change
  const handleFilterChange = (filter, value) => {
    switch (filter) {
      case 'symbol':
        setFilterSymbol(value);
        break;
      case 'agent':
        setFilterAgent(value);
        break;
      case 'direction':
        setFilterDirection(value);
        break;
      default:
        break;
    }
    setPage(0);
  };
  
  // Handle row click
  const handleRowClick = (id) => {
    navigate(`/trades/${id}`);
  };
  
  // Get trades based on tab
  const getTrades = () => {
    return tabValue === 0 ? activeTrades || [] : tradeHistory || [];
  };
  
  // Filter trades
  const getFilteredTrades = () => {
    let filteredTrades = getTrades();
    
    // Apply search
    if (searchTerm) {
      filteredTrades = filteredTrades.filter(trade => 
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.strategy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filters
    if (filterSymbol) {
      filteredTrades = filteredTrades.filter(trade => trade.symbol === filterSymbol);
    }
    
    if (filterAgent) {
      filteredTrades = filteredTrades.filter(trade => trade.agent === filterAgent);
    }
    
    if (filterDirection) {
      filteredTrades = filteredTrades.filter(trade => trade.direction === filterDirection);
    }
    
    return filteredTrades;
  };
  
  // Get paginated trades
  const getPaginatedTrades = () => {
    const filteredTrades = getFilteredTrades();
    return filteredTrades.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  };
  
  // Get unique symbols
  const getUniqueSymbols = () => {
    const allTrades = [...(activeTrades || []), ...(tradeHistory || [])];
    return [...new Set(allTrades.map(trade => trade.symbol))];
  };
  
  // Get unique agents
  const getUniqueAgents = () => {
    const allTrades = [...(activeTrades || []), ...(tradeHistory || [])];
    return [...new Set(allTrades.map(trade => trade.agent))];
  };
  
  // Container variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };
  
  // Item variants for animations
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };
  
  return (
    <Box sx={{ pb: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: 700,
                mb: 1,
              }}
              className="glow-text"
            >
              Trades
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                color: theme.palette.text.secondary,
              }}
            >
              Manage and monitor all trading activities
            </Typography>
          </Box>
        </motion.div>
        
        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Card 
            sx={{ 
              background: 'rgba(17, 24, 39, 0.7)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
            className="futuristic-border"
          >
            <CardHeader
              title={
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{
                    '& .MuiTab-root': {
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      minWidth: 100,
                    },
                  }}
                >
                  <Tab label={`Active (${activeTrades ? activeTrades.length : 0})`} />
                  <Tab label={`History (${tradeHistory ? tradeHistory.length : 0})`} />
                </Tabs>
              }
              action={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearch}
                    sx={{ mr: 2, width: 200 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <FormControl size="small" sx={{ mr: 2, width: 120 }}>
                    <InputLabel>Symbol</InputLabel>
                    <Select
                      value={filterSymbol}
                      onChange={(e) => handleFilterChange('symbol', e.target.value)}
                      label="Symbol"
                    >
                      <MenuItem value="">All</MenuItem>
                      {getUniqueSymbols().map((symbol) => (
                        <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ mr: 2, width: 150 }}>
                    <InputLabel>Agent</InputLabel>
                    <Select
                      value={filterAgent}
                      onChange={(e) => handleFilterChange('agent', e.target.value)}
                      label="Agent"
                    >
                      <MenuItem value="">All</MenuItem>
                      {getUniqueAgents().map((agent) => (
                        <MenuItem key={agent} value={agent}>{agent}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ width: 120 }}>
                    <InputLabel>Direction</InputLabel>
                    <Select
                      value={filterDirection}
                      onChange={(e) => handleFilterChange('direction', e.target.value)}
                      label="Direction"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="long">Long</MenuItem>
                      <MenuItem value="short">Short</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              }
              sx={{
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                '& .MuiCardHeader-action': {
                  mt: { xs: 2, md: 0 },
                },
              }}
            />
            <Divider sx={{ opacity: 0.2 }} />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Symbol</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Direction</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Entry Price</TableCell>
                      {tabValue === 0 ? (
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Current Price</TableCell>
                      ) : (
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Exit Price</TableCell>
                      )}
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>PnL</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Size</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Agent</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Strategy</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Entry Time</TableCell>
                      {tabValue === 1 && (
                        <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Exit Time</TableCell>
                      )}
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getPaginatedTrades().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={tabValue === 0 ? 10 : 11} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No trades found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      getPaginatedTrades().map((trade) => (
                        <TableRow
                          key={trade.id}
                          hover
                          onClick={() => handleRowClick(trade.id)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            },
                            '&:last-child td, &:last-child th': { border: 0 },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {trade.symbol || 'Unknown'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={trade.side || trade.direction || 'unknown'}
                              icon={(trade.side === 'buy' || trade.direction === 'long' || trade.direction === 'buy') ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                              color={(trade.side === 'buy' || trade.direction === 'long' || trade.direction === 'buy') ? 'success' : 'error'}
                              sx={{ height: 24 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCurrency(trade.price || trade.entryPrice || 0, 'USD', (trade.symbol || '').includes('BTC') ? 0 : 2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2">
                                {formatCurrency(tabValue === 0 ? (trade.currentPrice || trade.price || 0) : (trade.exitPrice || 0), 'USD', (trade.symbol || '').includes('BTC') ? 0 : 2)}
                              </Typography>
                              {tabValue === 0 && (
                                (trade.currentPrice || trade.price || 0) > (trade.price || trade.entryPrice || 0) ? (
                                  <TrendingUp fontSize="small" sx={{ ml: 0.5, color: theme.palette.success.main }} />
                                ) : (
                                  <TrendingDown fontSize="small" sx={{ ml: 0.5, color: theme.palette.error.main }} />
                                )
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                color: (trade.targetProfit || 0) >= 0 ? theme.palette.success.main : theme.palette.error.main,
                                fontWeight: 600,
                              }}
                            >
                              {(trade.targetProfit || 0) >= 0 ? '+' : ''}
                              {formatCurrency(trade.targetProfit || 0)} (Target)
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {(trade.quantity || trade.positionSize || 0).toFixed(4)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={`Target Profit: $${trade.targetProfit || '0.00'}`}>
                              <Chip
                                size="small"
                                label={trade.agent || 'OMNI-Agent'}
                                sx={{
                                  height: 24,
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {trade.strategy || trade.orderType || 'Market'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {trade.timestamp ? formatDate(trade.timestamp, 'short') : (trade.entryTime ? formatDate(trade.entryTime, 'short') : '-')}
                            </Typography>
                          </TableCell>
                          {tabValue === 1 && (
                            <TableCell>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {trade.exitTime ? formatDate(trade.exitTime, 'short') : '-'}
                              </Typography>
                            </TableCell>
                          )}
                          <TableCell>
                            <Chip
                              size="small"
                              label={trade.status || 'unknown'}
                              color={
                                trade.status === 'active' ? 'info' :
                                trade.status === 'profit' ? 'success' :
                                trade.status === 'loss' ? 'error' :
                                'default'
                              }
                              sx={{ height: 24 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={getFilteredTrades().length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default Trades;
