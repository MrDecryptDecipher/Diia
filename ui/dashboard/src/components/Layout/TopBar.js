import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Badge, 
  Menu, 
  MenuItem, 
  Tooltip, 
  Avatar, 
  Chip,
  useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon, 
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useSocket } from '../../context/SocketContext';
import { motion } from 'framer-motion';

const TopBar = ({ toggleSidebar }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { systemStatus, tradeEvents } = useData();
  const { isConnected } = useSocket();
  
  // State for menus
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  
  // Handle menu open/close
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  
  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
    handleUserMenuClose();
  };
  
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'rgba(10, 14, 23, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${theme.palette.primary.dark}`,
        boxShadow: `0 0 10px ${theme.palette.primary.dark}`,
      }}
      className="futuristic-border"
    >
      <Toolbar>
        {/* Menu Button */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.1em',
              background: 'linear-gradient(45deg, #7B68EE, #00BFFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            className="glow-text"
          >
            OMNI-ALPHA VΩ∞∞
          </Typography>
        </motion.div>
        
        {/* System Status */}
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
          <Chip
            size="small"
            label={systemStatus ? systemStatus.status : 'Connecting...'}
            color={systemStatus && systemStatus.status === 'online' ? 'success' : 'error'}
            sx={{ 
              height: 24,
              '& .MuiChip-label': {
                fontFamily: 'Rajdhani, sans-serif',
                fontWeight: 600,
              }
            }}
            className={systemStatus && systemStatus.status === 'online' ? 'pulsate' : ''}
          />
        </Box>
        
        {/* Socket Status */}
        <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
          <Tooltip title={isConnected ? 'Connected to server' : 'Disconnected from server'}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: isConnected ? theme.palette.success.main : theme.palette.error.main,
                boxShadow: `0 0 5px ${isConnected ? theme.palette.success.main : theme.palette.error.main}`,
              }}
              className={isConnected ? 'pulsate' : ''}
            />
          </Tooltip>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Right Side Icons */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Performance Mode */}
          <Tooltip title="Performance Settings">
            <IconButton color="inherit" onClick={() => handleNavigate('/settings')}>
              <SpeedIcon />
            </IconButton>
          </Tooltip>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              color="inherit"
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={tradeEvents.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Notifications Menu */}
          <Menu
            anchorEl={notificationsAnchorEl}
            open={Boolean(notificationsAnchorEl)}
            onClose={handleNotificationsClose}
            PaperProps={{
              sx: {
                width: 320,
                maxHeight: 400,
                background: 'rgba(17, 24, 39, 0.9)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.primary.dark}`,
                boxShadow: `0 0 10px ${theme.palette.primary.dark}`,
              },
              className: 'futuristic-border',
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                Trade Events
              </Typography>
            </Box>
            {tradeEvents.length === 0 ? (
              <MenuItem>
                <Typography variant="body2">No recent trade events</Typography>
              </MenuItem>
            ) : (
              tradeEvents.map((event, index) => (
                <MenuItem key={index} onClick={() => handleNavigate(`/trades/${event.id}`)}>
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {event.type === 'entry' ? 'New Trade' : 'Trade Exit'}: {event.symbol}
                      </Typography>
                      <Chip
                        size="small"
                        label={event.direction}
                        color={event.direction === 'long' ? 'success' : 'error'}
                        sx={{ height: 20 }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      {event.reason}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      Agent: {event.agent}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>
          
          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton color="inherit" onClick={() => handleNavigate('/settings')}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          {/* User Menu */}
          <Tooltip title="User Menu">
            <IconButton
              onClick={handleUserMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(45deg, #7B68EE, #00BFFF)',
                  border: `2px solid ${theme.palette.primary.dark}`,
                }}
              >
                A
              </Avatar>
            </IconButton>
          </Tooltip>
          
          {/* User Menu */}
          <Menu
            anchorEl={userMenuAnchorEl}
            open={Boolean(userMenuAnchorEl)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: {
                width: 200,
                background: 'rgba(17, 24, 39, 0.9)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.primary.dark}`,
                boxShadow: `0 0 10px ${theme.palette.primary.dark}`,
              },
              className: 'futuristic-border',
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => handleNavigate('/settings')}>
              <SettingsIcon sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/documentation')}>
              <DarkModeIcon sx={{ mr: 1 }} />
              Documentation
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
