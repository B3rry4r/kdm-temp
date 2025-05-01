import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertColor } from '@mui/material/Alert';
import { ThemeProvider, createTheme } from '@mui/material/styles';

interface AlertMessageProps {
  open: boolean;
  message: string;
  severity?: AlertColor | 'purple';
  onClose: () => void;
  autoHideDuration?: number;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ open, message, severity = 'info', onClose, autoHideDuration = 4000 }) => {
  // Create a custom theme with purple color for our brand
  const theme = createTheme({
    palette: {
      // Add the brand purple color
      primary: {
        main: '#68049B',
      },
    },
    components: {
      MuiAlert: {
        styleOverrides: {
          root: {
            backgroundColor: severity === 'purple' ? '#68049B' : undefined,
            color: severity === 'purple' ? '#fff' : undefined,
          },
        },
      },
    },
  });

  // Use standard severity if not 'purple'
  const actualSeverity: AlertColor = severity === 'purple' ? 'info' : (severity as AlertColor);

  return (
    <ThemeProvider theme={theme}>
      <Snackbar 
        open={open} 
        autoHideDuration={autoHideDuration} 
        onClose={onClose} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: 9999 }} // Very high z-index to appear above modals
      >
        <MuiAlert 
          elevation={6} 
          variant="filled" 
          onClose={onClose} 
          severity={actualSeverity}
          sx={{ 
            width: '100%', 
            bgcolor: severity === 'purple' ? '#68049B' : undefined,
            color: severity === 'purple' ? '#fff' : undefined,
            fontWeight: 'bold',
          }}
        >
          {message}
        </MuiAlert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default AlertMessage; 