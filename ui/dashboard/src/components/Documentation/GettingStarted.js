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
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowRight,
  CheckCircle,
  PlayArrow,
  Settings,
  Psychology,
  BarChart,
} from '@mui/icons-material';

const GettingStarted = () => {
  const theme = useTheme();
  
  return (
    <Box>
      {/* Introduction */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Welcome to OMNI-ALPHA
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        OMNI-ALPHA is a cutting-edge trading system that leverages quantum-inspired algorithms, 
        neural networks, and advanced analytics to provide optimal trading strategies. This guide 
        will help you get started with the system and understand its core features.
      </Typography>
      
      {/* System Overview */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: alpha(theme.palette.background.paper, 0.1),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          System Overview
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          OMNI-ALPHA consists of several interconnected components:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <BarChart color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Trading Engine" 
              secondary="Executes trades based on signals from the agent network" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Psychology color="secondary" />
            </ListItemIcon>
            <ListItemText 
              primary="Agent Network" 
              secondary="A network of specialized AI agents that analyze markets and generate trading signals" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Settings color="info" />
            </ListItemIcon>
            <ListItemText 
              primary="Configuration System" 
              secondary="Allows customization of trading parameters, risk levels, and agent behavior" 
            />
          </ListItem>
        </List>
      </Paper>
      
      {/* Quick Start Guide */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Quick Start Guide
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <CheckCircle color="success" />
          </ListItemIcon>
          <ListItemText 
            primary="Step 1: Configure Your Account" 
            secondary="Set up your trading preferences in the Settings page" 
          />
        </ListItem>
        <Divider sx={{ my: 1, opacity: 0.2 }} />
        <ListItem>
          <ListItemIcon>
            <CheckCircle color="success" />
          </ListItemIcon>
          <ListItemText 
            primary="Step 2: Explore Available Assets" 
            secondary="Browse the Assets page to see available trading pairs and opportunity scores" 
          />
        </ListItem>
        <Divider sx={{ my: 1, opacity: 0.2 }} />
        <ListItem>
          <ListItemIcon>
            <CheckCircle color="success" />
          </ListItemIcon>
          <ListItemText 
            primary="Step 3: Activate Agents" 
            secondary="Enable and configure trading agents in the Agents page" 
          />
        </ListItem>
        <Divider sx={{ my: 1, opacity: 0.2 }} />
        <ListItem>
          <ListItemIcon>
            <CheckCircle color="success" />
          </ListItemIcon>
          <ListItemText 
            primary="Step 4: Monitor Trades" 
            secondary="Track your active and historical trades in the Trades page" 
          />
        </ListItem>
        <Divider sx={{ my: 1, opacity: 0.2 }} />
        <ListItem>
          <ListItemIcon>
            <CheckCircle color="success" />
          </ListItemIcon>
          <ListItemText 
            primary="Step 5: Analyze Performance" 
            secondary="Review your trading performance in the Dashboard" 
          />
        </ListItem>
      </List>
      
      {/* Key Features */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
        Key Features
      </Typography>
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          background: alpha(theme.palette.background.paper, 0.1),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <List>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Quantum-Inspired Algorithms" 
              secondary="Leverages quantum computing principles for advanced pattern recognition" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Multi-Agent Architecture" 
              secondary="Specialized agents work together to analyze different aspects of the market" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Advanced Risk Management" 
              secondary="Sophisticated risk controls to protect your capital" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Real-Time Analytics" 
              secondary="Live market data analysis and visualization" 
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ArrowRight color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Customizable Strategies" 
              secondary="Tailor the system to your trading preferences and risk tolerance" 
            />
          </ListItem>
        </List>
      </Paper>
      
      {/* Video Tutorial */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Video Tutorials
      </Typography>
      <List>
        <ListItem button>
          <ListItemIcon>
            <PlayArrow color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Getting Started with OMNI-ALPHA" 
            secondary="A comprehensive introduction to the system (10:23)" 
          />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <PlayArrow color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Configuring Trading Agents" 
            secondary="Learn how to set up and optimize your trading agents (8:45)" 
          />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <PlayArrow color="error" />
          </ListItemIcon>
          <ListItemText 
            primary="Advanced Trading Strategies" 
            secondary="Discover advanced techniques for maximizing profits (15:12)" 
          />
        </ListItem>
      </List>
      
      {/* Next Steps */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
        Next Steps
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Now that you're familiar with the basics, explore these resources to deepen your understanding:
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <ArrowRight color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Trading Documentation" 
            secondary="Learn about different trading strategies and parameters" 
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <ArrowRight color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="Agents Documentation" 
            secondary="Understand how the agent network operates and how to optimize it" 
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <ArrowRight color="primary" />
          </ListItemIcon>
          <ListItemText 
            primary="API Documentation" 
            secondary="Integrate OMNI-ALPHA with your existing systems" 
          />
        </ListItem>
      </List>
    </Box>
  );
};

export default GettingStarted;
