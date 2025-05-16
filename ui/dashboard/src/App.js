import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { AnimatePresence } from 'framer-motion';

// Layout components
import Layout from './components/Layout/Layout';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';

// Pages
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import TradeDetails from './pages/TradeDetails';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import Assets from './pages/Assets';
import AssetDetails from './pages/AssetDetails';
import Leaderboard from './pages/Leaderboard';
import Metrics from './pages/Metrics';
import QuantumAnalytics from './pages/QuantumAnalytics';
import HyperdimensionalAnalytics from './pages/HyperdimensionalAnalytics';
import StrategyBuilderPage from './pages/StrategyBuilderPage';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Documentation from './pages/Documentation';

// Context
import { SocketProvider } from './context/SocketContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';

// Services
import { initializeSocket } from './services/socketService';

function App() {
  const [socket, setSocket] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = initializeSocket();
    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ThemeProvider>
      <SocketProvider socket={socket}>
        <DataProvider>
          <Box sx={{ display: 'flex', minHeight: '100vh' }} className="quantum-particles plasma-bg">
            <CssBaseline />
            <TopBar toggleSidebar={toggleSidebar} />
            <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 3,
                mt: 8,
                ml: { sm: isSidebarOpen ? '240px' : 0 },
                transition: 'margin 0.2s ease-in-out',
                width: { sm: `calc(100% - ${isSidebarOpen ? '240px' : '0px'})` }
              }}
            >
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="trades" element={<Trades />} />
                    <Route path="trades/:id" element={<TradeDetails />} />
                    <Route path="agents" element={<Agents />} />
                    <Route path="agents/:id" element={<AgentDetail />} />
                    <Route path="assets" element={<Assets />} />
                    <Route path="assets/:symbol" element={<AssetDetails />} />
                    <Route path="leaderboard" element={<Leaderboard />} />
                    <Route path="metrics" element={<Metrics />} />
                    <Route path="quantum" element={<QuantumAnalytics />} />
                    <Route path="hyperdimensional" element={<HyperdimensionalAnalytics />} />
                    <Route path="strategy-builder" element={<StrategyBuilderPage />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="documentation" element={<Documentation />} />
                  </Route>
                </Routes>
              </AnimatePresence>
            </Box>
          </Box>
        </DataProvider>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
