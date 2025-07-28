"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, PermissionModule, PermissionAction, hasPermission, getRoleText } from "@/types/user";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const pathname = usePathname();
	const router = useRouter();

	/**
	 * 获取当前用户信息
	 */
	useEffect(() => {
		try {
			const userStr = localStorage.getItem("user");
			if (userStr) {
				const user = JSON.parse(userStr) as User;
				// 验证用户数据完整性
				if (user && user.id && user.username && user.nickname) {
					setCurrentUser(user);
				} else {
					console.error("用户数据不完整:", user);
					// 清理无效数据
					localStorage.removeItem("isLoggedIn");
					localStorage.removeItem("user");
					localStorage.removeItem("userPermissions");
					router.push("/login");
				}
			}
		} catch (error) {
			console.error("获取用户信息失败:", error);
			// 如果用户信息损坏，清理并重定向到登录页
			localStorage.removeItem("isLoggedIn");
			localStorage.removeItem("user");
			localStorage.removeItem("userPermissions");
			router.push("/login");
		}
	}, [router]);

	// 检查用户权限的辅助函数
	const canAccess = (module: PermissionModule, action: PermissionAction = PermissionAction.READ): boolean => {
		if (!currentUser || !currentUser.permissions) {
			return false;
		}
		return hasPermission(currentUser.permissions, module, action);
	};

	// 安全获取用户头像或首字母
	const getUserAvatar = (user: User | null): string => {
		if (!user) return "👤";

		// 如果有头像且不是复合emoji，直接使用
		if (user.avatar && user.avatar.length <= 2) {
			return user.avatar;
		}

		// 根据性别和角色生成默认头像
		if (user.role === "super_admin") return "🔧";
		if (user.gender === 1) return "👨"; // 男性
		if (user.gender === 2) return "��"; // 女性

		// 最后降级：使用昵称或用户名首字母
		if (user.nickname && user.nickname.length > 0) {
			return user.nickname.charAt(0).toUpperCase();
		}
		if (user.username && user.username.length > 0) {
			return user.username.charAt(0).toUpperCase();
		}

		return "👤";
	};

	// 安全获取用户昵称
	const getUserDisplayName = (user: User | null): string => {
		if (!user) return "用户";
		return user.nickname || user.username || "用户";
	};

	/**
	 * 导航菜单配置（基于权限过滤）
	 */
	const getNavigation = () => {
		const allNavItems = [
			{
				name: "数据统计",
				href: "/dashboard",
				icon: "📊",
				current: pathname === "/dashboard",
				module: PermissionModule.DASHBOARD,
			},
			{
				name: "职位管理",
				href: "/dashboard/jobs",
				icon: "💼",
				current: pathname === "/dashboard/jobs",
				module: PermissionModule.JOBS,
			},
			{
				name: "申请者沟通",
				href: "/dashboard/chat",
				icon: "💬",
				current: pathname === "/dashboard/chat",
				module: PermissionModule.CHAT,
			},
			{
				name: "用户管理",
				href: "/dashboard/users",
				icon: "👥",
				current: pathname === "/dashboard/users",
				module: PermissionModule.USERS,
			},
			{
				name: "公司管理",
				href: "/dashboard/organizations",
				icon: "🏢",
				current: pathname === "/dashboard/organizations",
				module: PermissionModule.USERS,
			},
			{
				name: "系统设置",
				href: "/dashboard/settings",
				icon: "⚙️",
				current: pathname === "/dashboard/settings",
				module: PermissionModule.SETTINGS,
			},
		];

		// 根据用户权限过滤导航项
		return allNavItems.filter((item) => canAccess(item.module));
	};

	const navigation = getNavigation();

	/**
	 * 退出登录
	 */
	const handleLogout = () => {
		localStorage.removeItem("isLoggedIn");
		localStorage.removeItem("user");
		localStorage.removeItem("userPermissions");
		router.push("/login");
	};

	return (
		<div className='h-screen flex bg-gray-50'>
			{/* 移动端侧边栏遮罩 */}
			{sidebarOpen && (
				<div
					className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* 侧边栏 */}
			<div
				className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className='flex flex-col h-full'>
					{/* Logo区域 */}
					<div className='flex items-center justify-between h-16 px-6 bg-indigo-600 text-white'>
						<div className='flex items-center space-x-2'>
							<div className='text-2xl'>🚀</div>
							<span className='text-xl font-bold'>Jobbit 后台</span>
						</div>
						{/* 移动端关闭按钮 */}
						<button
							onClick={() => setSidebarOpen(false)}
							className='lg:hidden p-1 hover:bg-indigo-700 rounded transition-colors'
						>
							<svg
								className='w-5 h-5'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M6 18L18 6M6 6l12 12'
								/>
							</svg>
						</button>
					</div>

					{/* 导航菜单 */}
					<nav className='flex-1 px-4 py-6 space-y-2'>
						{navigation.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								onClick={() => setSidebarOpen(false)}
								className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
									item.current
										? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700"
										: "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
								}`}
							>
								<span className='text-lg'>{item.icon}</span>
								<span>{item.name}</span>
							</Link>
						))}
					</nav>

					{/* 用户信息和退出按钮 */}
					<div className='p-4 border-t border-gray-200'>
						{currentUser && (
							<div className='flex items-center space-x-3 mb-3'>
								<div className='w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold'>
									{getUserAvatar(currentUser)}
								</div>
								<div className='flex-1 min-w-0'>
									<p className='text-sm font-medium text-gray-900 truncate'>{getUserDisplayName(currentUser)}</p>
									<p className='text-xs text-gray-500'>
										{currentUser.role ? getRoleText(currentUser.role) : "未知角色"} • #{currentUser.handle || "0000"}
									</p>
								</div>
							</div>
						)}
						<button
							onClick={handleLogout}
							className='w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
						>
							<span>🚪</span>
							<span>退出登录</span>
						</button>
					</div>
				</div>
			</div>

			{/* 主内容区域 */}
			<div className='flex-1 flex flex-col min-w-0'>
				{/* 顶部导航栏 */}
				<header className='bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6'>
					<div className='flex items-center space-x-4'>
						{/* 移动端菜单按钮 */}
						<button
							onClick={() => setSidebarOpen(true)}
							className='lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors'
						>
							<svg
								className='w-6 h-6 text-gray-600'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M4 6h16M4 12h16M4 18h16'
								/>
							</svg>
						</button>

						<h1 className='text-xl font-semibold text-gray-900'>{navigation.find((item) => item.current)?.name || "管理后台"}</h1>
					</div>

					{/* 右侧操作区域 */}
					<div className='flex items-center space-x-4'>
						{/* 用户信息 */}
						{currentUser && (
							<div className='hidden sm:flex items-center space-x-3'>
								<div className='text-sm text-gray-600'>欢迎，{getUserDisplayName(currentUser)}</div>
								<div className='w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm'>
									{getUserAvatar(currentUser)}
								</div>
							</div>
						)}

						{/* 日期显示 */}
						<div className='text-sm text-gray-600'>
							{new Date().toLocaleDateString("zh-CN", {
								year: "numeric",
								month: "long",
								day: "numeric",
								weekday: "long",
							})}
						</div>
					</div>
				</header>

				{/* 页面内容 */}
				<main className='flex-1 overflow-hidden'>{children}</main>
			</div>
		</div>
	);
}
