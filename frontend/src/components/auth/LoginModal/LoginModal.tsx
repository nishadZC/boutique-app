import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  Dialog, DialogContent, IconButton, Box, Typography, TextField, Button, Alert, Divider, CircularProgress,
  Stepper, Step, StepLabel, InputAdornment, LinearProgress,
} from '@mui/material';
import { Close as CloseIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../contexts/AuthContext';
import { EMAIL_MAX_LENGTH, getEmailError, normalizeEmail } from '../../../utils/validation';
import { PasswordChangeRequired } from '../../../types';

type ForcedChange = Pick<PasswordChangeRequired, 'passwordChangeToken' | 'user'>;
const ADMIN_PASSWORD_MIN_LENGTH = 12;

/**
 * Shown when an account (the bootstrap admin) must replace its initial password.
 * Cannot be dismissed: the only ways out are setting a password or signing out.
 */
const ForcedPasswordChange: React.FC<{ forced: ForcedChange; onDone: () => void; onCancel: () => void }> = ({ forced, onDone, onCancel }) => {
  const { completePasswordChange } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [saving, setSaving] = useState(false);

  const strength = getPasswordStrength(password);
  const errors = {
    password: password.length >= ADMIN_PASSWORD_MIN_LENGTH ? null : `Use at least ${ADMIN_PASSWORD_MIN_LENGTH} characters`,
    confirm: confirm === password ? null : 'Passwords do not match',
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');
    if (errors.password || errors.confirm) return;
    setSaving(true);
    try {
      await completePasswordChange(forced.passwordChangeToken, password);
      onDone();
    } catch (err: any) {
      if (err?.response?.status === 401) setExpired(true);
      setError(err?.response?.data?.error || 'Could not update your password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit} noValidate>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Set a new password</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        For security, <strong>{forced.user.email}</strong> must replace its initial password before continuing.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {expired ? (
        <Button variant="contained" fullWidth size="large" onClick={onCancel}>Sign in again</Button>
      ) : (
        <>
          <TextField
            label="New password" type={show ? 'text' : 'password'} fullWidth required autoFocus autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)}
            error={submitted && !!errors.password} helperText={submitted && errors.password ? errors.password : `At least ${ADMIN_PASSWORD_MIN_LENGTH} characters`}
            sx={{ mb: 1 }}
            InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShow(v => !v)} edge="end" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
          />
          {password && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress variant="determinate" value={(strength / 4) * 100} color={strengthColors[strength]} sx={{ mb: 0.5 }} />
              <Typography variant="caption" color={`${strengthColors[strength]}.main`}>{strengthLabels[strength]}</Typography>
            </Box>
          )}
          <TextField
            label="Confirm new password" type={show ? 'text' : 'password'} fullWidth required autoComplete="new-password"
            value={confirm} onChange={e => setConfirm(e.target.value)}
            error={submitted && !!errors.confirm} helperText={submitted && errors.confirm ? errors.confirm : ' '}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={saving} sx={{ mb: 1.5 }}>
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save password and continue'}
          </Button>
          <Button fullWidth onClick={onCancel}>Sign out</Button>
        </>
      )}
    </Box>
  );
};


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

