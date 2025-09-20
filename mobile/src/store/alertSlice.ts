import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Alert {
  id: string;
  type: 'emergency' | 'warning' | 'info' | 'shelter_update';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  senderId: string;
  senderRole: string;
  shelterId?: string;
  acknowledged: boolean;
  actionRequired: boolean;
  expiresAt?: number;
}

export interface AlertFilter {
  priority?: Alert['priority'];
  type?: Alert['type'];
  acknowledged?: boolean;
}

export interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  filter: AlertFilter;
  isLoading: boolean;
  error: string | null;
}

const initialState: AlertState = {
  alerts: [],
  unreadCount: 0,
  filter: {},
  isLoading: false,
  error: null
};

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<Omit<Alert, 'acknowledged' | 'timestamp'>>) => {
      const alert: Alert = {
        ...action.payload,
        acknowledged: false,
        timestamp: Date.now()
      };
      state.alerts.unshift(alert);
      state.unreadCount += 1;
    },
    acknowledgeAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(alert => alert.id === action.payload);
      if (alert && !alert.acknowledged) {
        alert.acknowledged = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    acknowledgeAllAlerts: (state) => {
      state.alerts.forEach(alert => {
        alert.acknowledged = true;
      });
      state.unreadCount = 0;
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      const alertIndex = state.alerts.findIndex(alert => alert.id === action.payload);
      if (alertIndex !== -1) {
        const alert = state.alerts[alertIndex];
        if (!alert.acknowledged) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.alerts.splice(alertIndex, 1);
      }
    },
    clearAllAlerts: (state) => {
      state.alerts = [];
      state.unreadCount = 0;
    },
    setAlertFilter: (state, action: PayloadAction<AlertFilter>) => {
      state.filter = action.payload;
    },
    clearAlertFilter: (state) => {
      state.filter = {};
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    removeExpiredAlerts: (state) => {
      const now = Date.now();
      const beforeCount = state.alerts.length;
      state.alerts = state.alerts.filter(alert => {
        if (alert.expiresAt && alert.expiresAt < now) {
          if (!alert.acknowledged) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          return false;
        }
        return true;
      });
    }
  }
});

export const {
  addAlert,
  acknowledgeAlert,
  acknowledgeAllAlerts,
  removeAlert,
  clearAllAlerts,
  setAlertFilter,
  clearAlertFilter,
  setLoading,
  setError,
  removeExpiredAlerts
} = alertSlice.actions;

export default alertSlice.reducer;
