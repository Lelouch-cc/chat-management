import * as Ably from 'ably';
import { v4 as uuidv4 } from 'uuid';
import { ChannelManager } from './ChannelManager';
import type {
  AblyMessage,
  AblyMessageProperties,
  ServerMessage,
  MessageContent,
  MessageListener,
  PresenceListener,
  AblyTokenRequestResponse
} from '../../types/chat';
import { PublishEvent } from '../../types/chat';

interface User {
  handle: number;
  username: string;
}

interface ChatAPIInterface {
  getAblyTokenRequest(): Promise<{ data: AblyTokenRequestResponse }>;
}

export class ChatManager {
  private static _instance: ChatManager;
  private realtime: Ably.Realtime | null = null;
  private currentUser: User | null = null;
  private messageChannel: Ably.RealtimeChannel | null = null;
  private messageListeners: MessageListener[] = [];
  private presenceListeners: PresenceListener[] = [];
  private isConnected = false;
  private isInitialized = false;
  private subscribedChannels = new Set<string>();
  private chatAPI: ChatAPIInterface;

  static getInstance(): ChatManager {
    if (!ChatManager._instance) {
      ChatManager._instance = new ChatManager();
    }
    return ChatManager._instance;
  }

  private constructor() {
    this.chatAPI = {
      getAblyTokenRequest: async () => {
        throw new Error('ChatAPI not implemented. Please set the API implementation.');
      }
    };
  }

  setChatAPI(api: ChatAPIInterface): void {
    this.chatAPI = api;
  }

  async initialize(user: User): Promise<void> {
    if (this.isInitialized) {
      this.log('ChatManager 已在初始化中或已初始化，跳过重复初始化');
      return;
    }

    try {
      if (this.currentUser && user.handle !== this.currentUser.handle) {
        this.log('检测到用户变更，执行完全重新初始化');
        await this.fullReset();
      }

      this.currentUser = user;
      await this.connectToAbly();

      this.isInitialized = true;
      this.log('ChatManager 初始化完成');
    } catch (error) {
      this.log(`ChatManager 初始化失败: ${error}`);
      this.isInitialized = false;
      throw error;
    }
  }

  async fullReset(): Promise<void> {
    this.log('执行 ChatManager 完全重置');

    await this.cleanupConnection();

    this.isConnected = false;
    this.isInitialized = false;
    this.currentUser = null;
    this.subscribedChannels.clear();
  }

  private async cleanupConnection(): Promise<void> {
    if (this.messageChannel) {
      try {
        await this.messageChannel.presence.leave();
        await this.messageChannel.detach();
      } catch (error) {
        this.log(`清理消息频道失败: ${error}`);
      }
      this.messageChannel = null;
    }

    if (this.realtime) {
      try {
        this.realtime.close();
      } catch (error) {
        this.log(`关闭 Ably 连接失败: ${error}`);
      }
      this.realtime = null;
    }

    this.subscribedChannels.clear();
  }

  private async connectToAbly(): Promise<void> {
    if (!this.currentUser) {
      throw new Error('用户未初始化');
    }

    if (this.realtime && this.isConnected && this.currentUser.handle) {
      this.log('Ably 已连接，跳过重复连接');
      return;
    }

    try {
      await this.cleanupConnection();

      const clientOptions: Ably.ClientOptions = {
        authCallback: async () => {
          const tokenResponse = await this.chatAPI.getAblyTokenRequest();
          return tokenResponse.data.tokenRequest;
        },
        disconnectedRetryTimeout: 5000,
      };

      this.realtime = new Ably.Realtime(clientOptions);

      this.realtime.connection.on((stateChange: Ably.ConnectionStateChange) => {
        if (stateChange.current === 'connected') {
          this.isConnected = true;
          this.subscribeToMessageChannel();
        } else if (stateChange.current === 'failed') {
          this.isConnected = false;
          this.log(`Ably连接失败: ${stateChange.reason?.message}`);
        } else if (stateChange.current === 'disconnected') {
          this.isConnected = false;
          this.log('Ably连接断开');
        }
      });

      this.log('连接Ably成功');
    } catch (error) {
      this.log(`连接Ably失败: ${error}`);
      throw error;
    }
  }

  private subscribeToMessageChannel(): void {
    if (!this.currentUser || !this.realtime) return;

    const channelName = ChannelManager.getMyChannel(this.currentUser);

    if (this.subscribedChannels.has(channelName)) {
      this.log(`频道 ${channelName} 已订阅，跳过重复订阅`);
      return;
    }

    try {
      this.messageChannel = this.realtime.channels.get(channelName);

      this.messageChannel.subscribe((message: Ably.Message) => {
        this.handleIncomingMessage(message);
      });

      this.messageChannel.presence.subscribe((presenceMessage: Ably.PresenceMessage) => {
        const userHandle = parseInt(presenceMessage.clientId || '0');
        if (userHandle) {
          const isOnline = presenceMessage.action === 'enter' || presenceMessage.action === 'update';

          this.presenceListeners.forEach(listener => {
            listener(userHandle, isOnline);
          });
        }
      });

      this.subscribedChannels.add(channelName);

      this.log(`Ably 订阅自己的消息通道: ${channelName}`);
    } catch (error) {
      this.log(`订阅消息频道失败: ${error}`);
    }
  }

