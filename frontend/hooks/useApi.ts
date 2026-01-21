'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiError } from '@/types';

// Generic hook for GET requests
export function useApiQuery<T>(
  key: string | string[],
  endpoint: string,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, ApiError>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: () => api.get<T>(endpoint),
    ...options,
  });
}

// Generic hook for POST mutations
export function useApiMutation<TData, TVariables>(
  endpoint: string,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
    invalidateKeys?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: (variables) => api.post<TData>(endpoint, variables),
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

// Hook for PUT mutations
export function useApiPutMutation<TData, TVariables>(
  endpoint: string,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
    invalidateKeys?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: (variables) => api.put<TData>(endpoint, variables),
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

// Hook for DELETE mutations
export function useApiDeleteMutation<TData>(
  endpoint: string,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
    invalidateKeys?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, void>({
    mutationFn: () => api.delete<TData>(endpoint),
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

// Hook for file uploads
export function useApiUpload<TData>(
  endpoint: string,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
    invalidateKeys?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, FormData>({
    mutationFn: (formData) => api.upload<TData>(endpoint, formData),
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
