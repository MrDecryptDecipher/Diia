import React from 'react';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

const LoadingIndicator = ({ message = 'Loading...' }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <CircularProgress
        size={40}
        thickness={4}
        sx={{
          color: theme.palette.primary.main,
          mb: 2,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          color: theme.palette.text.secondary,
          fontFamily: 'Rajdhani, sans-serif',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingIndicator;
