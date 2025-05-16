import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme, 
  alpha,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import MemoryIcon from '@mui/icons-material/Memory';
import BlurOnIcon from '@mui/icons-material/BlurOn';
import SecurityIcon from '@mui/icons-material/Security';

const ComponentPanel = ({ onDragStart }) => {
  const theme = useTheme();
  const [openSections, setOpenSections] = React.useState({
    indicators: true,
    signals: true,
    conditions: true,
    entries: true,
    exits: true,
    quantum: true,
    hyperdimensional: true,
    riskManagement: true
  });

  const handleToggle = (section) => {
    setOpenSections({
      ...openSections,
      [section]: !openSections[section]
    });
  };

  const componentTypes = [
    {
      section: 'indicators',
      title: 'Indicators',
      icon: <ShowChartIcon />,
      color: theme.palette.info.main,
      components: [
        { type: 'Indicator', name: 'Moving Average', description: 'Simple Moving Average (SMA) indicator' },
        { type: 'Indicator', name: 'RSI', description: 'Relative Strength Index indicator' },
        { type: 'Indicator', name: 'MACD', description: 'Moving Average Convergence Divergence indicator' },
        { type: 'Indicator', name: 'Bollinger Bands', description: 'Bollinger Bands volatility indicator' }
      ]
    },
    {
      section: 'signals',
      title: 'Signals',
      icon: <SignalCellularAltIcon />,
      color: theme.palette.warning.main,
      components: [
        { type: 'Signal', name: 'Crossover', description: 'Detects when one line crosses another' },
        { type: 'Signal', name: 'Threshold', description: 'Triggers when value crosses a threshold' },
        { type: 'Signal', name: 'Divergence', description: 'Detects divergence between price and indicator' }
      ]
    },
    {
      section: 'conditions',
      title: 'Conditions',
      icon: <FilterAltIcon />,
      color: theme.palette.secondary.main,
      components: [
        { type: 'Condition', name: 'AND', description: 'Logical AND operator' },
        { type: 'Condition', name: 'OR', description: 'Logical OR operator' },
        { type: 'Condition', name: 'NOT', description: 'Logical NOT operator' },
        { type: 'Condition', name: 'Time Filter', description: 'Filters based on time conditions' }
      ]
    },
    {
      section: 'entries',
      title: 'Entries',
      icon: <CallMadeIcon />,
      color: theme.palette.success.main,
      components: [
        { type: 'Entry', name: 'Market Entry', description: 'Enter at market price' },
        { type: 'Entry', name: 'Limit Entry', description: 'Enter at specified limit price' },
        { type: 'Entry', name: 'Stop Entry', description: 'Enter at specified stop price' }
      ]
    },
    {
      section: 'exits',
      title: 'Exits',
      icon: <CallReceivedIcon />,
      color: theme.palette.error.main,
      components: [
        { type: 'Exit', name: 'Take Profit', description: 'Exit at profit target' },
        { type: 'Exit', name: 'Stop Loss', description: 'Exit at stop loss level' },
        { type: 'Exit', name: 'Trailing Stop', description: 'Exit with trailing stop loss' }
      ]
    },
    {
      section: 'quantum',
      title: 'Quantum Components',
      icon: <MemoryIcon />,
      color: theme.palette.primary.main,
      components: [
        { type: 'QuantumComponent', name: 'Quantum Predictor', description: 'Predicts price movements using quantum algorithms' },
        { type: 'QuantumComponent', name: 'Quantum Optimizer', description: 'Optimizes parameters using quantum computing' },
        { type: 'QuantumComponent', name: 'Quantum Pattern', description: 'Detects patterns using quantum pattern recognition' }
      ]
    },
    {
      section: 'hyperdimensional',
      title: 'Hyperdimensional Components',
      icon: <BlurOnIcon />,
      color: '#9c27b0', // Purple
      components: [
        { type: 'HyperdimensionalComponent', name: 'HD Pattern Recognizer', description: 'Recognizes patterns in high-dimensional space' },
        { type: 'HyperdimensionalComponent', name: 'HD Correlator', description: 'Finds correlations in high-dimensional data' },
        { type: 'HyperdimensionalComponent', name: 'HD Predictor', description: 'Predicts using hyperdimensional computing' }
      ]
    },
    {
      section: 'riskManagement',
      title: 'Risk Management',
      icon: <SecurityIcon />,
      color: '#ff9800', // Orange
      components: [
        { type: 'RiskManagement', name: 'Position Sizer', description: 'Calculates optimal position size' },
        { type: 'RiskManagement', name: 'Risk Limiter', description: 'Limits risk per trade' },
        { type: 'RiskManagement', name: 'Zero Loss Enforcer', description: 'Enforces zero loss policy' }
      ]
    }
  ];

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        height: '100%', 
        overflow: 'auto',
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)'
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Components
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Drag components to the canvas
        </Typography>
      </Box>
      
      <Divider />
      
      <List sx={{ width: '100%' }} component="nav">
        {componentTypes.map((section) => (
          <React.Fragment key={section.section}>
            <ListItemButton onClick={() => handleToggle(section.section)}>
              <ListItemIcon sx={{ color: section.color }}>
                {section.icon}
              </ListItemIcon>
              <ListItemText 
                primary={section.title} 
                primaryTypographyProps={{ fontWeight: 'medium' }}
              />
              {openSections[section.section] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            
            <Collapse in={openSections[section.section]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.components.map((component, index) => (
                  <ListItem 
                    key={index} 
                    sx={{ pl: 4 }}
                    disablePadding
                    draggable
                    onDragStart={(event) => onDragStart(event, component)}
                    style={{ cursor: 'grab' }}
                  >
                    <ListItemButton 
                      sx={{ 
                        borderLeft: `3px solid ${section.color}`,
                        ml: 2,
                        borderRadius: '0 8px 8px 0',
                        my: 0.5
                      }}
                    >
                      <ListItemText 
                        primary={component.name} 
                        secondary={component.description}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default ComponentPanel;
