import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import AgentStatusCard from '../components/Dashboard/AgentStatusCard';

const Agents = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { agentStatus } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const networkRef = useRef(null);
  
  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (filter, value) => {
    switch (filter) {
      case 'type':
        setFilterType(value);
        break;
      case 'status':
        setFilterStatus(value);
        break;
      default:
        break;
    }
  };
  
  // Filter agents
  const getFilteredAgents = () => {
    if (!agentStatus) return [];
    
    let filteredAgents = [...agentStatus];
    
    // Apply search
    if (searchTerm) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply filters
    if (filterType) {
      filteredAgents = filteredAgents.filter(agent => agent.type === filterType);
    }
    
    if (filterStatus) {
      filteredAgents = filteredAgents.filter(agent => agent.status === filterStatus);
    }
    
    return filteredAgents;
  };
  
  // Get unique agent types
  const getUniqueTypes = () => {
    if (!agentStatus || !Array.isArray(agentStatus)) return [];
    return [...new Set(agentStatus.map(agent => agent?.type || '').filter(Boolean))];
  };
  
  // Get unique agent statuses
  const getUniqueStatuses = () => {
    if (!agentStatus || !Array.isArray(agentStatus)) return [];
    return [...new Set(agentStatus.map(agent => agent?.status || '').filter(Boolean))];
  };
  
  // Create network visualization
  useEffect(() => {
    if (!networkRef.current || !agentStatus || agentStatus.length === 0) return;
    
    // Clear previous visualization
    d3.select(networkRef.current).selectAll('*').remove();
    
    // Set up dimensions
    const width = networkRef.current.clientWidth;
    const height = 400;
    
    // Create SVG
    const svg = d3.select(networkRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create nodes and links
    const nodes = agentStatus.filter(agent => agent && agent.id).map(agent => ({
      id: agent.id,
      name: agent.name || 'Unknown Agent',
      type: agent.type || 'Unknown',
      status: agent.status || 'Unknown',
      color: agent.color || '#666666',
      connections: agent.connections || 0,
    }));
    
    // Create links based on connections
    const links = [];
    nodes.forEach(node => {
      for (let i = 0; i < node.connections; i++) {
        const targetIndex = Math.floor(Math.random() * nodes.length);
        if (nodes[targetIndex].id !== node.id) {
          links.push({
            source: node.id,
            target: nodes[targetIndex].id,
            value: Math.random(),
          });
        }
      }
    });
    
    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));
    
    // Create gradient
    const gradient = svg.append('defs')
      .selectAll('linearGradient')
      .data(links)
      .enter()
      .append('linearGradient')
      .attr('id', (d, i) => `link-gradient-${i}`)
      .attr('gradientUnits', 'userSpaceOnUse');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', d => {
        const sourceNode = nodes.find(node => node.id === d.source.id || node.id === d.source);
        return sourceNode ? sourceNode.color : theme.palette.primary.main;
      });
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', d => {
        const targetNode = nodes.find(node => node.id === d.target.id || node.id === d.target);
        return targetNode ? targetNode.color : theme.palette.secondary.main;
      });
    
    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d, i) => `url(#link-gradient-${i})`)
      .attr('stroke-width', d => Math.sqrt(d.value) * 2)
      .attr('opacity', 0.6);
    
    // Create nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        navigate(`/agents/${d.id}`);
      });
    
    // Add circles
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => d.color)
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer');
    
    // Add text
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => (d.name && typeof d.name === 'string') ? d.name.substring(0, 2) : '??');
    
    // Add title for tooltip
    node.append('title')
      .text(d => `${d.name || 'Unknown'} (${d.type || 'Unknown'})\nStatus: ${d.status || 'Unknown'}`);
    
    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
      
      // Update gradient positions
      gradient
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Clean up
    return () => {
      simulation.stop();
    };
  }, [agentStatus, theme, navigate]);
  
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
              Agent Network
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: 'Rajdhani, sans-serif',
                color: theme.palette.text.secondary,
              }}
            >
              Multi-agent system with specialized roles and collaborative intelligence
            </Typography>
          </Box>
        </motion.div>
        
        {/* Network Visualization */}
        <motion.div variants={itemVariants}>
          <Card 
            sx={{ 
              mb: 3,
              background: 'rgba(17, 24, 39, 0.7)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
            className="futuristic-border neural-connections"
          >
            <CardHeader
              title={
                <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
                  Agent Interaction Network
                </Typography>
              }
              subheader="Interactive visualization of agent connections and relationships"
            />
            <Divider sx={{ opacity: 0.2 }} />
            <CardContent>
              <Box
                ref={networkRef}
                sx={{
                  width: '100%',
                  height: 400,
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={handleSearch}
              sx={{ flexGrow: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {getUniqueTypes().map((type) => (
                  <MenuItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                {getUniqueStatuses().map((status) => (
                  <MenuItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </motion.div>
        
        {/* Agent Cards */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={3}>
            {getFilteredAgents().map((agent) => (
              <Grid item xs={12} sm={6} md={4} key={agent.id}>
                <AgentStatusCard agent={agent} />
              </Grid>
            ))}
            {getFilteredAgents().length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    No agents found matching your filters.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default Agents;
