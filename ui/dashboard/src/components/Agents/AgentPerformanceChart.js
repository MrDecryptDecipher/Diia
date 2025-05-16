import React, { useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent, CardHeader, Divider, useTheme, alpha } from '@mui/material';
import * as d3 from 'd3';

const AgentPerformanceChart = ({ agent, performanceData }) => {
  const theme = useTheme();
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !performanceData || performanceData.length === 0) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3
      .scaleTime()
      .domain(d3.extent(performanceData, d => new Date(d.timestamp)))
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(performanceData, d => Math.max(d.accuracy, d.efficiency, d.confidence, d.adaptability))])
      .nice()
      .range([height, 0]);

    // Create line generators
    const lineAccuracy = d3
      .line()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d.accuracy))
      .curve(d3.curveMonotoneX);

    const lineEfficiency = d3
      .line()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d.efficiency))
      .curve(d3.curveMonotoneX);

    const lineConfidence = d3
      .line()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d.confidence))
      .curve(d3.curveMonotoneX);

    const lineAdaptability = d3
      .line()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d.adaptability))
      .curve(d3.curveMonotoneX);

    // Add X axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%H:%M')))
      .call(g => g.select('.domain').attr('stroke', theme.palette.text.secondary))
      .call(g => g.selectAll('.tick line').attr('stroke', theme.palette.text.secondary))
      .call(g => g.selectAll('.tick text').attr('fill', theme.palette.text.secondary));

    // Add Y axis
    svg
      .append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .call(g => g.select('.domain').attr('stroke', theme.palette.text.secondary))
      .call(g => g.selectAll('.tick line').attr('stroke', theme.palette.text.secondary))
      .call(g => g.selectAll('.tick text').attr('fill', theme.palette.text.secondary));

    // Add grid lines
    svg
      .append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', alpha(theme.palette.text.secondary, 0.1)));

    // Add lines
    svg
      .append('path')
      .datum(performanceData)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.primary.main)
      .attr('stroke-width', 2)
      .attr('d', lineAccuracy);

    svg
      .append('path')
      .datum(performanceData)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.success.main)
      .attr('stroke-width', 2)
      .attr('d', lineEfficiency);

    svg
      .append('path')
      .datum(performanceData)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.warning.main)
      .attr('stroke-width', 2)
      .attr('d', lineConfidence);

    svg
      .append('path')
      .datum(performanceData)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.info.main)
      .attr('stroke-width', 2)
      .attr('d', lineAdaptability);

    // Add dots
    svg
      .selectAll('.dot-accuracy')
      .data(performanceData)
      .enter()
      .append('circle')
      .attr('class', 'dot-accuracy')
      .attr('cx', d => x(new Date(d.timestamp)))
      .attr('cy', d => y(d.accuracy))
      .attr('r', 4)
      .attr('fill', theme.palette.primary.main);

    svg
      .selectAll('.dot-efficiency')
      .data(performanceData)
      .enter()
      .append('circle')
      .attr('class', 'dot-efficiency')
      .attr('cx', d => x(new Date(d.timestamp)))
      .attr('cy', d => y(d.efficiency))
      .attr('r', 4)
      .attr('fill', theme.palette.success.main);

    svg
      .selectAll('.dot-confidence')
      .data(performanceData)
      .enter()
      .append('circle')
      .attr('class', 'dot-confidence')
      .attr('cx', d => x(new Date(d.timestamp)))
      .attr('cy', d => y(d.confidence))
      .attr('r', 4)
      .attr('fill', theme.palette.warning.main);

    svg
      .selectAll('.dot-adaptability')
      .data(performanceData)
      .enter()
      .append('circle')
      .attr('class', 'dot-adaptability')
      .attr('cx', d => x(new Date(d.timestamp)))
      .attr('cy', d => y(d.adaptability))
      .attr('r', 4)
      .attr('fill', theme.palette.info.main);

    // Add legend
    const legend = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start')
      .selectAll('g')
      .data(['Accuracy', 'Efficiency', 'Confidence', 'Adaptability'])
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${i * 100}, -10)`);

    legend
      .append('rect')
      .attr('x', 0)
      .attr('width', 12)
      .attr('height', 2)
      .attr('fill', (d, i) => {
        switch (i) {
          case 0:
            return theme.palette.primary.main;
          case 1:
            return theme.palette.success.main;
          case 2:
            return theme.palette.warning.main;
          case 3:
            return theme.palette.info.main;
          default:
            return theme.palette.grey[500];
        }
      });

    legend
      .append('text')
      .attr('x', 16)
      .attr('y', 2)
      .attr('dy', '0.1em')
      .attr('fill', theme.palette.text.secondary)
      .text(d => d);

  }, [performanceData, theme]);

  return (
    <Card
      sx={{
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
      className="futuristic-border"
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
            Performance Metrics
          </Typography>
        }
        subheader="Real-time performance tracking of agent metrics"
      />
      <Divider sx={{ opacity: 0.2 }} />
      <CardContent>
        <Box
          ref={chartRef}
          sx={{
            width: '100%',
            height: 300,
          }}
        />
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceChart;
