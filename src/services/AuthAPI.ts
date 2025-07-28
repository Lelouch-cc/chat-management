import { ApiService } from "@/lib/http";
import type { ApiResponse } from "@/types/api";
import type { AdminLoginRequest, AdminLoginResponse } from "@/types/auth";

/**
 * 认证API服务类
 */
export class AuthAPI extends ApiService {
	/**
	 * 管理员登录
	 * @param request 登录请求参数
	 * @returns 登录响应
	 */
	async adminLogin(request: AdminLoginRequest): Promise<ApiResponse<AdminLoginResponse>> {
		try {
			const response = await this.client.post<AdminLoginResponse>("/jobbit/v1/admin/login", request);
			return response;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * 管理员登出
	 * @returns 登出响应
	 */
	async adminLogout(): Promise<ApiResponse<void>> {
		try {
			const response = await this.client.post<void>("/jobbit/v1/admin/logout");
			return response;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * 刷新令牌
	 * @param refreshToken 刷新令牌
	 * @returns 新的访问令牌
	 */
	async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
		try {
			const response = await this.client.post<{ token: string }>("/jobbit/v1/admin/refresh", {
				refreshToken,
			});
			return response;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * 获取当前用户信息
	 * @returns 用户信息
	 */
	async getCurrentUser(): Promise<ApiResponse<AdminLoginResponse["admin"]>> {
		try {
			const response = await this.client.get<AdminLoginResponse["admin"]>("/jobbit/v1/admin/profile");
			return response;
		} catch (error) {
			this.handleError(error);
		}
	}
}

// 创建认证API实例
export const authAPI = new AuthAPI();
