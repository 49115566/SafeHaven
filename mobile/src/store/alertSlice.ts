import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Alert, AlertType, AlertPriority, AlertStatus } from '../types';
import { alertService, CreateAlertRequest } from '../services/alertService';

// Async thunks
export const createAlertAsync = createAsyncThunk(
  'alerts/createAlert',
  async (alertData: CreateAlertRequest, { rejectWithValue }) => {
    try {
      return await alertService.createAlert(alertData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAlertsAsync = createAsyncThunk(
  'alerts/fetchAlerts',
  async (shelterId: string, { rejectWithValue }) => {
    try {
      return await alertService.getAlerts(shelterId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const acknowledgeAlertAsync = createAsyncThunk(
  'alerts/acknowledgeAlert',
  async (alertId: string, { rejectWithValue }) => {
    try {
      await alertService.acknowledgeAlert(alertId);
      return alertId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export interface AlertFilter {
  priority?: AlertPriority;
  type?: AlertType;
  status?: string;
}

export interface AlertState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  filter: AlertFilter;
}

const initialState: AlertState = {
  alerts: [],
  isLoading: false,
  error: null,
  filter: {}
};

const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    setAlertFilter: (state, action: PayloadAction<AlertFilter>) => {
      state.filter = action.payload;
    },
    clearAlertFilter: (state) => {
      state.filter = {};
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create alert
      .addCase(createAlertAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAlertAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts.unshift(action.payload);
      })
      .addCase(createAlertAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch alerts
      .addCase(fetchAlertsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlertsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.alerts = action.payload;
      })
      .addCase(fetchAlertsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Acknowledge alert
      .addCase(acknowledgeAlertAsync.fulfilled, (state, action) => {
        const alert = state.alerts.find(a => a.alertId === action.payload);
        if (alert) {
          alert.status = AlertStatus.ACKNOWLEDGED;
          alert.acknowledgedAt = new Date().toISOString();
        }
      });
  }
});

export const {
  setAlertFilter,
  clearAlertFilter,
  clearError
} = alertSlice.actions;

export default alertSlice.reducer;
