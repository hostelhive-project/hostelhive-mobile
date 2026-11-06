import { baseApi } from './baseApi';
import type { ApiResponse, Booking } from '../types/api';

export interface CreateBookingPayload {
  roomId: string;
  emergencyContact?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  termsAcceptedAt?: string;
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyBookings: builder.query<ApiResponse<Booking[]>, void>({
      query: () => ({
        url: '/bookings/mine',
        method: 'GET',
      }),
      providesTags: ['Booking'],
    }),

    getBookingById: builder.query<ApiResponse<Booking>, string>({
      query: (id) => ({
        url: `/bookings/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Booking', id }],
    }),

    createBooking: builder.mutation<ApiResponse<Booking>, CreateBookingPayload>({
      query: (payload) => ({
        url: '/bookings',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Booking', 'Room', 'Hostel'],
    }),

    cancelBooking: builder.mutation<ApiResponse<Booking>, string>({
      query: (id) => ({
        url: `/bookings/${id}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Booking', 'Room', 'Hostel'],
    }),
  }),
});

export const {
  useGetMyBookingsQuery,
  useLazyGetMyBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
} = bookingApi;

