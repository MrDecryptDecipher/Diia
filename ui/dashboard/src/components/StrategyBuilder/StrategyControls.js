import React from 'react';
import { 
  Box, 
  Button, 
  ButtonGroup, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Typography,
  Paper,
  useTheme,
  alpha,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';

const StrategyControls = ({ 
  strategyName, 
  setStrategyName, 
  strategyType, 
  setStrategyType, 
  onSave, 
  onBacktest, 
  onClear, 
  onUndo, 
  onRedo, 
  onNew,
  onDuplicate,
  onExport,
  onImport,
  onZoomIn,
  onZoomOut,
  onFitView,
  canUndo,
  canRedo,
  isRunning,
  onStopBacktest
}) => {
  const theme = useTheme();
  
  const strategyTypes = [
    { value: 'momentum', label: 'Momentum' },
    { value: 'pattern', label: 'Pattern Recognition' },
    { value: 'trend', label: 'Trend Following' },
    { value: 'volatility', label: 'Volatility Breakout' },
    { value: 'sentiment', label: 'Sentiment Analysis' },
    { value: 'quantum', label: 'Quantum Strategy' },
    { value: 'hyperdimensional', label: 'Hyperdimensional Strategy' },
    { value: 'hybrid', label: 'Hybrid Strategy' }
  ];
  
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Strategy Name"
          variant="outlined"
          size="small"
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
          sx={{ mr: 2, flexGrow: 1 }}
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Strategy Type</InputLabel>
          <Select
            value={strategyType}
            onChange={(e) => setStrategyType(e.target.value)}
            label="Strategy Type"
          >
            {strategyTypes.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <ButtonGroup variant="contained" size="small">
          <Tooltip title="New Strategy">
            <Button 
              startIcon={<AddIcon />} 
              onClick={onNew}
              color="primary"
            >
              New
            </Button>
          </Tooltip>
          <Tooltip title="Save Strategy">
            <Button 
              startIcon={<SaveIcon />} 
              onClick={onSave}
              color="primary"
            >
              Save
            </Button>
          </Tooltip>
          <Tooltip title="Duplicate Strategy">
            <Button 
              startIcon={<ContentCopyIcon />} 
              onClick={onDuplicate}
              color="primary"
            >
              Duplicate
            </Button>
          </Tooltip>
        </ButtonGroup>
        
        <ButtonGroup variant="contained" size="small">
          <Tooltip title="Export Strategy">
            <IconButton onClick={onExport} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Strategy">
            <IconButton onClick={onImport} color="primary">
              <UploadIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
        
        <ButtonGroup variant="contained" size="small">
          <Tooltip title="Undo">
            <span>
              <IconButton 
                onClick={onUndo} 
                color="primary" 
                disabled={!canUndo}
              >
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <IconButton 
                onClick={onRedo} 
                color="primary" 
                disabled={!canRedo}
              >
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Clear Canvas">
            <IconButton onClick={onClear} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <ButtonGroup variant="contained" size="small">
          <Tooltip title="Zoom In">
            <IconButton onClick={onZoomIn} color="primary">
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out">
            <IconButton onClick={onZoomOut} color="primary">
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit View">
            <IconButton onClick={onFitView} color="primary">
              <FitScreenIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>
        
        <Button
          variant="contained"
          color={isRunning ? "error" : "success"}
          startIcon={isRunning ? <StopIcon /> : <PlayArrowIcon />}
          onClick={isRunning ? onStopBacktest : onBacktest}
          size="medium"
        >
          {isRunning ? "Stop Backtest" : "Run Backtest"}
        </Button>
      </Box>
    </Paper>
  );
};

export default StrategyControls;
