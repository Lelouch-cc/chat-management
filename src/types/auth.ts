// 登录请求参数
export interface AdminLoginRequest {
	data: {
		username: string;
		password: string;
	};
}

// 登录响应数据
export interface AdminLoginResponse {
	token: string;
	admin: {
		id: string;
		username: string;
		password: string;
		permission: string[];
		create_ts: string;
		update_ts: string;
	};
}

// API错误响应
export interface ApiErrorResponse {
	code: number;
	message: string;
	success: false;
	data?: null;
}
