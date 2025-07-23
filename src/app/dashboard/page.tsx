"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
	const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);

	/**
	 * 获取当前用户信息
	 */
	useEffect(() => {
		try {
			const userStr = localStorage.getItem("user");
			if (userStr) {
				const user = JSON.parse(userStr);
				setCurrentUser(user);
			}
		} catch (error) {
			console.error("解析用户信息失败:", error);
		}
	}, []);

	// 模拟统计数据
	const stats = [
		{
			name: "活跃职位",
			value: "24",
			change: "+12%",
			changeType: "increase",
			icon: "💼",
			description: "本月新增职位",
		},
		{
			name: "求职申请",
			value: "142",
			change: "+18%",
			changeType: "increase",
			icon: "📝",
			description: "待处理申请",
		},
		{
			name: "沟通消息",
			value: "89",
			change: "+5%",
			changeType: "increase",
			icon: "💬",
			description: "今日消息数",
		},
		{
			name: "在线申请者",
			value: "8",
			change: "0%",
			changeType: "neutral",
			icon: "👥",
			description: "当前在线",
		},
	];

	// 快捷操作
	const quickActions = [
		{
			name: "发布新职位",
			description: "创建新的职位招聘信息",
			href: "/dashboard/jobs",
			icon: "➕",
			color: "bg-blue-500 hover:bg-blue-600",
		},
		{
			name: "查看申请",
			description: "处理求职者申请",
			href: "/dashboard/applications",
			icon: "📋",
			color: "bg-green-500 hover:bg-green-600",
		},
		{
			name: "申请者沟通",
			description: "与申请者在线交流",
			href: "/dashboard/chat",
			icon: "💬",
			color: "bg-purple-500 hover:bg-purple-600",
		},
		{
			name: "用户管理",
			description: "管理系统用户",
			href: "/dashboard/users",
			icon: "👥",
			color: "bg-orange-500 hover:bg-orange-600",
		},
	];

	// 最近活动（模拟数据）
	const recentActivities = [
		{
			id: 1,
			action: "发布了新职位",
			subject: "高级前端工程师",
			time: "2分钟前",
			user: "管理员",
			type: "job",
		},
		{
			id: 2,
			action: "收到新申请",
			subject: "React 开发工程师",
			time: "15分钟前",
			user: "张三",
			type: "application",
		},
		{
			id: 3,
			action: "申请者消息",
			subject: "面试时间确认",
			time: "1小时前",
			user: "李四",
			type: "message",
		},
		{
			id: 4,
			action: "更新职位状态",
			subject: "UI设计师",
			time: "2小时前",
			user: "管理员",
			type: "update",
		},
	];

	return (
		<div className='h-full overflow-y-auto'>
			<div className='p-6 max-w-7xl mx-auto'>
				{/* 欢迎信息 */}
				<div className='mb-8'>
					<h2 className='text-2xl font-bold text-gray-900 mb-2'>欢迎回来，{currentUser?.username || "管理员"}！</h2>
					<p className='text-gray-600'>这里是您的管理后台概览，您可以查看最新的数据统计和快速执行各种操作。</p>
				</div>

				{/* 统计卡片 */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
					{stats.map((stat) => (
						<div
							key={stat.name}
							className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
						>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-sm font-medium text-gray-600'>{stat.name}</p>
									<p className='text-3xl font-bold text-gray-900 mt-2'>{stat.value}</p>
								</div>
								<div className='text-3xl'>{stat.icon}</div>
							</div>
							<div className='flex items-center justify-between mt-4'>
								<span
									className={`text-sm font-medium ${
										stat.changeType === "increase" ? "text-green-600" : stat.changeType === "decrease" ? "text-red-600" : "text-gray-500"
									}`}
								>
									{stat.change}
								</span>
								<span className='text-xs text-gray-500'>{stat.description}</span>
							</div>
						</div>
					))}
				</div>

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* 快捷操作 */}
					<div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>快捷操作</h3>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
							{quickActions.map((action) => (
								<Link
									key={action.name}
									href={action.href}
									className='group'
								>
									<div className='p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md'>
										<div className='flex items-center space-x-3'>
											<div
												className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white text-lg transition-colors`}
											>
												{action.icon}
											</div>
											<div className='flex-1'>
												<p className='font-medium text-gray-900 group-hover:text-indigo-600 transition-colors'>{action.name}</p>
												<p className='text-sm text-gray-500 mt-1'>{action.description}</p>
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>
					</div>

					{/* 最近活动 */}
					<div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>最近活动</h3>
						<div className='space-y-4'>
							{recentActivities.map((activity) => (
								<div
									key={activity.id}
									className='flex items-start space-x-3'
								>
									<div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
										<span className='text-sm'>
											{activity.type === "job" && "💼"}
											{activity.type === "application" && "📝"}
											{activity.type === "message" && "💬"}
											{activity.type === "update" && "🔄"}
										</span>
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm text-gray-900'>
											<span className='font-medium'>{activity.user}</span> {activity.action}{" "}
											<span className='font-medium text-indigo-600'>{activity.subject}</span>
										</p>
										<p className='text-xs text-gray-500 mt-1'>{activity.time}</p>
									</div>
								</div>
							))}
						</div>
						<div className='mt-4 pt-4 border-t border-gray-100'>
							<Link
								href='/dashboard/activities'
								className='text-sm text-indigo-600 hover:text-indigo-500 font-medium'
							>
								查看所有活动 →
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
