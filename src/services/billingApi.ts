import { baseApi } from './baseApi';
import type { ApiResponse } from '../types/api';
import type { BlockchainVerifyRecord } from '../types/blockchain';
import type {
  Invoice,
  Payment,
  CheckoutResponse,
  CheckoutPayload,
  InvoiceReceipt,
} from '../types/billing';

export const billingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listInvoicesForBooking: builder.query<ApiResponse<Invoice[]>, string>({
      query: (bookingId) => ({
        url: `/invoices/booking/${bookingId}`,
        method: 'GET',
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Invoice' as const, id: _id })),
              { type: 'Invoice', id: 'LIST' },
            ]
          : [{ type: 'Invoice', id: 'LIST' }],
    }),

    getInvoiceById: builder.query<ApiResponse<Invoice>, string>({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Invoice', id }],
    }),

    getInvoiceReceipt: builder.query<ApiResponse<InvoiceReceipt>, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/receipt`,
        method: 'GET',
      }),
    }),

    listPaymentsForInvoice: builder.query<ApiResponse<Payment[]>, string>({
      query: (invoiceId) => ({
        url: `/payments/invoice/${invoiceId}`,
        method: 'GET',
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Payment' as const, id: _id })),
              { type: 'Payment', id: 'LIST' },
            ]
          : [{ type: 'Payment', id: 'LIST' }],
    }),

    getPaymentById: builder.query<ApiResponse<Payment>, string>({
      query: (id) => ({
        url: `/payments/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Payment', id }],
    }),

    getPaymentBlockchainRecord: builder.query<
      ApiResponse<BlockchainVerifyRecord>,
      string
    >({
      query: (paymentId) => ({
        url: `/blockchain/Payment/${paymentId}/verify`,
        method: 'GET',
      }),
    }),

    initiateCheckout: builder.mutation<ApiResponse<CheckoutResponse>, CheckoutPayload>({
      query: (payload) => ({
        url: '/payments/checkout',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Invoice', 'Payment'],
    }),
  }),
});

export const {
  useListInvoicesForBookingQuery,
  useLazyListInvoicesForBookingQuery,
  useGetInvoiceByIdQuery,
  useLazyGetInvoiceReceiptQuery,
  useLazyGetInvoiceByIdQuery,
  useListPaymentsForInvoiceQuery,
  useLazyListPaymentsForInvoiceQuery,
  useGetPaymentByIdQuery,
  useLazyGetPaymentBlockchainRecordQuery,
  useInitiateCheckoutMutation,
} = billingApi;

