import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

const AssetDetails = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Asset Details
      </Typography>
      <Typography variant="body1">
        This page is under construction.
      </Typography>
    </Box>
  );
};

export default AssetDetails;
