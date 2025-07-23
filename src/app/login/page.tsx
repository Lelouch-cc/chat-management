"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	/**
	 * 处理表单提交
	 * 验证用户输入并执行登录逻辑
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		try {
			// 基础表单验证
			if (!username.trim()) {
				throw new Error("请输入用户名");
			}
			if (!password.trim()) {
				throw new Error("请输入密码");
			}
			if (password.length < 6) {
				throw new Error("密码长度至少6位");
			}

			// 模拟登录请求（实际项目中这里会调用API）
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 保存用户信息到本地存储
			localStorage.setItem("user", JSON.stringify({ username }));
			localStorage.setItem("isLoggedIn", "true");

			// 登录成功，跳转到管理后台主页
			router.push("/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "登录失败，请重试");
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

				{/* 错误提示 */}
				{error && (
					<div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
						<div className='flex items-center'>
							<div className='text-red-800 text-sm'>⚠️ {error}</div>
						</div>
					</div>
				)}

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
							管理员账号
						</label>
						<input
							id='username'
							type='text'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200'
							placeholder='请输入管理员账号'
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
							className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200'
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

				{/* 底部提示 */}
				<div className='mt-8 text-center'>
					<p className='text-sm text-gray-500'>演示账号：输入任意用户名和密码（6位以上）即可登录</p>
				</div>
			</div>
		</div>
	);
}
