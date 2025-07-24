'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChatManager } from '../lib/chat/ChatManager';
import type { ServerMessage, MessageContent, MessageListener, PresenceListener } from '../types/chat';

interface User {
  handle: number;
  username: string;
}

interface UseChatOptions {
  user?: User;
  chatAPI?: {
    getAblyTokenRequest(): Promise<{ data: unknown }>;
  };
  autoConnect?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { user, chatAPI, autoConnect = false } = options;
  
  const [chatManager] = useState(() => ChatManager.getInstance());
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Map<number, boolean>>(new Map());
  const [isInitializing, setIsInitializing] = useState(false);

  const updateConnectionStatus = useCallback(() => {
    setIsConnected(chatManager.isConnectedToChat);
    setCurrentUser(chatManager.getCurrentUser);
  }, [chatManager]);

  useEffect(() => {
    if (chatAPI) {
      chatManager.setChatAPI(chatAPI);
    }

    const messageListener: MessageListener = (message: ServerMessage) => {
      setMessages(prev => [...prev, message]);
    };

    const presenceListener: PresenceListener = (userHandle: number, isOnline: boolean) => {
      setOnlineUsers(prev => new Map(prev.set(userHandle, isOnline)));
    };

    chatManager.addMessageListener(messageListener);
    chatManager.addPresenceListener(presenceListener);

    updateConnectionStatus();

    return () => {
      chatManager.removeMessageListener(messageListener);
      chatManager.removePresenceListener(presenceListener);
    };
  }, [chatManager, chatAPI, updateConnectionStatus]);

  useEffect(() => {
    if (autoConnect && user && !isConnected && !isInitializing) {
      initialize(user);
    }
  }, [autoConnect, user, isConnected, isInitializing, initialize]);

  const initialize = useCallback(async (targetUser: User) => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    try {
      await chatManager.initialize(targetUser);
      updateConnectionStatus();
    } catch (error) {
      console.error('Chat initialization failed:', error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [chatManager, updateConnectionStatus, isInitializing]);

  const createMessage = useCallback((params: {
    chatId: number;
    receiverHandle: number;
    messageType: number;
    content: MessageContent;
  }): ServerMessage => {
    return chatManager.createMessage(params);
  }, [chatManager]);

  const sendMessage = useCallback(async (message: ServerMessage): Promise<boolean> => {
    try {
      const success = await chatManager.sendMessage(message);
      if (success) {
        setMessages(prev => prev.map(msg => 
          msg.messageId === message.messageId 
            ? { ...msg, status: 1 } 
            : msg
        ));
      } else {
        setMessages(prev => prev.map(msg => 
          msg.messageId === message.messageId 
            ? { ...msg, status: -1 } 
            : msg
        ));
      }
      return success;
    } catch (error) {
      console.error('Send message failed:', error);
      setMessages(prev => prev.map(msg => 
        msg.messageId === message.messageId 
          ? { ...msg, status: -1 } 
          : msg
      ));
      return false;
    }
  }, [chatManager]);

  const acknowledgeMessages = useCallback(async (chatId: number, messageIds: string[]): Promise<boolean> => {
    return await chatManager.acknowledgeMessages(chatId, messageIds);
  }, [chatManager]);

  const disconnect = useCallback(async () => {
    await chatManager.disconnect();
    setIsConnected(false);
    setCurrentUser(null);
    setMessages([]);
    setOnlineUsers(new Map());
  }, [chatManager]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const getFilteredMessages = useCallback((chatId?: number) => {
    if (chatId === undefined) return messages;
    return messages.filter(msg => msg.chatId === chatId);
  }, [messages]);

  const isUserOnline = useCallback((userHandle: number): boolean => {
    return onlineUsers.get(userHandle) ?? false;
  }, [onlineUsers]);

  return {
    // State
    isConnected,
    currentUser,
    messages,
    onlineUsers,
    isInitializing,

    // Actions
    initialize,
    createMessage,
    sendMessage,
    acknowledgeMessages,
    disconnect,
    clearMessages,

    // Helpers
    getFilteredMessages,
    isUserOnline,

    // Manager instance (for advanced usage)
    chatManager,
  };
}