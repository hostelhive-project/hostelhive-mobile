import { baseApi } from './baseApi';
import type { ApiResponse, User } from '../types/api';
import type { AppNotification, UnreadCountResponse } from '../types/notification';

export interface ListNotificationsParams {
  unreadOnly?: boolean;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listNotifications: builder.query<ApiResponse<AppNotification[]>, ListNotificationsParams | void>({
      query: (params) => ({
        url: '/notifications',
        method: 'GET',
        params: params?.unreadOnly ? { unread: 'true' } : undefined,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Notification' as const, id: _id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    getUnreadCount: builder.query<ApiResponse<UnreadCountResponse>, void>({
      query: () => ({
        url: '/notifications/unread-count',
        method: 'GET',
      }),
      providesTags: [{ type: 'Notification', id: 'COUNT' }],
    }),

    markNotificationRead: builder.mutation<ApiResponse<AppNotification>, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
        { type: 'Notification', id: 'COUNT' },
      ],
    }),

    markAllNotificationsRead: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }, { type: 'Notification', id: 'COUNT' }],
    }),

    updateDeviceToken: builder.mutation<ApiResponse<User>, { userId: string; deviceToken: string | null }>({
      query: ({ userId, deviceToken }) => ({
        url: `/users/${userId}`,
        method: 'PUT',
        body: { deviceToken },
      }),
      invalidatesTags: (_result, _error, { deviceToken }) => (deviceToken ? ['User'] : []),
    }),
  }),
});

export const {
  useListNotificationsQuery,
  useLazyListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useUpdateDeviceTokenMutation,
} = notificationApi;

