import React, { memo, useState, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, Divider, CircularProgress,
} from '@mui/material';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout/AuthLayout';
import { ROUTES } from '../../constants/routes';
import styles from './Login.module.css';

const Login = memo(function Login() {
  const { login, loginWithGoogle, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  React.useEffect(() => {
    if (localError) setLocalError('');
    if (error) clearError();
  }, [email, password]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    try {
      await login(email, password);
      navigate(ROUTES.HOME);
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  }, [email, password, login, clearError, navigate]);

  const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate(ROUTES.HOME);
    } catch {
      setLocalError('Google sign-in failed');
    }
  }, [loginWithGoogle, navigate]);

  const displayError = localError || error;

  return (
    <AuthLayout
      eyebrow="Welcome Back"
      title="Sign in to your account"
      description="Your wardrobe, personalised. Sign in to continue your luxury fashion journey."
    >
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>Sign In</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        New here?{' '}
        <RouterLink
          to={ROUTES.REGISTER}
          className={styles.link}
        >
          Create an account
        </RouterLink>
      </Typography>

      {displayError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => { clearError(); setLocalError(''); }}>{displayError}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField label="Email" type="email" fullWidth required value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }} autoComplete="email" />
        <TextField label="Password" type="password" fullWidth required value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 3 }} autoComplete="current-password" />
        <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mb: 2 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">OR</Typography></Divider>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setLocalError('Google sign-in failed')} shape="rectangular" theme="outline" size="large" />
      </Box>
    </AuthLayout>
  );
});

export default Login;
