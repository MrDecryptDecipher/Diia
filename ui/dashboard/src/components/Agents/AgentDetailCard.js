import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Memory,
  Psychology,
  Science,
  Biotech,
  SmartToy,
  Speed,
  Insights,
  BarChart,
  Timeline,
  ShowChart,
  Lightbulb,
  DataObject,
} from '@mui/icons-material';

const AgentDetailCard = ({ agent }) => {
  const theme = useTheme();

  // Get agent icon based on type
  const getAgentIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'quantum':
        return <Science fontSize="small" />;
      case 'neural':
        return <Psychology fontSize="small" />;
      case 'hybrid':
        return <Memory fontSize="small" />;
      case 'genetic':
        return <Biotech fontSize="small" />;
      default:
        return <SmartToy fontSize="small" />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return theme.palette.success.main;
      case 'standby':
        return theme.palette.info.main;
      case 'learning':
        return theme.palette.warning.main;
      case 'analyzing':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Get performance color
  const getPerformanceColor = (value) => {
    if (value >= 80) return theme.palette.success.main;
    if (value >= 60) return theme.palette.info.main;
    if (value >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(agent.color, 0.2)} 0%, rgba(17, 24, 39, 0.7) 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(agent.color, 0.3)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
      className="futuristic-border"
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at top left, ${alpha(agent.color, 0.2)} 0%, transparent 70%)`,
          opacity: 0.5,
        }}
      />

      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(agent.color, 0.2),
                color: agent.color,
              }}
            >
              {getAgentIcon(agent.type)}
            </Box>
            <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: agent.color }}>
              {agent.name}
            </Typography>
          </Box>
        }
        action={
          <Chip
            size="small"
            label={agent.status}
            sx={{
              backgroundColor: alpha(getStatusColor(agent.status), 0.1),
              color: getStatusColor(agent.status),
              borderRadius: '4px',
            }}
            className={agent.status === 'active' ? 'pulsate' : ''}
          />
        }
        subheader={
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} Agent • Stage {agent.evolutionStage}
          </Typography>
        }
        sx={{ position: 'relative', zIndex: 1 }}
      />

      <Divider sx={{ opacity: 0.2 }} />

      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3}>
          {/* Performance Metrics */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Performance Metrics
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Speed fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="body2">Accuracy</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                  {agent.accuracy !== undefined ? agent.accuracy.toFixed(2) : '0.00'}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={agent.accuracy || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: theme.palette.primary.main,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Insights fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                  <Typography variant="body2">Efficiency</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                  {agent.efficiency !== undefined ? agent.efficiency.toFixed(2) : '0.00'}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={agent.efficiency || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: theme.palette.success.main,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChart fontSize="small" sx={{ mr: 1, color: theme.palette.warning.main }} />
                  <Typography variant="body2">Confidence</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>
                  {agent.confidence !== undefined ? agent.confidence.toFixed(2) : '0.00'}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={agent.confidence || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.warning.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: theme.palette.warning.main,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Timeline fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                  <Typography variant="body2">Adaptability</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: theme.palette.info.main, fontWeight: 600 }}>
                  {agent.adaptability !== undefined ? agent.adaptability.toFixed(2) : '0.00'}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={agent.adaptability || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.info.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: theme.palette.info.main,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShowChart fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                  <Typography variant="body2">Overall Performance</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: getPerformanceColor(agent.performance || 0), fontWeight: 600 }}>
                  {agent.performance !== undefined ? agent.performance.toFixed(2) : '0.00'}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={agent.performance || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(getPerformanceColor(agent.performance || 0), 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    backgroundColor: getPerformanceColor(agent.performance || 0),
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Agent Capabilities */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Agent Capabilities
            </Typography>

            <List dense>
              {agent.capabilities && agent.capabilities.length > 0 ? (
                agent.capabilities.map((capability, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Lightbulb fontSize="small" sx={{ color: agent.color }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={capability.name}
                      secondary={capability.description}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary="No capabilities available"
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              )}
            </List>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
              Specializations
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {agent.specializations && agent.specializations.length > 0 ? (
                agent.specializations.map((spec, index) => (
                  <Chip
                    key={index}
                    size="small"
                    label={spec}
                    sx={{
                      backgroundColor: alpha(agent.color, 0.1),
                      color: agent.color,
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No specializations available
                </Typography>
              )}
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
              Technical Details
            </Typography>

            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <DataObject fontSize="small" sx={{ color: theme.palette.info.main }} />
                </ListItemIcon>
                <ListItemText
                  primary="Algorithm Type"
                  secondary={agent.algorithmType || 'Unknown'}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Memory fontSize="small" sx={{ color: theme.palette.info.main }} />
                </ListItemIcon>
                <ListItemText
                  primary="Processing Units"
                  secondary={agent.processingUnits ? `${agent.processingUnits} units` : 'Unknown'}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Psychology fontSize="small" sx={{ color: theme.palette.info.main }} />
                </ListItemIcon>
                <ListItemText
                  primary="Learning Model"
                  secondary={agent.learningModel || 'Unknown'}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2, opacity: 0.2 }} />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Recent Activity
          </Typography>
          <List dense>
            {agent.recentActivity && agent.recentActivity.length > 0 ? (
              agent.recentActivity.map((activity, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={activity.action}
                    secondary={activity.timestamp}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem sx={{ px: 0 }}>
                <ListItemText
                  primary="No recent activity"
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                />
              </ListItem>
            )}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AgentDetailCard;
