import { baseApi } from './baseApi';
import type { ApiResponse, User } from '../types/api';
import type {
  LoginPayload,
  RegisterStudentPayload,
  AuthResponseData,
  AuthTokens,
  RegistrationPendingData,
} from '../types/auth';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthResponseData>, LoginPayload>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Booking'],
    }),

    registerStudent: builder.mutation<ApiResponse<RegistrationPendingData>, RegisterStudentPayload>({
      query: (data) => ({
        url: '/auth/register',
        method: 'POST',
        body: {
          ...data,
          role: 'Student', // Explicit student role
        },
      }),
      invalidatesTags: ['User', 'Booking'],
    }),

    verifyEmail: builder.mutation<ApiResponse<AuthResponseData>, { email: string; otp: string }>({
      query: (body) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'Booking'],
    }),

    activateStaffInvite: builder.mutation<
      ApiResponse<AuthResponseData>,
      { email: string; otp: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/activate-staff-invite',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    resendVerification: builder.mutation<ApiResponse<null>, { email: string }>({
      query: (body) => ({
        url: '/auth/resend-verification',
        method: 'POST',
        body,
      }),
    }),

    requestPasswordReset: builder.mutation<ApiResponse<null>, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<
      ApiResponse<null>,
      { email: string; otp: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

    changePassword: builder.mutation<
      ApiResponse<null>,
      { currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
    }),

    getMe: builder.query<ApiResponse<User>, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    logout: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
        timeout: 5000,
      }),
    }),

    refreshToken: builder.mutation<ApiResponse<AuthTokens>, { refreshToken: string }>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),

    updateProfile: builder.mutation<
      ApiResponse<User>,
      { id: string; name?: string; phone?: string; profileImageUrl?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterStudentMutation,
  useVerifyEmailMutation,
  useActivateStaffInviteMutation,
  useResendVerificationMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useLogoutMutation,
  useRefreshTokenMutation,
  useUpdateProfileMutation,
} = authApi;

