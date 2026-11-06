import { baseApi } from '../services/baseApi';
import { authApi } from '../services/authApi';
import type { AppDispatch } from '../store/store';
import { logout as clearAuthState } from '../store/slices/authSlice';
import { secureStorage } from './secureStorage';

/** Revoke the backend session (which also clears push registration), then clear local data. */
export async function signOut(dispatch: AppDispatch, _userId?: string | null): Promise<void> {
  try { await dispatch(authApi.endpoints.logout.initiate()).unwrap(); }
  catch { /* Local sign-out must also work offline. */ }

  await secureStorage.clearSession();
  dispatch(clearAuthState());
  dispatch(baseApi.util.resetApiState());
}
