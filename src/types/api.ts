export interface RequestConfig extends RequestInit {
  url?: string;
  baseURL?: string;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
  params?: Record<string, string | number | boolean>;
}

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  code: number;
  success: boolean;
}

export interface ApiError extends Error {
  code?: number;
  status?: number;
  response?: Response;
  config?: RequestConfig;
}

export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor<T = unknown> = (response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;
export type ErrorInterceptor = (error: ApiError) => Promise<never> | ApiError;

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retry?: number;
  retryDelay?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}