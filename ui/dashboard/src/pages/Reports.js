import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  alpha,
  Paper,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import ReportGenerator from '../components/Reports/ReportGenerator';

const Reports = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.main }}>
        Reports
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          mb: 3
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Generate Comprehensive Reports
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Create detailed reports with advanced visualizations for all timeframes. Download as PDF for sharing and analysis.
        </Typography>
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            mb: 3
          }}
        >
          <Tab label="Performance Report" />
          <Tab label="Trade Analysis" />
          <Tab label="Agent Performance" />
          <Tab label="Asset Analysis" />
          <Tab label="Strategy Report" />
        </Tabs>
        
        <ReportGenerator reportType={activeTab} />
      </Paper>
    </Box>
  );
};

export default Reports;
