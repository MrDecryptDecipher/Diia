import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

const Layout = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Outlet />
    </Box>
  );
};

export default Layout;
