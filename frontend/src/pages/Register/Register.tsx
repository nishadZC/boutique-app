import React, { memo, useState, useCallback } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, Stepper, Step, StepLabel,
  InputAdornment, IconButton, CircularProgress, LinearProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout/AuthLayout';
import { ROUTES } from '../../constants/routes';
import styles from './Register.module.css';

const STEPS = ['Personal Info', 'Account Setup', 'Confirmation'];

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8)  score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['inherit', 'error', 'warning', 'info', 'success'] as const;

const Register = memo(function Register() {
  const { loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const strength = getPasswordStrength(password);

  React.useEffect(() => {
    if (localError) setLocalError('');
    if (error) clearError();
  }, [firstName, lastName, email, password, confirmPassword, agreed]);

  const validateStep = useCallback(() => {
    if (activeStep === 0) {
      if (!firstName.trim() || !lastName.trim()) { setLocalError('Please enter your first and last name.'); return false; }
    }
    if (activeStep === 1) {
      if (!email.trim()) { setLocalError('Please enter a valid email address.'); return false; }
      if (password.length < 8) { setLocalError('Password must be at least 8 characters.'); return false; }
      if (password !== confirmPassword) { setLocalError('Passwords do not match.'); return false; }
    }
    if (activeStep === 2 && !agreed) { setLocalError('Please accept the terms to continue.'); return false; }
    setLocalError('');
    return true;
  }, [activeStep, firstName, lastName, email, password, confirmPassword, agreed]);

  const handleNext = useCallback(async () => {
    clearError();
    if (!validateStep()) return;
    if (activeStep < STEPS.length - 1) { setActiveStep(s => s + 1); return; }
    // Final submit
    try {
      const { authService } = await import('../../services/authService');
      const response = await authService.register({ firstName, lastName, email, password });
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      navigate(ROUTES.HOME);
    } catch (err: any) {
      setLocalError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Registration failed');
    }
  }, [activeStep, clearError, validateStep, firstName, lastName, email, password, navigate]);

  const displayError = localError || error;

  return (
    <AuthLayout
      eyebrow="Join Us"
      title="Create your account"
      description="Begin your luxury fashion journey. Exclusive collections, personalised style."
    >
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>Create Account</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Already have an account?{' '}
        <RouterLink
          to={ROUTES.LOGIN}
          className={styles.link}
        >
          Sign in
        </RouterLink>
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {displayError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => { clearError(); setLocalError(''); }}>{displayError}</Alert>}

      {activeStep === 0 && (
        <Box>
          <TextField label="First Name" fullWidth required value={firstName} onChange={e => setFirstName(e.target.value)} sx={{ mb: 2 }} autoComplete="given-name" />
          <TextField label="Last Name"  fullWidth required value={lastName}  onChange={e => setLastName(e.target.value)}  sx={{ mb: 3 }} autoComplete="family-name" />
        </Box>
      )}

      {activeStep === 1 && (
        <Box>
          <TextField label="Email" type="email" fullWidth required value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }} autoComplete="email" />
          <TextField
            label="Password" type={showPassword ? 'text' : 'password'} fullWidth required
            value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 1 }}
            InputProps={{
              endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(s => !s)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
            }}
          />
          {password && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={(strength / 4) * 100} color={strengthColors[strength]} sx={{ mb: 0.5 }} />
              <Typography variant="caption" color={`${strengthColors[strength]}.main`}>{strengthLabels[strength]}</Typography>
            </Box>
          )}
          <TextField label="Confirm Password" type={showPassword ? 'text' : 'password'} fullWidth required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} sx={{ mb: 3 }} />
        </Box>
      )}

      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>Review Your Details</Typography>
          <Typography variant="body2"><strong>Name:</strong> {firstName} {lastName}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}><strong>Email:</strong> {email}</Typography>
        </Box>
      )}

      <Box sx={{ mt: 'auto' }}>
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <label htmlFor="terms"><Typography variant="body2">I agree to the Terms of Service and Privacy Policy</Typography></label>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeStep > 0 && (
            <Button 
              variant="outlined" 
              onClick={() => {
                clearError();
                setLocalError('');
                setActiveStep(s => s - 1);
              }} 
              sx={{ flex: 1 }}
            >
              Back
            </Button>
          )}
          <Button variant="contained" onClick={handleNext} disabled={loading} sx={{ flex: 1 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : activeStep === STEPS.length - 1 ? 'Create Account' : 'Next'}
          </Button>
        </Box>
      </Box>
    </AuthLayout>
  );
});

export default Register;