import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ToastState {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface UiState {
  toasts: ToastState[];
  isGlobalLoading: boolean;
}

const initialState: UiState = {
  toasts: [],
  isGlobalLoading: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{ type: 'success' | 'error' | 'info' | 'warning'; message: string }>
    ) => {
      const newToast: ToastState = {
        id: Date.now().toString(),
        type: action.payload.type,
        message: action.payload.message,
      };
      state.toasts.push(newToast);
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.isGlobalLoading = action.payload;
    },
  },
});

export const { showToast, dismissToast, setGlobalLoading } = uiSlice.actions;
export default uiSlice.reducer;

