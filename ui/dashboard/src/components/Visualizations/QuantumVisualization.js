import React, { useEffect, useRef } from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import * as d3 from 'd3';

const QuantumVisualization = () => {
  const theme = useTheme();
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up dimensions
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'quantum-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', theme.palette.primary.main);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', theme.palette.secondary.main);
    
    // Generate random quantum states
    const numStates = 20;
    const states = Array.from({ length: numStates }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      radius: Math.random() * 5 + 2,
      value: Math.random(),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));
    
    // Create quantum states
    const stateGroups = svg.selectAll('.quantum-state')
      .data(states)
      .enter()
      .append('g')
      .attr('class', 'quantum-state');
    
    // Add circles
    stateGroups.append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius)
      .attr('fill', 'url(#quantum-gradient)')
      .attr('opacity', d => d.value * 0.8 + 0.2);
    
    // Add glow effect
    stateGroups.append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius * 2)
      .attr('fill', 'url(#quantum-gradient)')
      .attr('opacity', d => d.value * 0.3)
      .attr('filter', 'blur(3px)');
    
    // Create connections between states
    const connections = [];
    for (let i = 0; i < numStates; i++) {
      for (let j = i + 1; j < numStates; j++) {
        if (Math.random() < 0.2) {
          connections.push({
            source: states[i],
            target: states[j],
            strength: Math.random(),
          });
        }
      }
    }
    
    // Add connections
    svg.selectAll('.quantum-connection')
      .data(connections)
      .enter()
      .append('line')
      .attr('class', 'quantum-connection')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('stroke', 'url(#quantum-gradient)')
      .attr('stroke-width', d => d.strength)
      .attr('opacity', d => d.strength * 0.5);
    
    // Animation
    const animate = () => {
      // Update state positions
      states.forEach(state => {
        state.x += state.vx;
        state.y += state.vy;
        
        // Bounce off walls
        if (state.x < 0 || state.x > innerWidth) state.vx *= -1;
        if (state.y < 0 || state.y > innerHeight) state.vy *= -1;
      });
      
      // Update circles
      svg.selectAll('.quantum-state circle')
        .data(states)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      // Update connections
      svg.selectAll('.quantum-connection')
        .data(connections)
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    const animationRef = { current: requestAnimationFrame(animate) };
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [theme]);
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
};

export default QuantumVisualization;
