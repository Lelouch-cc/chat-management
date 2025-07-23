import { useState, useEffect } from "react";
import { User, Permission, PermissionModule, PermissionAction, hasPermission } from "@/types/user";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

interface UseAuthReturn extends AuthState {
	login: (user: User) => void;
	logout: () => void;
	hasPermission: (module: PermissionModule, action: PermissionAction) => boolean;
	hasAnyPermission: (module: PermissionModule, actions: PermissionAction[]) => boolean;
	hasAllPermissions: (module: PermissionModule, actions: PermissionAction[]) => boolean;
	updateUser: (updatedUser: User) => void;
}

/**
 * 认证和权限管理Hook
 */
export const useAuth = (): UseAuthReturn => {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
	});

	/**
	 * 初始化认证状态
	 */
	useEffect(() => {
		const initAuth = () => {
			try {
				const isLoggedIn = localStorage.getItem("isLoggedIn");
				const userStr = localStorage.getItem("user");

				if (isLoggedIn === "true" && userStr) {
					const user = JSON.parse(userStr) as User;

					// 验证用户数据完整性
					if (user && user.id && user.username && user.permissions) {
						setAuthState({
							user,
							isAuthenticated: true,
							isLoading: false,
						});
						return;
					}
				}

				// 清理无效的认证信息
				localStorage.removeItem("isLoggedIn");
				localStorage.removeItem("user");
				localStorage.removeItem("userPermissions");

				setAuthState({
					user: null,
					isAuthenticated: false,
					isLoading: false,
				});
			} catch (error) {
				console.error("初始化认证状态失败:", error);

				// 清理损坏的数据
				localStorage.removeItem("isLoggedIn");
				localStorage.removeItem("user");
				localStorage.removeItem("userPermissions");

				setAuthState({
					user: null,
					isAuthenticated: false,
					isLoading: false,
				});
			}
		};

		initAuth();
	}, []);

	/**
	 * 登录
	 */
	const login = (user: User) => {
		try {
			localStorage.setItem("isLoggedIn", "true");
			localStorage.setItem("user", JSON.stringify(user));
			localStorage.setItem("userPermissions", JSON.stringify(user.permissions));

			setAuthState({
				user,
				isAuthenticated: true,
				isLoading: false,
			});
		} catch (error) {
			console.error("登录状态保存失败:", error);
			throw new Error("登录失败，请重试");
		}
	};

	/**
	 * 登出
	 */
	const logout = () => {
		localStorage.removeItem("isLoggedIn");
		localStorage.removeItem("user");
		localStorage.removeItem("userPermissions");

		setAuthState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
		});
	};

	/**
	 * 更新用户信息
	 */
	const updateUser = (updatedUser: User) => {
		try {
			localStorage.setItem("user", JSON.stringify(updatedUser));
			localStorage.setItem("userPermissions", JSON.stringify(updatedUser.permissions));

			setAuthState((prev) => ({
				...prev,
				user: updatedUser,
			}));
		} catch (error) {
			console.error("更新用户信息失败:", error);
		}
	};

	/**
	 * 检查是否有指定权限
	 */
	const checkPermission = (module: PermissionModule, action: PermissionAction): boolean => {
		if (!authState.user || !authState.user.permissions) {
			return false;
		}

		return hasPermission(authState.user.permissions, module, action);
	};

	/**
	 * 检查是否有任意一个权限
	 */
	const hasAnyPermission = (module: PermissionModule, actions: PermissionAction[]): boolean => {
		return actions.some((action) => checkPermission(module, action));
	};

	/**
	 * 检查是否有所有权限
	 */
	const hasAllPermissions = (module: PermissionModule, actions: PermissionAction[]): boolean => {
		return actions.every((action) => checkPermission(module, action));
	};

	return {
		...authState,
		login,
		logout,
		hasPermission: checkPermission,
		hasAnyPermission,
		hasAllPermissions,
		updateUser,
	};
};
