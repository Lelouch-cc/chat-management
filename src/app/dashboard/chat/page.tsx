"use client";

import { useState, useEffect, useRef } from "react";
import { useMultiPublisherChat } from "../../../hooks/useMultiPublisherChat";
import { ChatAPI } from "../../../services/ChatAPI";
import type { Publisher, Applicant, AdminUser } from "../../../types/chat";

// 消息类型定义（用于显示）
interface Message {
	id: number;
	senderId: number;
	senderName: string;
	content: string;
	timestamp: string;
	isMe: boolean;
}

// 模拟数据
const mockPublishers: Publisher[] = [
	{
		id: 1,
		name: "李经理",
		handle: 1001,
		avatar: "👨‍💼",
		position: "技术总监",
		department: "技术部",
		isActive: true,
	},
	{
		id: 2,
		name: "王主管",
		handle: 1002,
		avatar: "👩‍💼",
		position: "产品总监",
		department: "产品部",
		isActive: true,
	},
	{
		id: 3,
		name: "张组长",
		handle: 1003,
		avatar: "👨‍🏫",
		position: "设计总监",
		department: "设计部",
		isActive: true,
	},
];

const mockApplicantsByPublisher = new Map<number, Applicant[]>([
	[1, [ // 李经理的申请者
		{
			id: 1,
			name: "张小明",
			handle: 2001,
			avatar: "👨‍💻",
			isOnline: true,
			appliedPosition: "高级前端工程师",
			applicationDate: "2024-01-15",
			status: "interviewing",
			publisherId: 1,
			chatId: 101,
		},
		{
			id: 2,
			name: "王建国",
			handle: 2002,
			avatar: "👨‍🔬",
			isOnline: false,
			lastSeen: "2小时前",
			appliedPosition: "Java 后端工程师",
			applicationDate: "2024-01-13",
			status: "pending",
			publisherId: 1,
			chatId: 102,
		},
	]],
	[2, [ // 王主管的申请者
		{
			id: 3,
			name: "刘晓红",
			handle: 2003,
			avatar: "👩‍💼",
			isOnline: true,
			appliedPosition: "产品经理",
			applicationDate: "2024-01-12",
			status: "interviewing",
			publisherId: 2,
			chatId: 103,
		},
		{
			id: 4,
			name: "陈志强",
			handle: 2004,
			avatar: "👨‍🎓",
			isOnline: false,
			lastSeen: "1天前",
			appliedPosition: "产品助理",
			applicationDate: "2024-01-10",
			status: "pending",
			publisherId: 2,
			chatId: 104,
		},
	]],
	[3, [ // 张组长的申请者
		{
			id: 5,
			name: "李美丽",
			handle: 2005,
			avatar: "👩‍🎨",
			isOnline: true,
			appliedPosition: "UI/UX 设计师",
			applicationDate: "2024-01-14",
			status: "pending",
			publisherId: 3,
			chatId: 105,
		},
	]],
]);

