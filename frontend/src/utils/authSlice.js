import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

// Async thunk to check the user's session status
export const checkUserStatus = createAsyncThunk(
  'auth/checkUserStatus',
  async (_, { rejectWithValue }) => {
    try {
      // Restore token from localStorage if available
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        window.__AUTH_TOKEN = storedToken;
      }
      
      const res = await api.apiFetch('/api/auth/me');
      if (!res.ok) {
        // Clear stored token if auth fails
        localStorage.removeItem('authToken');
        delete window.__AUTH_TOKEN;
        return rejectWithValue('No active session');
      }
      
      return res.data.user;
    } catch (error) {
      // Clear stored token on error
      localStorage.removeItem('authToken');
      delete window.__AUTH_TOKEN;
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  authStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.authStatus = 'succeeded';
    },
    logoutSuccess: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.authStatus = 'idle';
      // Clear stored token on logout
      localStorage.removeItem('authToken');
      delete window.__AUTH_TOKEN;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkUserStatus.pending, (state) => {
        state.authStatus = 'loading';
      })
      .addCase(checkUserStatus.fulfilled, (state, action) => {
        state.authStatus = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(checkUserStatus.rejected, (state) => {
        state.authStatus = 'failed';
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { loginSuccess, logoutSuccess } = authSlice.actions;
export default authSlice.reducer;