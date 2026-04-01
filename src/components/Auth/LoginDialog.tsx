import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose }) => {
  const { login, register, loginWithGoogle, resetPassword, error, loading, clearError } = useAuth();
  const [tab, setTab] = useState(0); // 0 = login, 1 = register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setConfirmPassword('');
    setLocalError(null);
    setResetSent(false);
    clearError();
    onClose();
  };

  const handleLogin = async () => {
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    try {
      await login(email, password);
      handleClose();
    } catch {
      // Error is handled by AuthContext
    }
  };

  const handleRegister = async () => {
    setLocalError(null);
    if (!email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    try {
      await register(email, password, displayName || undefined);
      handleClose();
    } catch {
      // Error is handled by AuthContext
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      handleClose();
    } catch {
      // Error is handled by AuthContext
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch {
      setLocalError('Failed to send reset email');
    }
  };

  const displayedError = localError || error;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="span">
          {tab === 0 ? 'Sign In' : 'Create Account'}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setLocalError(null); clearError(); }}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label="Sign In" />
          <Tab label="Register" />
        </Tabs>

        {displayedError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {displayedError}
          </Alert>
        )}

        {resetSent && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset email sent! Check your inbox.
          </Alert>
        )}

        {tab === 1 && (
          <TextField
            fullWidth
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            sx={{ mb: 2 }}
            autoComplete="name"
          />
        )}

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
          autoComplete="email"
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: tab === 0 ? 1 : 2 }}
          autoComplete={tab === 0 ? 'current-password' : 'new-password'}
        />

        {tab === 1 && (
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 2 }}
            autoComplete="new-password"
          />
        )}

        {tab === 0 && (
          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Button size="small" onClick={handleResetPassword} disabled={loading}>
              Forgot password?
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2 }}>or</Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{ mb: 1 }}
        >
          Continue with Google
        </Button>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={tab === 0 ? handleLogin : handleRegister}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Please wait…' : tab === 0 ? 'Sign In' : 'Create Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginDialog;
