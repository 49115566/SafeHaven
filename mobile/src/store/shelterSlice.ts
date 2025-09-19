import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ShelterState, Shelter } from '../types';

const initialState: ShelterState = {
  currentShelter: null,
  isLoading: false,
  error: null,
  lastSync: null,
};

const shelterSlice = createSlice({
  name: 'shelter',
  initialState,
  reducers: {
    setShelter: (state, action: PayloadAction<Shelter>) => {
      state.currentShelter = action.payload;
      state.lastSync = new Date().toISOString();
    },
    updateShelterStatus: (state, action: PayloadAction<Partial<Shelter>>) => {
      if (state.currentShelter) {
        state.currentShelter = { ...state.currentShelter, ...action.payload };
        state.lastSync = new Date().toISOString();
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
    },
  },
});

export const { setShelter, updateShelterStatus, setLoading, setError, clearShelter } = shelterSlice.actions;
export default shelterSlice.reducer;