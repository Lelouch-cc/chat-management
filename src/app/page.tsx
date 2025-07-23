"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();

	useEffect(() => {
		/**
		 * 检查用户登录状态并自动重定向
		 * - 已登录：跳转到管理后台主页
		 * - 未登录：跳转到登录页面
		 */
		const checkAuthAndRedirect = () => {
			try {
				const isLoggedIn = localStorage.getItem("isLoggedIn");
				const userStr = localStorage.getItem("user");

				if (isLoggedIn && userStr) {
					// 验证用户数据是否有效
					const user = JSON.parse(userStr);
					if (user && user.username) {
						// 已登录且数据有效，跳转到管理后台主页
						router.replace("/dashboard");
						return;
					}
				}

				// 未登录或数据无效，跳转到登录页面
				router.replace("/login");
			} catch (error) {
				console.error("检查登录状态失败:", error);
				// 发生错误时，清除可能损坏的数据并跳转到登录页面
				localStorage.removeItem("isLoggedIn");
				localStorage.removeItem("user");
				router.replace("/login");
			}
		};

		checkAuthAndRedirect();
	}, [router]);

	// 显示加载状态，防止页面闪烁
	return (
		<div className='min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center'>
			<div className='text-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4'></div>
				<p className='text-gray-600'>正在加载管理后台...</p>
			</div>
		</div>
	);
}
