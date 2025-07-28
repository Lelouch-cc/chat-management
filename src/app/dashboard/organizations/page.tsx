"use client";

import { useState, useEffect } from "react";
import { organizationAPI } from "@/services";
import type { Organization, CreateOrganizationRequest } from "@/types/organization";
import { useAuth } from "@/hooks/useAuth";
import { PermissionModule, PermissionAction } from "@/types/user";
import toast from "react-hot-toast";

export default function OrganizationsPage() {
	const { hasPermission } = useAuth();
	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [currentOffset, setCurrentOffset] = useState<string>("0");
	const [hasMore, setHasMore] = useState(false);

	// 表单状态
	const [formData, setFormData] = useState({
		name: "",
		icon: "",
		desc: "",
		email: "",
		password: "",
	});

	// 图片上传状态
	const [iconFile, setIconFile] = useState<File | null>(null);
	const [iconPreview, setIconPreview] = useState<string>("");

	// 检查权限
	const canManageOrganizations = hasPermission(PermissionModule.USERS, PermissionAction.MANAGE);

	// 获取公司列表
	const fetchOrganizations = async (offset: string = "0", append: boolean = false) => {
		setIsLoading(true);
		try {
			const response = await organizationAPI.getOrganizations({ offset });
			if (response.code === 200 && response.data) {
				const newOrganizations = response.data.items || [];

				if (append) {
					// 追加数据（加载更多）
					setOrganizations((prev) => [...prev, ...newOrganizations]);
				} else {
					// 替换数据（首次加载或刷新）
					setOrganizations(newOrganizations);
				}

				// 更新分页状态
				setCurrentOffset(response.data.offset);
				setHasMore(response.data.has_more === 1);
			}
		} catch (error) {
			console.error("获取公司列表失败:", error);
			toast.error("获取公司列表失败");
		} finally {
			setIsLoading(false);
		}
	};

	// 加载更多公司
	const loadMoreOrganizations = async () => {
		if (hasMore && !isLoading) {
			await fetchOrganizations(currentOffset, true);
		}
	};

	// 处理图片上传
	const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// 检查文件类型
		if (!file.type.startsWith("image/")) {
			toast.error("请选择图片文件");
			return;
		}

		// 检查文件大小 (限制为 2MB)
		if (file.size > 2 * 1024 * 1024) {
			toast.error("图片文件大小不能超过 2MB");
			return;
		}

		setIconFile(file);

		// 创建预览
		const reader = new FileReader();
		reader.onload = (event) => {
			const result = event.target?.result as string;
			setIconPreview(result);
			// 更新表单数据，将base64数据存储到icon字段
			setFormData((prev) => ({ ...prev, icon: result }));
		};
		reader.readAsDataURL(file);
	};

	// 清除图片
	const clearIcon = () => {
		setIconFile(null);
		setIconPreview("");
		setFormData((prev) => ({ ...prev, icon: "" }));
	};

	// 创建公司
	const handleCreateOrganization = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!canManageOrganizations) {
			toast.error("您没有创建公司的权限");
			return;
		}

		setIsLoading(true);
		try {
			const request: CreateOrganizationRequest = {
				data: formData,
			};

			const response = await organizationAPI.createOrganization(request);

			if (response.code === 200 && response.data) {
				toast.success("公司创建成功！");
				setShowCreateModal(false);
				setFormData({
					name: "",
					icon: "",
					desc: "",
					email: "",
					password: "",
				});
				// 清理图片状态
				setIconFile(null);
				setIconPreview("");
				// 刷新列表
				fetchOrganizations("0", false);
			} else {
				throw new Error("创建失败");
			}
		} catch (error) {
			console.error("创建公司失败:", error);
			toast.error("创建公司失败，请重试");
		} finally {
			setIsLoading(false);
		}
	};

	// 格式化时间
	const formatTimestamp = (timestamp: string) => {
		return new Date(parseInt(timestamp)).toLocaleString("zh-CN");
	};

	useEffect(() => {
		if (canManageOrganizations) {
			fetchOrganizations("0", false);
		}
	}, [canManageOrganizations]);

	if (!canManageOrganizations) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='text-6xl mb-4'>🔒</div>
					<h1 className='text-2xl font-bold text-gray-900 mb-2'>访问受限</h1>
					<p className='text-gray-600'>您没有访问公司管理页面的权限</p>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* 页面标题 */}
				<div className='mb-8'>
					<div className='flex items-center justify-between'>
						<div>
							<h1 className='text-3xl font-bold text-gray-900'>公司管理</h1>
							<p className='mt-2 text-gray-600'>管理系统中的所有公司组织</p>
						</div>
						<button
							onClick={() => setShowCreateModal(true)}
							className='bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2'
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
									d='M12 6v6m0 0v6m0-6h6m-6 0H6'
								/>
							</svg>
							<span>创建公司</span>
						</button>
					</div>
				</div>

				{/* 公司列表 */}
				<div className='bg-white rounded-lg shadow'>
					<div className='px-6 py-4 border-b border-gray-200'>
						<div className='flex items-center justify-between'>
							<div>
								<h2 className='text-lg font-semibold text-gray-900'>公司列表</h2>
								{organizations.length > 0 && (
									<p className='text-sm text-gray-600 mt-1'>
										已显示 {organizations.length} 个公司 {hasMore && "· 还有更多"}
									</p>
								)}
							</div>
							<button
								onClick={() => fetchOrganizations("0", false)}
								disabled={isLoading}
								className='inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50'
							>
								<svg
									className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
									/>
								</svg>
								刷新
							</button>
						</div>
					</div>

					{isLoading ? (
						<div className='p-12 text-center'>
							<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto'></div>
							<p className='mt-4 text-gray-600'>加载中...</p>
						</div>
					) : organizations.length === 0 ? (
						<div className='p-12 text-center'>
							<div className='text-4xl mb-4'>🏢</div>
							<h3 className='text-lg font-semibold text-gray-900 mb-2'>暂无公司</h3>
							<p className='text-gray-600'>点击上方按钮创建第一个公司</p>
						</div>
					) : (
						<div className='overflow-hidden'>
							<table className='min-w-full divide-y divide-gray-200'>
								<thead className='bg-gray-50'>
									<tr>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>公司信息</th>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>描述</th>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>创建时间</th>
										<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>操作</th>
									</tr>
								</thead>
								<tbody className='bg-white divide-y divide-gray-200'>
									{organizations.map((org) => (
										<tr
											key={org.id}
											className='hover:bg-gray-50'
										>
											<td className='px-6 py-4 whitespace-nowrap'>
												<div className='flex items-center'>
													<div className='w-12 h-12 mr-3 flex items-center justify-center'>
														{org.icon ? (
															org.icon.startsWith("data:image") ? (
																<img
																	src={org.icon}
																	alt={org.name}
																	className='w-10 h-10 rounded-lg object-cover'
																/>
															) : (
																<div className='text-2xl'>{org.icon}</div>
															)
														) : (
															<div className='text-2xl'>🏢</div>
														)}
													</div>
													<div>
														<div className='text-sm font-medium text-gray-900'>{org.name}</div>
														<div className='text-sm text-gray-500'>ID: {org.id.substring(0, 8)}...</div>
													</div>
												</div>
											</td>
											<td className='px-6 py-4'>
												<div className='text-sm text-gray-900'>{org.desc}</div>
											</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{formatTimestamp(org.create_ts)}</td>
											<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
												<button className='text-indigo-600 hover:text-indigo-900 mr-4'>编辑</button>
												<button className='text-red-600 hover:text-red-900'>删除</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>

							{/* 加载更多按钮 */}
							{hasMore && (
								<div className='px-6 py-4 border-t border-gray-200 text-center'>
									<button
										onClick={loadMoreOrganizations}
										disabled={isLoading}
										className='inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50'
									>
										{isLoading ? (
											<>
												<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2'></div>
												加载中...
											</>
										) : (
											<>
												<svg
													className='w-4 h-4 mr-2'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M19 9l-7 7-7-7'
													/>
												</svg>
												加载更多
											</>
										)}
									</button>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* 创建公司弹窗 */}
			{showCreateModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
					<div className='bg-white rounded-lg max-w-md w-full p-6'>
						<div className='flex items-center justify-between mb-4'>
							<h3 className='text-lg font-semibold text-gray-900'>创建新公司</h3>
							<button
								onClick={() => {
									setShowCreateModal(false);
									// 清理表单和图片状态
									setFormData({
										name: "",
										icon: "",
										desc: "",
										email: "",
										password: "",
									});
									setIconFile(null);
									setIconPreview("");
								}}
								className='text-gray-400 hover:text-gray-600'
							>
								<svg
									className='w-6 h-6'
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

						<form
							onSubmit={handleCreateOrganization}
							className='space-y-4'
						>
							<div>
								<label className='block text-sm font-medium text-gray-900 mb-1'>公司名称 *</label>
								<input
									type='text'
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-600'
									placeholder='请输入公司名称'
									required
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-900 mb-2'>公司图标</label>
								<div className='space-y-3'>
									{/* 图片预览 */}
									{iconPreview && (
										<div className='flex items-center space-x-3'>
											<img
												src={iconPreview}
												alt='预览'
												className='w-16 h-16 rounded-lg object-cover border border-gray-200'
											/>
											<button
												type='button'
												onClick={clearIcon}
												className='text-red-600 hover:text-red-700 text-sm'
											>
												删除图片
											</button>
										</div>
									)}

									{/* 上传按钮 */}
									<div className='flex items-center space-x-3'>
										<label className='cursor-pointer'>
											<input
												type='file'
												accept='image/*'
												onChange={handleIconUpload}
												className='hidden'
											/>
											<div className='flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200'>
												<svg
													className='w-4 h-4 text-gray-500'
													fill='none'
													stroke='currentColor'
													viewBox='0 0 24 24'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														strokeWidth={2}
														d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
													/>
												</svg>
												<span className='text-sm text-gray-700'>{iconPreview ? "更换图片" : "选择图片"}</span>
											</div>
										</label>
									</div>

									<p className='text-xs text-gray-700'>支持 JPG、PNG、GIF 格式，文件大小不超过 2MB</p>
								</div>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-900 mb-1'>公司描述 *</label>
								<textarea
									value={formData.desc}
									onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-600'
									placeholder='请输入公司描述'
									rows={3}
									required
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-900 mb-1'>邮箱 *</label>
								<input
									type='email'
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-600'
									placeholder='请输入邮箱地址'
									required
								/>
							</div>

							<div>
								<label className='block text-sm font-medium text-gray-900 mb-1'>密码 *</label>
								<input
									type='password'
									value={formData.password}
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-600'
									placeholder='请输入密码'
									required
								/>
							</div>

							<div className='flex space-x-3 pt-4'>
								<button
									type='button'
									onClick={() => {
										setShowCreateModal(false);
										// 清理表单和图片状态
										setFormData({
											name: "",
											icon: "",
											desc: "",
											email: "",
											password: "",
										});
										setIconFile(null);
										setIconPreview("");
									}}
									className='flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors duration-200'
									disabled={isLoading}
								>
									取消
								</button>
								<button
									type='submit'
									className='flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50'
									disabled={isLoading}
								>
									{isLoading ? "创建中..." : "创建"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
