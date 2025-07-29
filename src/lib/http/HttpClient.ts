import type {
	RequestConfig,
	ApiResponse,
	ApiError,
	RequestInterceptor,
	ResponseInterceptor,
	ErrorInterceptor,
	HttpClientConfig,
} from "../../types/api";
import { HttpMethod } from "../../types/api";

export class HttpClient {
	private baseURL: string;
	private timeout: number;
	private defaultHeaders: Record<string, string>;
	private retry: number;
	private retryDelay: number;
	private requestInterceptors: RequestInterceptor[] = [];
	private responseInterceptors: ResponseInterceptor[] = [];
	private errorInterceptors: ErrorInterceptor[] = [];

	constructor(config: HttpClientConfig = {}) {
		this.baseURL = config.baseURL || "";
		this.timeout = config.timeout || 10000;
		this.defaultHeaders = {
			"Content-Type": "application/json",
			...config.headers,
		};
		this.retry = config.retry || 3;
		this.retryDelay = config.retryDelay || 1000;
	}

	private buildURL(url: string, params?: Record<string, string | number | boolean>): string {
		const fullURL = url.startsWith("http") ? url : `${this.baseURL}${url}`;

		if (!params || Object.keys(params).length === 0) {
			return fullURL;
		}

		const urlObj = new URL(fullURL);
		Object.entries(params).forEach(([key, value]) => {
			urlObj.searchParams.append(key, String(value));
		});

		return urlObj.toString();
	}