export default function ChatPage() {
	const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
	const [newMessage, setNewMessage] = useState("");
	const [showApplicantList, setShowApplicantList] = useState(false);
	const [showPublisherList, setShowPublisherList] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// 使用多发布者聊天Hook
	const {
		isConnected,
		currentPublisher,
		publishers,
		selectedApplicant,
		switchPublisher,
		loadApplicantsForPublisher,
		selectApplicant,
		sendMessage: sendChatMessage,
		getApplicantMessages,
		getCurrentPublisherApplicants,
		isApplicantOnline,
	} = useMultiPublisherChat({
		adminUser: adminUser || undefined,
		chatAPI: ChatAPI,
		autoConnect: true,
	});


	/**
	 * 初始化管理员用户和模拟数据
	 */
	useEffect(() => {
		try {
			const userStr = localStorage.getItem("user");
			if (userStr) {
				const user = JSON.parse(userStr);
				// 创建管理员用户
				const mockAdminUser: AdminUser = {
					handle: user.handle || 9999,
					username: user.username || "管理员",
					role: "admin",
					publishers: mockPublishers,
				};
				setAdminUser(mockAdminUser);
			} else {
				// 如果没有用户信息，创建默认管理员
				const defaultAdminUser: AdminUser = {
					handle: 9999,
					username: "管理员",
					role: "admin",
					publishers: mockPublishers,
				};
				setAdminUser(defaultAdminUser);
			}
		} catch (error) {
			console.error("解析用户信息失败:", error);
		}
	}, []);

	/**
	 * 加载发布者的申请者数据
	 */
	useEffect(() => {
		if (currentPublisher && mockApplicantsByPublisher.has(currentPublisher.id)) {
			const applicants = mockApplicantsByPublisher.get(currentPublisher.id) || [];
			loadApplicantsForPublisher(currentPublisher.id, applicants);
		}
	}, [currentPublisher, loadApplicantsForPublisher]);

	/**
	 * 监听选中申请者的消息变化
	 */
	useEffect(() => {
		if (selectedApplicant) {
			const chatMessages = getApplicantMessages(selectedApplicant.id);
			const displayMessages: Message[] = chatMessages.map((msg, index) => ({
				id: index + 1,
				senderId: msg.senderId || 0,
				senderName: msg.senderId === adminUser?.handle ? (adminUser?.username || '管理员') : selectedApplicant.name,
				content: typeof msg.content === 'string' ? JSON.parse(msg.content).text || msg.content : msg.content,
				timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString('zh-CN', {
					hour: '2-digit',
					minute: '2-digit'
				}),
				isMe: msg.senderId === adminUser?.handle
			}));
			setMessages(displayMessages);
		} else {
			setMessages([]);
		}
	}, [selectedApplicant, getApplicantMessages, adminUser]);

	/**
	 * 滚动到消息底部
	 */
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	/**
	 * 选择申请者开始聊天
	 */
	const handleSelectApplicant = (applicant: Applicant) => {
		selectApplicant(applicant);
		setShowApplicantList(false); // 选择申请者后隐藏列表（移动端）
	};

	/**
	 * 切换发布者
	 */
	const handleSwitchPublisher = async (publisher: Publisher) => {
		const success = await switchPublisher(publisher);
		if (success) {
			setShowPublisherList(false);
		}
	};

	/**
	 * 发送消息
	 */
	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim() || !selectedApplicant || !adminUser) return;

		const messageText = newMessage.trim();
		setNewMessage(""); // 立即清空输入框

		try {
			const success = await sendChatMessage(messageText);
			if (!success) {
				console.error('发送消息失败');
				// 可以在这里显示错误提示
			}
		} catch (error) {
			console.error('发送消息异常:', error);
		}
	};

	/**
	 * 获取申请状态样式
	 */
	const getStatusStyle = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-800";
			case "interviewing":
				return "bg-blue-100 text-blue-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			case "hired":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	/**
	 * 获取申请状态文本
	 */
	const getStatusText = (status: string) => {
		switch (status) {
			case "pending":
				return "待处理";
			case "interviewing":
				return "面试中";
			case "rejected":
				return "已拒绝";
			case "hired":
				return "已录用";
			default:
				return "未知";
		}
	};

	// 获取当前发布者的申请者列表
	const currentApplicants = getCurrentPublisherApplicants();

	return (
		<div className='h-full flex bg-white relative'>
			{/* 移动端遮罩层 */}
			{(showApplicantList || showPublisherList) && (
				<div
					className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
					onClick={() => {
						setShowApplicantList(false);
						setShowPublisherList(false);
					}}
				/>
			)}

			{/* 左侧申请者列表 */}
			<div
				className={`w-80 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out z-50 ${
					showApplicantList
						? "fixed inset-y-0 left-0 translate-x-0"
						: "fixed inset-y-0 left-0 -translate-x-full lg:relative lg:translate-x-0"
				}`}
			>
				{/* 发布者选择器 */}
				<div className='p-4 bg-white border-b border-gray-200'>
					<div className='flex items-center justify-between mb-3'>
						<h3 className='font-semibold text-gray-900'>当前发布者</h3>
						{/* 移动端关闭按钮 */}
						<button
							onClick={() => setShowApplicantList(false)}
							className='lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800 transition-colors'
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
					
					{/* 当前发布者显示/切换按钮 */}
					<button
						onClick={() => setShowPublisherList(!showPublisherList)}
						className='w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors'
					>
						{currentPublisher ? (
							<>
								<div className='w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm'>
									{currentPublisher.avatar}
								</div>
								<div className='flex-1 text-left'>
									<p className='font-medium text-gray-900'>{currentPublisher.name}</p>
									<p className='text-xs text-gray-500'>{currentPublisher.position}</p>
								</div>
								<svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
								</svg>
							</>
						) : (
							<>
								<div className='w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center'>
									<span className='text-gray-600 text-sm'>?</span>
								</div>
								<div className='flex-1 text-left'>
									<p className='font-medium text-gray-500'>选择发布者</p>
								</div>
							</>
						)}
					</button>

					{/* 发布者下拉列表 */}
					{showPublisherList && (
						<div className='absolute left-4 right-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-60 max-h-48 overflow-y-auto'>
							{publishers.map((publisher) => (
								<button
									key={publisher.id}
									onClick={() => handleSwitchPublisher(publisher)}
									className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors ${
										currentPublisher?.id === publisher.id ? 'bg-blue-50' : ''
									}`}
								>
									<div className='w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm'>
										{publisher.avatar}
									</div>
									<div className='flex-1 text-left'>
										<p className='font-medium text-gray-900'>{publisher.name}</p>
										<p className='text-xs text-gray-500'>{publisher.position} • {publisher.department}</p>
									</div>
									{currentPublisher?.id === publisher.id && (
										<svg className='w-4 h-4 text-blue-500' fill='currentColor' viewBox='0 0 20 20'>
											<path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
										</svg>
									)}
								</button>
							))}
						</div>
					)}
				</div>

				{/* 申请者列表头部 */}
				<div className='p-4 bg-white border-b border-gray-200'>
					<div className='flex items-center justify-between'>
						<div className='flex-1'>
							<h3 className='font-semibold text-gray-900'>职位申请者</h3>
							<p className='text-sm text-gray-500'>
								{currentPublisher ? `${currentPublisher.name}的申请者` : '请先选择发布者'}
							</p>
						</div>
					</div>
				</div>

				{/* 连接状态和申请统计 */}
				<div className='p-4 bg-white border-b border-gray-200'>
					<div className='flex items-center justify-between text-sm mb-2'>
						<span className='text-gray-600'>连接状态</span>
						<div className='flex items-center space-x-2'>
							<div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
							<span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
								{isConnected ? '已连接' : '未连接'}
							</span>
						</div>
					</div>
					<div className='flex items-center justify-between text-sm'>
						<span className='text-gray-600'>在线申请者</span>
						<span className='text-green-600 font-medium'>
							{currentApplicants.filter((applicant) => isApplicantOnline(applicant.handle)).length}/{currentApplicants.length}
						</span>
					</div>
				</div>

				{/* 申请者列表 */}
				<div className='flex-1 overflow-y-auto'>
					{currentApplicants.length > 0 ? currentApplicants.map((applicant) => (
						<div
							key={applicant.id}
							onClick={() => handleSelectApplicant(applicant)}
							className={`p-4 hover:bg-white cursor-pointer border-b border-gray-100 transition-colors ${
								selectedApplicant?.id === applicant.id ? "bg-white border-indigo-200 shadow-sm" : ""
							}`}
						>
							<div className='flex items-center space-x-3'>
								<div className='relative'>
									<div className='w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg'>
										{applicant.avatar}
									</div>
									<div
										className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
											isApplicantOnline(applicant.handle) ? "bg-green-400" : "bg-gray-400"
										}`}
									></div>
								</div>
								<div className='flex-1 min-w-0'>
									<div className='flex items-center space-x-2 mb-1'>
										<p className='font-medium text-gray-900 truncate'>{applicant.name}</p>
										<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(applicant.status)}`}>
											{getStatusText(applicant.status)}
										</span>
									</div>
									<p className='text-xs text-gray-500 truncate'>申请：{applicant.appliedPosition}</p>
									<p className='text-xs text-gray-400 truncate'>{isApplicantOnline(applicant.handle) ? "在线" : applicant.lastSeen}</p>
								</div>
							</div>
						</div>
					)) : (
						<div className='flex-1 flex items-center justify-center p-8'>
							<div className='text-center'>
								<div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-400 mx-auto mb-4'>
									👥
								</div>
								<h3 className='text-lg font-medium text-gray-900 mb-2'>暂无申请者</h3>
								<p className='text-gray-500 text-sm'>
									{currentPublisher ? `${currentPublisher.name}暂时没有申请者` : '请先选择发布者'}
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* 右侧聊天区域 */}
			<div className='flex-1 flex flex-col min-w-0'>
				{selectedApplicant ? (
					<>
						{/* 聊天头部 */}
						<div className='p-4 bg-white border-b border-gray-200 flex-shrink-0'>
							<div className='flex items-center space-x-3'>
								{/* 移动端申请者列表切换按钮 */}
								<button
									onClick={() => setShowApplicantList(true)}
									className='lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0'
								>
									<svg
										className='w-5 h-5 text-gray-600'
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

								<div className='relative flex-shrink-0'>
									<div className='w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg'>
										{selectedApplicant.avatar}
									</div>
									<div
										className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
											isApplicantOnline(selectedApplicant.handle) ? "bg-green-400" : "bg-gray-400"
										}`}
									></div>
								</div>
								<div className='min-w-0 flex-1'>
									<div className='flex items-center space-x-2 mb-1'>
										<h3 className='font-semibold text-gray-900 truncate'>{selectedApplicant.name}</h3>
										<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(selectedApplicant.status)}`}>
											{getStatusText(selectedApplicant.status)}
										</span>
									</div>
									<p className='text-sm text-gray-500 truncate'>
										申请职位：{selectedApplicant.appliedPosition}
										{currentPublisher && (
											<span className='text-gray-400'> • 面试官：{currentPublisher.name}</span>
										)}
									</p>
								</div>

								{/* 聊天操作按钮 */}
								<div className='flex items-center space-x-2'>
									<button
										className='p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
										title='安排面试'
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
												d='M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z'
											/>
										</svg>
									</button>
									<button
										className='p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
										title='查看简历'
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
												d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
											/>
										</svg>
									</button>
									<button
										className='p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors'
										title='申请详情'
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
												d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>

						{/* 消息列表 */}
						<div className='flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-gray-50'>
							{messages.map((message) => (
								<div
									key={message.id}
									className={`flex ${message.isMe ? "justify-end" : "justify-start"}`}
								>
									<div
										className={`flex items-end space-x-2 max-w-[75%] sm:max-w-md ${message.isMe ? "flex-row-reverse space-x-reverse" : ""}`}
									>
										{!message.isMe && selectedApplicant && (
											<div className='w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0'>
												{selectedApplicant.avatar}
											</div>
										)}
										<div
											className={`px-4 py-2 rounded-2xl ${
												message.isMe ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-900"
											}`}
										>
											<p className='text-sm break-words'>{message.content}</p>
											<p className={`text-xs mt-1 ${message.isMe ? "text-indigo-200" : "text-gray-500"}`}>{message.timestamp}</p>
										</div>
									</div>
								</div>
							))}
							<div ref={messagesEndRef} />
						</div>

						{/* 消息输入框 */}
						<div className='p-4 bg-white border-t border-gray-200 flex-shrink-0'>
							<form
								onSubmit={handleSendMessage}
								className='flex space-x-2 sm:space-x-4'
							>
								<button
									type='button'
									className='p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0'
									title='发送文件'
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
											d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
										/>
									</svg>
								</button>
								<input
									type='text'
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									placeholder='输入消息与申请者沟通...'
									className='flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm sm:text-base text-gray-900 placeholder-gray-500'
								/>
								<button
									type='button'
									className='p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0'
									title='选择表情'
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
											d='M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
										/>
									</svg>
								</button>
								<button
									type='submit'
									disabled={!newMessage.trim()}
									className='px-4 sm:px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-full transition-colors text-sm sm:text-base flex-shrink-0'
								>
									发送
								</button>
							</form>
						</div>
					</>
				) : (
					/* 未选择申请者时的空状态 */
					<div className='flex-1 flex items-center justify-center p-4 bg-gray-50'>
						<div className='text-center max-w-md mx-auto'>
							{/* 移动端显示申请者列表按钮 */}
							<div className='lg:hidden mb-6'>
								<button
									onClick={() => setShowApplicantList(true)}
									className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg'
								>
									查看申请者列表
								</button>
							</div>

							<div className='w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-3xl sm:text-4xl text-gray-600 mx-auto mb-4 shadow-sm'>
								💼
							</div>
							<h3 className='text-lg sm:text-xl font-semibold text-gray-900 mb-2'>选择申请者开始沟通</h3>
							<p className='text-gray-500 text-sm sm:text-base px-4'>
								<span className='hidden lg:inline'>从左侧申请者列表中</span>
								<span className='lg:hidden'>点击上方按钮查看申请者列表，</span>
								选择一位申请者开始面试沟通
							</p>

							{/* 快捷操作 */}
							<div className='mt-8 space-y-3'>
								<div className='flex items-center justify-center space-x-4 text-sm text-gray-500'>
									<span>💡 沟通功能：</span>
								</div>
								<div className='flex flex-wrap justify-center gap-2'>
									<span className='px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200'>面试邀请</span>
									<span className='px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200'>简历查看</span>
									<span className='px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200'>状态更新</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
