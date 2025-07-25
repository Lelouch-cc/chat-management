"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, UserRole, UserStatus, Gender, ROLE_PERMISSIONS } from "@/types/user";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	// 模拟用户数据库（实际项目中这些数据应该在后端）
	const mockUsers: User[] = [
		{
			id: 1,
			username: "admin",
			nickname: "系统管理员",
			handle: 10001,
			gender: Gender.MALE,
			birthday: "1990-01-01",
			email: "admin@jobbit.com",
			phone: "13800138000",
			avatar: "🔧",
			role: UserRole.SUPER_ADMIN,
			permissions: ROLE_PERMISSIONS[UserRole.SUPER_ADMIN],
			status: UserStatus.ACTIVE,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-15T12:00:00Z",
			lastLoginAt: "2024-01-15T10:30:00Z",
		},
		{
			id: 2,
			username: "hr_manager",
			nickname: "张经理",
			handle: 10002,
			gender: Gender.FEMALE,
			birthday: "1985-06-15",
			email: "zhang@jobbit.com",
			phone: "13800138001",
			avatar: "👩",
			role: UserRole.HR_MANAGER,
			permissions: ROLE_PERMISSIONS[UserRole.HR_MANAGER],
			status: UserStatus.ACTIVE,
			createdAt: "2024-01-02T00:00:00Z",
			updatedAt: "2024-01-15T11:00:00Z",
			lastLoginAt: "2024-01-15T09:45:00Z",
		},
		{
			id: 3,
			username: "hr_staff_001",
			nickname: "李专员",
			handle: 10003,
			gender: Gender.MALE,
			birthday: "1992-03-20",
			email: "li@jobbit.com",
			phone: "13800138002",
			avatar: "👨",
			role: UserRole.HR_SPECIALIST,
			permissions: ROLE_PERMISSIONS[UserRole.HR_SPECIALIST],
			status: UserStatus.ACTIVE,
			createdAt: "2024-01-03T00:00:00Z",
			updatedAt: "2024-01-15T08:30:00Z",
			lastLoginAt: "2024-01-15T08:15:00Z",
		},
		{
			id: 4,
			username: "viewer_001",
			nickname: "王查看员",
			handle: 10004,
			gender: Gender.FEMALE,
			birthday: "1995-12-10",
			email: "wang@jobbit.com",
			avatar: "👩",
			role: UserRole.VIEWER,
			permissions: ROLE_PERMISSIONS[UserRole.VIEWER],
			status: UserStatus.INACTIVE,
			createdAt: "2024-01-04T00:00:00Z",
			updatedAt: "2024-01-10T15:20:00Z",
		},
	];

	/**
	 * 用户认证函数
	 */
	const authenticateUser = (username: string, password: string): User | null => {
		// 查找用户
		const user = mockUsers.find((u) => u.username === username);

		if (!user) {
			return null;
		}

		// 检查用户状态
		if (user.status !== UserStatus.ACTIVE) {
			throw new Error("账号已被禁用，请联系管理员");
		}

		// 验证密码（实际项目中应该使用哈希验证）
		// 这里为了演示，任何6位以上的密码都可以登录
		if (!password || password.length < 6) {
			throw new Error("密码不正确");
		}

		// 更新最后登录时间
		const updatedUser = {
			...user,
			lastLoginAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		return updatedUser;
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
				throw new Error("请输入用户名");
			}
			if (!password.trim()) {
				throw new Error("请输入密码");
			}

			// 模拟登录请求延迟
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 用户认证
			const authenticatedUser = authenticateUser(username.trim(), password);

			if (!authenticatedUser) {
				throw new Error("用户名不存在");
			}

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
					<p className='text-gray-600'>欢迎登录管理系统</p>
				</div>

				{/* 登录表单 */}
				<form
					onSubmit={handleSubmit}
					className='space-y-6'
				>
					{/* 用户名输入框 */}
					<div>
						<label
							htmlFor='username'
							className='block text-sm font-medium text-gray-700 mb-2'
						>
							用户名
						</label>
						<input
							id='username'
							type='text'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500'
							placeholder='请输入用户名'
							disabled={isLoading}
						/>
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
							placeholder='请输入密码'
							disabled={isLoading}
						/>
					</div>

					{/* 登录按钮 */}
					<button
						type='submit'
						disabled={isLoading}
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
							"登录管理后台"
						)}
					</button>
				</form>
			</div>
		</div>
	);
}
