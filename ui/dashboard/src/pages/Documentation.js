import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  useTheme,
  alpha,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MenuBook,
  Code,
  Api,
  Psychology,
  BarChart,
  Help,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GettingStarted, TradingDocs } from '../components/Documentation';

const Documentation = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Container variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  // Item variants for animations
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <Box sx={{ pb: 4 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: 700,
                mb: 1,
              }}
              className="glow-text"
            >
              Documentation
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                color: theme.palette.text.secondary,
              }}
            >
              Comprehensive guides and references for the Nija DilA system
            </Typography>
          </Box>
        </motion.div>

        {/* Documentation Card */}
        <motion.div variants={itemVariants}>
          <Card
            sx={{
              mb: 3,
              background: 'rgba(17, 24, 39, 0.7)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
            className="futuristic-border"
          >
            <CardHeader
              title={
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  textColor="primary"
                  indicatorColor="primary"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      fontFamily: 'Rajdhani, sans-serif',
                      fontWeight: 600,
                      minWidth: 120,
                    },
                  }}
                >
                  <Tab icon={<MenuBook />} label="Getting Started" />
                  <Tab icon={<BarChart />} label="Trading" />
                  <Tab icon={<Psychology />} label="Agents" />
                  <Tab icon={<Api />} label="API" />
                  <Tab icon={<Code />} label="Examples" />
                  <Tab icon={<Help />} label="FAQ" />
                </Tabs>
              }
            />
            <Divider sx={{ opacity: 0.2 }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ p: 2, minHeight: 400 }}>
                {activeTab === 0 && <GettingStarted />}
                {activeTab === 1 && <TradingDocs />}
                {activeTab === 2 && (
                  <Typography variant="body1">
                    Agents documentation will be added here
                  </Typography>
                )}
                {activeTab === 3 && (
                  <Typography variant="body1">
                    API documentation will be added here
                  </Typography>
                )}
                {activeTab === 4 && (
                  <Typography variant="body1">
                    Examples will be added here
                  </Typography>
                )}
                {activeTab === 5 && (
                  <Typography variant="body1">
                    FAQ will be added here
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default Documentation;
