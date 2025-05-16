import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AgentStatusCard = ({ agent }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Default color if agent.color is undefined
  const agentColor = agent.color || theme.palette.primary.main;

  // Handle click
  const handleClick = () => {
    navigate(`/agents/${agent.id}`);
  };

  // Status color
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

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        boxShadow: `0 8px 16px ${alpha(agentColor, 0.2)}`,
        transition: { duration: 0.2 }
      }}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          background: `linear-gradient(135deg, ${alpha(agentColor, 0.2)} 0%, rgba(17, 24, 39, 0.7) 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(agentColor, 0.3)}`,
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
            background: `radial-gradient(circle at top left, ${alpha(agentColor, 0.2)} 0%, transparent 70%)`,
            opacity: 0.5,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: agentColor }}>
              {agent.name}
            </Typography>
            <Chip
              size="small"
              label={agent.status}
              sx={{
                height: 24,
                backgroundColor: alpha(getStatusColor(agent.status), 0.1),
                color: getStatusColor(agent.status),
                borderRadius: '4px',
              }}
              className={agent.status === 'active' ? 'pulsate' : ''}
            />
          </Box>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {agent.type ? `${agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} Agent` : 'Unknown Agent'} • Stage {agent.evolutionStage || 1}
          </Typography>

          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Accuracy
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                {agent.accuracy !== undefined ? agent.accuracy.toFixed(2) : '0.00'}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={agent.accuracy !== undefined ? agent.accuracy : 0}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Efficiency
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                {agent.efficiency !== undefined ? agent.efficiency.toFixed(2) : '0.00'}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={agent.efficiency !== undefined ? agent.efficiency : 0}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                  backgroundColor: theme.palette.success.main,
                },
              }}
            />
          </Box>

          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Confidence
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.warning.main, fontWeight: 600 }}>
                {agent.confidence !== undefined ? agent.confidence.toFixed(2) : '0.00'}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={agent.confidence !== undefined ? agent.confidence : 0}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 2,
                  backgroundColor: theme.palette.warning.main,
                },
              }}
            />
          </Box>

          <Tooltip title={agent.lastActionTime || 'Unknown'}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
              Last action: {agent.lastAction || 'No action recorded'}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  );
};

export default AgentStatusCard;
