"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, UserRole, UserStatus, Gender, ROLE_PERMISSIONS } from "@/types/user";
import { authAPI } from "@/services";
import type { AdminLoginRequest } from "@/types/auth";

// 身份类型定义
type IdentityType = "super_admin" | "company_admin" | "hr_specialist";

// 身份配置
const IDENTITY_CONFIG = {
	super_admin: {
		label: "超级管理员",
		icon: "🔧",
		description: "系统最高权限管理员",
	},
	company_admin: {
		label: "公司管理员",
		icon: "🏢",
		description: "公司级别管理员",
	},
	hr_specialist: {
		label: "HR专员",
		icon: "👨‍💼",
		description: "人力资源专员",
	},
};

export default function LoginPage() {
	const [selectedIdentity, setSelectedIdentity] = useState<IdentityType | null>(null);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	/**
	 * 重置表单状态
	 */
	const resetForm = () => {
		setUsername("");
		setPassword("");
	};

	/**
	 * 处理身份选择
	 */
	const handleIdentitySelect = (identity: IdentityType) => {
		setSelectedIdentity(identity);
		resetForm();
	};

	/**
	 * 返回身份选择
	 */
	const handleBackToIdentity = () => {
		setSelectedIdentity(null);
		resetForm();
	};

	/**
	 * 将API响应转换为本地User类型
	 */
	const mapApiUserToLocalUser = (apiAdmin: {
		id: string;
		username: string;
		password: string;
		permission: string[];
		create_ts: string;
		update_ts: string;
	}): User => {
		// 根据用户名判断角色（临时方案，实际应该由后端返回角色信息）
		let role: UserRole = UserRole.HR_SPECIALIST;
		let nickname = "用户";
		let avatar = "👤";

		// 简单的角色判断逻辑
		if (apiAdmin.username.includes("admin")) {
			if (apiAdmin.username === "admin" || apiAdmin.username.includes("super")) {
				role = UserRole.SUPER_ADMIN;
				nickname = "超级管理员";
				avatar = "🔧";
			} else if (apiAdmin.username.includes("company")) {
				role = UserRole.COMPANY_ADMIN;
				nickname = "公司管理员";
				avatar = "🏢";
			} else {
				role = UserRole.ADMIN;
				nickname = "管理员";
				avatar = "⚙️";
			}
		} else if (apiAdmin.username.includes("hr")) {
			role = UserRole.HR_SPECIALIST;
			nickname = "HR专员";
			avatar = "👨‍💼";
		}

		// 将时间戳转换为ISO字符串
		const createDate = new Date(parseInt(apiAdmin.create_ts)).toISOString();
		const updateDate = new Date(parseInt(apiAdmin.update_ts)).toISOString();

		return {
			id: parseInt(apiAdmin.id.replace(/-/g, "").substring(0, 8), 16), // 将UUID转换为数字ID
			username: apiAdmin.username,
			nickname: nickname,
			handle: parseInt(apiAdmin.id.substring(0, 8), 16), // 生成handle
			gender: Gender.UNKNOWN,
			birthday: "1990-01-01",
			email: `${apiAdmin.username}@jobbit.com`,
			phone: undefined,
			avatar: avatar,
			role: role,
			permissions: ROLE_PERMISSIONS[role],
			status: UserStatus.ACTIVE,
			createdAt: createDate,
			updatedAt: updateDate,
			lastLoginAt: new Date().toISOString(),
		};
	};

	/**
	 * 用户认证函数 - 使用真实API
	 */
	const authenticateUser = async (username: string, password: string): Promise<User> => {
		// 构建API请求参数
		const loginRequest: AdminLoginRequest = {
			data: {
				username,
				password,
			},
		};

		try {
			// 调用登录API
			const response = await authAPI.adminLogin(loginRequest);

			// 检查响应状态 - API返回格式为 { code: 200, data: {...} }
			if (!response.data || response.code !== 200) {
				throw new Error(response.message || "登录失败");
			}

			// 将API响应转换为本地User类型
			const user = mapApiUserToLocalUser(response.data.admin);

			// 保存token到localStorage
			localStorage.setItem("authToken", response.data.token);

			return user;
		} catch (error) {
			// 如果是网络错误或API错误，抛出对应的错误信息
			if (error instanceof Error) {
				throw error;
			}
			throw new Error("网络连接失败，请检查网络后重试");
		}
	};

	/**
	 * 处理表单提交
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		// 显示登录中提示
		const loadingToast = toast.loading("正在登录中...", {
			style: {
				borderRadius: "8px",
				background: "#333",
				color: "#fff",
			},
		});

		try {
			// 基础表单验证
			if (!username.trim()) {
				throw new Error("请输入登录账号");
			}
			if (!password.trim()) {
				throw new Error("请输入密码");
			}

			// 模拟登录请求延迟
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 用户认证
			const authenticatedUser: User = await authenticateUser(username.trim(), password);

			// 保存用户信息到本地存储
			localStorage.setItem("user", JSON.stringify(authenticatedUser));
			localStorage.setItem("isLoggedIn", "true");
			localStorage.setItem("userPermissions", JSON.stringify(authenticatedUser.permissions));

			// 显示登录成功提示
			toast.success(`欢迎回来，${authenticatedUser.nickname}！`, {
				id: loadingToast,
				duration: 2000,
				style: {
					borderRadius: "8px",
					background: "#10B981",
					color: "#fff",
				},
			});

			// 延迟跳转，让用户看到成功提示
			setTimeout(() => {
				router.push("/dashboard");
			}, 500);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "登录失败，请重试";

			// 显示错误提示
			toast.error(errorMessage, {
				id: loadingToast,
				duration: 4000,
				style: {
					borderRadius: "8px",
					background: "#EF4444",
					color: "#fff",
				},
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
			<div className='bg-white rounded-2xl shadow-xl w-full max-w-md p-8'>
				{/* 标题区域 */}
				<div className='text-center mb-8'>
					<h1 className='text-3xl font-bold text-gray-900 mb-2'>Jobbit 管理后台</h1>
					<p className='text-gray-600'>{selectedIdentity ? `${IDENTITY_CONFIG[selectedIdentity].label}登录` : "请选择您的身份"}</p>
				</div>

				{/* 身份选择阶段 */}
				{!selectedIdentity && (
					<div className='space-y-4'>
						<h2 className='text-lg font-semibold text-gray-900 text-center mb-6'>选择登录身份</h2>
						{Object.entries(IDENTITY_CONFIG).map(([key, config]) => (
							<button
								key={key}
								onClick={() => handleIdentitySelect(key as IdentityType)}
								className='w-full p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 text-left group'
							>
								<div className='flex items-center space-x-4'>
									<div className='text-3xl group-hover:scale-110 transition-transform duration-200'>{config.icon}</div>
									<div>
										<h3 className='font-semibold text-gray-900 group-hover:text-indigo-600'>{config.label}</h3>
										<p className='text-sm text-gray-600'>{config.description}</p>
									</div>
								</div>
							</button>
						))}
					</div>
				)}

				{/* 登录表单阶段 */}
				{selectedIdentity && (
					<form
						onSubmit={handleSubmit}
						className='space-y-6'
					>
						{/* 返回按钮 */}
						<button
							type='button'
							onClick={handleBackToIdentity}
							className='flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-4'
						>
							<svg
								className='w-4 h-4 mr-1'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M15 19l-7-7 7-7'
								/>
							</svg>
							重新选择身份
						</button>

						{/* 身份信息显示 */}
						<div className='bg-indigo-50 rounded-lg p-4 mb-6'>
							<div className='flex items-center space-x-3'>
								<span className='text-2xl'>{IDENTITY_CONFIG[selectedIdentity].icon}</span>
								<div>
									<h3 className='font-semibold text-indigo-900'>{IDENTITY_CONFIG[selectedIdentity].label}</h3>
									<p className='text-sm text-indigo-700'>{IDENTITY_CONFIG[selectedIdentity].description}</p>
								</div>
							</div>
						</div>

						{/* 账号输入 */}
						<div>
							<label
								htmlFor='username'
								className='block text-sm font-medium text-gray-700 mb-2'
							>
								输入账号
							</label>
							<input
								id='username'
								type='text'
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500'
								placeholder='请输入您的账号'
								disabled={isLoading}
							/>
							<p className='text-xs text-gray-500 mt-1'>请联系管理员获取您的登录账号</p>
						</div>

						{/* 密码输入框 */}
						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium text-gray-700 mb-2'
							>
								密码
							</label>
							<input
								id='password'
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500'
								placeholder='请输入密码（任意6位以上）'
								disabled={isLoading}
							/>
						</div>

						{/* 登录按钮 */}
						<button
							type='submit'
							disabled={isLoading || !username}
							className='w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center'
						>
							{isLoading ? (
								<>
									<svg
										className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
										fill='none'
										viewBox='0 0 24 24'
									>
										<circle
											className='opacity-25'
											cx='12'
											cy='12'
											r='10'
											stroke='currentColor'
											strokeWidth='4'
										></circle>
										<path
											className='opacity-75'
											fill='currentColor'
											d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
										></path>
									</svg>
									登录中...
								</>
							) : (
								`登录 ${IDENTITY_CONFIG[selectedIdentity].label}`
							)}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
