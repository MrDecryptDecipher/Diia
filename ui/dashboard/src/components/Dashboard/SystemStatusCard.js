import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import { formatDuration, formatDate } from '../../utils/formatters';

const SystemStatusCard = ({ systemStatus }) => {
  const theme = useTheme();

  if (!systemStatus) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Loading system status...
        </Typography>
      </Box>
    );
  }

  // Status items
  const statusItems = [
    { label: 'System Load', value: systemStatus.systemLoad, color: theme.palette.primary.main },
    { label: 'Memory Usage', value: systemStatus.memoryUsage, color: theme.palette.secondary.main },
    { label: 'CPU Usage', value: systemStatus.cpuUsage, color: theme.palette.warning.main },
    { label: 'Disk Usage', value: systemStatus.diskUsage, color: theme.palette.info.main },
  ];

  // Parse percentage value
  const parsePercentage = (value) => {
    if (typeof value === 'string' && value.endsWith('%')) {
      return parseFloat(value);
    }
    return 0;
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Uptime
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {formatDuration(systemStatus.uptime)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Mode
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
              {systemStatus.mode}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Active Agents
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {systemStatus.activeAgents}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              Active Trades
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {systemStatus.activeTrades}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          System Resources
        </Typography>

        {statusItems.map((item) => (
          <Box key={item.label} sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {item.label}
              </Typography>
              <Typography variant="caption" sx={{ color: item.color, fontWeight: 600 }}>
                {item.value}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={parsePercentage(item.value)}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(item.color, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                  backgroundColor: item.color,
                },
              }}
            />
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Network Latency
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {systemStatus.networkLatency}
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          API Calls Per Minute
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {systemStatus.apiCallsPerMinute ? systemStatus.apiCallsPerMinute.toLocaleString() : 'N/A'}
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Last Update
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {formatDate(systemStatus.lastUpdate, 'datetime')}
        </Typography>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          Next Maintenance
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {systemStatus.nextMaintenance ? formatDate(systemStatus.nextMaintenance, 'long') : 'Not scheduled'}
        </Typography>
      </Box>
    </Box>
  );
};

export default SystemStatusCard;
