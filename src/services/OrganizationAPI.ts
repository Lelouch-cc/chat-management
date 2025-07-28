import { ApiService } from "@/lib/http";
import type { ApiResponse } from "@/types/api";
import type {
	CreateOrganizationRequest,
	CreateOrganizationResponse,
	UpdateOrganizationRequest,
	Organization,
	OrganizationsListResponse,
} from "@/types/organization";

/**
 * 公司组织管理API服务类
 */
export class OrganizationAPI extends ApiService {
	/**
	 * 创建公司
	 * @param request 创建公司请求参数
	 * @returns 创建公司响应
	 */
	async createOrganization(request: CreateOrganizationRequest): Promise<ApiResponse<CreateOrganizationResponse>> {
		try {
			const response = await this.client.post<CreateOrganizationResponse>("/jobbit/v1/admin/organizations", request);
			return response;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * 获取公司列表
	 * @param params 查询参数
	 * @returns 公司列表
	 */
	async getOrganizations(params?: { offset?: string }): Promise<ApiResponse<OrganizationsListResponse>> {
		try {
			const response = await this.client.get<OrganizationsListResponse>("/jobbit/v1/admin/organizations", { params });
			return response;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * 获取单个公司信息
	 * @param id 公司ID
	 * @returns 公司信息
	 */
	async getOrganization(id: string): Promise<ApiResponse<Organization>> {
		try {
			const response = await this.client.get<Organization>(`/jobbit/v1/admin/organizations/${id}`);
			return response;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * 更新公司信息
	 * @param id 公司ID
	 * @param request 更新请求参数
	 * @returns 更新后的公司信息
	 */
	async updateOrganization(id: string, request: UpdateOrganizationRequest): Promise<ApiResponse<Organization>> {
		try {
			const response = await this.client.put<Organization>(`/jobbit/v1/admin/organizations/${id}`, request);
			return response;
		} catch (error) {
			this.handleError(error);
		}
	}

	/**
	 * 删除公司
	 * @param id 公司ID
	 * @returns 删除结果
	 */
	async deleteOrganization(id: string): Promise<ApiResponse<void>> {
		try {
			const response = await this.client.delete<void>(`/jobbit/v1/admin/organizations/${id}`);
			return response;
		} catch (error) {
			this.handleError(error);
		}
	}
}

// 创建公司管理API实例
export const organizationAPI = new OrganizationAPI();
