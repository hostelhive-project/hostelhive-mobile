import { baseApi } from './baseApi';
import type { ApiResponse } from '../types/api';
import type {
  ChatMessage,
  SendMessagePayload,
  SendMessageResponse,
  ChatSessionSummary,
} from '../types/chatbot';

export const chatbotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ApiResponse<SendMessageResponse>, SendMessagePayload>({
      query: (payload) => {
        const body: Record<string, string> = {
          message: payload.message,
        };
        if (payload.sessionId && payload.sessionId.trim()) {
          body.sessionId = payload.sessionId.trim();
        }
        if (payload.hostelId && payload.hostelId.trim()) {
          body.hostelId = payload.hostelId.trim();
        }

        return {
          url: '/chatbot/message',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['Chatbot'],
    }),

    getChatHistory: builder.query<ApiResponse<ChatMessage[]>, string>({
      query: (sessionId) => ({
        url: '/chatbot/history',
        method: 'GET',
        params: { sessionId },
      }),
      providesTags: ['Chatbot'],
    }),

    listChatSessions: builder.query<ApiResponse<ChatSessionSummary[]>, void>({
      query: () => ({
        url: '/chatbot/sessions',
        method: 'GET',
      }),
      providesTags: ['Chatbot'],
    }),
  }),
});

export const {
  useSendMessageMutation,
  useGetChatHistoryQuery,
  useLazyGetChatHistoryQuery,
  useListChatSessionsQuery,
} = chatbotApi;

