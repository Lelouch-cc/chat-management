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