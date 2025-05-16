import React, { useEffect, useRef } from 'react';
import { Box, Grid, Typography, Card, CardContent, useTheme, alpha } from '@mui/material';
import * as d3 from 'd3';

const SpectralTree = ({ data }) => {
  const theme = useTheme();
  const svgRef = useRef(null);
  
  // Create spectral tree visualization
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
    
    // Create tree layout
    const treeLayout = d3.tree()
      .size([width - 100, height - 100]);
    
    // Create hierarchy
    const root = d3.hierarchy(data);
    
    // Assign positions
    treeLayout(root);
    
    // Create group for visualization
    const g = svg.append('g')
      .attr('transform', 'translate(50, 50)');
    
    // Create links
    const links = g.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y * 0.6)
        .y(d => d.x))
      .attr('stroke', d => {
        const depth = d.source.depth;
        const colors = [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.info.main,
          theme.palette.success.main,
          theme.palette.warning.main,
        ];
        return colors[depth % colors.length];
      })
      .attr('stroke-width', d => 3 - d.source.depth * 0.5)
      .attr('fill', 'none')
      .attr('opacity', 0.6);
    
    // Create nodes
    const nodes = g.selectAll('.node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y * 0.6},${d.x})`);
    
    // Add circles to nodes
    nodes.append('circle')
      .attr('r', d => 8 - d.depth * 1.5)
      .attr('fill', d => {
        const depth = d.depth;
        const colors = [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.info.main,
          theme.palette.success.main,
          theme.palette.warning.main,
        ];
        return colors[depth % colors.length];
      })
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1);
    
    // Add labels to nodes
    nodes.append('text')
      .attr('dy', 3)
      .attr('x', d => d.children ? -12 : 12)
      .attr('text-anchor', d => d.children ? 'end' : 'start')
      .text(d => d.data.name)
      .attr('font-size', d => 12 - d.depth * 2)
      .attr('fill', theme.palette.text.primary);
    
    // Add glow effect
    const defs = svg.append('defs');
    
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode')
      .attr('in', 'coloredBlur');
    feMerge.append('feMergeNode')
      .attr('in', 'SourceGraphic');
    
    // Apply glow effect
    nodes.selectAll('circle')
      .style('filter', 'url(#glow)');
    
    // Add animation
    nodes.selectAll('circle')
      .transition()
      .duration(2000)
      .attr('r', d => (8 - d.depth * 1.5) * (1 + Math.random() * 0.2))
      .on('end', function repeat() {
        d3.select(this)
          .transition()
          .duration(2000 + Math.random() * 1000)
          .attr('r', d => (8 - d.depth * 1.5) * (1 + Math.random() * 0.2))
          .on('end', repeat);
      });
    
    // Clean up
    return () => {
      // Stop animations
    };
  }, [data, theme]);
  
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Spectral Decision Tree
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
                Tree Performance
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                The Spectral Tree Engine analyzes market data using quantum-inspired decision trees to identify optimal trading opportunities.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Decision Accuracy:</span>
                  <span style={{ color: theme.palette.success.main }}>94.7%</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Processing Speed:</span>
                  <span style={{ color: theme.palette.info.main }}>12ms</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Tree Depth:</span>
                  <span style={{ color: theme.palette.warning.main }}>8 levels</span>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Decision Metrics
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Key metrics used in the decision-making process:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Spectral Entropy:</span>
                  <span style={{ color: theme.palette.success.main }}>0.87</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Information Gain:</span>
                  <span style={{ color: theme.palette.success.main }}>0.92</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Quantum Coherence:</span>
                  <span style={{ color: theme.palette.success.main }}>0.78</span>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SpectralTree;
