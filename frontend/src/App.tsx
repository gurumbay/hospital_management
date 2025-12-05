import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Patients from './pages/references/Patients';
import Diagnoses from './pages/references/Diagnoses';
import Wards from './pages/references/Wards';
import Distribution from './pages/journals/Distribution';
import Occupancy from './pages/reports/Occupancy';
import DiagnosisStats from './pages/reports/DiagnosisStats';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import theme from './styles/theme';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <ErrorBoundary>
              <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  
                  {/* References */}
                  <Route path="/patients" element={<Patients />} />
                  <Route path="/diagnoses" element={<Diagnoses />} />
                  <Route path="/wards" element={<Wards />} />
                  
                  {/* Journals */}
                  <Route path="/distribution" element={<Distribution />} />
                  
                  {/* Reports */}
                  <Route path="/reports/occupancy" element={<Occupancy />} />
                  <Route path="/reports/diagnosis-stats" element={<DiagnosisStats />} />
                </Route>
              </Route>

              {/* Redirect unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
