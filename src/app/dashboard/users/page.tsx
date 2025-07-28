"use client";

import { useState, useEffect } from "react";
import {
	User,
	CreateUserRequest,
	UpdateUserRequest,
	UserRole,
	UserStatus,
	Gender,
	PermissionModule,
	PermissionAction,
	Permission,
	ROLE_PERMISSIONS,
	getRoleText,
	getGenderText,
	getStatusText,
	getStatusStyle,
	hasPermission,
} from "@/types/user";

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showPermissionModal, setShowPermissionModal] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	// 表单状态
	const [formData, setFormData] = useState<CreateUserRequest>({
		username: "",
		nickname: "",
		handle: 0,
		gender: Gender.UNKNOWN,
		birthday: "",
		email: "",
		phone: "",
		password: "",
		role: UserRole.HR_SPECIALIST,
		permissions: [],
	});

	// 初始化空用户列表（实际应该从API获取）
	useEffect(() => {
		// TODO: 调用用户管理API获取用户列表
		setUsers([]);

		// 设置当前用户（从localStorage获取）
		try {
			const userStr = localStorage.getItem("user");
			if (userStr) {
				const userData = JSON.parse(userStr);
				setCurrentUser(userData);
			}
		} catch (error) {
			console.error("获取当前用户信息失败:", error);
		}
	}, []);

	// 过滤用户列表
	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.handle.toString().includes(searchTerm);

		const matchesRole = roleFilter === "all" || user.role === roleFilter;
		const matchesStatus = statusFilter === "all" || user.status === statusFilter;

		return matchesSearch && matchesRole && matchesStatus;
	});

	// 检查权限
	const canManageUsers = currentUser ? hasPermission(currentUser.permissions, PermissionModule.USERS, PermissionAction.MANAGE) : false;

	const canWriteUsers = currentUser ? hasPermission(currentUser.permissions, PermissionModule.USERS, PermissionAction.WRITE) : false;

	const canDeleteUsers = currentUser ? hasPermission(currentUser.permissions, PermissionModule.USERS, PermissionAction.DELETE) : false;

	// 创建用户
	const handleCreateUser = (e: React.FormEvent) => {
		e.preventDefault();

		const newUser: User = {
			id: Math.max(...users.map((u) => u.id)) + 1,
			...formData,
			permissions: formData.permissions?.length ? formData.permissions : ROLE_PERMISSIONS[formData.role],
			status: UserStatus.ACTIVE,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		setUsers([...users, newUser]);
		setShowCreateModal(false);
		resetForm();
	};

	// 更新用户
	const handleUpdateUser = (userId: number, updateData: UpdateUserRequest) => {
		setUsers(
			users.map((user) =>
				user.id === userId
					? {
							...user,
							...updateData,
							permissions: updateData.permissions || user.permissions,
							updatedAt: new Date().toISOString(),
					  }
					: user
			)
		);
		setShowEditModal(false);
		setEditingUser(null);
	};

	// 删除用户
	const handleDeleteUser = (userId: number) => {
		if (confirm("确定要删除这个用户吗？此操作不可恢复。")) {
			setUsers(users.filter((user) => user.id !== userId));
		}
	};

	// 重置表单
	const resetForm = () => {
		setFormData({
			username: "",
			nickname: "",
			handle: 0,
			gender: Gender.UNKNOWN,
			birthday: "",
			email: "",
			phone: "",
			password: "",
			role: UserRole.HR_SPECIALIST,
			permissions: [],
		});
	};

	// 打开编辑模态框
	const openEditModal = (user: User) => {
		setEditingUser(user);
		setShowEditModal(true);
	};

	// 打开权限管理模态框
	const openPermissionModal = (user: User) => {
		setEditingUser(user);
		setShowPermissionModal(true);
	};

	return (
		<div className='h-full overflow-y-auto'>
			<div className='p-6 max-w-7xl mx-auto'>
				{/* 页面标题 */}
				<div className='mb-6'>
					<h2 className='text-2xl font-bold text-gray-900 mb-2'>用户管理</h2>
					<p className='text-gray-600'>管理系统用户账号、角色和权限</p>
				</div>

				{/* 操作栏 */}
				<div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
						<div className='flex flex-col sm:flex-row gap-4'>
							{/* 搜索框 */}
							<div className='relative'>
								<input
									type='text'
									placeholder='搜索用户名、昵称、邮箱或Handle...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='w-full sm:w-80 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500'
								/>
								<svg
									className='w-5 h-5 text-gray-400 absolute left-3 top-2.5'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
									/>
								</svg>
							</div>

							{/* 角色筛选 */}
							<select
								value={roleFilter}
								onChange={(e) => setRoleFilter(e.target.value)}
								className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white'
							>
								<option value='all'>所有角色</option>
								{Object.values(UserRole).map((role) => (
									<option
										key={role}
										value={role}
									>
										{getRoleText(role)}
									</option>
								))}
							</select>

							{/* 状态筛选 */}
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white'
							>
								<option value='all'>所有状态</option>
								{Object.values(UserStatus).map((status) => (
									<option
										key={status}
										value={status}
									>
										{getStatusText(status)}
									</option>
								))}
							</select>
						</div>

						{/* 创建用户按钮 */}
						{(canManageUsers || canWriteUsers) && (
							<button
								onClick={() => setShowCreateModal(true)}
								className='bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center space-x-2'
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
								<span>创建用户</span>
							</button>
						)}
					</div>
				</div>

				{/* 用户列表 */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-100'>
					<div className='p-6 border-b border-gray-200'>
						<h3 className='text-lg font-semibold text-gray-900'>用户列表 ({filteredUsers.length})</h3>
					</div>

					<div className='overflow-x-auto'>
						<table className='w-full'>
							<thead className='bg-gray-50'>
								<tr>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>用户信息</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Handle</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>角色</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>状态</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>最后登录</th>
									<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>操作</th>
								</tr>
							</thead>
							<tbody className='bg-white divide-y divide-gray-200'>
								{filteredUsers.map((user) => (
									<tr
										key={user.id}
										className='hover:bg-gray-50'
									>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='flex items-center'>
												<div className='flex-shrink-0 h-10 w-10'>
													<div className='h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg'>
														{user.avatar || "👤"}
													</div>
												</div>
												<div className='ml-4'>
													<div className='text-sm font-medium text-gray-900'>{user.nickname}</div>
													<div className='text-sm text-gray-500'>@{user.username}</div>
													{user.email && <div className='text-xs text-gray-400'>{user.email}</div>}
												</div>
											</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='text-sm font-mono text-gray-900'>#{user.handle}</div>
											<div className='text-xs text-gray-500'>{getGenderText(user.gender)}</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800'>
												{getRoleText(user.role)}
											</span>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<span
												className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(user.status)}`}
											>
												{getStatusText(user.status)}
											</span>
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
											{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("zh-CN") : "从未登录"}
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
											<div className='flex items-center space-x-2'>
												{(canManageUsers || canWriteUsers) && (
													<>
														<button
															onClick={() => openEditModal(user)}
															className='text-indigo-600 hover:text-indigo-900 transition-colors'
															title='编辑用户'
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
															onClick={() => openPermissionModal(user)}
															className='text-purple-600 hover:text-purple-900 transition-colors'
															title='权限管理'
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
																	d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z'
																/>
															</svg>
														</button>
													</>
												)}
												{(canManageUsers || canDeleteUsers) && user.id !== currentUser?.id && (
													<button
														onClick={() => handleDeleteUser(user.id)}
														className='text-red-600 hover:text-red-900 transition-colors'
														title='删除用户'
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
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{filteredUsers.length === 0 && (
						<div className='p-12 text-center'>
							<div className='text-4xl mb-4'>👥</div>
							<h3 className='text-lg font-medium text-gray-900 mb-2'>暂无用户</h3>
							<p className='text-gray-500'>
								{searchTerm || roleFilter !== "all" || statusFilter !== "all" ? "没有找到匹配的用户" : "还没有创建任何用户"}
							</p>
						</div>
					)}
				</div>
			</div>

			{/* 创建用户模态框 */}
			{showCreateModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
					<div className='bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
						<div className='p-6 border-b border-gray-200'>
							<h3 className='text-lg font-semibold text-gray-900'>创建新用户</h3>
						</div>
						<form
							onSubmit={handleCreateUser}
							className='p-6 space-y-4'
						>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>用户名</label>
									<input
										type='text'
										required
										value={formData.username}
										onChange={(e) => setFormData({ ...formData, username: e.target.value })}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900'
										placeholder='登录用户名'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>昵称</label>
									<input
										type='text'
										required
										value={formData.nickname}
										onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900'
										placeholder='显示昵称'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>Handle</label>
									<input
										type='number'
										required
										value={formData.handle || ""}
										onChange={(e) => setFormData({ ...formData, handle: parseInt(e.target.value) || 0 })}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900'
										placeholder='唯一标识符'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>性别</label>
									<select
										value={formData.gender}
										onChange={(e) => setFormData({ ...formData, gender: parseInt(e.target.value) as Gender })}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white'
									>
										{Object.entries(Gender)
											.filter(([key]) => isNaN(Number(key)))
											.map(([key, value]) => (
												<option
													key={value}
													value={value}
												>
													{getGenderText(value as Gender)}
												</option>
											))}
									</select>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>生日</label>
									<input
										type='date'
										required
										value={formData.birthday}
										onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>角色</label>
									<select
										value={formData.role}
										onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white'
									>
										{Object.values(UserRole).map((role) => (
											<option
												key={role}
												value={role}
											>
												{getRoleText(role)}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>邮箱</label>
									<input
										type='email'
										value={formData.email}
										onChange={(e) => setFormData({ ...formData, email: e.target.value })}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900'
										placeholder='用户邮箱'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>手机号</label>
									<input
										type='tel'
										value={formData.phone}
										onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
										className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900'
										placeholder='用户手机号'
									/>
								</div>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>密码</label>
								<input
									type='password'
									required
									value={formData.password}
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900'
									placeholder='登录密码'
								/>
							</div>
							<div className='flex justify-end space-x-3 pt-4'>
								<button
									type='button'
									onClick={() => {
										setShowCreateModal(false);
										resetForm();
									}}
									className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
								>
									取消
								</button>
								<button
									type='submit'
									className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors'
								>
									创建用户
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* 其他模态框占位符 */}
			{showEditModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
					<div className='bg-white rounded-xl max-w-md w-full p-6'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>编辑用户</h3>
						<p className='text-gray-600 mb-4'>编辑用户功能正在开发中...</p>
						<div className='flex justify-end'>
							<button
								onClick={() => setShowEditModal(false)}
								className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
							>
								关闭
							</button>
						</div>
					</div>
				</div>
			)}

			{showPermissionModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
					<div className='bg-white rounded-xl max-w-md w-full p-6'>
						<h3 className='text-lg font-semibold text-gray-900 mb-4'>权限管理</h3>
						<p className='text-gray-600 mb-4'>权限管理功能正在开发中...</p>
						<div className='flex justify-end'>
							<button
								onClick={() => setShowPermissionModal(false)}
								className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
							>
								关闭
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