  private async handleIncomingMessage(message: Ably.Message): Promise<void> {
    try {
      const messageData = typeof message.data === 'string' 
        ? JSON.parse(message.data) 
        : message.data;
      const ablyMessage = messageData as AblyMessage;
      const properties = ablyMessage.properties;

      this.log(`收到消息: ${message.toString()}`);

      const serverMessage: ServerMessage = {
        chatId: properties.chatId,
        messageId: properties.messageId,
        messageType: properties.messageType,
        content: properties.content,
        senderId: properties.senderId,
        receiverId: properties.receiverId,
        timestamp: Date.now(),
      };

      this.messageListeners.forEach(listener => {
        listener(serverMessage);
      });
    } catch (error) {
      this.log(`处理接收消息失败: ${error}`);
    }
  }

  createMessage(params: {
    chatId: number;
    receiverHandle: number;
    messageType: number;
    content: MessageContent;
  }): ServerMessage {
    if (!this.currentUser) {
      throw new Error('User not initialized');
    }

    const messageId = uuidv4();
    const contentJson = JSON.stringify(params.content);

    const serverMessage: ServerMessage = {
      chatId: params.chatId,
      messageId,
      messageType: params.messageType,
      content: contentJson,
      senderId: this.currentUser.handle,
      receiverId: params.receiverHandle,
      timestamp: Date.now(),
      status: 0, // 发送中
    };

    return serverMessage;
  }

  async sendMessage(message: ServerMessage): Promise<boolean> {
    if (!this.currentUser || !this.isConnected || !this.realtime) {
      throw new Error('Not connected to chat server');
    }

    try {
      const properties: AblyMessageProperties = {
        chatId: message.chatId!,
        messageId: message.messageId!,
        messageType: message.messageType!,
        content: message.content!,
        senderId: message.senderId!,
        receiverId: message.receiverId!,
      };

      const ablyMessage: AblyMessage = { properties };

      const channelName = ChannelManager.getSendChannel(message.receiverId!);
      const channel = this.realtime.channels.get(channelName);
      
      await channel.publish(PublishEvent.ABLY_CHAT, JSON.stringify(ablyMessage));

      this.log(`发送消息成功: ${JSON.stringify(ablyMessage)}`);
      return true;
    } catch (error) {
      this.log(`发送消息失败: ${error}`);
      return false;
    }
  }

  async acknowledgeMessages(chatId: number, messageIds: string[]): Promise<boolean> {
    if (!this.currentUser || !this.isConnected || !this.realtime) {
      this.log('未连接到聊天服务器，无法确认消息已读');
      return false;
    }

    try {
      const ackData = { chat_id: chatId, message_ids: messageIds };

      const channelName = ChannelManager.getReadChannel();
      const channel = this.realtime.channels.get(channelName);

      await channel.publish(PublishEvent.ABLY_ACK, ackData);

      this.log(`确认消息已读成功: 聊天ID=${chatId}, 消息IDs=${messageIds}`);
      return true;
    } catch (error) {
      this.log(`确认消息已读失败: ${error}`);
      return false;
    }
  }

  addMessageListener(listener: MessageListener): void {
    this.messageListeners.push(listener);
  }

  removeMessageListener(listener: MessageListener): void {
    const index = this.messageListeners.indexOf(listener);
    if (index > -1) {
      this.messageListeners.splice(index, 1);
    }
  }

  addPresenceListener(listener: PresenceListener): void {
    this.presenceListeners.push(listener);
  }

  removePresenceListener(listener: PresenceListener): void {
    const index = this.presenceListeners.indexOf(listener);
    if (index > -1) {
      this.presenceListeners.splice(index, 1);
    }
  }

  async disconnect(): Promise<void> {
    this.log('开始断开 ChatManager 连接');

    await this.cleanupConnection();

    this.isConnected = false;
    this.isInitialized = false;
    this.currentUser = null;

    this.messageListeners.length = 0;
    this.presenceListeners.length = 0;

    this.log('ChatManager 连接已断开');
  }

  get isConnectedToChat(): boolean {
    return this.isConnected;
  }

  get getCurrentUser(): User | null {
    return this.currentUser;
  }

  async forceReinitialize(user: User): Promise<void> {
    this.log('强制重新初始化 ChatManager');

    this.isInitialized = false;

    await this.initialize(user);
  }

  private log(message: string): void {
    console.log(`[ChatManager] ${message}`);
  }
}