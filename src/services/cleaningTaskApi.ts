import { baseApi } from './baseApi';
import type { ApiResponse } from '../types/api';
import type {
  CleaningTask,
  CleaningTaskStatus,
  CompleteTaskPayload,
  DelayTaskPayload,
  StartTaskPayload,
} from '../types/cleaningTask';

export interface ListCleaningTasksParams {
  status?: CleaningTaskStatus;
}

export const cleaningTaskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyTasks: builder.query<ApiResponse<CleaningTask[]>, ListCleaningTasksParams | void>({
      query: (params) => ({
        url: '/cleaning-tasks/mine',
        method: 'GET',
        params: params?.status ? { status: params.status } : undefined,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'CleaningTask' as const, id: _id })),
              { type: 'CleaningTask', id: 'LIST' },
            ]
          : [{ type: 'CleaningTask', id: 'LIST' }],
    }),

    getTaskById: builder.query<ApiResponse<CleaningTask>, string>({
      query: (id) => ({
        url: `/cleaning-tasks/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'CleaningTask', id }],
    }),

    startTask: builder.mutation<
      ApiResponse<CleaningTask>,
      { taskId: string; body?: StartTaskPayload } | string
    >({
      query: (arg) => {
        const taskId = typeof arg === 'string' ? arg : arg.taskId;
        const body = typeof arg === 'string' ? undefined : arg.body;
        return {
          url: `/cleaning-tasks/${taskId}/start`,
          method: 'PATCH',
          body,
        };
      },
      invalidatesTags: (_result, _error, arg) => {
        const taskId = typeof arg === 'string' ? arg : arg.taskId;
        return [
          { type: 'CleaningTask', id: taskId },
          { type: 'CleaningTask', id: 'LIST' },
        ];
      },
    }),

    completeTask: builder.mutation<
      ApiResponse<CleaningTask>,
      { taskId: string; body: CompleteTaskPayload }
    >({
      query: ({ taskId, body }) => ({
        url: `/cleaning-tasks/${taskId}/complete`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: 'CleaningTask', id: taskId },
        { type: 'CleaningTask', id: 'LIST' },
      ],
    }),

    delayTask: builder.mutation<
      ApiResponse<CleaningTask>,
      { taskId: string; body: DelayTaskPayload }
    >({
      query: ({ taskId, body }) => ({
        url: `/cleaning-tasks/${taskId}/delay`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        { type: 'CleaningTask', id: taskId },
        { type: 'CleaningTask', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetMyTasksQuery,
  useLazyGetMyTasksQuery,
  useGetTaskByIdQuery,
  useStartTaskMutation,
  useCompleteTaskMutation,
  useDelayTaskMutation,
} = cleaningTaskApi;

