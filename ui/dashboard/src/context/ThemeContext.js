import React, { createContext, useState, useContext, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

// Create context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // State for visual effects level
  const [visualEffects, setVisualEffects] = useState('high');
  
  // Function to get animation duration based on visual effects level
  const getAnimationDuration = () => {
    switch (visualEffects) {
      case 'low':
        return 0.2;
      case 'medium':
        return 0.5;
      case 'high':
        return 0.8;
      case 'ultra':
        return 1.2;
      default:
        return 0.5;
    }
  };
  
  // Create MUI theme
  const theme = useMemo(() => createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#7B68EE', // Medium slate blue
        light: '#9F8FEF',
        dark: '#5A4FCB',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#00BFFF', // Deep sky blue
        light: '#33CFFF',
        dark: '#0095CC',
        contrastText: '#FFFFFF',
      },
      error: {
        main: '#FF4500', // Orange red
        light: '#FF6A33',
        dark: '#CC3700',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: '#FFD700', // Gold
        light: '#FFDF33',
        dark: '#CCAC00',
        contrastText: '#000000',
      },
      info: {
        main: '#1E90FF', // Dodger blue
        light: '#4BA6FF',
        dark: '#0073CC',
        contrastText: '#FFFFFF',
      },
      success: {
        main: '#32CD32', // Lime green
        light: '#5BD75B',
        dark: '#28A428',
        contrastText: '#FFFFFF',
      },
      background: {
        default: '#0A0E17',
        paper: 'rgba(17, 24, 39, 0.7)',
      },
      text: {
        primary: '#FFFFFF',
        secondary: 'rgba(255, 255, 255, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.5)',
      },
    },
    typography: {
      fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: '"Orbitron", "Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 700,
      },
      h2: {
        fontFamily: '"Orbitron", "Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 700,
      },
      h3: {
        fontFamily: '"Orbitron", "Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      h4: {
        fontFamily: '"Orbitron", "Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      h5: {
        fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      h6: {
        fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
      },
      button: {
        fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 5,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(102, 51, 153, 0.5)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(102, 51, 153, 0.8)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: 'rgba(17, 24, 39, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '5px',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '5px',
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '5px',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(102, 51, 153, 0.5)',
            boxShadow: '0 0 10px rgba(102, 51, 153, 0.5)',
            borderRadius: '5px',
            padding: '8px 12px',
            fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: '0.875rem',
          },
        },
      },
    },
  }), []);
  
  // Context value
  const value = {
    visualEffects,
    setVisualEffects,
    getAnimationDuration,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