const LoginForm: React.FC<{ onSwitchToRegister: () => void; onSuccess: () => void; onPasswordChangeRequired: (f: ForcedChange) => void }> = ({ onSwitchToRegister, onSuccess, onPasswordChangeRequired }) => {
  const { login, loginWithGoogle, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  // Field errors show once something typed has been left, or on submit - never while typing
  // or for a field the user has not reached yet.
  const [emailTouched, setEmailTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailError = getEmailError(email);
  const passwordError = password ? null : 'Password is required';
  const showEmailError = (emailTouched || submitted) && !!emailError;
  const showPasswordError = submitted && !!passwordError;

  useEffect(() => {
    if (localError) setLocalError('');
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    setSubmitted(true);
    if (emailError || passwordError) return;
    try {
      const result = await login(normalizeEmail(email), password);
      if (result.passwordChangeRequired) onPasswordChangeRequired(result);
      else onSuccess();
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  }, [email, password, emailError, passwordError, login, clearError, onSuccess, onPasswordChangeRequired]);

  const handleGoogleSuccess = useCallback(async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      if (result.passwordChangeRequired) onPasswordChangeRequired(result);
      else onSuccess();
    } catch {
      setLocalError('Google sign-in failed');
    }
  }, [loginWithGoogle, onSuccess, onPasswordChangeRequired]);

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
          value={email} onChange={e => setEmail(e.target.value)} onBlur={() => { if (email.trim()) setEmailTouched(true); }}
          error={showEmailError} helperText={showEmailError ? emailError : ' '}
          slotProps={{ htmlInput: { maxLength: EMAIL_MAX_LENGTH, inputMode: 'email', autoCapitalize: 'none', spellCheck: false } }}
          sx={{ mb: 1 }} autoComplete="email" autoFocus
        />
        <TextField
          label="Password" type="password" fullWidth required
          value={password} onChange={e => setPassword(e.target.value)}
          error={showPasswordError} helperText={showPasswordError ? passwordError : ' '}
          sx={{ mb: 2 }} autoComplete="current-password"
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
  const [emailTouched, setEmailTouched] = useState(false);

  const strength = getPasswordStrength(password);
  const emailError = getEmailError(email);
  const showEmailError = emailTouched && !!emailError;

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
      if (emailError) { setEmailTouched(true); setLocalError(emailError); return false; }
      if (password.length < 8) { setLocalError('Password must be at least 8 characters.'); return false; }
      if (password !== confirmPassword) { setLocalError('Passwords do not match.'); return false; }
    }
    if (activeStep === 2 && !agreed) { setLocalError('Please accept the terms to continue.'); return false; }
    setLocalError('');
    return true;
  }, [activeStep, firstName, lastName, emailError, password, confirmPassword, agreed]);

  const handleNext = useCallback(async () => {
    clearError();
    if (!validateStep()) return;
    if (activeStep < STEPS.length - 1) { setActiveStep(s => s + 1); return; }
    try {
      const { authService } = await import('../../../services/authService');
      const response = await authService.register({ firstName: firstName.trim(), lastName: lastName.trim(), email: normalizeEmail(email), password });
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
          <TextField
            label="Email" type="email" fullWidth required
            value={email} onChange={e => setEmail(e.target.value)} onBlur={() => { if (email.trim()) setEmailTouched(true); }}
            error={showEmailError} helperText={showEmailError ? emailError : 'We’ll send order updates here'}
            slotProps={{ htmlInput: { maxLength: EMAIL_MAX_LENGTH, inputMode: 'email', autoCapitalize: 'none', spellCheck: false } }}
            sx={{ mb: 2 }} autoComplete="email"
          />
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
          <Typography variant="body2" sx={{ mb: 2 }}><strong>Email:</strong> {normalizeEmail(email)}</Typography>
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
  const [forced, setForced] = useState<ForcedChange | null>(null);

  useEffect(() => {
    if (open) { setMode('login'); setForced(null); }
  }, [open]);

  // While a password change is pending the dialog cannot be dismissed.
  const handleClose = forced ? undefined : onDismiss;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disableEscapeKeyDown={!!forced}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' },
        },
      }}
    >
      {!forced && (
        <IconButton
          onClick={onDismiss}
          aria-label="close"
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
        >
          <CloseIcon />
        </IconButton>
      )}

      <DialogContent sx={{ p: 4, minHeight: 560, display: 'flex', flexDirection: 'column' }}>
        {forced
          ? <ForcedPasswordChange forced={forced} onDone={() => { setForced(null); onSuccess(); }} onCancel={() => { setForced(null); setMode('login'); }} />
          : mode === 'login'
            ? <LoginForm onSwitchToRegister={() => setMode('register')} onSuccess={onSuccess} onPasswordChangeRequired={setForced} />
            : <RegisterForm onSwitchToLogin={() => setMode('login')} onSuccess={onSuccess} />}
      </DialogContent>
    </Dialog>
  );
});

export default LoginModal;
