import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Memory,
  Psychology,
  Science,
  Biotech,
  SmartToy,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { formatPercentage } from '../../utils/formatters';

const AgentCard = ({ agent }) => {
  const theme = useTheme();
  const navigate = useNavigate();

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

  // Handle card click
  const handleClick = () => {
    navigate(`/agents/${agent.id}`);
  };

  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(agent.color, 0.2)} 0%, rgba(17, 24, 39, 0.7) 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(agent.color, 0.3)}`,
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
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
      <CardActionArea onClick={handleClick} sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                  mr: 1.5,
                }}
              >
                {getAgentIcon(agent.type)}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: agent.color }}>
                  {agent.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)} Agent
                </Typography>
              </Box>
            </Box>
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
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2">Performance</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: getPerformanceColor(agent.performance),
                  }}
                >
                  {formatPercentage(agent.performance / 100)}
                </Typography>
                {agent.performance >= 50 ? (
                  <TrendingUp fontSize="small" sx={{ ml: 0.5, color: theme.palette.success.main }} />
                ) : (
                  <TrendingDown fontSize="small" sx={{ ml: 0.5, color: theme.palette.error.main }} />
                )}
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={agent.performance}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: alpha(getPerformanceColor(agent.performance), 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: getPerformanceColor(agent.performance),
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Accuracy
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatPercentage(agent.accuracy / 100)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Efficiency
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatPercentage(agent.efficiency / 100)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Confidence
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatPercentage(agent.confidence / 100)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Trades
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {agent.tradesCount}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Win Rate
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: agent.winRate >= 0.5 ? theme.palette.success.main : theme.palette.error.main,
                }}
              >
                {formatPercentage(agent.winRate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Evolution
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Stage {agent.evolutionStage}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AgentCard;
