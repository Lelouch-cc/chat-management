'use client';

import { useState, useCallback } from 'react';
import { httpClient } from '../lib/http';
import type { ApiResponse, RequestConfig } from '../types/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = unknown>(
  initialConfig?: RequestConfig,
  options: UseApiOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async (config?: RequestConfig): Promise<ApiResponse<T> | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const finalConfig = { ...initialConfig, ...config };
      const response = await httpClient.request<T>(finalConfig);
      
      setState({
        data: response.data,
        loading: false,
        error: null,
      });

      onSuccess?.(response.data);
      return response;
    } catch (error) {
      const apiError = error instanceof Error ? error : new Error('Unknown error');
      
      setState({
        data: null,
        loading: false,
        error: apiError,
      });

      onError?.(apiError);
      return null;
    }
  }, [initialConfig, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// 针对不同HTTP方法的特化hooks
export function useGet<T = unknown>(url: string, options: UseApiOptions = {}) {
  return useApi<T>({ method: 'GET', url }, options);
}

export function usePost<T = unknown>(url: string, options: UseApiOptions = {}) {
  const api = useApi<T>({ method: 'POST', url }, options);
  
  const post = useCallback((data?: unknown, config?: Omit<RequestConfig, 'method' | 'url' | 'body'>) => {
    return api.execute({
      ...config,
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [api]);

  return {
    ...api,
    post,
  };
}

export function usePut<T = unknown>(url: string, options: UseApiOptions = {}) {
  const api = useApi<T>({ method: 'PUT', url }, options);
  
  const put = useCallback((data?: unknown, config?: Omit<RequestConfig, 'method' | 'url' | 'body'>) => {
    return api.execute({
      ...config,
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [api]);

  return {
    ...api,
    put,
  };
}

export function useDelete<T = unknown>(url: string, options: UseApiOptions = {}) {
  return useApi<T>({ method: 'DELETE', url }, options);
}

// 分页数据的hook
export function usePagination<T = unknown>(
  url: string, 
  initialParams: { page?: number; pageSize?: number } = {},
  options: UseApiOptions = {}
) {
  const [params, setParams] = useState({
    page: 1,
    pageSize: 10,
    ...initialParams,
  });

  const api = useApi<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>({
    method: 'GET',
    url,
    params,
  }, options);

  const loadPage = useCallback((page: number) => {
    const newParams = { ...params, page };
    setParams(newParams);
    return api.execute({ params: newParams });
  }, [params, api]);

  const changePageSize = useCallback((pageSize: number) => {
    const newParams = { ...params, page: 1, pageSize };
    setParams(newParams);
    return api.execute({ params: newParams });
  }, [params, api]);

  const refresh = useCallback(() => {
    return api.execute({ params });
  }, [api, params]);

  return {
    ...api,
    params,
    loadPage,
    changePageSize,
    refresh,
    hasNextPage: api.data ? params.page < api.data.totalPages : false,
    hasPrevPage: params.page > 1,
  };
}