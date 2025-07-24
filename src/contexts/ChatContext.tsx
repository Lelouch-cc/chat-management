'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ChatManager } from '../lib/chat/ChatManager';
import { ChatAPI } from '../services/ChatAPI';
import type { ServerMessage, MessageListener, PresenceListener } from '../types/chat';

interface User {
  handle: number;
  username: string;
}

interface ChatContextType {
  chatManager: ChatManager;
  isConnected: boolean;
  currentUser: User | null;
  messages: ServerMessage[];
  onlineUsers: Map<number, boolean>;
  initialize: (user: User) => Promise<void>;
  sendMessage: (message: ServerMessage) => Promise<boolean>;
  acknowledgeMessages: (chatId: number, messageIds: string[]) => Promise<boolean>;
  disconnect: () => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  chatAPI?: {
    getAblyTokenRequest(): Promise<{ data: unknown }>;
  };
}

export function ChatProvider({ children, chatAPI }: ChatProviderProps) {
  const [chatManager] = useState(() => ChatManager.getInstance());
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ServerMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Map<number, boolean>>(new Map());

  useEffect(() => {
    if (chatAPI) {
      chatManager.setChatAPI(chatAPI);
    } else {
      // 使用默认的 ChatAPI
      chatManager.setChatAPI(ChatAPI);
    }

    const messageListener: MessageListener = (message: ServerMessage) => {
      setMessages(prev => [...prev, message]);
    };

    const presenceListener: PresenceListener = (userHandle: number, isOnline: boolean) => {
      setOnlineUsers(prev => new Map(prev.set(userHandle, isOnline)));
    };

    chatManager.addMessageListener(messageListener);
    chatManager.addPresenceListener(presenceListener);

    return () => {
      chatManager.removeMessageListener(messageListener);
      chatManager.removePresenceListener(presenceListener);
    };
  }, [chatManager, chatAPI]);

  const initialize = async (user: User) => {
    try {
      await chatManager.initialize(user);
      setCurrentUser(user);
      setIsConnected(chatManager.isConnectedToChat);
    } catch (error) {
      console.error('Chat initialization failed:', error);
      throw error;
    }
  };

  const sendMessage = async (message: ServerMessage): Promise<boolean> => {
    try {
      const success = await chatManager.sendMessage(message);
      if (success) {
        setMessages(prev => [...prev, { ...message, status: 1 }]);
      }
      return success;
    } catch (error) {
      console.error('Send message failed:', error);
      setMessages(prev => [...prev, { ...message, status: -1 }]);
      return false;
    }
  };

  const acknowledgeMessages = async (chatId: number, messageIds: string[]): Promise<boolean> => {
    return await chatManager.acknowledgeMessages(chatId, messageIds);
  };

  const disconnect = async () => {
    await chatManager.disconnect();
    setIsConnected(false);
    setCurrentUser(null);
    setMessages([]);
    setOnlineUsers(new Map());
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const value: ChatContextType = {
    chatManager,
    isConnected,
    currentUser,
    messages,
    onlineUsers,
    initialize,
    sendMessage,
    acknowledgeMessages,
    disconnect,
    clearMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}