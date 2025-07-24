import type { ServerMessage, AblyTokenRequestResponse, AesKeyResponse } from './chat';

// 分页获取消息列表响应模型
export interface MessageListResponse {
  messages: ServerMessage[];
  lastEvaluatedKey?: LastEvaluatedKey;
}

// 分页键模型
export interface LastEvaluatedKey {
  chatId?: number;
  lastTimestamp?: number;
  messageId?: string;
}

// 聊天会话模型
export interface ChatSession {
  id?: number;
  chatId: number;
  chatUserHandle: number;
  lastMessageTime?: number;
  userId?: string;
  nickname?: string;
  photosJson?: string;
  gender?: number;
  birthday?: string;
  lastMessage?: string;
  unreadCount?: number;
  isOnline?: boolean;
  avatarUrl?: string;
}

// 会话列表响应模型
export interface ChatSessionListResponse {
  chats?: ChatSession[];
  pageSize?: number;
  hasMore?: number;
}

// 创建会话请求模型
export interface CreateSessionRequest {
  userHandle: number;
  targetUserHandle: number;
}

// 创建会话响应模型
export interface CreateSessionResponse {
  chatId: number;
}

// 消息内容基类
export interface MessageContentBase {
  type: 'text' | 'image' | 'file';
}

// 文本消息内容
export interface TextContent extends MessageContentBase {
  type: 'text';
  text: string;
}

// 图片消息内容
export interface ImageContent extends MessageContentBase {
  type: 'image';
  url: string;
  width: number;
  height: number;
}

// 文件消息内容
export interface FileContent extends MessageContentBase {
  type: 'file';
  url: string;
  filename: string;
  size: number;
  mimeType?: string;
}

export type ChatMessageContent = TextContent | ImageContent | FileContent;

// 消息确认模型
export interface MessageAck {
  chatId: number;
  messageIds: string[];
}

// API 请求参数类型
export interface GetUnreadMessagesParams {
  lastEvaluatedKey?: LastEvaluatedKey;
}

export interface GetHistoryMessagesParams {
  chatId: number;
  lastEvaluatedKey?: LastEvaluatedKey;
}

export interface CreateChatSessionParams {
  targetUserHandle: number;
}

// 扩展 ServerMessage 添加解析内容的方法
export interface ExtendedServerMessage extends ServerMessage {
  getDecodedContent(): ChatMessageContent | null;
  getMessageContentText(): string;
}

// 消息类型枚举
export enum MessageType {
  TEXT = 1,
  IMAGE = 2,
  FILE = 3,
}

// 消息状态枚举
export enum MessageStatus {
  SENDING = 0,
  SENT = 1,
  FAILED = 2,
}

// API 响应类型重新导出
export type { AblyTokenRequestResponse, AesKeyResponse };