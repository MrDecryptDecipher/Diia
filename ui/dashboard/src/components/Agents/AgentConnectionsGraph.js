import React, { useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent, CardHeader, Divider, useTheme, alpha } from '@mui/material';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';

const AgentConnectionsGraph = ({ agent, connectedAgents }) => {
  const theme = useTheme();
  const graphRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!graphRef.current || !agent || !connectedAgents || connectedAgents.length === 0) return;

    // Clear previous visualization
    d3.select(graphRef.current).selectAll('*').remove();

    // Set up dimensions
    const width = graphRef.current.clientWidth;
    const height = 400;

    // Create SVG
    const svg = d3
      .select(graphRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create nodes and links
    const nodes = [
      {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        color: agent.color,
        radius: 30, // Main agent is larger
        main: true,
      },
      ...connectedAgents.map(connAgent => ({
        id: connAgent.id,
        name: connAgent.name,
        type: connAgent.type,
        status: connAgent.status,
        color: connAgent.color,
        radius: 20,
        main: false,
      })),
    ];

    // Create links based on connections
    const links = connectedAgents.map(connAgent => ({
      source: agent.id,
      target: connAgent.id,
      value: connAgent.connectionStrength || 1,
    }));

    // Create simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.radius + 10));

    // Create gradient
    const gradient = svg
      .append('defs')
      .selectAll('linearGradient')
      .data(links)
      .enter()
      .append('linearGradient')
      .attr('id', (d, i) => `link-gradient-${i}`)
      .attr('gradientUnits', 'userSpaceOnUse');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', agent.color);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', d => {
        const targetNode = nodes.find(node => node.id === d.target.id || node.id === d.target);
        return targetNode ? targetNode.color : theme.palette.secondary.main;
      });

    // Create links
    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d, i) => `url(#link-gradient-${i})`)
      .attr('stroke-width', d => Math.sqrt(d.value) * 3)
      .attr('opacity', 0.6);

    // Create nodes
    const node = svg
      .append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(
        d3
          .drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      )
      .on('click', (event, d) => {
        if (!d.main) {
          navigate(`/agents/${d.id}`);
        }
      });

    // Add circles
    node
      .append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        const gradientId = `radial-${d.id}`;

        // Create radial gradient for each node
        const radialGradient = svg
          .append('defs')
          .append('radialGradient')
          .attr('id', gradientId)
          .attr('cx', '30%')
          .attr('cy', '30%')
          .attr('r', '70%')
          .attr('fx', '30%')
          .attr('fy', '30%');

        radialGradient
          .append('stop')
          .attr('offset', '0%')
          .attr('stop-color', d.main ? alpha(d.color, 0.9) : alpha(d.color, 0.7));

        radialGradient
          .append('stop')
          .attr('offset', '100%')
          .attr('stop-color', d.main ? d.color : alpha(d.color, 0.5));

        return `url(#${gradientId})`;
      })
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .attr('filter', 'url(#glow)');

    // Add glow filter
    const defs = svg.append('defs');
    const filter = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter
      .append('feGaussianBlur')
      .attr('stdDeviation', '2.5')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Add text
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#ffffff')
      .attr('font-size', d => (d.main ? '14px' : '10px'))
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => d.name.substring(0, d.main ? 4 : 2));

    // Add title for tooltip
    node
      .append('title')
      .text(d => `${d.name} (${d.type})\nStatus: ${d.status}`);

    // Add connection strength labels
    svg
      .append('g')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', theme.palette.text.secondary)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('pointer-events', 'none')
      .text(d => d && d.value !== undefined ? `${(d.value * 100).toFixed(0)}%` : '0%');

    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', d => d && d.source && d.source.x !== undefined ? d.source.x : 0)
        .attr('y1', d => d && d.source && d.source.y !== undefined ? d.source.y : 0)
        .attr('x2', d => d && d.target && d.target.x !== undefined ? d.target.x : 0)
        .attr('y2', d => d && d.target && d.target.y !== undefined ? d.target.y : 0);

      node.attr('transform', d => {
        if (d && d.x !== undefined && d.y !== undefined) {
          return `translate(${d.x},${d.y})`;
        }
        return 'translate(0,0)';
      });

      // Update gradient positions
      gradient
        .attr('x1', d => d && d.source && d.source.x !== undefined ? d.source.x : 0)
        .attr('y1', d => d && d.source && d.source.y !== undefined ? d.source.y : 0)
        .attr('x2', d => d && d.target && d.target.x !== undefined ? d.target.x : 0)
        .attr('y2', d => d && d.target && d.target.y !== undefined ? d.target.y : 0);

      // Update connection strength labels
      svg
        .selectAll('text')
        .filter(function() {
          return !this.parentNode || !this.parentNode.classList || !this.parentNode.classList.contains('node');
        })
        .attr('x', d => {
          if (d && d.source && d.source.x !== undefined && d.target && d.target.x !== undefined) {
            return (d.source.x + d.target.x) / 2;
          }
          return 0;
        })
        .attr('y', d => {
          if (d && d.source && d.source.y !== undefined && d.target && d.target.y !== undefined) {
            return (d.source.y + d.target.y) / 2;
          }
          return 0;
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
  }, [agent, connectedAgents, theme, navigate]);

  return (
    <Card
      sx={{
        background: 'rgba(17, 24, 39, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
      className="futuristic-border neural-connections"
    >
      <CardHeader
        title={
          <Typography variant="h6" sx={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
            Agent Connections
          </Typography>
        }
        subheader="Network of connected agents and their relationship strengths"
      />
      <Divider sx={{ opacity: 0.2 }} />
      <CardContent>
        <Box
          ref={graphRef}
          sx={{
            width: '100%',
            height: 400,
          }}
        />
      </CardContent>
    </Card>
  );
};

export default AgentConnectionsGraph;