	private createAbortController(timeout: number): AbortController {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), timeout);
		return controller;
	}

	private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
		let processedConfig = { ...config };

		for (const interceptor of this.requestInterceptors) {
			processedConfig = await interceptor(processedConfig);
		}

		return processedConfig;
	}

	private async applyResponseInterceptors<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
		let processedResponse = response;

		for (const interceptor of this.responseInterceptors) {
			processedResponse = (await interceptor(processedResponse)) as ApiResponse<T>;
		}

		return processedResponse;
	}

	private async applyErrorInterceptors(error: ApiError): Promise<never> {
		let processedError = error;

		for (const interceptor of this.errorInterceptors) {
			try {
				const result = await interceptor(processedError);
				if (result instanceof Error) {
					processedError = result;
				}
			} catch (interceptorError) {
				processedError = interceptorError as ApiError;
			}
		}

		throw processedError;
	}

	private createApiError(message: string, response?: Response, config?: RequestConfig): ApiError {
		const error = new Error(message) as ApiError;
		error.name = "ApiError";
		error.response = response;
		error.config = config;
		error.status = response?.status;
		return error;
	}

	private async sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async executeRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
		// 首先应用请求拦截器
		const interceptedConfig = await this.applyRequestInterceptors(config);

		const { timeout = this.timeout, retry = this.retry, retryDelay = this.retryDelay, params, ...fetchConfig } = interceptedConfig;

		const url = this.buildURL(interceptedConfig.url || "", params);
		const controller = this.createAbortController(timeout);

		const requestConfig: RequestInit = {
			...fetchConfig,
			headers: {
				...this.defaultHeaders,
				...fetchConfig.headers,
			},
			signal: controller.signal,
		};

		let lastError: ApiError | undefined;
		let attempt = 0;

		while (attempt <= retry) {
			try {
				const response = await fetch(url, requestConfig);

				if (!response.ok) {
					throw this.createApiError(`HTTP ${response.status}: ${response.statusText}`, response, config);
				}

				const contentType = response.headers.get("content-type");
				let data: T;

				if (contentType && contentType.includes("application/json")) {
					const jsonData = await response.json();

					// 支持标准 API 响应格式
					if (jsonData && typeof jsonData === "object" && "data" in jsonData) {
						return await this.applyResponseInterceptors(jsonData as ApiResponse<T>);
					} else {
						// 兼容直接返回数据的情况
						data = jsonData;
					}
				} else {
					data = (await response.text()) as unknown as T;
				}

				const apiResponse: ApiResponse<T> = {
					data,
					message: "Success",
					code: response.status,
					success: true,
				};

				return await this.applyResponseInterceptors(apiResponse);
			} catch (error) {
				lastError = error as ApiError;

				// 如果是中止请求，不重试
				if (error instanceof Error && error.name === "AbortError") {
					lastError = this.createApiError("Request timeout", undefined, config);
					break;
				}

				// 如果是最后一次尝试，不再等待
				if (attempt === retry) {
					break;
				}

				// 等待后重试
				await this.sleep(retryDelay * Math.pow(2, attempt)); // 指数退避
				attempt++;
			}
		}

		if (!lastError) {
			lastError = this.createApiError("Unknown error occurred", undefined, config);
		}
		return await this.applyErrorInterceptors(lastError);
	}

	async request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
		// 确保 config 有 headers 属性
		const configWithHeaders = {
			...config,
			headers: config.headers || {},
		};

		const processedConfig = await this.applyRequestInterceptors(configWithHeaders);
		return this.executeRequest<T>(processedConfig);
	}

	async get<T = unknown>(url: string, config: Omit<RequestConfig, "method" | "url"> = {}): Promise<ApiResponse<T>> {
		return this.request<T>({
			...config,
			method: HttpMethod.GET,
			url,
		});
	}

	async post<T = unknown>(
		url: string,
		data?: unknown,
		config: Omit<RequestConfig, "method" | "url" | "body"> = {}
	): Promise<ApiResponse<T>> {
		return this.request<T>({
			...config,
			method: HttpMethod.POST,
			url,
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async put<T = unknown>(
		url: string,
		data?: unknown,
		config: Omit<RequestConfig, "method" | "url" | "body"> = {}
	): Promise<ApiResponse<T>> {
		return this.request<T>({
			...config,
			method: HttpMethod.PUT,
			url,
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async patch<T = unknown>(
		url: string,
		data?: unknown,
		config: Omit<RequestConfig, "method" | "url" | "body"> = {}
	): Promise<ApiResponse<T>> {
		return this.request<T>({
			...config,
			method: HttpMethod.PATCH,
			url,
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	async delete<T = unknown>(url: string, config: Omit<RequestConfig, "method" | "url"> = {}): Promise<ApiResponse<T>> {
		return this.request<T>({
			...config,
			method: HttpMethod.DELETE,
			url,
		});
	}

	// 拦截器管理
	addRequestInterceptor(interceptor: RequestInterceptor): void {
		this.requestInterceptors.push(interceptor);
	}

	addResponseInterceptor(interceptor: ResponseInterceptor): void {
		this.responseInterceptors.push(interceptor);
	}

	addErrorInterceptor(interceptor: ErrorInterceptor): void {
		this.errorInterceptors.push(interceptor);
	}

	removeRequestInterceptor(interceptor: RequestInterceptor): void {
		const index = this.requestInterceptors.indexOf(interceptor);
		if (index > -1) {
			this.requestInterceptors.splice(index, 1);
		}
	}

	removeResponseInterceptor(interceptor: ResponseInterceptor): void {
		const index = this.responseInterceptors.indexOf(interceptor);
		if (index > -1) {
			this.responseInterceptors.splice(index, 1);
		}
	}

	removeErrorInterceptor(interceptor: ErrorInterceptor): void {
		const index = this.errorInterceptors.indexOf(interceptor);
		if (index > -1) {
			this.errorInterceptors.splice(index, 1);
		}
	}

	// 配置更新
	updateConfig(config: Partial<HttpClientConfig>): void {
		if (config.baseURL !== undefined) this.baseURL = config.baseURL;
		if (config.timeout !== undefined) this.timeout = config.timeout;
		if (config.retry !== undefined) this.retry = config.retry;
		if (config.retryDelay !== undefined) this.retryDelay = config.retryDelay;
		if (config.headers) {
			this.defaultHeaders = { ...this.defaultHeaders, ...config.headers };
		}
	}

	// 设置认证头
	setAuthToken(token: string, type: "Bearer" | "Basic" = "Bearer"): void {
		this.defaultHeaders["Authorization"] = `${type} ${token}`;
	}

	// 移除认证头
	removeAuthToken(): void {
		delete this.defaultHeaders["Authorization"];
	}

	// 获取当前配置
	getConfig(): HttpClientConfig {
		return {
			baseURL: this.baseURL,
			timeout: this.timeout,
			headers: { ...this.defaultHeaders },
			retry: this.retry,
			retryDelay: this.retryDelay,
		};
	}
}
