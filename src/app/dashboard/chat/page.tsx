"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// 用户类型定义
interface User {
	id: number;
	name: string;
	avatar: string;
	isOnline: boolean;
	lastSeen?: string;
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
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [showUserList, setShowUserList] = useState(false); // 移动端用户列表显示状态
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	// 模拟用户列表数据
	const [users] = useState<User[]>([
		{
			id: 1,
			name: "张三",
			avatar: "👨‍💻",
			isOnline: true,
		},
		{
			id: 2,
			name: "李四",
			avatar: "👩‍🎨",
			isOnline: true,
		},
		{
			id: 3,
			name: "王五",
			avatar: "👨‍🔬",
			isOnline: false,
			lastSeen: "5分钟前",
		},
		{
			id: 4,
			name: "赵六",
			avatar: "👩‍💼",
			isOnline: true,
		},
		{
			id: 5,
			name: "钱七",
			avatar: "👨‍🎓",
			isOnline: false,
			lastSeen: "1小时前",
		},
	]);

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
	 * 选择聊天用户
	 */
	const handleSelectUser = (user: User) => {
		setSelectedUser(user);
		setShowUserList(false); // 选择用户后隐藏用户列表（移动端）
		// 模拟加载该用户的历史消息
		const mockMessages: Message[] = [
			{
				id: 1,
				senderId: user.id,
				senderName: user.name,
				content: `你好！我是${user.name}`,
				timestamp: "10:30",
				isMe: false,
			},
			{
				id: 2,
				senderId: 0,
				senderName: currentUser?.username || "",
				content: "你好！很高兴认识你",
				timestamp: "10:32",
				isMe: true,
			},
		];
		setMessages(mockMessages);
	};

	/**
	 * 发送消息
	 */
	const handleSendMessage = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newMessage.trim() || !selectedUser || !currentUser) return;

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

		// 模拟对方回复（延迟1-2秒）
		setTimeout(() => {
			const replyMessage: Message = {
				id: messages.length + 2,
				senderId: selectedUser.id,
				senderName: selectedUser.name,
				content: `收到你的消息："${message.content}"`,
				timestamp: new Date().toLocaleTimeString("zh-CN", {
					hour: "2-digit",
					minute: "2-digit",
				}),
				isMe: false,
			};
			setMessages((prev) => [...prev, replyMessage]);
		}, Math.random() * 1000 + 1000);
	};

	return (
		<div className='h-full flex bg-white relative'>
			{/* 移动端遮罩层 */}
			{showUserList && (
				<div
					className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
					onClick={() => setShowUserList(false)}
				/>
			)}

			{/* 左侧用户列表 */}
			<div
				className={`w-80 bg-gray-50 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out z-50 ${
					showUserList ? "fixed inset-y-0 left-0 translate-x-0" : "fixed inset-y-0 left-0 -translate-x-full lg:relative lg:translate-x-0"
				}`}
			>
				{/* 用户列表头部 */}
				<div className='p-4 bg-white border-b border-gray-200'>
					<div className='flex items-center justify-between'>
						<div className='flex-1'>
							<h3 className='font-semibold text-gray-900'>团队成员</h3>
							<p className='text-sm text-gray-500'>选择成员开始聊天</p>
						</div>
						{/* 移动端关闭按钮 */}
						<button
							onClick={() => setShowUserList(false)}
							className='lg:hidden p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600'
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

				{/* 在线状态统计 */}
				<div className='p-4 bg-white border-b border-gray-200'>
					<div className='flex items-center justify-between text-sm'>
						<span className='text-gray-600'>在线成员</span>
						<span className='text-green-600 font-medium'>
							{users.filter((user) => user.isOnline).length}/{users.length}
						</span>
					</div>
				</div>

				{/* 用户列表 */}
				<div className='flex-1 overflow-y-auto'>
					{users.map((user) => (
						<div
							key={user.id}
							onClick={() => handleSelectUser(user)}
							className={`p-4 hover:bg-white cursor-pointer border-b border-gray-100 transition-colors ${
								selectedUser?.id === user.id ? "bg-white border-indigo-200 shadow-sm" : ""
							}`}
						>
							<div className='flex items-center space-x-3'>
								<div className='relative'>
									<div className='w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg'>
										{user.avatar}
									</div>
									<div
										className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
											user.isOnline ? "bg-green-400" : "bg-gray-400"
										}`}
									></div>
								</div>
								<div className='flex-1 min-w-0'>
									<p className='font-medium text-gray-900 truncate'>{user.name}</p>
									<p className='text-sm text-gray-500 truncate'>{user.isOnline ? "在线" : user.lastSeen}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* 右侧聊天区域 */}
			<div className='flex-1 flex flex-col min-w-0'>
				{selectedUser ? (
					<>
						{/* 聊天头部 */}
						<div className='p-4 bg-white border-b border-gray-200 flex-shrink-0'>
							<div className='flex items-center space-x-3'>
								{/* 移动端用户列表切换按钮 */}
								<button
									onClick={() => setShowUserList(true)}
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
										{selectedUser.avatar}
									</div>
									<div
										className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
											selectedUser.isOnline ? "bg-green-400" : "bg-gray-400"
										}`}
									></div>
								</div>
								<div className='min-w-0 flex-1'>
									<h3 className='font-semibold text-gray-900 truncate'>{selectedUser.name}</h3>
									<p className='text-sm text-gray-500 truncate'>{selectedUser.isOnline ? "在线" : selectedUser.lastSeen}</p>
								</div>

								{/* 聊天操作按钮 */}
								<div className='flex items-center space-x-2'>
									<button className='p-2 text-gray-400 hover:text-gray-600 transition-colors'>📞</button>
									<button className='p-2 text-gray-400 hover:text-gray-600 transition-colors'>📹</button>
									<button className='p-2 text-gray-400 hover:text-gray-600 transition-colors'>ℹ️</button>
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
											<div className='w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0'>
												{selectedUser.avatar}
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
									className='p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0'
								>
									📎
								</button>
								<input
									type='text'
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									placeholder='输入消息...'
									className='flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm sm:text-base'
								/>
								<button
									type='button'
									className='p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0'
								>
									😊
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
					/* 未选择用户时的空状态 */
					<div className='flex-1 flex items-center justify-center p-4 bg-gray-50'>
						<div className='text-center max-w-md mx-auto'>
							{/* 移动端显示用户列表按钮 */}
							<div className='lg:hidden mb-6'>
								<button
									onClick={() => setShowUserList(true)}
									className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg'
								>
									查看团队成员
								</button>
							</div>

							<div className='w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-3xl sm:text-4xl text-gray-400 mx-auto mb-4 shadow-sm'>
								💬
							</div>
							<h3 className='text-lg sm:text-xl font-semibold text-gray-900 mb-2'>选择团队成员开始聊天</h3>
							<p className='text-gray-500 text-sm sm:text-base px-4'>
								<span className='hidden lg:inline'>从左侧成员列表中</span>
								<span className='lg:hidden'>点击上方按钮查看成员列表，</span>
								选择一个成员开始对话
							</p>

							{/* 快捷操作 */}
							<div className='mt-8 space-y-3'>
								<div className='flex items-center justify-center space-x-4 text-sm text-gray-500'>
									<span>💡 快捷操作：</span>
								</div>
								<div className='flex flex-wrap justify-center gap-2'>
									<span className='px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200'>@提及成员</span>
									<span className='px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200'>发送文件</span>
									<span className='px-3 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200'>语音通话</span>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
