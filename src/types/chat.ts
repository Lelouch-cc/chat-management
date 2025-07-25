export interface AblyTokenRequest {
  keyName?: string;
  ttl?: number;
  capability?: string;
  clientId?: string;
  timestamp?: number;
  nonce?: string;
  mac?: string;
}

export interface AblyTokenRequestResponse {
  tokenRequest: AblyTokenRequest;
}

export interface AesKeyResponse {
  keyId: number;
  key: string;
}

export interface AblyMessageProperties {
  chatId: number;
  messageId: string;
  messageType: number;
  content: string;
  senderId: number;
  receiverId: number;
}

export interface AblyMessage {
  properties: AblyMessageProperties;
}

export interface MessageContent {
  text?: string;
  image?: string;
  file?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ServerMessage {
  id?: number;
  chatId?: number;
  messageId?: string;
  messageType?: number;
  content?: string;
  senderId?: number;
  receiverId?: number;
  timestamp?: number;
  isRead?: boolean;
  status?: number; // 0: 发送中, 1: 发送成功, 2: 发送失败
}

export interface NotificationContent {
  title: string;
  body: string;
}

export interface PushNotificationRequest {
  userHandle: number;
  notification: NotificationContent;
  data?: Record<string, unknown>;
}

export enum PublishEvent {
  ABLY_CHAT = 'ably_chat',
  ABLY_ACK = 'ably_ack'
}

export type MessageListener = (message: ServerMessage) => void;
export type PresenceListener = (userHandle: number, isOnline: boolean) => void;

// 发布者接口
export interface Publisher {
  id: number;
  name: string;
  handle: number;
  avatar?: string;
  position?: string;
  department?: string;
  isActive: boolean;
}

// 应聘者/申请者接口
export interface Applicant {
  id: number;
  name: string;
  handle: number;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  appliedPosition: string;
  applicationDate: string;
  status: "pending" | "interviewing" | "rejected" | "hired";
  publisherId: number; // 对应的发布者ID
  chatId?: number; // 聊天会话ID
}

// 管理员用户接口
export interface AdminUser {
  handle: number;
  username: string;
  role: 'admin' | 'manager';
  publishers: Publisher[]; // 管理的发布者列表
}

// 多发布者聊天上下文
export interface MultiPublisherChatContext {
  currentPublisher: Publisher | null;
  publishers: Publisher[];
  applicantsByPublisher: Map<number, Applicant[]>;
  messagesByApplicant: Map<number, ServerMessage[]>;
  onlineApplicants: Map<number, boolean>;
}

// 发布者切换事件
export interface PublisherSwitchEvent {
  previousPublisher: Publisher | null;
  currentPublisher: Publisher;
  timestamp: number;
}

// 聊天通道信息
export interface ChatChannelInfo {
  publisherId: number;
  applicantId: number;
  channelName: string;
  isSubscribed: boolean;
  lastActivity?: number;
}

export type PublisherSwitchListener = (event: PublisherSwitchEvent) => void;
export type ApplicantStatusListener = (applicantId: number, status: Applicant['status']) => void;