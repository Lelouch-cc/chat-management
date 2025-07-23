"use client";

import { useState } from "react";

// 职位类型定义
interface Job {
	id: number;
	title: string;
	company: string;
	location: string;
	type: string;
	salary: string;
	description: string;
	requirements: string[];
	status: "active" | "paused" | "closed";
	publishDate: string;
	applicants: number;
}

export default function JobsPage() {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [editingJob, setEditingJob] = useState<Job | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// 模拟职位数据
	const [jobs, setJobs] = useState<Job[]>([
		{
			id: 1,
			title: "高级前端工程师",
			company: "Jobbit 科技",
			location: "北京",
			type: "全职",
			salary: "25K-35K",
			description: "负责公司前端产品的开发和维护，参与产品架构设计。",
			requirements: ["React/Vue 3年以上经验", "TypeScript 熟练", "有大型项目经验"],
			status: "active",
			publishDate: "2024-01-15",
			applicants: 24,
		},
		{
			id: 2,
			title: "UI/UX 设计师",
			company: "Jobbit 科技",
			location: "上海",
			type: "全职",
			salary: "18K-25K",
			description: "负责产品界面设计和用户体验优化，与产品团队密切合作。",
			requirements: ["Figma/Sketch 熟练", "有移动端设计经验", "良好的审美能力"],
			status: "active",
			publishDate: "2024-01-12",
			applicants: 18,
		},
		{
			id: 3,
			title: "Java 后端工程师",
			company: "Jobbit 科技",
			location: "深圳",
			type: "全职",
			salary: "20K-30K",
			description: "负责后端服务开发，数据库设计和优化，API 接口开发。",
			requirements: ["Java 5年以上经验", "Spring Boot 熟练", "MySQL 调优经验"],
			status: "paused",
			publishDate: "2024-01-10",
			applicants: 12,
		},
	]);

	/**
	 * 过滤职位列表
	 */
	const filteredJobs = jobs.filter((job) => {
		const matchesSearch =
			job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = statusFilter === "all" || job.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	/**
	 * 获取状态显示样式
	 */
	const getStatusStyle = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800";
			case "paused":
				return "bg-yellow-100 text-yellow-800";
			case "closed":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	/**
	 * 获取状态文本
	 */
	const getStatusText = (status: string) => {
		switch (status) {
			case "active":
				return "招聘中";
			case "paused":
				return "已暂停";
			case "closed":
				return "已关闭";
			default:
				return "未知";
		}
	};

	/**
	 * 删除职位
	 */
	const handleDeleteJob = (jobId: number) => {
		if (confirm("确定要删除这个职位吗？")) {
			setJobs(jobs.filter((job) => job.id !== jobId));
		}
	};

	/**
	 * 更新职位状态
	 */
	const handleStatusChange = (jobId: number, newStatus: Job["status"]) => {
		setJobs(jobs.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job)));
	};

	return (
		<div className='h-full overflow-y-auto'>
			<div className='p-6 max-w-7xl mx-auto'>
				{/* 页面头部 */}
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8'>
					<div>
						<h2 className='text-2xl font-bold text-gray-900 mb-2'>职位管理</h2>
						<p className='text-gray-600'>管理和发布职位信息，跟踪招聘进度</p>
					</div>
					<button
						onClick={() => setShowCreateModal(true)}
						className='mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2'
					>
						<span>➕</span>
						<span>发布新职位</span>
					</button>
				</div>

				{/* 搜索和筛选 */}
				<div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6'>
					<div className='flex flex-col sm:flex-row gap-4'>
						{/* 搜索框 */}
						<div className='flex-1'>
							<input
								type='text'
								placeholder='搜索职位标题或公司名称...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500 text-sm'
							/>
						</div>

						{/* 状态筛选 */}
						<div className='sm:w-48'>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 text-sm bg-white'
							>
								<option
									value='all'
									className='text-gray-900'
								>
									所有状态
								</option>
								<option
									value='active'
									className='text-gray-900'
								>
									招聘中
								</option>
								<option
									value='paused'
									className='text-gray-900'
								>
									已暂停
								</option>
								<option
									value='closed'
									className='text-gray-900'
								>
									已关闭
								</option>
							</select>
						</div>
					</div>
				</div>

				{/* 职位统计 */}
				<div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
					<div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>总职位数</p>
								<p className='text-2xl font-bold text-gray-900 mt-1'>{jobs.length}</p>
							</div>
							<div className='text-2xl'>💼</div>
						</div>
					</div>

					<div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>招聘中</p>
								<p className='text-2xl font-bold text-green-600 mt-1'>{jobs.filter((job) => job.status === "active").length}</p>
							</div>
							<div className='text-2xl'>🟢</div>
						</div>
					</div>

					<div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>总申请数</p>
								<p className='text-2xl font-bold text-blue-600 mt-1'>{jobs.reduce((sum, job) => sum + job.applicants, 0)}</p>
							</div>
							<div className='text-2xl'>📝</div>
						</div>
					</div>

					<div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm font-medium text-gray-600'>平均申请</p>
								<p className='text-2xl font-bold text-purple-600 mt-1'>
									{Math.round(jobs.reduce((sum, job) => sum + job.applicants, 0) / jobs.length)}
								</p>
							</div>
							<div className='text-2xl'>📊</div>
						</div>
					</div>
				</div>

				{/* 职位列表 */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-100'>
					<div className='p-6 border-b border-gray-200'>
						<h3 className='text-lg font-semibold text-gray-900'>职位列表 ({filteredJobs.length})</h3>
					</div>

					<div className='divide-y divide-gray-200'>
						{filteredJobs.map((job) => (
							<div
								key={job.id}
								className='p-6 hover:bg-gray-50 transition-colors'
							>
								<div className='flex items-start justify-between'>
									<div className='flex-1'>
										<div className='flex items-center space-x-3 mb-2'>
											<h4 className='text-lg font-semibold text-gray-900'>{job.title}</h4>
											<span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(job.status)}`}>
												{getStatusText(job.status)}
											</span>
										</div>

										<div className='flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3'>
											<span className='flex items-center space-x-1'>
												<span>🏢</span>
												<span>{job.company}</span>
											</span>
											<span className='flex items-center space-x-1'>
												<span>📍</span>
												<span>{job.location}</span>
											</span>
											<span className='flex items-center space-x-1'>
												<span>💰</span>
												<span>{job.salary}</span>
											</span>
											<span className='flex items-center space-x-1'>
												<span>👥</span>
												<span>{job.applicants} 人申请</span>
											</span>
										</div>

										<p className='text-gray-700 mb-3 line-clamp-2'>{job.description}</p>

										<div className='flex flex-wrap gap-2'>
											{job.requirements.slice(0, 3).map((req, index) => (
												<span
													key={index}
													className='px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded'
												>
													{req}
												</span>
											))}
											{job.requirements.length > 3 && (
												<span className='px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded'>+{job.requirements.length - 3} 更多</span>
											)}
										</div>
									</div>

									{/* 操作按钮 */}
									<div className='flex items-center space-x-2 ml-4'>
										<select
											value={job.status}
											onChange={(e) => handleStatusChange(job.id, e.target.value as Job["status"])}
											className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white font-medium'
										>
											<option
												value='active'
												className='text-gray-900'
											>
												招聘中
											</option>
											<option
												value='paused'
												className='text-gray-900'
											>
												暂停
											</option>
											<option
												value='closed'
												className='text-gray-900'
											>
												关闭
											</option>
										</select>

										<button
											onClick={() => setEditingJob(job)}
											className='p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
											title='编辑职位'
										>
											<svg
												className='w-4 h-4'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
												/>
											</svg>
										</button>

										<button
											onClick={() => handleDeleteJob(job.id)}
											className='p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
											title='删除职位'
										>
											<svg
												className='w-4 h-4'
												fill='none'
												stroke='currentColor'
												viewBox='0 0 24 24'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
												/>
											</svg>
										</button>
									</div>
								</div>

								<div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-100'>
									<span className='text-sm text-gray-500'>发布时间：{job.publishDate}</span>
									<button className='text-sm text-indigo-600 hover:text-indigo-500 font-medium'>查看申请者 →</button>
								</div>
							</div>
						))}

						{filteredJobs.length === 0 && (
							<div className='p-12 text-center'>
								<div className='text-4xl mb-4'>📋</div>
								<h3 className='text-lg font-medium text-gray-900 mb-2'>暂无职位</h3>
								<p className='text-gray-500'>{searchTerm || statusFilter !== "all" ? "没有找到匹配的职位" : "还没有发布任何职位"}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* 发布新职位模态框 */}
			{showCreateModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
					<div className='bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
						<div className='p-6 border-b border-gray-200'>
							<h3 className='text-lg font-semibold text-gray-900'>发布新职位</h3>
						</div>
						<div className='p-6'>
							<p className='text-gray-600 mb-4'>职位发布功能正在开发中，敬请期待！</p>
							<div className='flex justify-end space-x-3'>
								<button
									onClick={() => setShowCreateModal(false)}
									className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
								>
									关闭
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
