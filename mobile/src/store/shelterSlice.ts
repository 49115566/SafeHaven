import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ShelterState, Shelter, ShelterStatusUpdate } from '../types';
import { shelterService } from '../services/shelterService';
import { offlineService, PendingUpdate } from '../services/offlineService';

interface StaffAssignment {
  userId: string;
  shelterId: string;
  role: string;
  shift: {
    start: string;
    end: string;
  };
  responsibilities: string[];
}

interface Resources {
  [key: string]: {
    available: number;
    unit: string;
  };
}

interface ExtendedShelterState extends ShelterState {
  resources?: Resources;
  staffAssignments?: StaffAssignment[];
}

const initialState: ExtendedShelterState = {
  currentShelter: null,
  isLoading: false,
  error: null,
  lastSync: null,
  resources: undefined,
  staffAssignments: [],
};

// Async thunk for syncing pending updates
export const syncPendingUpdates = createAsyncThunk(
  'shelter/syncPendingUpdates',
  async (_, { rejectWithValue }) => {
    try {
      const isOnline = await offlineService.isOnline();
      if (!isOnline) {
        throw new Error('Device is offline');
      }

      const pendingUpdates = await offlineService.getPendingUpdates();
      const results = [];

      for (const pendingUpdate of pendingUpdates) {
        try {
          const updatedShelter = await shelterService.updateStatus(
            pendingUpdate.update.shelterId,
            {
              capacity: pendingUpdate.update.capacity,
              resources: pendingUpdate.update.resources,
              status: pendingUpdate.update.status,
              urgentNeeds: pendingUpdate.update.urgentNeeds
            }
          );
          
          // Remove successful update from queue
          await offlineService.removeUpdate(pendingUpdate.id);
          results.push({ success: true, shelter: updatedShelter });
        } catch (error: any) {
          // Increment retry count for failed updates
          await offlineService.incrementRetryCount(pendingUpdate.id);
          results.push({ success: false, error: error?.message || 'Unknown error', updateId: pendingUpdate.id });
        }
      }

      await offlineService.updateLastSync();
      return results;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Sync failed');
    }
  }
);

// Async thunk for updating shelter status
export const updateShelterStatusAsync = createAsyncThunk(
  'shelter/updateStatus',
  async (
    { shelterId, statusUpdate }: { shelterId: string; statusUpdate: Omit<ShelterStatusUpdate, 'shelterId' | 'timestamp'> },
    { rejectWithValue }
  ) => {
    try {
      const isOnline = await offlineService.isOnline();
      
      if (isOnline) {
        // Try immediate update if online
        const updatedShelter = await shelterService.updateStatus(shelterId, statusUpdate);
        return { shelter: updatedShelter, wasOffline: false };
      } else {
        // Queue for later if offline
        const fullUpdate: ShelterStatusUpdate = {
          ...statusUpdate,
          shelterId,
          timestamp: new Date().toISOString()
        };
        
        await offlineService.queueUpdate(fullUpdate);
        return { update: fullUpdate, wasOffline: true };
      }
    } catch (error: any) {
      // If online request failed, queue it for later
      const fullUpdate: ShelterStatusUpdate = {
        ...statusUpdate,
        shelterId,
        timestamp: new Date().toISOString()
      };
      
      await offlineService.queueUpdate(fullUpdate);
      return rejectWithValue({ message: error?.message || 'Update failed', queued: true });
    }
  }
);

const shelterSlice = createSlice({
  name: 'shelter',
  initialState,
  reducers: {
    setShelter: (state, action: PayloadAction<Shelter>) => {
      state.currentShelter = action.payload;
      state.lastSync = new Date().toISOString();
      state.error = null;
    },
    updateShelterStatus: (state, action: PayloadAction<Partial<Shelter>>) => {
      if (state.currentShelter) {
        state.currentShelter = { ...state.currentShelter, ...action.payload };
        state.lastSync = new Date().toISOString();
      }
    },
    updateResources: (state, action: PayloadAction<Resources>) => {
      state.resources = action.payload;
    },
    assignStaff: (state, action: PayloadAction<StaffAssignment>) => {
      if (!state.staffAssignments) {
        state.staffAssignments = [];
      }
      state.staffAssignments.push(action.payload);
    },
    removeStaffAssignment: (state, action: PayloadAction<string>) => {
      if (state.staffAssignments) {
        state.staffAssignments = state.staffAssignments.filter(
          assignment => assignment.userId !== action.payload
        );
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearShelter: (state) => {
      state.currentShelter = null;
      state.error = null;
      state.lastSync = null;
      state.resources = undefined;
      state.staffAssignments = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update shelter status async
      .addCase(updateShelterStatusAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateShelterStatusAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.shelter) {
          // Online update successful
          state.currentShelter = action.payload.shelter;
          state.lastSync = new Date().toISOString();
        } else if (action.payload.update) {
          // Offline update queued
          const update = action.payload.update;
          if (state.currentShelter) {
            state.currentShelter = {
              ...state.currentShelter,
              ...update.capacity && { capacity: update.capacity },
              ...update.resources && { resources: { ...state.currentShelter.resources, ...update.resources } },
              ...update.status && { status: update.status },
              ...update.urgentNeeds && { urgentNeeds: update.urgentNeeds },
              lastUpdated: update.timestamp
            };
          }
        }
      })
      .addCase(updateShelterStatusAsync.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        state.error = payload?.message || 'Failed to update shelter status';
      })
      
      // Sync pending updates
      .addCase(syncPendingUpdates.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(syncPendingUpdates.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update with the latest successful sync result
        const successfulUpdate = action.payload.find((result: any) => result.success && result.shelter);
        if (successfulUpdate?.shelter) {
          state.currentShelter = successfulUpdate.shelter;
          state.lastSync = new Date().toISOString();
        }
      })
      .addCase(syncPendingUpdates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setShelter, 
  updateShelterStatus,
  updateResources,
  assignStaff,
  removeStaffAssignment,
  setLoading, 
  setError, 
  clearShelter, 
  clearError 
} = shelterSlice.actions;

export default shelterSlice.reducer;