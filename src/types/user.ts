// 权限模块枚举
export enum PermissionModule {
	DASHBOARD = "dashboard", // 数据统计
	JOBS = "jobs", // 职位管理
	APPLICATIONS = "applications", // 申请管理
	CHAT = "chat", // 申请者沟通
	USERS = "users", // 用户管理
	SETTINGS = "settings", // 系统设置
}

// 权限操作枚举
export enum PermissionAction {
	READ = "read", // 查看
	WRITE = "write", // 编辑
	DELETE = "delete", // 删除
	MANAGE = "manage", // 管理（包含所有权限）
}

// 权限接口
export interface Permission {
	module: PermissionModule;
	actions: PermissionAction[];
}

// 用户角色枚举
export enum UserRole {
	SUPER_ADMIN = "super_admin", // 超级管理员
	ADMIN = "admin", // 管理员
	HR_MANAGER = "hr_manager", // HR经理
	HR_SPECIALIST = "hr_specialist", // HR专员
	VIEWER = "viewer", // 只读用户
}

// 性别枚举
export enum Gender {
	UNKNOWN = 0, // 未知
	MALE = 1, // 男性
	FEMALE = 2, // 女性
	OTHER = 3, // 其他
}

// 用户状态枚举
export enum UserStatus {
	ACTIVE = "active", // 激活
	INACTIVE = "inactive", // 未激活
	SUSPENDED = "suspended", // 暂停
	DELETED = "deleted", // 已删除
}

// 用户基本信息接口
export interface User {
	id: number;
	username: string; // 用户名（登录用）
	nickname: string; // 昵称（显示用）
	handle: number; // 用户唯一标识符
	gender: Gender; // 性别
	birthday: string; // 生日（YYYY-MM-DD格式）
	email?: string; // 邮箱（可选）
	phone?: string; // 手机号（可选）
	avatar?: string; // 头像URL（可选）
	role: UserRole; // 用户角色
	permissions: Permission[]; // 用户权限列表
	status: UserStatus; // 用户状态
	createdAt: string; // 创建时间
	updatedAt: string; // 更新时间
	lastLoginAt?: string; // 最后登录时间
}

// 创建用户请求接口
export interface CreateUserRequest {
	username: string;
	nickname: string;
	handle: number;
	gender: Gender;
	birthday: string;
	email?: string;
	phone?: string;
	password: string;
	role: UserRole;
	permissions?: Permission[];
}

// 更新用户请求接口
export interface UpdateUserRequest {
	nickname?: string;
	gender?: Gender;
	birthday?: string;
	email?: string;
	phone?: string;
	avatar?: string;
	role?: UserRole;
	permissions?: Permission[];
	status?: UserStatus;
}

// 预定义角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
	[UserRole.SUPER_ADMIN]: [
		// 超级管理员拥有所有权限
		{
			module: PermissionModule.DASHBOARD,
			actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
		},
		{
			module: PermissionModule.JOBS,
			actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
		},
		{
			module: PermissionModule.APPLICATIONS,
			actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
		},
		{
			module: PermissionModule.CHAT,
			actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
		},
		{
			module: PermissionModule.USERS,
			actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
		},
		{
			module: PermissionModule.SETTINGS,
			actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
		},
	],
	[UserRole.ADMIN]: [
		// 管理员权限（除了用户管理的删除权限）
		{ module: PermissionModule.DASHBOARD, actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.MANAGE] },
		{
			module: PermissionModule.JOBS,
			actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
		},
		{
			module: PermissionModule.APPLICATIONS,
			actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE, PermissionAction.MANAGE],
		},
		{ module: PermissionModule.CHAT, actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.MANAGE] },
		{ module: PermissionModule.USERS, actions: [PermissionAction.READ, PermissionAction.WRITE] },
		{ module: PermissionModule.SETTINGS, actions: [PermissionAction.READ, PermissionAction.WRITE] },
	],
	[UserRole.HR_MANAGER]: [
		// HR经理权限
		{ module: PermissionModule.DASHBOARD, actions: [PermissionAction.READ] },
		{ module: PermissionModule.JOBS, actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE] },
		{ module: PermissionModule.APPLICATIONS, actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE] },
		{ module: PermissionModule.CHAT, actions: [PermissionAction.READ, PermissionAction.WRITE] },
		{ module: PermissionModule.USERS, actions: [PermissionAction.READ] },
	],
	[UserRole.HR_SPECIALIST]: [
		// HR专员权限
		{ module: PermissionModule.DASHBOARD, actions: [PermissionAction.READ] },
		{ module: PermissionModule.JOBS, actions: [PermissionAction.READ, PermissionAction.WRITE] },
		{ module: PermissionModule.APPLICATIONS, actions: [PermissionAction.READ, PermissionAction.WRITE] },
		{ module: PermissionModule.CHAT, actions: [PermissionAction.READ, PermissionAction.WRITE] },
	],
	[UserRole.VIEWER]: [
		// 只读用户权限
		{ module: PermissionModule.DASHBOARD, actions: [PermissionAction.READ] },
		{ module: PermissionModule.JOBS, actions: [PermissionAction.READ] },
		{ module: PermissionModule.APPLICATIONS, actions: [PermissionAction.READ] },
	],
};

// 权限检查工具函数
export const hasPermission = (userPermissions: Permission[], module: PermissionModule, action: PermissionAction): boolean => {
	const modulePermission = userPermissions.find((p) => p.module === module);
	return modulePermission?.actions.includes(action) || false;
};

// 获取性别显示文本
export const getGenderText = (gender: Gender): string => {
	switch (gender) {
		case Gender.MALE:
			return "男";
		case Gender.FEMALE:
			return "女";
		case Gender.OTHER:
			return "其他";
		default:
			return "未知";
	}
};

// 获取角色显示文本
export const getRoleText = (role: UserRole): string => {
	switch (role) {
		case UserRole.SUPER_ADMIN:
			return "超级管理员";
		case UserRole.ADMIN:
			return "管理员";
		case UserRole.HR_MANAGER:
			return "HR经理";
		case UserRole.HR_SPECIALIST:
			return "HR专员";
		case UserRole.VIEWER:
			return "只读用户";
		default:
			return "未知角色";
	}
};

// 获取状态显示文本
export const getStatusText = (status: UserStatus): string => {
	switch (status) {
		case UserStatus.ACTIVE:
			return "正常";
		case UserStatus.INACTIVE:
			return "未激活";
		case UserStatus.SUSPENDED:
			return "已暂停";
		case UserStatus.DELETED:
			return "已删除";
		default:
			return "未知";
	}
};

// 获取状态样式
export const getStatusStyle = (status: UserStatus): string => {
	switch (status) {
		case UserStatus.ACTIVE:
			return "bg-green-100 text-green-800";
		case UserStatus.INACTIVE:
			return "bg-yellow-100 text-yellow-800";
		case UserStatus.SUSPENDED:
			return "bg-red-100 text-red-800";
		case UserStatus.DELETED:
			return "bg-gray-100 text-gray-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
};
