import React, { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, useTheme, alpha } from '@mui/material';
import ComponentNode from './ComponentNode';

// Define custom node types
const nodeTypes = {
  component: ComponentNode
};

const StrategyCanvas = ({ initialNodes = [], initialEdges = [], onNodesChange, onEdgesChange }) => {
  const theme = useTheme();
  const reactFlowWrapper = useRef(null);
  const connectingNodeId = useRef(null);
  const { project } = useReactFlow();
  
  // Initialize nodes and edges
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  
  // Handle node changes
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChangeInternal(changes);
      if (onNodesChange) {
        onNodesChange(changes);
      }
    },
    [onNodesChangeInternal, onNodesChange]
  );
  
  // Handle edge changes
  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeInternal(changes);
      if (onEdgesChange) {
        onEdgesChange(changes);
      }
    },
    [onEdgesChangeInternal, onEdgesChange]
  );
  
  // Handle connection
  const onConnect = useCallback(
    (params) => {
      // Create a custom edge with animated path
      const edge = {
        ...params,
        animated: true,
        style: { stroke: theme.palette.primary.main, strokeWidth: 2 }
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, theme.palette.primary.main]
  );
  
  // Handle connection start
  const onConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
  }, []);
  
  // Handle connection end
  const onConnectEnd = useCallback(
    (event) => {
      if (!connectingNodeId.current) return;
      
      const targetIsPane = event.target.classList.contains('react-flow__pane');
      if (targetIsPane) {
        // If dropped on pane, could create a new node
        const { top, left } = reactFlowWrapper.current.getBoundingClientRect();
        const position = project({
          x: event.clientX - left - 100,
          y: event.clientY - top,
        });
        
        // Could add logic here to create a new node
      }
      
      connectingNodeId.current = null;
    },
    [project]
  );
  
  // Handle drop (for drag and drop from component panel)
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const componentData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      
      // Check if the dropped element is valid
      if (!componentData) {
        return;
      }
      
      const position = project({
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top,
      });
      
      // Create a new node
      const newNode = {
        id: `${componentData.type}-${Date.now()}`,
        type: 'component',
        position,
        data: {
          ...componentData,
          onConfigure: () => console.log(`Configure ${componentData.name}`),
          onDelete: () => console.log(`Delete ${componentData.name}`)
        },
      };
      
      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );
  
  // Handle drag over
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  return (
    <Box
      ref={reactFlowWrapper}
      sx={{
        height: '100%',
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: alpha(theme.palette.background.default, 0.7),
        backdropFilter: 'blur(5px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Control', 'Meta']}
        selectionKeyCode={['Shift']}
      >
        <Background
          variant="dots"
          gap={12}
          size={1}
          color={alpha(theme.palette.primary.main, 0.2)}
        />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.type === 'component') return n.data.color || theme.palette.primary.main;
            return theme.palette.text.secondary;
          }}
          nodeColor={(n) => {
            if (n.type === 'component') return alpha(n.data.color || theme.palette.primary.main, 0.2);
            return alpha(theme.palette.background.paper, 0.8);
          }}
          maskColor={alpha(theme.palette.background.default, 0.5)}
          style={{
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${theme.palette.divider}`
          }}
        />
      </ReactFlow>
    </Box>
  );
};

export default StrategyCanvas;
