import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants/routes';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;

  // Проверяем, пришли ли мы со страницы регистрации
  React.useEffect(() => {
    if ((location.state as any)?.registered) {
      setSuccessMessage('Регистрация успешна! Пожалуйста, войдите в аккаунт.');
      // Очищаем состояние в URL
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      // Normalize backend validation/errors into a user-friendly string
      const resp = err?.response?.data;
      let message = 'Ошибка входа. Проверьте логин и пароль.';
      if (resp) {
        const detail = resp.detail ?? resp.message ?? resp.error;
        if (Array.isArray(detail)) {
          // Pydantic validation errors: array of { loc, msg, type }
          message = detail
            .map((d: any) => (d.msg ? `${d.loc?.join?.('.') || ''}: ${d.msg}`.trim() : JSON.stringify(d)))
            .join(' ; ');
        } else if (typeof detail === 'string') {
          message = detail;
        } else if (typeof resp === 'string') {
          message = resp;
        } else {
          // Fallback: stringify a useful part
          message = resp.detail?.msg || resp.message || JSON.stringify(resp);
        }
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography component="h1" variant="h5">
              Вход в систему
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Автоматизация приемного отделения
            </Typography>
          </Box>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Имя пользователя"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Нет аккаунта?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  variant="body2"
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Зарегистрироваться
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Демо доступ: admin / admin123
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
