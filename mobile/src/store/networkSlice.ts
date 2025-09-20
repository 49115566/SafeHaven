import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PendingSyncItem {
  id: string;
  type: 'shelter_status' | 'alert' | 'profile_update' | 'resource_update' | 'status_update';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface NetworkState {
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'pending' | 'failed';
  pendingSyncItems: PendingSyncItem[];
  failedSyncItems?: PendingSyncItem[];
  lastSyncTime: number | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

const initialState: NetworkState = {
  isOnline: true,
  syncStatus: 'idle',
  pendingSyncItems: [],
  failedSyncItems: [],
  lastSyncTime: null,
  connectionQuality: 'excellent'
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
      state.connectionQuality = action.payload ? 'excellent' : 'offline';
    },
    setSyncStatus: (state, action: PayloadAction<NetworkState['syncStatus']>) => {
      state.syncStatus = action.payload;
      if (action.payload === 'synced') {
        state.lastSyncTime = Date.now();
      }
    },
    addPendingSync: (state, action: PayloadAction<Omit<PendingSyncItem, 'retryCount' | 'maxRetries'>>) => {
      const item: PendingSyncItem = {
        ...action.payload,
        retryCount: 0,
        maxRetries: 3
      };
      state.pendingSyncItems.push(item);
      state.syncStatus = 'pending';
    },
    removePendingSync: (state, action: PayloadAction<string>) => {
      state.pendingSyncItems = state.pendingSyncItems.filter(item => item.id !== action.payload);
      if (state.pendingSyncItems.length === 0) {
        state.syncStatus = 'synced';
      }
    },
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const item = state.pendingSyncItems.find(item => item.id === action.payload);
      if (item) {
        item.retryCount += 1;
      }
    },
    markSyncFailed: (state, action: PayloadAction<string>) => {
      const itemIndex = state.pendingSyncItems.findIndex(item => item.id === action.payload);
      if (itemIndex !== -1) {
        const failedItem = state.pendingSyncItems[itemIndex];
        state.pendingSyncItems.splice(itemIndex, 1);
        if (!state.failedSyncItems) {
          state.failedSyncItems = [];
        }
        state.failedSyncItems.push(failedItem);
      }
    },
    setConnectionQuality: (state, action: PayloadAction<NetworkState['connectionQuality']>) => {
      state.connectionQuality = action.payload;
    },
    clearPendingSync: (state) => {
      state.pendingSyncItems = [];
      state.syncStatus = 'idle';
    },
    clearFailedSync: (state) => {
      state.failedSyncItems = [];
    }
  }
});

export const {
  setOnlineStatus,
  setSyncStatus,
  addPendingSync,
  removePendingSync,
  incrementRetryCount,
  markSyncFailed,
  setConnectionQuality,
  clearPendingSync,
  clearFailedSync
} = networkSlice.actions;

export default networkSlice.reducer;
