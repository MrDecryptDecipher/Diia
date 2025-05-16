import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShowChart as ShowChartIcon,
  People as PeopleIcon,
  Insights as InsightsIcon,
  Leaderboard as LeaderboardIcon,
  BarChart as BarChartIcon,
  Science as ScienceIcon,
  Psychology as PsychologyIcon,
  Architecture as ArchitectureIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../../context/DataContext';

// Drawer width
const drawerWidth = 240;

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { metrics } = useData();

  // Navigation items
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Trades', icon: <ShowChartIcon />, path: '/trades' },
    { text: 'Agents', icon: <PeopleIcon />, path: '/agents' },
    { text: 'Assets', icon: <InsightsIcon />, path: '/assets' },
    { text: 'Leaderboard', icon: <LeaderboardIcon />, path: '/leaderboard' },
    { text: 'Metrics', icon: <BarChartIcon />, path: '/metrics' },
    { text: 'Quantum Analytics', icon: <ScienceIcon />, path: '/quantum' },
    { text: 'Hyperdimensional', icon: <PsychologyIcon />, path: '/hyperdimensional' },
    { text: 'Strategy Builder', icon: <ArchitectureIcon />, path: '/strategy-builder' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Documentation', icon: <DescriptionIcon />, path: '/documentation' },
  ];

  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
    if (window.innerWidth < 600) {
      onClose();
    }
  };

  // Check if a path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'rgba(10, 14, 23, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRight: `1px solid ${theme.palette.primary.dark}`,
          boxShadow: `0 0 10px ${theme.palette.primary.dark}`,
        },
      }}
      className="futuristic-border"
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Toolbar Spacer */}
        <Box sx={{ height: 64 }} />

        {/* Capital Info */}
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.4)}, ${alpha(theme.palette.secondary.dark, 0.4)})`,
            borderBottom: `1px solid ${theme.palette.primary.dark}`,
          }}
          className="quantum-particles"
        >
          <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'Rajdhani, sans-serif' }}>
            Current Capital
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #7B68EE, #00BFFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            className="glow-text"
          >
            {metrics ? `$${metrics.currentCapital.toFixed(2)}` : '$0.00'}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Initial: {metrics ? `$${metrics.initialCapital.toFixed(2)}` : '$0.00'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: metrics && metrics.pnl >= 0 ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {metrics && metrics.pnl >= 0 ? '+' : ''}
              {metrics ? `$${metrics.pnl.toFixed(2)} (${metrics.pnlPercentage.toFixed(2)}%)` : '$0.00 (0.00%)'}
            </Typography>
          </Box>
        </Box>

        {/* Navigation */}
        <List sx={{ flexGrow: 1, pt: 0 }}>
          {navItems.map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  selected={isActive(item.path)}
                  sx={{
                    borderLeft: isActive(item.path) ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? theme.palette.primary.main : 'inherit',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: isActive(item.path) ? 600 : 400,
                      color: isActive(item.path) ? theme.palette.primary.main : 'inherit',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </motion.div>
          ))}
        </List>

        {/* Footer */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            OMNI-ALPHA VΩ∞∞ v1.0.0
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
