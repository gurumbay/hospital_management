import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const MainLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Sidebar только для авторизованных */}
      {user && <Sidebar />}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header только для авторизованных */}
        {user && <Header />}

        {/* Основное содержимое */}
        <Container
          component="main"
          maxWidth="xl"
          sx={{
            flex: 1,
            py: 3,
            mt: user ? 0 : 8, // Отступ если нет header
          }}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
