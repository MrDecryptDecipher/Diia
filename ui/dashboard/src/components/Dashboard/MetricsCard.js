import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  useTheme, 
  alpha 
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { motion } from 'framer-motion';

const MetricsCard = ({ title, value, icon, color, subtitle, trend, trendValue }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      whileHover={{ 
        y: -5,
        boxShadow: `0 10px 20px ${alpha(color, 0.3)}`,
        transition: { duration: 0.2 }
      }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, rgba(17, 24, 39, 0.7) 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(color, 0.3)}`,
          boxShadow: `0 4px 12px ${alpha(color, 0.2)}`,
          position: 'relative',
          overflow: 'hidden',
        }}
        className="futuristic-border"
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: `radial-gradient(circle at top right, ${alpha(color, 0.3)} 0%, transparent 70%)`,
            opacity: 0.5,
          }}
        />
        
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, color: 'text.secondary' }}>
              {title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: alpha(color, 0.1),
                color: color,
              }}
            >
              {icon}
            </Box>
          </Box>
          
          <Typography
            variant="h4"
            sx={{
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700,
              mb: 1,
              color: theme.palette.text.primary,
            }}
          >
            {value}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
            
            {trend !== 'neutral' && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                }}
              >
                {trend === 'up' ? <TrendingUp fontSize="small" sx={{ mr: 0.5 }} /> : <TrendingDown fontSize="small" sx={{ mr: 0.5 }} />}
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {trendValue}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricsCard;
