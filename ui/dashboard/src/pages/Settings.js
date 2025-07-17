import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  useTheme,
  alpha,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Save,
  Refresh,
  Security,
  Notifications,
  Palette,
  AccountCircle,
  Api,
  BarChart,
  Speed,
  Psychology,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Settings = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    username: 'User123',
    email: 'user@example.com',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '24h',
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'dark',
    accentColor: '#3f51b5',
    fontSize: 14,
    animationsEnabled: true,
    compactMode: false,
    highContrastMode: false,
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    tradeAlerts: true,
    priceAlerts: true,
    systemAlerts: true,
    marketingEmails: false,
    soundEnabled: true,
  });

  // API settings
  const [apiSettings, setApiSettings] = useState({
    apiKey: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    apiSecret: '••••••••••••••••••••••••••••••••',
    rateLimit: 10,
    webhookUrl: '',
    ipWhitelist: '',
  });

  // Trading settings
  const [tradingSettings, setTradingSettings] = useState({
    defaultLeverage: 1,
    maxPositionSize: 1000,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    autoClosePositions: false,
    confirmTrades: true,
    riskLevel: 'medium',
  });

  // Agent settings
  const [agentSettings, setAgentSettings] = useState({
    agentsEnabled: true,
    maxAgents: 5,
    agentAutonomy: 50,
    quantumEnabled: true,
    neuralEnabled: true,
    hybridEnabled: true,
    agentCommunication: true,
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle general settings change
  const handleGeneralSettingsChange = (event) => {
    setGeneralSettings({
      ...generalSettings,
      [event.target.name]: event.target.value,
    });
  };

  // Handle appearance settings change
  const handleAppearanceSettingsChange = (event) => {
    const { name, value, checked } = event.target;
    setAppearanceSettings({
      ...appearanceSettings,
      [name]: name === 'animationsEnabled' || name === 'compactMode' || name === 'highContrastMode' ? checked : value,
    });
  };

  // Handle notification settings change
  const handleNotificationSettingsChange = (event) => {
    setNotificationSettings({
      ...notificationSettings,
      [event.target.name]: event.target.checked,
    });
  };

  // Handle API settings change
  const handleApiSettingsChange = (event) => {
    setApiSettings({
      ...apiSettings,
      [event.target.name]: event.target.value,
    });
  };

  // Handle trading settings change
  const handleTradingSettingsChange = (event) => {
    const { name, value, checked } = event.target;
    setTradingSettings({
      ...tradingSettings,
      [name]: name === 'autoClosePositions' || name === 'confirmTrades' ? checked : value,
    });
  };

  // Handle agent settings change
  const handleAgentSettingsChange = (event) => {
    const { name, value, checked } = event.target;
    setAgentSettings({
      ...agentSettings,
      [name]: name === 'agentsEnabled' || name === 'quantumEnabled' || name === 'neuralEnabled' || name === 'hybridEnabled' || name === 'agentCommunication' ? checked : value,
    });
  };

  // Handle slider change
  const handleSliderChange = (setting, value) => {
    if (setting === 'agentAutonomy') {
      setAgentSettings({
        ...agentSettings,
        agentAutonomy: value,
      });
    }
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real app, this would save settings to the backend
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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

  // Render general settings
  const renderGeneralSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Username"
          name="username"
          value={generalSettings.username}
          onChange={handleGeneralSettingsChange}
          variant="outlined"
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          value={generalSettings.email}
          onChange={handleGeneralSettingsChange}
          variant="outlined"
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Language</InputLabel>
          <Select
            name="language"
            value={generalSettings.language}
            onChange={handleGeneralSettingsChange}
            label="Language"
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="de">German</MenuItem>
            <MenuItem value="ja">Japanese</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Timezone</InputLabel>
          <Select
            name="timezone"
            value={generalSettings.timezone}
            onChange={handleGeneralSettingsChange}
            label="Timezone"
          >
            <MenuItem value="UTC">UTC</MenuItem>
            <MenuItem value="EST">Eastern Time (EST)</MenuItem>
            <MenuItem value="CST">Central Time (CST)</MenuItem>
            <MenuItem value="MST">Mountain Time (MST)</MenuItem>
            <MenuItem value="PST">Pacific Time (PST)</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Date Format</InputLabel>
          <Select
            name="dateFormat"
            value={generalSettings.dateFormat}
            onChange={handleGeneralSettingsChange}
            label="Date Format"
          >
            <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
            <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
            <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Time Format</InputLabel>
          <Select
            name="timeFormat"
            value={generalSettings.timeFormat}
            onChange={handleGeneralSettingsChange}
            label="Time Format"
          >
            <MenuItem value="12h">12-hour (AM/PM)</MenuItem>
            <MenuItem value="24h">24-hour</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  // Render appearance settings
  const renderAppearanceSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Theme</InputLabel>
          <Select
            name="theme"
            value={appearanceSettings.theme}
            onChange={handleAppearanceSettingsChange}
            label="Theme"
          >
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="system">System Default</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Accent Color</InputLabel>
          <Select
            name="accentColor"
            value={appearanceSettings.accentColor}
            onChange={handleAppearanceSettingsChange}
            label="Accent Color"
          >
            <MenuItem value="#3f51b5">Blue</MenuItem>
            <MenuItem value="#f50057">Pink</MenuItem>
            <MenuItem value="#00bcd4">Cyan</MenuItem>
            <MenuItem value="#4caf50">Green</MenuItem>
            <MenuItem value="#ff9800">Orange</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Font Size</InputLabel>
          <Select
            name="fontSize"
            value={appearanceSettings.fontSize}
            onChange={handleAppearanceSettingsChange}
            label="Font Size"
          >
            <MenuItem value={12}>Small</MenuItem>
            <MenuItem value={14}>Medium</MenuItem>
            <MenuItem value={16}>Large</MenuItem>
            <MenuItem value={18}>Extra Large</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={appearanceSettings.animationsEnabled}
              onChange={handleAppearanceSettingsChange}
              name="animationsEnabled"
              color="primary"
            />
          }
          label="Enable Animations"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={appearanceSettings.compactMode}
              onChange={handleAppearanceSettingsChange}
              name="compactMode"
              color="primary"
            />
          }
          label="Compact Mode"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={appearanceSettings.highContrastMode}
              onChange={handleAppearanceSettingsChange}
              name="highContrastMode"
              color="primary"
            />
          }
          label="High Contrast Mode"
        />
      </Grid>
    </Grid>
  );

  // Render notification settings
  const renderNotificationSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={notificationSettings.emailNotifications}
              onChange={handleNotificationSettingsChange}
              name="emailNotifications"
              color="primary"
            />
          }
          label="Email Notifications"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={notificationSettings.pushNotifications}
              onChange={handleNotificationSettingsChange}
              name="pushNotifications"
              color="primary"
            />
          }
          label="Push Notifications"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={notificationSettings.tradeAlerts}
              onChange={handleNotificationSettingsChange}
              name="tradeAlerts"
              color="primary"
            />
          }
          label="Trade Alerts"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={notificationSettings.priceAlerts}
              onChange={handleNotificationSettingsChange}
              name="priceAlerts"
              color="primary"
            />
          }
          label="Price Alerts"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={notificationSettings.systemAlerts}
              onChange={handleNotificationSettingsChange}
              name="systemAlerts"
              color="primary"
            />
          }
          label="System Alerts"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={notificationSettings.marketingEmails}
              onChange={handleNotificationSettingsChange}
              name="marketingEmails"
              color="primary"
            />
          }
          label="Marketing Emails"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={notificationSettings.soundEnabled}
              onChange={handleNotificationSettingsChange}
              name="soundEnabled"
              color="primary"
            />
          }
          label="Sound Notifications"
        />
      </Grid>
    </Grid>
  );

  // Render API settings
  const renderApiSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 2 }}>
          API keys provide access to your account. Keep them secure and never share them.
        </Alert>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="API Key"
          name="apiKey"
          value={apiSettings.apiKey}
          onChange={handleApiSettingsChange}
          variant="outlined"
          margin="normal"
          InputProps={{
            readOnly: true,
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="API Secret"
          name="apiSecret"
          value={apiSettings.apiSecret}
          onChange={handleApiSettingsChange}
          variant="outlined"
          margin="normal"
          type="password"
          InputProps={{
            readOnly: true,
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Refresh />}
          sx={{ mt: 2 }}
        >
          Regenerate API Keys
        </Button>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Rate Limit (requests/second)</InputLabel>
          <Select
            name="rateLimit"
            value={apiSettings.rateLimit}
            onChange={handleApiSettingsChange}
            label="Rate Limit (requests/second)"
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Webhook URL"
          name="webhookUrl"
          value={apiSettings.webhookUrl}
          onChange={handleApiSettingsChange}
          variant="outlined"
          margin="normal"
          placeholder="https://example.com/webhook"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="IP Whitelist (comma separated)"
          name="ipWhitelist"
          value={apiSettings.ipWhitelist}
          onChange={handleApiSettingsChange}
          variant="outlined"
          margin="normal"
          placeholder="192.168.1.1, 10.0.0.1"
        />
      </Grid>
    </Grid>
  );

  // Render trading settings
  const renderTradingSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Default Leverage</InputLabel>
          <Select
            name="defaultLeverage"
            value={tradingSettings.defaultLeverage}
            onChange={handleTradingSettingsChange}
            label="Default Leverage"
          >
            <MenuItem value={1}>1x (No Leverage)</MenuItem>
            <MenuItem value={2}>2x</MenuItem>
            <MenuItem value={5}>5x</MenuItem>
            <MenuItem value={10}>10x</MenuItem>
            <MenuItem value={20}>20x</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Max Position Size (USDT)"
          name="maxPositionSize"
          type="number"
          value={tradingSettings.maxPositionSize}
          onChange={handleTradingSettingsChange}
          variant="outlined"
          margin="normal"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Stop Loss Percentage"
          name="stopLossPercentage"
          type="number"
          value={tradingSettings.stopLossPercentage}
          onChange={handleTradingSettingsChange}
          variant="outlined"
          margin="normal"
          InputProps={{
            endAdornment: '%',
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Take Profit Percentage"
          name="takeProfitPercentage"
          type="number"
          value={tradingSettings.takeProfitPercentage}
          onChange={handleTradingSettingsChange}
          variant="outlined"
          margin="normal"
          InputProps={{
            endAdornment: '%',
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Risk Level</InputLabel>
          <Select
            name="riskLevel"
            value={tradingSettings.riskLevel}
            onChange={handleTradingSettingsChange}
            label="Risk Level"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={tradingSettings.autoClosePositions}
              onChange={handleTradingSettingsChange}
              name="autoClosePositions"
              color="primary"
            />
          }
          label="Auto-close Positions"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={tradingSettings.confirmTrades}
              onChange={handleTradingSettingsChange}
              name="confirmTrades"
              color="primary"
            />
          }
          label="Confirm Trades"
        />
      </Grid>
    </Grid>
  );

  // Render agent settings
  const renderAgentSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={agentSettings.agentsEnabled}
              onChange={handleAgentSettingsChange}
              name="agentsEnabled"
              color="primary"
            />
          }
          label="Enable Agents"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Max Agents</InputLabel>
          <Select
            name="maxAgents"
            value={agentSettings.maxAgents}
            onChange={handleAgentSettingsChange}
            label="Max Agents"
            disabled={!agentSettings.agentsEnabled}
          >
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={3}>3</MenuItem>
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Typography gutterBottom>Agent Autonomy</Typography>
        <Slider
          value={agentSettings.agentAutonomy}
          onChange={(_, value) => handleSliderChange('agentAutonomy', value)}
          valueLabelDisplay="auto"
          step={10}
          marks
          min={0}
          max={100}
          disabled={!agentSettings.agentsEnabled}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">Manual</Typography>
          <Typography variant="caption" color="text.secondary">Full Autonomy</Typography>
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Agent Types</Typography>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={agentSettings.quantumEnabled}
              onChange={handleAgentSettingsChange}
              name="quantumEnabled"
              color="primary"
              disabled={!agentSettings.agentsEnabled}
            />
          }
          label="Quantum Agents"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={agentSettings.neuralEnabled}
              onChange={handleAgentSettingsChange}
              name="neuralEnabled"
              color="primary"
              disabled={!agentSettings.agentsEnabled}
            />
          }
          label="Neural Agents"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={agentSettings.hybridEnabled}
              onChange={handleAgentSettingsChange}
              name="hybridEnabled"
              color="primary"
              disabled={!agentSettings.agentsEnabled}
            />
          }
          label="Hybrid Agents"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={agentSettings.agentCommunication}
              onChange={handleAgentSettingsChange}
              name="agentCommunication"
              color="primary"
              disabled={!agentSettings.agentsEnabled}
            />
          }
          label="Enable Agent Communication"
        />
      </Grid>
    </Grid>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderGeneralSettings();
      case 1:
        return renderAppearanceSettings();
      case 2:
        return renderNotificationSettings();
      case 3:
        return renderApiSettings();
      case 4:
        return renderTradingSettings();
      case 5:
        return renderAgentSettings();
      default:
        return null;
    }
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
              Settings
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                color: theme.palette.text.secondary,
              }}
            >
              Configure your Nija DilA system preferences
            </Typography>
          </Box>
        </motion.div>

        {/* Settings Card */}
        <motion.div variants={itemVariants}>
          <Card
            sx={{
              mb: 3,
              background: 'rgba(17, 24, 39, 0.7)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
            className="futuristic-border"
          >
            <CardHeader
              title={
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  textColor="primary"
                  indicatorColor="primary"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      minWidth: 120,
                    },
                  }}
                >
                  <Tab icon={<AccountCircle />} label="General" />
                  <Tab icon={<Palette />} label="Appearance" />
                  <Tab icon={<Notifications />} label="Notifications" />
                  <Tab icon={<Api />} label="API" />
                  <Tab icon={<BarChart />} label="Trading" />
                  <Tab icon={<Psychology />} label="Agents" />
                </Tabs>
              }
              action={
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Save />}
                  onClick={handleSaveSettings}
                  sx={{ mt: 1 }}
                >
                  Save Settings
                </Button>
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
            <CardContent sx={{ p: 3 }}>
              {renderTabContent()}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
