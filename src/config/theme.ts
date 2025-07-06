import { createTheme } from '@mui/material/styles';

export const modernTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
      light: '#8fa3f3',
      dark: '#4056c4',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00c9ff',
      light: '#5ddcff',
      dark: '#0097cc',
      contrastText: '#ffffff',
    },
    background: {
      default: 'transparent',
      paper: 'rgba(255, 255, 255, 0.08)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(102, 126, 234, 0.2)',
    },
    divider: 'rgba(255, 255, 255, 0.15)',
    success: {
      main: '#43e97b',
      light: '#71eca7',
      dark: '#38d66a',
    },
    warning: {
      main: '#fee140',
      light: '#ffeb70',
      dark: '#e6cb3a',
    },
    error: {
      main: '#fa709a',
      light: '#ff9bb8',
      dark: '#e0537a',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '-0.01em',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
          boxShadow: '0 4px 15px rgba(0, 201, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #00b8e6 0%, #7de68a 100%)',
            boxShadow: '0 8px 25px rgba(0, 201, 255, 0.4)',
          },
        },
        outlined: {
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.08)',
            transform: 'translateY(-1px)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00c9ff',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.8)',
          },
          '& .MuiInputBase-input': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-thumb': {
            background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 4px 15px rgba(0, 201, 255, 0.3)',
          },
          '& .MuiSlider-track': {
            background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
          },
          '& .MuiSlider-rail': {
            background: 'rgba(255, 255, 255, 0.2)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
            height: '3px',
            borderRadius: '3px',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: '48px',
          '&.Mui-selected': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          color: '#ffffff',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.08)',
            transform: 'translateY(-1px)',
          },
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
            boxShadow: '0 4px 15px rgba(0, 201, 255, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00b8e6 0%, #7de68a 100%)',
            },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          margin: '4px 0',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.1)',
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
            boxShadow: '0 4px 15px rgba(0, 201, 255, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00b8e6 0%, #7de68a 100%)',
            },
          },
        },
      },
    },
  },
});

export const glassStyles = {
  panel: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  darkPanel: {
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
  },
  button: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.08)',
      transform: 'translateY(-1px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
    },
  },
  gradientButton: {
    background: 'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0, 201, 255, 0.3)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      background: 'linear-gradient(135deg, #00b8e6 0%, #7de68a 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 201, 255, 0.4)',
    },
  },
  accentButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
    },
  },
};
