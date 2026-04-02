import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  severity: NotificationSeverity;
  timestamp: number;
  autoHideDuration?: number;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<{ message: string; severity: NotificationSeverity; autoHideDuration?: number }>) => {
      state.notifications.push({
        id: uuidv4(),
        message: action.payload.message,
        severity: action.payload.severity,
        timestamp: Date.now(),
        autoHideDuration: action.payload.autoHideDuration ?? 4000,
      });
    },
    dismissNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, dismissNotification, clearAllNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
