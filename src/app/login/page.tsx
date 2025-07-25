"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Form, Button, Card, Typography, Avatar } from "@douyinfe/semi-ui";
import { IconUser, IconLock } from "@douyinfe/semi-icons";
import toast from "react-hot-toast";
import { User, UserRole, UserStatus, Gender, ROLE_PERMISSIONS } from "@/types/user";

const { Title, Text } = Typography;

interface LoginFormValues {
	username: string;
	password: string;
}

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const formRef = useRef<any>(null);

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
	const handleSubmit = async (values: LoginFormValues) => {
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
			const { username, password } = values;

			// 基础表单验证
			if (!username?.trim()) {
				throw new Error("请输入用户名");
			}
			if (!password?.trim()) {
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
		<>
			<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
				<Card
					className='w-full max-w-xl'
					bordered={false}
					shadows='hover'
					style={{
						backgroundColor: "rgba(255, 255, 255, 0.95)",
						backdropFilter: "blur(10px)",
						borderRadius: "16px",
						padding: "40px",
					}}
				>
					{/* 标题区域 */}
					<div className='text-center mb-10'>
						<Avatar
							size='large'
							style={{
								backgroundColor: "var(--semi-color-primary)",
								marginBottom: "16px",
							}}
						>
							💼
						</Avatar>
						<Title
							heading={2}
							style={{ margin: "8px 0", color: "var(--semi-color-text-0)" }}
						>
							Jobbit 管理后台
						</Title>
						<Text type='secondary'>欢迎登录管理系统</Text>
					</div>

					{/* 登录表单 */}
					<Form
						ref={formRef}
						onSubmit={handleSubmit}
						style={{ marginBottom: "32px" }}
					>
						<Form.Input
							field='username'
							label='用户名'
							prefix={<IconUser style={{ margin: "0 8px" }} />}
							placeholder='请输入用户名'
							size='large'
							disabled={isLoading}
							rules={[{ required: true, message: "请输入用户名" }]}
							style={{
								marginBottom: "20px",
								width: "100%",
								height: "56px",
							}}
						/>

						<Form.Input
							field='password'
							label='密码'
							type='password'
							prefix={<IconLock style={{ margin: "0 8px" }} />}
							placeholder='请输入密码'
							size='large'
							disabled={isLoading}
							rules={[
								{ required: true, message: "请输入密码" },
								{ min: 6, message: "密码至少6位字符" },
							]}
							style={{
								marginBottom: "28px",
								width: "100%",
								height: "56px",
							}}
						/>

						<Button
							htmlType='submit'
							type='primary'
							theme='solid'
							size='large'
							loading={isLoading}
							block
							style={{
								height: "52px",
								fontSize: "16px",
								fontWeight: "600",
								width: "100%",
								borderRadius: "8px",
							}}
						>
							{isLoading ? "登录中..." : "登录管理后台"}
						</Button>
					</Form>
				</Card>
			</div>
		</>
	);
}
