/**
 * RTK Query API for PACS Service
 * Elite Power User - API Integration
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AccountDTO,
  PropertyDTO,
  PACSSearchDTO,
  PayImportedPaymentRunDTO,
  REETExportDTO,
  SqlQueryResult,
  TaskQueryMappingDTO,
  TaskQueryDTO,
  PacsUserDTO,
} from '../../types/pacs';

const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const pacsApi = createApi({
  reducerPath: 'pacsApi',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      // Add auth headers if needed
      // const token = getToken();
      // if (token) {
      //   headers.set('authorization', `Bearer ${token}`);
      // }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Accounts', 'Properties', 'Payments', 'Queries', 'Users'],
  endpoints: (builder) => ({
    // Accounts
    getAccounts: builder.query<AccountDTO[], PACSSearchDTO | void>({
      query: (criteria) => {
        if (criteria) {
          return {
            url: '/pacs/accounts/search',
            method: 'POST',
            body: criteria,
          };
        }
        return '/pacs/accounts';
      },
      providesTags: ['Accounts'],
    }),
    getAccount: builder.query<AccountDTO, number>({
      query: (id) => `/pacs/accounts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Accounts', id }],
    }),

    // Properties
    getProperties: builder.query<PropertyDTO[], PACSSearchDTO | void>({
      query: (criteria) => {
        if (criteria) {
          return {
            url: '/pacs/properties/search',
            method: 'POST',
            body: criteria,
          };
        }
        return '/pacs/properties';
      },
      providesTags: ['Properties'],
    }),
    getProperty: builder.query<PropertyDTO, number>({
      query: (id) => `/pacs/properties/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Properties', id }],
    }),

    // Payments
    executePaymentImport: builder.mutation<PayImportedPaymentRunDTO, { filePath: string }>({
      query: ({ filePath }) => ({
        url: '/pacs/payments/import',
        method: 'POST',
        body: { filePath },
      }),
      invalidatesTags: ['Payments'],
    }),

    // REET Export
    executeREETExport: builder.mutation<
      REETExportDTO,
      { filePath: string; asOfDate: Date; validate?: boolean }
    >({
      query: ({ filePath, asOfDate, validate = false }) => ({
        url: '/pacs/reet/export',
        method: 'POST',
        body: {
          filePath,
          asOfDate: asOfDate.toISOString(),
          validate,
        },
      }),
    }),

    // SQL Queries
    executeSqlQuery: builder.mutation<SqlQueryResult, { query: string }>({
      query: ({ query }) => ({
        url: '/pacs/queries/execute',
        method: 'POST',
        body: { query },
      }),
    }),

    exportQueryToExcel: builder.mutation<
      void,
      { query: string; filePath: string; sheetName: string }
    >({
      query: ({ query, filePath, sheetName }) => ({
        url: '/pacs/queries/export-excel',
        method: 'POST',
        body: { query, filePath, sheetName },
      }),
    }),

    // Task Queries
    getTaskQueries: builder.query<TaskQueryDTO[], void>({
      query: () => '/pacs/task-queries',
      providesTags: ['Queries'],
    }),
    getTaskQuery: builder.query<TaskQueryDTO, string>({
      query: (id) => `/pacs/task-queries/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Queries', id }],
    }),
    executeTaskQuery: builder.mutation<SqlQueryResult, string>({
      query: (id) => ({
        url: `/pacs/task-queries/${id}/execute`,
        method: 'POST',
      }),
    }),

    // Task Query Mappings
    getTaskQueryMappings: builder.query<TaskQueryMappingDTO[], void>({
      query: () => '/pacs/task-query-mappings',
      providesTags: ['Queries'],
    }),
    getTaskQueryMapping: builder.query<TaskQueryMappingDTO, string>({
      query: (id) => `/pacs/task-query-mappings/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Queries', id }],
    }),
    createTaskQueryMapping: builder.mutation<TaskQueryMappingDTO, TaskQueryMappingDTO>({
      query: (mapping) => ({
        url: '/pacs/task-query-mappings',
        method: 'POST',
        body: mapping,
      }),
      invalidatesTags: ['Queries'],
    }),
    updateTaskQueryMapping: builder.mutation<void, TaskQueryMappingDTO>({
      query: (mapping) => ({
        url: `/pacs/task-query-mappings/${mapping.id}`,
        method: 'PUT',
        body: mapping,
      }),
      invalidatesTags: (_result, _error, mapping) => [{ type: 'Queries', id: mapping.id }],
    }),
    deleteTaskQueryMapping: builder.mutation<void, string>({
      query: (id) => ({
        url: `/pacs/task-query-mappings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Queries'],
    }),

    // Users
    getPacsUsers: builder.query<PacsUserDTO[], void>({
      query: () => '/pacs/users',
      providesTags: ['Users'],
    }),
    getPacsUser: builder.query<PacsUserDTO, number>({
      query: (id) => `/pacs/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Users', id }],
    }),
    syncPACSUserData: builder.mutation<boolean, void>({
      query: () => ({
        url: '/pacs/users/sync',
        method: 'POST',
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetAccountsQuery,
  useGetAccountQuery,
  useGetPropertiesQuery,
  useGetPropertyQuery,
  useExecutePaymentImportMutation,
  useExecuteREETExportMutation,
  useExecuteSqlQueryMutation,
  useExportQueryToExcelMutation,
  useGetTaskQueriesQuery,
  useGetTaskQueryQuery,
  useExecuteTaskQueryMutation,
  useGetTaskQueryMappingsQuery,
  useGetTaskQueryMappingQuery,
  useCreateTaskQueryMappingMutation,
  useUpdateTaskQueryMappingMutation,
  useDeleteTaskQueryMappingMutation,
  useGetPacsUsersQuery,
  useGetPacsUserQuery,
  useSyncPACSUserDataMutation,
} = pacsApi;

