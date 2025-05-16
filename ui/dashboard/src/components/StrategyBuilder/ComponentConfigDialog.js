import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  useTheme,
  alpha,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ComponentConfigDialog = ({ open, onClose, component, onSave }) => {
  const theme = useTheme();
  const [config, setConfig] = useState(component ? { ...component } : null);
  
  if (!component || !config) {
    return null;
  }
  
  const handleChange = (paramName, value) => {
    setConfig({
      ...config,
      parameters: config.parameters.map(param => 
        param.name === paramName ? { ...param, value } : param
      )
    });
  };
  
  const handleSave = () => {
    onSave(config);
    onClose();
  };
  
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
  
  const typeColor = getTypeColor(component.type);
  
  // Render parameter input based on parameter type
  const renderParameterInput = (param) => {
    switch (param.type) {
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={param.name}
            value={param.value}
            onChange={(e) => handleChange(param.name, parseFloat(e.target.value))}
            margin="normal"
            helperText={param.description}
            InputProps={{
              inputProps: {
                min: param.min,
                max: param.max,
                step: param.step || 1
              }
            }}
          />
        );
        
      case 'slider':
        return (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              {param.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                value={param.value}
                onChange={(_, newValue) => handleChange(param.name, newValue)}
                min={param.min}
                max={param.max}
                step={param.step || 1}
                valueLabelDisplay="auto"
                sx={{ 
                  color: typeColor,
                  '& .MuiSlider-thumb': {
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: `0px 0px 0px 8px ${alpha(typeColor, 0.16)}`
                    }
                  }
                }}
              />
              <Box sx={{ ml: 2, minWidth: 50 }}>
                <Typography variant="body2">
                  {param.value}
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {param.description}
            </Typography>
          </Box>
        );
        
      case 'select':
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel>{param.name}</InputLabel>
            <Select
              value={param.value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              label={param.name}
            >
              {param.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {param.description}
            </Typography>
          </FormControl>
        );
        
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={param.value}
                onChange={(e) => handleChange(param.name, e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body2">{param.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {param.description}
                </Typography>
              </Box>
            }
            sx={{ mt: 1, mb: 1, display: 'flex' }}
          />
        );
        
      case 'string':
      default:
        return (
          <TextField
            fullWidth
            label={param.name}
            value={param.value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            margin="normal"
            helperText={param.description}
          />
        );
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: `1px solid ${alpha(typeColor, 0.3)}`,
        backgroundColor: alpha(typeColor, 0.1),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: typeColor }}>
            {component.type}
          </Typography>
          <Typography variant="h6">
            {component.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        {component.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {component.description}
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
          Parameters
        </Typography>
        
        {config.parameters && config.parameters.length > 0 ? (
          config.parameters.map((param, index) => (
            <Box key={index}>
              {renderParameterInput(param)}
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No configurable parameters
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          sx={{ 
            backgroundColor: typeColor,
            '&:hover': {
              backgroundColor: alpha(typeColor, 0.8)
            }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComponentConfigDialog;
