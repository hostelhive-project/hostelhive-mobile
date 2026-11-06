import { baseApi } from './baseApi';
import type {
  ApiResponse,
  Hostel,
  Room,
  RoomLayoutType,
  Review,
  PublicChatbotInfo,
  HostelSearchParams,
  HostelExploreSort,
} from '../types/api';

export interface ExploreHostelsParams extends HostelSearchParams {
  q?: string;
  page: number;
  limit?: number;
  sort?: HostelExploreSort;
}

export interface ExploreHostelsPage {
  items: Hostel[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface RoomTypeSummary {
  layoutType: RoomLayoutType;
  totalRooms: number;
  availableRooms: number;
  availableBeds: number;
  startingRent: number | null;
}

export interface RoomCatalog {
  summary: Omit<RoomTypeSummary, 'layoutType'>;
  types: RoomTypeSummary[];
}

export type RoomSort = 'room-number' | 'rent-asc' | 'rent-desc';
export interface RoomOptionsParams {
  hostelId: string;
  page: number;
  limit?: number;
  layoutType?: RoomLayoutType;
  available?: boolean;
  q?: string;
  sort?: RoomSort;
}

export interface RoomOptionsPage {
  items: Room[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export const hostelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHostels: builder.query<ApiResponse<Hostel[]>, HostelSearchParams | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {};
        if (params?.location?.trim()) {
          queryParams.location = params.location.trim();
        }
        if (params?.maxPrice !== undefined && params?.maxPrice !== null && !isNaN(Number(params.maxPrice))) {
          queryParams.maxPrice = Number(params.maxPrice);
        }
        if (params?.facilities) {
          if (Array.isArray(params.facilities)) {
            // RTK Query serializes array as multiple query params or comma
            if (params.facilities.length > 0) {
              return {
                url: '/hostels',
                method: 'GET',
                params: {
                  ...queryParams,
                  facilities: params.facilities,
                },
              };
            }
          } else if (typeof params.facilities === 'string' && params.facilities.trim()) {
            queryParams.facilities = params.facilities.trim();
          }
        }
        return {
          url: '/hostels',
          method: 'GET',
          params: queryParams,
        };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Hostel' as const, id: _id })),
              { type: 'Hostel' as const, id: 'LIST' },
            ]
          : [{ type: 'Hostel' as const, id: 'LIST' }],
    }),

    getExploreHostelsPage: builder.query<ApiResponse<ExploreHostelsPage>, ExploreHostelsParams>({
      query: (params) => ({
        url: '/hostels/explore',
        method: 'GET',
        params: {
          q: params.q?.trim() || undefined,
          location: params.location?.trim() || undefined,
          maxPrice: params.maxPrice,
          facilities: params.facilities,
          page: params.page,
          limit: params.limit ?? 12,
          sort: params.sort ?? 'rating',
        },
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ _id }) => ({ type: 'Hostel' as const, id: _id })),
              { type: 'Hostel' as const, id: 'LIST' },
            ]
          : [{ type: 'Hostel' as const, id: 'LIST' }],
    }),

    getHostelById: builder.query<ApiResponse<Hostel>, string>({
      query: (id) => ({
        url: `/hostels/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Hostel', id }],
    }),

    getHostelRooms: builder.query<ApiResponse<Room[]>, { hostelId: string; availableOnly?: boolean }>({
      query: ({ hostelId, availableOnly }) => ({
        url: `/hostels/${hostelId}/rooms`,
        method: 'GET',
        params: availableOnly ? { available: 'true' } : undefined,
      }),
      providesTags: (_result, _error, { hostelId }) => [
        { type: 'Room', id: `HOSTEL_${hostelId}` },
      ],
    }),

    getRoomCatalog: builder.query<ApiResponse<RoomCatalog>, string>({
      query: (hostelId) => `/hostels/${hostelId}/room-catalog`,
      providesTags: (_result, _error, hostelId) => [
        { type: 'Room', id: `HOSTEL_${hostelId}` },
        { type: 'Hostel', id: hostelId },
      ],
    }),

    getRoomOptions: builder.query<ApiResponse<RoomOptionsPage>, RoomOptionsParams>({
      query: ({ hostelId, ...params }) => ({
        url: `/hostels/${hostelId}/room-options`,
        params: { ...params, limit: params.limit ?? 10 },
      }),
      providesTags: (_result, _error, { hostelId }) => [
        { type: 'Room', id: `HOSTEL_${hostelId}` },
        { type: 'Hostel', id: hostelId },
      ],
    }),

    getRoomById: builder.query<ApiResponse<Room>, string>({
      query: (id) => ({
        url: `/rooms/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Room', id }],
    }),

    getHostelReviews: builder.query<ApiResponse<Review[]>, string>({
      query: (hostelId) => ({
        url: `/hostels/${hostelId}/reviews`,
        method: 'GET',
      }),
      providesTags: (_result, _error, hostelId) => [
        { type: 'Review', id: `HOSTEL_${hostelId}` },
      ],
    }),

    getHostelChatbotInfo: builder.query<ApiResponse<PublicChatbotInfo>, string>({
      query: (hostelId) => ({
        url: `/hostels/${hostelId}/chatbot-info`,
        method: 'GET',
      }),
      providesTags: (_result, _error, hostelId) => [
        { type: 'Chatbot', id: `HOSTEL_${hostelId}` },
      ],
    }),

    createReview: builder.mutation<
      ApiResponse<Review>,
      { hostelId: string; rating: number; comment?: string }
    >({
      query: ({ hostelId, rating, comment }) => ({
        url: `/hostels/${hostelId}/reviews`,
        method: 'POST',
        body: { rating, comment },
      }),
      invalidatesTags: (_result, _error, { hostelId }) => [
        { type: 'Review', id: `HOSTEL_${hostelId}` },
        { type: 'Hostel', id: hostelId },
        { type: 'Hostel', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHostelsQuery,
  useLazyGetHostelsQuery,
  useGetExploreHostelsPageQuery,
  useGetHostelByIdQuery,
  useGetHostelRoomsQuery,
  useGetRoomCatalogQuery,
  useGetRoomOptionsQuery,
  useGetRoomByIdQuery,
  useGetHostelReviewsQuery,
  useGetHostelChatbotInfoQuery,
  useCreateReviewMutation,
} = hostelApi;

