import React, { useEffect, useRef } from 'react';
import { Box, Grid, Typography, Card, CardContent, useTheme, alpha } from '@mui/material';
import * as d3 from 'd3';

const HyperdimensionalComputing = ({ data }) => {
  const theme = useTheme();
  const svgRef = useRef(null);
  
  // Create hyperdimensional visualization
  useEffect(() => {
    if (!svgRef.current || !data) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up dimensions
    const width = svgRef.current.clientWidth;
    const height = 400;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create group for visualization
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales for projection
    const xScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([innerHeight, 0]);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickSize(-innerHeight)
      .tickPadding(10);
    
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickPadding(10);
    
    // Add axes
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('line')
      .attr('stroke', alpha(theme.palette.divider, 0.2));
    
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('line')
      .attr('stroke', alpha(theme.palette.divider, 0.2));
    
    // Style axes
    svg.selectAll('.domain')
      .attr('stroke', alpha(theme.palette.divider, 0.5));
    
    svg.selectAll('text')
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '10px');
    
    // Create color scale
    const colorScale = d3.scaleSequential(d3.interpolateInferno)
      .domain([0, 1]);
    
    // Create projection data
    const projectionData = data.projections.map(p => ({
      x: p.x,
      y: p.y,
      value: p.value,
      label: p.label,
      cluster: p.cluster,
    }));
    
    // Create clusters
    const clusters = data.clusters.map(cluster => ({
      id: cluster.id,
      x: cluster.x,
      y: cluster.y,
      radius: cluster.radius,
      label: cluster.label,
    }));
    
    // Add clusters
    g.selectAll('.cluster')
      .data(clusters)
      .enter()
      .append('circle')
      .attr('class', 'cluster')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', d => d.radius * 50)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.primary.main)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.6);
    
    // Add cluster labels
    g.selectAll('.cluster-label')
      .data(clusters)
      .enter()
      .append('text')
      .attr('class', 'cluster-label')
      .attr('x', d => xScale(d.x))
      .attr('y', d => yScale(d.y) - d.radius * 50 - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '12px')
      .text(d => d.label);
    
    // Add points
    g.selectAll('.point')
      .data(projectionData)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', 5)
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1)
      .attr('opacity', 0.8);
    
    // Add point labels
    g.selectAll('.point-label')
      .data(projectionData)
      .enter()
      .append('text')
      .attr('class', 'point-label')
      .attr('x', d => xScale(d.x))
      .attr('y', d => yScale(d.y) - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.text.primary)
      .attr('font-size', '10px')
      .text(d => d.label);
    
    // Add glow effect
    const defs = svg.append('defs');
    
    const filter = defs.append('filter')
      .attr('id', 'glow-hyper')
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
    g.selectAll('.point')
      .style('filter', 'url(#glow-hyper)');
    
    // Add dimension lines
    const dimensions = data.dimensions.map(dim => ({
      id: dim.id,
      angle: dim.angle,
      label: dim.label,
      importance: dim.importance,
    }));
    
    // Add dimension lines
    g.selectAll('.dimension')
      .data(dimensions)
      .enter()
      .append('line')
      .attr('class', 'dimension')
      .attr('x1', xScale(0))
      .attr('y1', yScale(0))
      .attr('x2', d => xScale(Math.cos(d.angle) * 0.9))
      .attr('y2', d => yScale(Math.sin(d.angle) * 0.9))
      .attr('stroke', theme.palette.info.main)
      .attr('stroke-width', d => d.importance * 3)
      .attr('opacity', 0.6);
    
    // Add dimension labels
    g.selectAll('.dimension-label')
      .data(dimensions)
      .enter()
      .append('text')
      .attr('class', 'dimension-label')
      .attr('x', d => xScale(Math.cos(d.angle) * 0.95))
      .attr('y', d => yScale(Math.sin(d.angle) * 0.95))
      .attr('text-anchor', d => {
        const x = Math.cos(d.angle);
        if (x > 0.5) return 'start';
        if (x < -0.5) return 'end';
        return 'middle';
      })
      .attr('dominant-baseline', d => {
        const y = Math.sin(d.angle);
        if (y > 0.5) return 'text-before-edge';
        if (y < -0.5) return 'text-after-edge';
        return 'middle';
      })
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '10px')
      .text(d => d.label);
    
    // Add animation
    g.selectAll('.point')
      .transition()
      .duration(2000)
      .attr('r', d => 5 + Math.random() * 2)
      .on('end', function repeat() {
        d3.select(this)
          .transition()
          .duration(2000 + Math.random() * 1000)
          .attr('r', d => 5 + Math.random() * 2)
          .attr('opacity', d => 0.7 + Math.random() * 0.3)
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
                Hyperdimensional Pattern Space
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
                Hyperdimensional Performance
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Hyperdimensional Computing processes market data in high-dimensional space to identify complex patterns invisible to traditional analysis.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Pattern Recognition:</span>
                  <span style={{ color: theme.palette.success.main }}>98.3%</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Dimensionality:</span>
                  <span style={{ color: theme.palette.info.main }}>10,000</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Processing Time:</span>
                  <span style={{ color: theme.palette.warning.main }}>8ms</span>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ background: alpha(theme.palette.background.paper, 0.1) }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Key Dimensions
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Most influential dimensions in the hyperdimensional space:
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Price Momentum:</span>
                  <span style={{ color: theme.palette.success.main }}>0.94</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Volume Profile:</span>
                  <span style={{ color: theme.palette.success.main }}>0.89</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Market Sentiment:</span>
                  <span style={{ color: theme.palette.success.main }}>0.87</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Volatility Structure:</span>
                  <span style={{ color: theme.palette.success.main }}>0.85</span>
                </Typography>
                <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <span>Order Flow Imbalance:</span>
                  <span style={{ color: theme.palette.success.main }}>0.82</span>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HyperdimensionalComputing;
