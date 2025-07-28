// 创建公司请求参数
export interface CreateOrganizationRequest {
	data: {
		name: string;
		icon: string;
		desc: string;
		email: string;
		password: string;
	};
}

// 公司组织信息
export interface Organization {
	id: string;
	name: string;
	icon: string;
	desc: string;
	create_ts: string;
	update_ts: string;
}

// 创建公司响应数据
export interface CreateOrganizationResponse {
	item: Organization;
}

// 更新公司请求参数
export interface UpdateOrganizationRequest {
	data: Partial<{
		name: string;
		icon: string;
		desc: string;
		email: string;
		password: string;
	}>;
}

// 公司列表响应
export interface OrganizationsListResponse {
	items: Organization[];
	offset: string;
	has_more: number;
}
