import React from 'react';
import { Box, Button, Typography } from '@mui/material';

interface State {
  hasError: boolean;
  error?: any;
}

export class ErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Log to console (or remote logging service)
    // eslint-disable-next-line no-console
    console.error('Uncaught error in component tree:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    // Optionally hard reload
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Something went wrong</Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>The application encountered an error but you can continue working.</Typography>
          <Button variant="contained" onClick={this.handleReload}>Dismiss</Button>
        </Box>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
