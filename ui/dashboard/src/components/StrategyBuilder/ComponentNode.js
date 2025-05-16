import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme, 
  alpha,
  Tooltip,
  IconButton
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';

const ComponentNode = ({ data, isConnectable, selected }) => {
  const theme = useTheme();
  
  // Get color based on component type
  const getTypeColor = (type) => {
    switch (type) {
      case 'Indicator':
        return theme.palette.info.main;
      case 'Signal':
        return theme.palette.warning.main;
      case 'Condition':
        return theme.palette.secondary.main;
      case 'Entry':
        return theme.palette.success.main;
      case 'Exit':
        return theme.palette.error.main;
      case 'QuantumComponent':
        return theme.palette.primary.main;
      case 'HyperdimensionalComponent':
        return '#9c27b0'; // Purple
      case 'RiskManagement':
        return '#ff9800'; // Orange
      default:
        return theme.palette.grey[500];
    }
  };
  
  const typeColor = getTypeColor(data.type);
  
  return (
    <Paper
      elevation={selected ? 8 : 3}
      sx={{
        minWidth: 200,
        maxWidth: 250,
        borderRadius: 2,
        border: selected ? `2px solid ${typeColor}` : `1px solid ${alpha(typeColor, 0.5)}`,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: typeColor,
          width: 10,
          height: 10,
          top: -5,
          borderRadius: '50%'
        }}
        isConnectable={isConnectable}
      />
      
      {/* Header */}
      <Box
        sx={{
          p: 1,
          backgroundColor: alpha(typeColor, 0.2),
          borderBottom: `1px solid ${alpha(typeColor, 0.3)}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: typeColor }}>
          {data.type}
        </Typography>
        <Box>
          <Tooltip title="Configure">
            <IconButton 
              size="small" 
              onClick={data.onConfigure}
              sx={{ color: alpha(theme.palette.text.primary, 0.7) }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              onClick={data.onDelete}
              sx={{ color: alpha(theme.palette.error.main, 0.7) }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Content */}
      <Box sx={{ p: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 0.5 }}>
          {data.name}
        </Typography>
        
        {data.description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {data.description}
          </Typography>
        )}
        
        {data.parameters && data.parameters.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Parameters:
            </Typography>
            {data.parameters.map((param, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 'medium' }}>
                  {param.name}:
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {typeof param.value === 'number' ? param.value.toFixed(2) : String(param.value)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: typeColor,
          width: 10,
          height: 10,
          bottom: -5,
          borderRadius: '50%'
        }}
        isConnectable={isConnectable}
      />
    </Paper>
  );
};

export default memo(ComponentNode);
