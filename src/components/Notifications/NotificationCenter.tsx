import React, { useEffect, useCallback, useRef } from 'react';
import { Box, Alert, IconButton, Slide } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { dismissNotification, Notification } from '../../store/slices/notificationSlice';
import { Z_INDEX } from '../../config/constants';

const MAX_VISIBLE = 3;

const severityBackground: Record<string, string> = {
  success: 'rgba(46, 125, 50, 0.85)',
  error: 'rgba(211, 47, 47, 0.85)',
  warning: 'rgba(237, 108, 2, 0.85)',
  info: 'rgba(2, 136, 209, 0.85)',
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const dispatch = useAppDispatch();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleDismiss = useCallback(() => {
    dispatch(dismissNotification(notification.id));
  }, [dispatch, notification.id]);

  useEffect(() => {
    const duration = notification.autoHideDuration ?? 4000;
    timerRef.current = setTimeout(handleDismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleDismiss, notification.autoHideDuration]);

  return (
    <Slide direction="right" in mountOnEnter unmountOnExit>
      <Alert
        severity={notification.severity}
        variant="filled"
        action={
          <IconButton size="small" color="inherit" onClick={handleDismiss} aria-label="Close notification">
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{
          mb: 1,
          background: severityBackground[notification.severity],
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          color: '#fff',
          minWidth: 280,
          maxWidth: 420,
          fontSize: '0.85rem',
          '& .MuiAlert-icon': { color: '#fff', opacity: 0.9 },
          '& .MuiAlert-action': { pt: 0 },
        }}
      >
        {notification.message}
      </Alert>
    </Slide>
  );
};

const NotificationCenter: React.FC = () => {
  const notifications = useAppSelector((state) => state.notifications.notifications);
  const visibleNotifications = notifications.slice(-MAX_VISIBLE);

  if (visibleNotifications.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 36,
        left: 16,
        zIndex: Z_INDEX.tooltip,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
      }}
    >
      {visibleNotifications.map((n) => (
        <NotificationItem key={n.id} notification={n} />
      ))}
    </Box>
  );
};

export default NotificationCenter;
