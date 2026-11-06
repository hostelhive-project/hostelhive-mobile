import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../config/env';
import { secureStorage } from '../utils/secureStorage';
import { refreshSession } from './sessionRefresh';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: 20000,
  prepareHeaders: async (headers, { getState }) => {
    // Prefer in-memory token from Redux state for speed
    const state = getState() as { auth: { accessToken: string | null } };
    let token = state.auth.accessToken;

    if (!token) {
      token = await secureStorage.getAccessToken();
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const rejectedToken = (api.getState() as { auth: { accessToken: string | null } }).auth.accessToken
    || await secureStorage.getAccessToken();
  let result = await rawBaseQuery(args, api, extraOptions);

  // If request failed with 401 Unauthorized, attempt refresh
  if (result.error && result.error.status === 401) {
    const url = typeof args === 'string' ? args : args.url;

    // Do not attempt refresh on auth endpoints to prevent loops
    if (!['/auth/login', '/auth/register', '/auth/refresh', '/auth/verify-email',
      '/auth/activate-staff-invite', '/auth/forgot-password', '/auth/reset-password',
      '/auth/resend-verification'].some(endpoint => url.startsWith(endpoint))) {
      if (await refreshSession(api, rejectedToken)) result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    'User',
    'Hostel',
    'Room',
    'Booking',
    'Invoice',
    'Payment',
    'Complaint',
    'CleaningTask',
    'Notification',
    'Chatbot',
    'Review',
  ],
  endpoints: () => ({}),
});

