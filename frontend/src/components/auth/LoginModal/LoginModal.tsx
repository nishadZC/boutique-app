import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogContent, IconButton, Box, Typography, TextField, Button, Alert, Divider, CircularProgress,
  Stepper, Step, StepLabel, InputAdornment, LinearProgress,
} from '@mui/material';
import { Close as CloseIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../contexts/AuthContext';

interface LoginModalProps {
  open: boolean;
  // Called on X / backdrop close, i.e. the user gave up without signing in.
  onDismiss: () => void;
  // Called only after a successful login or registration.
  onSuccess: () => void;
}

type AuthMode = 'login' | 'register';

const STEPS = ['Personal Info', 'Account Setup', 'Confirmation'];

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['inherit', 'error', 'warning', 'info', 'success'] as const;

const LoginForm: React.FC<{ onSwitchToRegister: () => void; onSuccess: () => void }> = ({ onSwitchToRegister, onSuccess }) => {
  const { login, loginWithGoogle, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (localError) setLocalError('');
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  }, [email, password, login, clearError, onSuccess]);

  const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    try {
      await loginWithGoogle(credentialResponse.credential);
      onSuccess();
    } catch {
      setLocalError('Google sign-in failed');
    }
  }, [loginWithGoogle, onSuccess]);

  const displayError = localError || error;

  return (
    <>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Sign In</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        New here?{' '}
        <Box component="button" type="button" onClick={onSwitchToRegister} sx={{ background: 'none', border: 'none', p: 0, cursor: 'pointer', color: 'primary.main', textDecoration: 'underline', font: 'inherit' }}>
          Create an account
        </Box>
      </Typography>

      {displayError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => { clearError(); setLocalError(''); }}>
          {displayError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email" type="email" fullWidth required
          value={email} onChange={e => setEmail(e.target.value)}
          sx={{ mb: 2 }} autoComplete="email" autoFocus
        />
        <TextField
          label="Password" type="password" fullWidth required
          value={password} onChange={e => setPassword(e.target.value)}
          sx={{ mb: 3 }} autoComplete="current-password"
        />
        <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mb: 2 }}>
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">OR</Typography></Divider>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setLocalError('Google sign-in failed')} shape="rectangular" theme="outline" size="large" />
      </Box>
    </>
  );
};

const RegisterForm: React.FC<{ onSwitchToLogin: () => void; onSuccess: () => void }> = ({ onSwitchToLogin, onSuccess }) => {
  const { loading, error, clearError } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (localError) setLocalError('');
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      const { authService } = await import('../../../services/authService');
      const response = await authService.register({ firstName, lastName, email, password });
      localStorage.setItem('accessToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      onSuccess();
      window.location.reload();
    } catch (err: any) {
      setLocalError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Registration failed');
    }
  }, [activeStep, clearError, validateStep, firstName, lastName, email, password, onSuccess]);

  const displayError = localError || error;

  return (
    <>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Create Account</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Already have an account?{' '}
        <Box component="button" type="button" onClick={onSwitchToLogin} sx={{ background: 'none', border: 'none', p: 0, cursor: 'pointer', color: 'primary.main', textDecoration: 'underline', font: 'inherit' }}>
          Sign in
        </Box>
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {displayError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => { clearError(); setLocalError(''); }}>{displayError}</Alert>}

      {activeStep === 0 && (
        <Box>
          <TextField label="First Name" fullWidth required value={firstName} onChange={e => setFirstName(e.target.value)} sx={{ mb: 2 }} autoComplete="given-name" />
          <TextField label="Last Name" fullWidth required value={lastName} onChange={e => setLastName(e.target.value)} sx={{ mb: 3 }} autoComplete="family-name" />
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

      <Box sx={{ mt: 'auto', pt: 2 }}>
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <input type="checkbox" id="modal-terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <label htmlFor="modal-terms"><Typography variant="body2">I agree to the Terms of Service and Privacy Policy</Typography></label>
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
    </>
  );
};

// Auth gate shown in place of a full navigation to /login or /register - the
// current page's route never changes, so once the user signs in the
// protected content behind this modal just renders. Toggling between the
// two forms switches local state, never the URL.
const LoginModal: React.FC<LoginModalProps> = memo(({ open, onDismiss, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  useEffect(() => {
    if (open) setMode('login');
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onDismiss}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' },
        },
      }}
    >
      <IconButton
        onClick={onDismiss}
        aria-label="close"
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 4, minHeight: 560, display: 'flex', flexDirection: 'column' }}>
        {mode === 'login'
          ? <LoginForm onSwitchToRegister={() => setMode('register')} onSuccess={onSuccess} />
          : <RegisterForm onSwitchToLogin={() => setMode('login')} onSuccess={onSuccess} />}
      </DialogContent>
    </Dialog>
  );
});

export default LoginModal;
