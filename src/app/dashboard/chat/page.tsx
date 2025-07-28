"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// 发布者类型定义
interface Publisher {
	id: number;
	name: string;
	companyName: string;
	avatar: string;
	isOnline: boolean;
	lastSeen?: string;
	applicantCount: number;
	activeChats: number;
}

// 申请者类型定义
interface Applicant {
	id: number;
	name: string;
	avatar: string;
	isOnline: boolean;
	lastSeen?: string;
	appliedPosition: string;
	applicationDate: string;
	status: "pending" | "interviewing" | "rejected" | "hired";
	publisherId: number; // 关联的发布者ID
	unreadCount: number; // 未读消息数
}

// 消息类型定义
interface Message {
	id: number;
	senderId: number;
	senderName: string;
	content: string;
	timestamp: string;
	isMe: boolean;
}

export default function ChatPage() {
	const [currentUser, setCurrentUser] = useState<{ username: string } | null>(null);
	const [selectedPublisher, setSelectedPublisher] = useState<Publisher | null>(null);
	const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [showPublisherList, setShowPublisherList] = useState(false); // 移动端发布者列表显示状态
	const [showApplicantList, setShowApplicantList] = useState(false); // 移动端申请者列表显示状态
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	// 模拟发布者列表数据
	const [publishers] = useState<Publisher[]>([
		{
			id: 1,
			name: "张经理",
			companyName: "科技创新有限公司",
			avatar: "👨‍💼",
			isOnline: true,
			applicantCount: 15,
			activeChats: 3,
		},
		{
			id: 2,
			name: "李总监",
			companyName: "互联网科技集团",
			avatar: "👩‍💼",
			isOnline: true,
			applicantCount: 23,
			activeChats: 5,
		},
		{
			id: 3,
			name: "王主管",
			companyName: "金融服务有限公司",
			avatar: "👨‍💻",
			isOnline: false,
			lastSeen: "1小时前",
			applicantCount: 8,
			activeChats: 1,
		},
		{
			id: 4,
			name: "陈总",
			companyName: "教育科技公司",
			avatar: "👩‍🏫",
			isOnline: true,
			applicantCount: 12,
			activeChats: 2,
		},
	]);

	// 模拟申请者列表数据（根据发布者过滤）
	const [allApplicants] = useState<Applicant[]>([
		{
			id: 1,
			name: "张小明",
			avatar: "👨‍💻",
			isOnline: true,
			appliedPosition: "高级前端工程师",
			applicationDate: "2024-01-15",
			status: "interviewing",
			publisherId: 1,
			unreadCount: 2,
		},
		{
			id: 2,
			name: "李美丽",
			avatar: "👩‍🎨",
			isOnline: true,
			appliedPosition: "UI/UX 设计师",
			applicationDate: "2024-01-14",
			status: "pending",
			publisherId: 1,
			unreadCount: 0,
		},
		{
			id: 3,
			name: "王建国",
			avatar: "👨‍🔬",
			isOnline: false,
			lastSeen: "2小时前",
			appliedPosition: "Java 后端工程师",
			applicationDate: "2024-01-13",
			status: "pending",
			publisherId: 1,
			unreadCount: 1,
		},
		{
			id: 4,
			name: "刘晓红",
			avatar: "👩‍💼",
			isOnline: true,
			appliedPosition: "产品经理",
			applicationDate: "2024-01-12",
			status: "interviewing",
			publisherId: 2,
			unreadCount: 3,
		},
		{
			id: 5,
			name: "陈志强",
			avatar: "👨‍🎓",
			isOnline: false,
			lastSeen: "1天前",
			appliedPosition: "高级前端工程师",
			applicationDate: "2024-01-10",
			status: "pending",
			publisherId: 2,
			unreadCount: 0,
		},
		{
			id: 6,
			name: "赵小丽",
			avatar: "👩‍💻",
			isOnline: true,
			appliedPosition: "数据分析师",
			applicationDate: "2024-01-11",
			status: "pending",
			publisherId: 3,
			unreadCount: 1,
		},
		{
			id: 7,
			name: "孙大明",
			avatar: "👨‍🏫",
			isOnline: false,
			lastSeen: "30分钟前",
			appliedPosition: "课程设计师",
			applicationDate: "2024-01-09",
			status: "interviewing",
			publisherId: 4,
			unreadCount: 0,
		},
	]);

	// 根据选择的发布者过滤申请者
	const filteredApplicants = selectedPublisher ? allApplicants.filter((applicant) => applicant.publisherId === selectedPublisher.id) : [];

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

	/**
	 * 滚动到消息底部
	 */
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	/**
	 * 选择发布者
	 */
	const handleSelectPublisher = (publisher: Publisher) => {
		setSelectedPublisher(publisher);
		setSelectedApplicant(null); // 清空选择的申请者
		setMessages([]); // 清空消息
		setShowPublisherList(false); // 隐藏发布者列表（移动端）
	};

	/**
	 * 选择申请者开始聊天
	 */
	const handleSelectApplicant = (applicant: Applicant) => {
		setSelectedApplicant(applicant);
		setShowApplicantList(false); // 选择申请者后隐藏列表（移动端）

		// 模拟加载该申请者的历史消息
		const mockMessages: Message[] = [
			{
				id: 1,
				senderId: applicant.id,
				senderName: applicant.name,
				content: `您好！我是${applicant.name}，很高兴能申请贵公司的${applicant.appliedPosition}职位。`,
				timestamp: "10:30",
				isMe: false,
			},
			{
				id: 2,
				senderId: 0,
				senderName: currentUser?.username || "",
				content: "您好！感谢您的申请，我们已经收到了您的简历，请问您方便聊聊您的工作经验吗？",
				timestamp: "10:32",
				isMe: true,
			},
		];
		setMessages(mockMessages);

		// 清除未读消息数
		const updatedApplicant = { ...applicant, unreadCount: 0 };
		// 这里可以调用API更新未读消息数
	};

	/**
	 * 发送消息
	 */
	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim() || !selectedApplicant || !currentUser) return;

		const message: Message = {
			id: messages.length + 1,
			senderId: 0,
			senderName: currentUser.username,
			content: newMessage.trim(),
			timestamp: new Date().toLocaleTimeString("zh-CN", {
				hour: "2-digit",
				minute: "2-digit",
			}),
			isMe: true,
		};

		setMessages((prev) => [...prev, message]);
		setNewMessage("");

		// 模拟申请者回复（延迟1-2秒）
		setTimeout(() => {
			const replyMessage: Message = {
				id: messages.length + 2,
				senderId: selectedApplicant.id,
				senderName: selectedApplicant.name,
				content: `收到您的消息："${message.content}"，我会认真考虑并回复您。`,
				timestamp: new Date().toLocaleTimeString("zh-CN", {
					hour: "2-digit",
					minute: "2-digit",
				}),
				isMe: false,
			};
			setMessages((prev) => [...prev, replyMessage]);
		}, Math.random() * 1000 + 1000);
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

	return (
		<div className='h-full flex bg-white relative'>
			{/* 移动端遮罩层 */}
			{(showPublisherList || showApplicantList) && (
				<div
					className='fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden'
					onClick={() => {
						setShowPublisherList(false);
						setShowApplicantList(false);
					}}
				/>
			)}

			{/* 左侧发布者列表 */}
			<div
				className={`w-80 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out z-50 ${
					showPublisherList
						? "fixed inset-y-0 left-0 translate-x-0"
						: "fixed inset-y-0 left-0 -translate-x-full lg:relative lg:translate-x-0"
				}`}
			>
				{/* 发布者列表头部 */}
				<div className='p-4 bg-white border-b border-gray-200'>
					<div className='flex items-center justify-between'>
						<div className='flex-1'>
							<h3 className='font-semibold text-gray-900'>职位发布者</h3>
							<p className='text-sm text-gray-500'>选择发布者开始沟通</p>
						</div>
						{/* 移动端关闭按钮 */}
						<button
							onClick={() => setShowPublisherList(false)}
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
				</div>

				{/* 发布统计 */}
				<div className='p-4 bg-white border-b border-gray-200'>
					<div className='flex items-center justify-between text-sm'>
						<span className='text-gray-600'>在线发布者</span>
						<span className='text-green-600 font-medium'>
							{publishers.filter((publisher) => publisher.isOnline).length}/{publishers.length}
						</span>
					</div>
				</div>

				{/* 发布者列表 */}
				<div className='flex-1 overflow-y-auto'>
					{publishers.map((publisher) => (
						<div
							key={publisher.id}
							onClick={() => handleSelectPublisher(publisher)}
							className={`p-4 hover:bg-white cursor-pointer border-b border-gray-100 transition-colors ${
								selectedPublisher?.id === publisher.id ? "bg-white border-indigo-200 shadow-sm" : ""
							}`}
						>
							<div className='flex items-center space-x-3'>
								<div className='relative'>
									<div className='w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg'>
										{publisher.avatar}
									</div>
									<div
										className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
											publisher.isOnline ? "bg-green-400" : "bg-gray-400"
										}`}
									></div>
								</div>
								<div className='flex-1 min-w-0'>
									<div className='flex items-center space-x-2 mb-1'>
										<p className='font-medium text-gray-900 truncate'>{publisher.name}</p>
										<span className='px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800'>{publisher.companyName}</span>
									</div>
									<p className='text-xs text-gray-500 truncate'>申请者：{publisher.applicantCount}</p>
									<p className='text-xs text-gray-400 truncate'>{publisher.isOnline ? "在线" : publisher.lastSeen}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* 中间申请者列表 */}
			{selectedPublisher && (
				<div
					className={`w-80 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out z-40 ${
						showApplicantList
							? "fixed inset-y-0 left-0 translate-x-0"
							: "fixed inset-y-0 left-0 -translate-x-full lg:relative lg:translate-x-0"
					}`}
				>
					{/* 申请者列表头部 */}
					<div className='p-4 bg-white border-b border-gray-200'>
						<div className='flex items-center justify-between'>
							<div className='flex-1'>
								<h3 className='font-semibold text-gray-900'>职位申请者</h3>
								<p className='text-sm text-gray-500'>{selectedPublisher.name}的申请者</p>
							</div>
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
					</div>

					{/* 申请统计 */}
					<div className='p-4 bg-white border-b border-gray-200'>
						<div className='flex items-center justify-between text-sm'>
							<span className='text-gray-600'>在线申请者</span>
							<span className='text-green-600 font-medium'>
								{filteredApplicants.filter((applicant) => applicant.isOnline).length}/{filteredApplicants.length}
							</span>
						</div>
					</div>

					{/* 申请者列表 */}
					<div className='flex-1 overflow-y-auto'>
						{filteredApplicants.length === 0 ? (
							<div className='flex items-center justify-center h-64 text-gray-500'>
								<div className='text-center'>
									<div className='text-3xl mb-2'>📋</div>
									<p className='text-sm'>该发布者暂无申请者</p>
								</div>
							</div>
						) : (
							filteredApplicants.map((applicant) => (
								<div
									key={applicant.id}
									onClick={() => handleSelectApplicant(applicant)}
									className={`p-4 hover:bg-white cursor-pointer border-b border-gray-100 transition-colors ${
										selectedApplicant?.id === applicant.id ? "bg-white border-indigo-200 shadow-sm" : ""
									}`}
								>
									<div className='flex items-center space-x-3'>
										<div className='relative'>
											<div className='w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-lg'>
												{applicant.avatar}
											</div>
											<div
												className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
													applicant.isOnline ? "bg-green-400" : "bg-gray-400"
												}`}
											></div>
											{applicant.unreadCount > 0 && (
												<div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'>
													<span className='text-xs text-white font-medium'>{applicant.unreadCount}</span>
												</div>
											)}
										</div>
										<div className='flex-1 min-w-0'>
											<div className='flex items-center space-x-2 mb-1'>
												<p className='font-medium text-gray-900 truncate'>{applicant.name}</p>
												<span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(applicant.status)}`}>
													{getStatusText(applicant.status)}
												</span>
											</div>
											<p className='text-xs text-gray-500 truncate'>申请：{applicant.appliedPosition}</p>
											<p className='text-xs text-gray-400 truncate'>{applicant.isOnline ? "在线" : applicant.lastSeen}</p>
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* 右侧聊天区域 */}
			<div className='flex-1 flex flex-col min-w-0'>
				{selectedApplicant ? (
					<>
						{/* 聊天头部 */}
						<div className='p-4 bg-white border-b border-gray-200 flex-shrink-0'>
							<div className='flex items-center space-x-3'>
								{/* 移动端菜单切换按钮 */}
								<div className='lg:hidden flex items-center space-x-2'>
									<button
										onClick={() => setShowPublisherList(true)}
										className='p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0'
										title='发布者列表'
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
									{selectedPublisher && (
										<button
											onClick={() => setShowApplicantList(true)}
											className='p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0'
											title='申请者列表'
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
													d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
												/>
											</svg>
										</button>
									)}
								</div>

								<div className='relative flex-shrink-0'>
									<div className='w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-lg'>
										{selectedApplicant.avatar}
									</div>
									<div
										className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
											selectedApplicant.isOnline ? "bg-green-400" : "bg-gray-400"
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
									<p className='text-sm text-gray-500 truncate'>申请职位：{selectedApplicant.appliedPosition}</p>
									<p className='text-xs text-gray-400 truncate'>来自：{selectedPublisher?.companyName}</p>
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
										{!message.isMe && (
											<div className='w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0'>
												{selectedApplicant?.avatar}
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
				) : selectedPublisher ? (
					/* 已选择发布者但未选择申请者时的空状态 */
					<div className='flex-1 flex items-center justify-center p-4 bg-gray-50'>
						<div className='text-center max-w-md mx-auto'>
							{/* 移动端显示申请者列表按钮 */}
							<div className='lg:hidden mb-6 space-y-3'>
								<button
									onClick={() => setShowPublisherList(true)}
									className='block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg'
								>
									切换发布者
								</button>
								<button
									onClick={() => setShowApplicantList(true)}
									className='block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg'
								>
									查看申请者列表
								</button>
							</div>

							<div className='w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-3xl sm:text-4xl text-gray-600 mx-auto mb-4 shadow-sm'>
								💬
							</div>
							<h3 className='text-lg sm:text-xl font-semibold text-gray-900 mb-2'>选择申请者开始聊天</h3>
							<p className='text-gray-500 text-sm sm:text-base px-4 mb-4'>
								<span className='hidden lg:inline'>从中间申请者列表中</span>
								<span className='lg:hidden'>点击上方按钮查看申请者列表，</span>
								选择一位申请者开始面试沟通
							</p>

							{/* 当前发布者信息 */}
							<div className='bg-white rounded-lg p-4 border border-gray-200 mb-6'>
								<div className='flex items-center space-x-3'>
									<div className='w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl'>
										{selectedPublisher.avatar}
									</div>
									<div className='text-left'>
										<h4 className='font-semibold text-gray-900'>{selectedPublisher.name}</h4>
										<p className='text-sm text-gray-600'>{selectedPublisher.companyName}</p>
										<p className='text-xs text-gray-500'>{selectedPublisher.applicantCount} 个申请者</p>
									</div>
								</div>
							</div>

							{/* 快捷操作 */}
							<div className='space-y-3'>
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
				) : (
					/* 未选择发布者时的空状态 */
					<div className='flex-1 flex items-center justify-center p-4 bg-gray-50'>
						<div className='text-center max-w-md mx-auto'>
							{/* 移动端显示发布者列表按钮 */}
							<div className='lg:hidden mb-6'>
								<button
									onClick={() => setShowPublisherList(true)}
									className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg'
								>
									查看发布者列表
								</button>
							</div>

							<div className='w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-3xl sm:text-4xl text-gray-600 mx-auto mb-4 shadow-sm'>
								💼
							</div>
							<h3 className='text-lg sm:text-xl font-semibold text-gray-900 mb-2'>选择发布者开始管理</h3>
							<p className='text-gray-500 text-sm sm:text-base px-4 mb-6'>
								<span className='hidden lg:inline'>从左侧发布者列表中</span>
								<span className='lg:hidden'>点击上方按钮查看发布者列表，</span>
								选择一位发布者查看其申请者
							</p>

							{/* 步骤指引 */}
							<div className='bg-white rounded-lg p-4 border border-gray-200 mb-6'>
								<h4 className='font-semibold text-gray-900 mb-3'>操作步骤</h4>
								<div className='space-y-2 text-sm text-gray-600'>
									<div className='flex items-center space-x-2'>
										<span className='w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium'>
											1
										</span>
										<span>选择发布者账号</span>
									</div>
									<div className='flex items-center space-x-2'>
										<span className='w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-medium'>
											2
										</span>
										<span className='text-gray-400'>选择申请者</span>
									</div>
									<div className='flex items-center space-x-2'>
										<span className='w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-xs font-medium'>
											3
										</span>
										<span className='text-gray-400'>开始聊天沟通</span>
									</div>
								</div>
							</div>

							{/* 快捷操作 */}
							<div className='space-y-3'>
								<div className='flex items-center justify-center space-x-4 text-sm text-gray-500'>
									<span>💡 管理功能：</span>
								</div>
								<div className='flex flex-wrap justify-center gap-2'>
									<span className='px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200'>申请者管理</span>
									<span className='px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200'>面试安排</span>
									<span className='px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200'>状态跟踪</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
