import { HttpClient } from "./HttpClient";
import { createDefaultInterceptors, createDevelopmentInterceptors } from "./interceptors";
import type { HttpClientConfig } from "../../types/api";
import { appConfig } from "@/config/config";

// 创建默认的HTTP客户端实例
const createHttpClient = () => {
	const client = new HttpClient({
		baseURL: appConfig.apiBaseUrl,
		timeout: 10000,
		retry: 3,
		retryDelay: 1000,
		headers: {
			"Content-Type": "application/json",
		},
	});

	// 根据环境添加不同的拦截器
	const interceptors = process.env.NODE_ENV === "development" ? createDevelopmentInterceptors() : createDefaultInterceptors();

	// 添加请求拦截器
	interceptors.request.forEach((interceptor) => {
		client.addRequestInterceptor(interceptor);
	});

	// 添加响应拦截器
	interceptors.response.forEach((interceptor) => {
		client.addResponseInterceptor(interceptor);
	});

	// 添加错误拦截器
	interceptors.error.forEach((interceptor) => {
		client.addErrorInterceptor(interceptor);
	});

	return client;
};

// 导出默认实例
export const httpClient = createHttpClient();

// 导出类和工具函数
export { HttpClient } from "./HttpClient";
export * from "./interceptors";
export * from "../../types/api";

// 导出便捷方法
export const { get, post, put, patch, delete: del, request } = httpClient;

// 创建新实例的工厂函数
export const createClient = (config?: HttpClientConfig) => {
	return new HttpClient(config);
};

// API 服务基类
export abstract class ApiService {
	protected client: HttpClient;

	constructor(client?: HttpClient) {
		this.client = client || httpClient;
	}

	protected buildPath(...segments: (string | number)[]): string {
		return segments.map((segment) => String(segment).replace(/^\/+|\/+$/g, "")).join("/");
	}

	protected handleError(error: unknown): never {
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Unknown error occurred");
	}
}
