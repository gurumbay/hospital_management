import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { authApi } from '../../services/api/auth';
import { ROUTES } from '../../utils/constants/routes';
import type { RegisterRequest } from '../../api/generated';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<RegisterRequest>>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    father_name: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.username || formData.username.length < 3) {
      setError('Имя пользователя должно быть минимум 3 символа');
      return false;
    }
    if (!formData.email || !formData.email.includes('@')) {
      setError('Введите корректный email');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Пароль должен быть минимум 6 символов');
      return false;
    }
    if (formData.password !== confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    if (!formData.first_name || formData.first_name.length < 2) {
      setError('Введите имя');
      return false;
    }
    if (!formData.last_name || formData.last_name.length < 2) {
      setError('Введите фамилию');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authApi.register(formData as RegisterRequest);
      // После успешной регистрации перенаправляем на логин
      navigate(ROUTES.LOGIN, {
        state: { registered: true },
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data?.detail)
          ? err.response?.data?.detail[0]?.msg
          : 'Ошибка регистрации. Попробуйте еще раз.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirm = () => {
    setShowConfirm(!showConfirm);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
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
            <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography component="h1" variant="h5">
              Регистрация
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Создайте аккаунт в системе
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Имя пользователя"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username || ''}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              helperText="Минимум 3 символа"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email || ''}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="first_name"
              label="Имя"
              name="first_name"
              autoComplete="given-name"
              value={formData.first_name || ''}
              onChange={handleChange}
              helperText="Минимум 2 символа"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              id="last_name"
              label="Фамилия"
              name="last_name"
              autoComplete="family-name"
              value={formData.last_name || ''}
              onChange={handleChange}
              helperText="Минимум 2 символа"
            />

            <TextField
              margin="normal"
              fullWidth
              id="father_name"
              label="Отчество"
              name="father_name"
              autoComplete="additional-name"
              value={formData.father_name || ''}
              onChange={handleChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password || ''}
              onChange={handleChange}
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
              helperText="Минимум 6 символов"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Подтверждение пароля"
              type={showConfirm ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                      onClick={handleToggleConfirm}
                      edge="end"
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Уже есть аккаунт?{' '}
                <Link
                  component={RouterLink}
                  to={ROUTES.LOGIN}
                  variant="body2"
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Войти
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
