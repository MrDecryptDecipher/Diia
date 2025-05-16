import React, { useEffect, useRef } from 'react';
import { Box, Paper, Typography, useTheme, alpha } from '@mui/material';
import * as d3 from 'd3';

const DimensionalVisualizer = ({ 
  data, 
  dimensions = 5, 
  width = 400, 
  height = 400, 
  title = 'Hyperdimensional Visualization',
  description
}) => {
  const theme = useTheme();
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Calculate radius
    const radius = Math.min(width, height) / 2 - 40;
    
    // Create scales for each dimension
    const angleScale = d3.scaleLinear()
      .domain([0, dimensions])
      .range([0, 2 * Math.PI]);
    
    const radiusScale = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, radius]);
    
    // Create axis lines
    const axes = Array.from({ length: dimensions }, (_, i) => {
      const angle = angleScale(i);
      return {
        x1: 0,
        y1: 0,
        x2: radius * Math.cos(angle),
        y2: radius * Math.sin(angle),
        angle: angle * 180 / Math.PI,
        label: `Dim ${i + 1}`
      };
    });
    
    // Draw axis lines
    svg.selectAll('.axis-line')
      .data(axes)
      .enter()
      .append('line')
      .attr('class', 'axis-line')
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2)
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
    
    // Draw axis labels
    svg.selectAll('.axis-label')
      .data(axes)
      .enter()
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', d => (radius + 15) * Math.cos(d.angle * Math.PI / 180))
      .attr('y', d => (radius + 15) * Math.sin(d.angle * Math.PI / 180))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', theme.palette.text.secondary)
      .attr('font-size', '10px')
      .text(d => d.label);
    
    // Draw concentric circles
    const circles = [0.25, 0.5, 0.75, 1];
    svg.selectAll('.circle')
      .data(circles)
      .enter()
      .append('circle')
      .attr('class', 'circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', d => radiusScale(d))
      .attr('fill', 'none')
      .attr('stroke', theme.palette.divider)
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '2,2');
    
    // Process data for visualization
    const processedData = data.map(item => {
      // Ensure we have enough coordinates
      const coords = item.coordinates.slice(0, dimensions);
      while (coords.length < dimensions) {
        coords.push(0); // Pad with zeros if needed
      }
      
      // Calculate points for the polygon
      const points = coords.map((value, i) => {
        const angle = angleScale(i);
        const distance = radiusScale(value);
        return [
          distance * Math.cos(angle),
          distance * Math.sin(angle)
        ];
      });
      
      return {
        ...item,
        points
      };
    });
    
    // Draw data polygons
    svg.selectAll('.data-polygon')
      .data(processedData)
      .enter()
      .append('path')
      .attr('class', 'data-polygon')
      .attr('d', d => {
        return d3.line()(d.points) + 'Z';
      })
      .attr('fill', (d, i) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main
        ];
        return alpha(colors[i % colors.length], 0.5);
      })
      .attr('stroke', (d, i) => {
        const colors = [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main
        ];
        return colors[i % colors.length];
      })
      .attr('stroke-width', 2)
      .attr('opacity', 0.7);
    
    // Draw data points
    svg.selectAll('.data-points')
      .data(processedData)
      .enter()
      .selectAll('.data-point')
      .data(d => d.points.map(point => ({ point, symbol: d.symbol })))
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => d.point[0])
      .attr('cy', d => d.point[1])
      .attr('r', 3)
      .attr('fill', theme.palette.background.paper)
      .attr('stroke', theme.palette.primary.main)
      .attr('stroke-width', 1);
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${-width / 2 + 20}, ${-height / 2 + 20})`);
    
    processedData.forEach((d, i) => {
      const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        theme.palette.info.main,
        theme.palette.warning.main
      ];
      
      legend.append('rect')
        .attr('x', 0)
        .attr('y', i * 20)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', alpha(colors[i % colors.length], 0.5))
        .attr('stroke', colors[i % colors.length]);
      
      legend.append('text')
        .attr('x', 20)
        .attr('y', i * 20 + 12)
        .attr('fill', theme.palette.text.primary)
        .attr('font-size', '12px')
        .text(d.symbol);
    });
    
  }, [data, dimensions, width, height, theme]);
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        {title}
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
        <svg ref={svgRef} width={width} height={height} />
      </Box>
      
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
};

export default DimensionalVisualizer;
