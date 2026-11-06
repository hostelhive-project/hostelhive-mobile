import { baseApi } from './baseApi';
import { API_BASE_URL } from '../config/env';
import { secureStorage } from '../utils/secureStorage';
import { refreshSession } from './sessionRefresh';
import type { ApiResponse } from '../types/api';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export interface UploadResponse {
  url: string;
  fileId: string;
  name: string;
}

/**
 * Executes a native multipart XMLHttpRequest.
 * Direct XHR is the canonical, reliable way to stream FormData on React Native
 * because it passes the FormData bridge descriptor directly to native OkHttp,
 * bypassing fetch polyfill wrappers that can corrupt or drop multipart bodies.
 */
function uploadViaXhr(
  url: string,
  formData: FormData,
  token: string | null
): Promise<{ status: number; data: any; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.timeout = 30000;

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // Response is not JSON
      }
      resolve({
        status: xhr.status,
        data,
        text: xhr.responseText || '',
      });
    };

    xhr.onerror = (e) => {
      // eslint-disable-next-line no-console
      console.error('[UPLOAD XHR ERROR]', e);
      reject(new Error(`Network request failed (status: ${xhr.status || 0})`));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload request timed out'));
    };

    xhr.send(formData);
  });
}

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation<ApiResponse<UploadResponse>, FormData>({
      async queryFn(formData, api) {
        const uploadUrl = `${API_BASE_URL}/upload/image`;
        try {
          const state = api.getState() as { auth: { accessToken: string | null } };
          let token = state.auth.accessToken;
          if (!token) {
            token = await secureStorage.getAccessToken();
          }

          // eslint-disable-next-line no-console
          console.log('[UPLOAD] Starting upload to:', uploadUrl, 'Has token:', Boolean(token));

          let result = await uploadViaXhr(uploadUrl, formData, token);

          if (result.status === 401) {
            const refreshedToken = await refreshSession(api, token);
            if (refreshedToken) result = await uploadViaXhr(uploadUrl, formData, refreshedToken);
          }

          // eslint-disable-next-line no-console
          console.log('[UPLOAD] Completed with status:', result.status);

          if (result.status < 200 || result.status >= 300) {
            const error: FetchBaseQueryError = {
              status: result.status,
              data: result.data || {
                success: false,
                message: result.text || `Upload failed with HTTP ${result.status}`,
              },
            };
            return { error };
          }

          return { data: result.data as ApiResponse<UploadResponse> };
        } catch (err: any) {
          // eslint-disable-next-line no-console
          console.error('[UPLOAD ERROR IN QUERYFN]:', err);
          const error: FetchBaseQueryError = {
            status: 'FETCH_ERROR',
            error: err?.message || 'Network request failed. Please check connection.',
          };
          return { error };
        }
      },
    }),
  }),
});

export const { useUploadImageMutation } = uploadApi;
