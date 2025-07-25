'use client';

import { useCallback, useEffect, useState } from 'react';
import { MultiPublisherChatManager } from '../lib/chat/MultiPublisherChatManager';
import type { 
  ServerMessage, 
  MessageListener, 
  PresenceListener, 
  AblyTokenRequestResponse,
  Publisher,
  Applicant,
  AdminUser,
  MultiPublisherChatContext,
  PublisherSwitchEvent,
  PublisherSwitchListener,
  ApplicantStatusListener,
  ChatChannelInfo
} from '../types/chat';

interface UseMultiPublisherChatOptions {
  adminUser?: AdminUser;
  chatAPI?: {
    getAblyTokenRequest(): Promise<{ data: AblyTokenRequestResponse }>;
  };
  autoConnect?: boolean;
}

export function useMultiPublisherChat(options: UseMultiPublisherChatOptions = {}) {
  const { adminUser, chatAPI, autoConnect = false } = options;
  
  const [chatManager] = useState(() => MultiPublisherChatManager.getInstance());
  const [isConnected, setIsConnected] = useState(false);
  const [currentPublisher, setCurrentPublisher] = useState<Publisher | null>(null);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [applicantsByPublisher, setApplicantsByPublisher] = useState<Map<number, Applicant[]>>(new Map());
  const [messagesByApplicant, setMessagesByApplicant] = useState<Map<number, ServerMessage[]>>(new Map());
  const [onlineApplicants, setOnlineApplicants] = useState<Map<number, boolean>>(new Map());
  const [activeChannels, setActiveChannels] = useState<Map<string, ChatChannelInfo>>(new Map());
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // 监听器列表
  const [publisherSwitchListeners] = useState<PublisherSwitchListener[]>([]);
  const [applicantStatusListeners] = useState<ApplicantStatusListener[]>([]);

  const updateConnectionStatus = useCallback(() => {
    setIsConnected(chatManager.isConnectedToChat);
    setCurrentPublisher(chatManager.getCurrentPublisher);
  }, [chatManager]);

  // 初始化发布者列表
  useEffect(() => {
    if (adminUser?.publishers) {
      setPublishers(adminUser.publishers.filter(p => p.isActive));
      
      // 如果没有当前发布者，选择第一个活跃的发布者
      if (!currentPublisher && adminUser.publishers.length > 0) {
        const firstActivePublisher = adminUser.publishers.find(p => p.isActive);
        if (firstActivePublisher) {
          setCurrentPublisher(firstActivePublisher);
        }
      }
    }
  }, [adminUser, currentPublisher]);

  // 设置聊天API
  useEffect(() => {
    if (chatAPI) {
      chatManager.setChatAPI(chatAPI);
    }
  }, [chatManager, chatAPI]);

  // 消息监听器
  useEffect(() => {
    const messageListener: MessageListener = (message: ServerMessage) => {
      if (message.senderId && message.receiverId) {
        // 确定是哪个申请者的消息
        const applicantId = message.senderId === adminUser?.handle ? message.receiverId : message.senderId;
        
        setMessagesByApplicant(prev => {
          const newMap = new Map(prev);
          const existingMessages = newMap.get(applicantId) || [];
          newMap.set(applicantId, [...existingMessages, message]);
          return newMap;
        });
      }
    };

    const presenceListener: PresenceListener = (userHandle: number, isOnline: boolean) => {
      setOnlineApplicants(prev => new Map(prev.set(userHandle, isOnline)));
      
      // 更新申请者在线状态
      setApplicantsByPublisher(prev => {
        const newMap = new Map();
        prev.forEach((applicants, publisherId) => {
          const updatedApplicants = applicants.map(applicant => 
            applicant.handle === userHandle 
              ? { ...applicant, isOnline, lastSeen: isOnline ? undefined : new Date().toLocaleString() }
              : applicant
          );
          newMap.set(publisherId, updatedApplicants);
        });
        return newMap;
      });
    };

    chatManager.addMessageListener(messageListener);
    chatManager.addPresenceListener(presenceListener);

    updateConnectionStatus();

    return () => {
      chatManager.removeMessageListener(messageListener);
      chatManager.removePresenceListener(presenceListener);
    };
  }, [chatManager, adminUser, updateConnectionStatus]);

  // 初始化聊天管理器
  const initialize = useCallback(async (user: AdminUser) => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    try {
      // 使用管理员用户信息初始化
      await chatManager.initialize(user);
      updateConnectionStatus();
    } catch (error) {
      console.error('Multi-publisher chat initialization failed:', error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [chatManager, updateConnectionStatus, isInitializing]);

  // 自动连接
  useEffect(() => {
    if (autoConnect && adminUser && !isConnected && !isInitializing) {
      initialize(adminUser);
    }
  }, [autoConnect, adminUser, isConnected, isInitializing, initialize]);

  // 切换发布者
  const switchPublisher = useCallback(async (publisher: Publisher) => {
    if (!isConnected) {
      console.warn('Chat not connected, cannot switch publisher');
      return false;
    }

    try {
      const success = await chatManager.switchPublisher(publisher);
      if (success) {
        setCurrentPublisher(publisher);
        setSelectedApplicant(null); // 清除当前选中的申请者
        
        // 通知本地监听器
        publisherSwitchListeners.forEach(listener => {
          try {
            const switchEvent: PublisherSwitchEvent = {
              previousPublisher: currentPublisher,
              currentPublisher: publisher,
              timestamp: Date.now()
            };
            listener(switchEvent);
          } catch (error) {
            console.error('Error in publisher switch listener:', error);
          }
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to switch publisher:', error);
      return false;
    }
  }, [currentPublisher, isConnected, publisherSwitchListeners, chatManager]);

  // 加载发布者的申请者列表
  const loadApplicantsForPublisher = useCallback(async (publisherId: number, applicants: Applicant[]) => {
    setApplicantsByPublisher(prev => {
      const newMap = new Map(prev);
      newMap.set(publisherId, applicants);
      return newMap;
    });

    // 初始化这些申请者的消息映射
    applicants.forEach(applicant => {
      if (!messagesByApplicant.has(applicant.id)) {
        setMessagesByApplicant(prev => {
          const newMap = new Map(prev);
          newMap.set(applicant.id, []);
          return newMap;
        });
      }
    });
  }, [messagesByApplicant]);

  // 选择申请者开始聊天
  const selectApplicant = useCallback((applicant: Applicant) => {
    if (!currentPublisher) {
      console.warn('No current publisher selected');
      return;
    }

    if (applicant.publisherId !== currentPublisher.id) {
      console.warn('Applicant does not belong to current publisher');
      return;
    }

    setSelectedApplicant(applicant);
  }, [currentPublisher]);

  // 发送消息
  const sendMessage = useCallback(async (content: string, messageType: number = 1): Promise<boolean> => {
    if (!selectedApplicant || !adminUser || !currentPublisher) {
      console.warn('Cannot send message: missing required data');
      return false;
    }

    try {
      const message = chatManager.createMessage({
        chatId: selectedApplicant.chatId || selectedApplicant.id,
        receiverHandle: selectedApplicant.handle,
        messageType,
        content: { text: content }
      });

      const success = await chatManager.sendMessage(message);
      
      if (success) {
        // 添加到本地消息列表
        setMessagesByApplicant(prev => {
          const newMap = new Map(prev);
          const existingMessages = newMap.get(selectedApplicant.id) || [];
          newMap.set(selectedApplicant.id, [...existingMessages, { ...message, status: 1 }]);
          return newMap;
        });
      }

      return success;
    } catch (error) {
      console.error('Send message failed:', error);
      return false;
    }
  }, [selectedApplicant, adminUser, currentPublisher, chatManager]);

  // 确认消息已读
  const acknowledgeMessages = useCallback(async (applicantId: number, messageIds: string[]): Promise<boolean> => {
    const applicant = currentPublisher && applicantsByPublisher.get(currentPublisher.id)?.find(a => a.id === applicantId);
    if (!applicant?.chatId) return false;

    return await chatManager.acknowledgeMessages(applicant.chatId, messageIds);
  }, [currentPublisher, applicantsByPublisher, chatManager]);

  // 获取申请者的消息
  const getApplicantMessages = useCallback((applicantId: number): ServerMessage[] => {
    return messagesByApplicant.get(applicantId) || [];
  }, [messagesByApplicant]);

  // 获取当前发布者的申请者列表
  const getCurrentPublisherApplicants = useCallback((): Applicant[] => {
    if (!currentPublisher) return [];
    return applicantsByPublisher.get(currentPublisher.id) || [];
  }, [currentPublisher, applicantsByPublisher]);

  // 检查申请者是否在线
  const isApplicantOnline = useCallback((applicantHandle: number): boolean => {
    return onlineApplicants.get(applicantHandle) ?? false;
  }, [onlineApplicants]);

  // 更新申请者状态
  const updateApplicantStatus = useCallback((applicantId: number, status: Applicant['status']) => {
    setApplicantsByPublisher(prev => {
      const newMap = new Map();
      prev.forEach((applicants, publisherId) => {
        const updatedApplicants = applicants.map(applicant => 
          applicant.id === applicantId ? { ...applicant, status } : applicant
        );
        newMap.set(publisherId, updatedApplicants);
      });
      return newMap;
    });

    // 通知状态监听器
    applicantStatusListeners.forEach(listener => {
      try {
        listener(applicantId, status);
      } catch (error) {
        console.error('Error in applicant status listener:', error);
      }
    });
  }, [applicantStatusListeners]);

  // 添加发布者切换监听器
  const addPublisherSwitchListener = useCallback((listener: PublisherSwitchListener) => {
    publisherSwitchListeners.push(listener);
    return () => {
      const index = publisherSwitchListeners.indexOf(listener);
      if (index > -1) {
        publisherSwitchListeners.splice(index, 1);
      }
    };
  }, [publisherSwitchListeners]);

  // 添加申请者状态监听器
  const addApplicantStatusListener = useCallback((listener: ApplicantStatusListener) => {
    applicantStatusListeners.push(listener);
    return () => {
      const index = applicantStatusListeners.indexOf(listener);
      if (index > -1) {
        applicantStatusListeners.splice(index, 1);
      }
    };
  }, [applicantStatusListeners]);

  // 断开连接
  const disconnect = useCallback(async () => {
    await chatManager.disconnect();
    setIsConnected(false);
    setCurrentPublisher(null);
    setSelectedApplicant(null);
    setMessagesByApplicant(new Map());
    setOnlineApplicants(new Map());
    setActiveChannels(new Map());
  }, [chatManager]);

  // 清除消息
  const clearMessages = useCallback(() => {
    setMessagesByApplicant(new Map());
  }, []);

  // 获取多发布者聊天上下文
  const getContext = useCallback((): MultiPublisherChatContext => {
    return {
      currentPublisher,
      publishers,
      applicantsByPublisher,
      messagesByApplicant,
      onlineApplicants,
    };
  }, [currentPublisher, publishers, applicantsByPublisher, messagesByApplicant, onlineApplicants]);

  return {
    // 状态
    isConnected,
    currentPublisher,
    publishers,
    selectedApplicant,
    isInitializing,
    activeChannels,

    // 操作
    initialize,
    switchPublisher,
    loadApplicantsForPublisher,
    selectApplicant,
    sendMessage,
    acknowledgeMessages,
    updateApplicantStatus,
    disconnect,
    clearMessages,

    // 获取数据
    getApplicantMessages,
    getCurrentPublisherApplicants,
    isApplicantOnline,
    getContext,

    // 监听器管理
    addPublisherSwitchListener,
    addApplicantStatusListener,

    // 管理器实例
    chatManager,
  };
}