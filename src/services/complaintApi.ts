import { baseApi } from './baseApi';
import type { ApiResponse } from '../types/api';
import type { BlockchainVerifyRecord } from '../types/blockchain';
import type { Complaint, CreateComplaintPayload, MarkComplaintFixedPayload } from '../types/complaint';

export const complaintApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyComplaints: builder.query<ApiResponse<Complaint[]>, void>({
      query: () => ({
        url: '/complaints/mine',
        method: 'GET',
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Complaint' as const, id: _id })),
              { type: 'Complaint', id: 'LIST' },
            ]
          : [{ type: 'Complaint', id: 'LIST' }],
    }),

    getAssignedComplaints: builder.query<ApiResponse<Complaint[]>, void>({
      query: () => ({
        url: '/complaints/assigned',
        method: 'GET',
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Complaint' as const, id: _id })),
              { type: 'Complaint', id: 'ASSIGNED' },
            ]
          : [{ type: 'Complaint', id: 'ASSIGNED' }],
    }),

    getComplaintById: builder.query<ApiResponse<Complaint>, string>({
      query: (id) => ({
        url: `/complaints/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Complaint', id }],
    }),

    getComplaintBlockchainRecord: builder.query<
      ApiResponse<BlockchainVerifyRecord>,
      string
    >({
      query: (complaintId) => ({
        url: `/blockchain/Complaint/${complaintId}/verify`,
        method: 'GET',
      }),
    }),

    createComplaint: builder.mutation<ApiResponse<Complaint>, CreateComplaintPayload>({
      query: (payload) => ({
        url: '/complaints',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Complaint'],
    }),

    markComplaintFixed: builder.mutation<
      ApiResponse<Complaint>,
      { complaintId: string; body: MarkComplaintFixedPayload }
    >({
      query: ({ complaintId, body }) => ({
        url: `/complaints/${complaintId}/mark-fixed`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Complaint'],
    }),

    confirmComplaintResolved: builder.mutation<ApiResponse<Complaint>, string>({
      query: (complaintId) => ({
        url: `/complaints/${complaintId}/confirm-resolution`,
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: ['Complaint'],
    }),

    reopenComplaint: builder.mutation<ApiResponse<Complaint>, string>({
      query: (complaintId) => ({
        url: `/complaints/${complaintId}/reopen`,
        method: 'PATCH',
        body: {},
      }),
      invalidatesTags: ['Complaint'],
    }),
  }),
});

export const {
  useGetMyComplaintsQuery,
  useLazyGetMyComplaintsQuery,
  useGetAssignedComplaintsQuery,
  useGetComplaintByIdQuery,
  useLazyGetComplaintBlockchainRecordQuery,
  useCreateComplaintMutation,
  useMarkComplaintFixedMutation,
  useConfirmComplaintResolvedMutation,
  useReopenComplaintMutation,
} = complaintApi;

