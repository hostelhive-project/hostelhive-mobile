import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { API_BASE_URL } from '../config/env';
import { secureStorage } from '../utils/secureStorage';
import { logout, setTokens } from '../store/slices/authSlice';
import type { ApiResponse } from '../types/api';
import type { AuthTokens } from '../types/auth';

let refreshInFlight: Promise<string | null> | null = null;

// API requests and native multipart uploads share one refresh operation because
// the backend rotates refresh tokens after a single use.
export async function refreshSession(
  api: Pick<BaseQueryApi, 'dispatch' | 'getState'>,
  rejectedAccessToken: string | null,
): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const operation = (async () => {
    const currentAccess = await secureStorage.getAccessToken();
    if (currentAccess && rejectedAccessToken && currentAccess !== rejectedAccessToken) return currentAccess;
    const refreshToken = await secureStorage.getRefreshToken();
    if (!refreshToken) {
      await secureStorage.clearSession();
      api.dispatch(logout());
      return null;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }), signal: controller.signal,
      });
      const result = await response.json().catch(() => null) as ApiResponse<AuthTokens> | null;
      // A sign-out or another sign-in must not be overwritten by an older reply.
      if (await secureStorage.getRefreshToken() !== refreshToken) return secureStorage.getAccessToken();
      if (response.ok && result?.success && result.data?.accessToken) {
        const tokens = { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken || refreshToken };
        await secureStorage.saveTokens(tokens.accessToken, tokens.refreshToken);
        api.dispatch(setTokens(tokens));
        return tokens.accessToken;
      }
      if (response.status === 401) {
        await secureStorage.clearSession();
        api.dispatch(logout());
      }
      return null;
    } catch {
      // Offline/timeout/provider errors do not prove that a session was revoked.
      return null;
    } finally { clearTimeout(timer); }
  })();
  refreshInFlight = operation;
  try { return await operation; }
  finally { if (refreshInFlight === operation) refreshInFlight = null; }
}
