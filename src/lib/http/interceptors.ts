import type { RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from '../../types/api';

// 请求拦截器 - 添加认证Token
export const authRequestInterceptor: RequestInterceptor = (config) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
  if (token && config.headers) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  
  return config;
};

// 请求拦截器 - 添加时间戳防缓存
export const timestampRequestInterceptor: RequestInterceptor = (config) => {
  if (config.method === 'GET' && config.params) {
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
  }
  
  return config;
};

// 请求拦截器 - 日志记录
export const loggingRequestInterceptor: RequestInterceptor = (config) => {
  console.log(`[HTTP] ${config.method}`, {
    headers: config.headers,
    body: config.body,
    params: config.params,
  });
  
  return config;
};

// 响应拦截器 - 统一处理业务错误
export const businessErrorResponseInterceptor: ResponseInterceptor = (response) => {
  // 假设后端返回的错误格式
  if (!response.success && response.code !== 200) {
    throw new Error(response.message || '请求失败');
  }
  
  return response;
};

// 响应拦截器 - 日志记录
export const loggingResponseInterceptor: ResponseInterceptor = (response) => {
  console.log('[HTTP] Response:', {
    success: response.success,
    code: response.code,
    message: response.message,
    data: response.data,
  });
  
  return response;
};

// 错误拦截器 - 认证错误处理
export const authErrorInterceptor: ErrorInterceptor = async (error) => {
  if (error.status === 401) {
    // 清除认证信息
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('authToken');
    
    // 可以在这里触发登录页面跳转
    console.warn('认证失效，请重新登录');
    
    // 可选：自动跳转到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
  
  throw error;
};

// 错误拦截器 - 网络错误处理
export const networkErrorInterceptor: ErrorInterceptor = async (error) => {
  if (!navigator.onLine) {
    error.message = '网络连接失败，请检查网络设置';
  } else if (error.name === 'AbortError') {
    error.message = '请求超时，请稍后重试';
  } else if (error.status === 0) {
    error.message = '网络错误，请检查网络连接';
  }
  
  throw error;
};

// 错误拦截器 - 通用错误处理
export const commonErrorInterceptor: ErrorInterceptor = async (error) => {
  // 根据不同的HTTP状态码显示不同的错误信息
  const statusMessages: Record<number, string> = {
    400: '请求参数错误',
    401: '未授权，请重新登录',
    403: '权限不足',
    404: '请求的资源不存在',
    405: '请求方法不允许',
    408: '请求超时',
    409: '数据冲突',
    422: '请求参数验证失败',
    429: '请求过于频繁，请稍后重试',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务不可用',
    504: '网关超时',
  };
  
  if (error.status && statusMessages[error.status]) {
    error.message = statusMessages[error.status];
  }
  
  // 错误日志记录
  console.error('[HTTP] Error:', {
    message: error.message,
    status: error.status,
    code: error.code,
    config: error.config,
  });
  
  throw error;
};

// 预设拦截器组合
export const createDefaultInterceptors = () => ({
  request: [
    authRequestInterceptor,
    timestampRequestInterceptor,
  ],
  response: [
    businessErrorResponseInterceptor,
  ],
  error: [
    authErrorInterceptor,
    networkErrorInterceptor,
    commonErrorInterceptor,
  ],
});

export const createDevelopmentInterceptors = () => ({
  request: [
    loggingRequestInterceptor,
    authRequestInterceptor,
    timestampRequestInterceptor,
  ],
  response: [
    loggingResponseInterceptor,
    businessErrorResponseInterceptor,
  ],
  error: [
    authErrorInterceptor,
    networkErrorInterceptor,
    commonErrorInterceptor,
  ],
});