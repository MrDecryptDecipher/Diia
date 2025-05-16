import React, { useEffect, useRef } from 'react';
import { Box, Grid, Typography, Card, CardContent, useTheme, alpha } from '@mui/material';
import * as d3 from 'd3';

const QuantumEntanglement = ({ data }) => {
  const theme = useTheme();
  const svgRef = useRef(null);
  
  // Create entanglement visualization
  useEffect(() => {
    if (!svgRef.current || !data) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up dimensions
    const width = svgRef.current.clientWidth;
    const height = 400;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create group for visualization
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Create nodes
    const nodes = data.assets.map(asset => ({
      id: asset.symbol,
      name: asset.name,
      value: asset.marketCap,
      group: asset.sector,
      correlations: asset.correlations,
    }));
    
    // Create links based on correlations
    const links = [];
    nodes.forEach(source => {
      source.correlations.forEach(correlation => {
        const target = nodes.find(node => node.id === correlation.symbol);
        if (target) {
          links.push({
            source: source.id,
            target: target.id,
            value: Math.abs(correlation.value),
            positive: correlation.value >= 0,
          });
        }
      });
    });
    
    // Create scales
    const sizeScale = d3.scaleSqrt()
      .domain([d3.min(nodes, d => d.value), d3.max(nodes, d => d.value)])
      .range([5, 20]);
    
    const colorScale = d3.scaleOrdinal()
      .domain([...new Set(nodes.map(d => d.group))])
      .range([
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.info.main,
        theme.palette.success.main,
        theme.palette.warning.main,
        theme.palette.error.main,
      ]);
    
    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-200))
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(d => sizeScale(d.value) + 5));
    
    // Create links
    const link = g.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => d.positive ? theme.palette.success.main : theme.palette.error.main)
      .attr('stroke-width', d => d.value * 3)
      .attr('opacity', d => d.value * 0.7);
    
    // Create nodes
    const node = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Add circles to nodes
    node.append('circle')
      .attr('r', d => sizeScale(d.value))
      .attr('fill', d => colorScale(d.group))
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1.5);
    
    // Add labels to nodes
    node.append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .text(d => d.id)
      .attr('font-size', '10px')
      .attr('fill', theme.palette.text.primary);
    
    // Add title for tooltip
    node.append('title')
      .text(d => `${d.name} (${d.id})\nSector: ${d.group}\nMarket Cap: $${d.value.toLocaleString()}`);
    
    // Add glow effect
    const defs = svg.append('defs');
    
    const filter = defs.append('filter')
      .attr('id', 'glow-entanglement')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');
    
    // Apply glow effect
    node.selectAll('circle')
      .style('filter', 'url(#glow-entanglement)');
    
    // Add quantum particles
    const particles = [];
    links.forEach(link => {
      const sourceNode = nodes.find(node => node.id === link.source.id || node.id === link.source);
      const targetNode = nodes.find(node => node.id === link.target.id || node.id === link.target);
      
      if (sourceNode && targetNode) {
        for (let i = 0; i < Math.ceil(link.value * 5); i++) {
          particles.push({
            source: sourceNode,
            target: targetNode,
            progress: Math.random(),
            speed: 0.005 + Math.random() * 0.01,
            color: link.positive ? theme.palette.success.main : theme.palette.error.main,
            size: 2 + Math.random() * 2,
          });
        }
      }
    });
    
    const particleGroup = g.append('g')
      .attr('class', 'particles');
    
    particles.forEach((particle, i) => {
      particleGroup.append('circle')
        .attr('id', `particle-${i}`)
        .attr('r', particle.size)
        .attr('fill', particle.color)
        .attr('opacity', 0.7);
    });
    
    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
      
      // Update particles
      particles.forEach((particle, i) => {
        particle.progress += particle.speed;
        if (particle.progress > 1) particle.progress = 0;
        
        const sourceX = particle.source.x;
        const sourceY = particle.source.y;
        const targetX = particle.target.x;
        const targetY = particle.target.y;
        
        const x = sourceX + (targetX - sourceX) * particle.progress;
        const y = sourceY + (targetY - sourceY) * particle.progress;
        
        particleGroup.select(`#particle-${i}`)
          .attr('cx', x)
          .attr('cy', y);
      });
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
  }, [data, theme]);
  
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Asset Correlation Network
              </Typography>
              <Box
                ref={svgRef}
                sx={{
                  width: '100%',
                  height: 400,
                }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Entanglement Analysis
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Quantum Entanglement analyzes correlations between assets to identify hidden relationships and potential arbitrage opportunities.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Correlation Accuracy:</span>
                  <span style={{ color: theme.palette.success.main }}>96.2%</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Hidden Patterns Detected:</span>
                  <span style={{ color: theme.palette.info.main }}>14</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Arbitrage Opportunities:</span>
                  <span style={{ color: theme.palette.warning.main }}>7</span>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Top Correlations
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Strongest asset correlations detected:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>BTC-ETH:</span>
                  <span style={{ color: theme.palette.success.main }}>+0.92</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>SOL-AVAX:</span>
                  <span style={{ color: theme.palette.success.main }}>+0.87</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>BTC-GOLD:</span>
                  <span style={{ color: theme.palette.error.main }}>-0.64</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>ETH-XRP:</span>
                  <span style={{ color: theme.palette.success.main }}>+0.76</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>BNB-ADA:</span>
                  <span style={{ color: theme.palette.success.main }}>+0.81</span>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuantumEntanglement;
