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
  AblyTokenRequestResponse,
  Publisher,
  Applicant,
  AdminUser,
  ChatChannelInfo,
  PublisherSwitchEvent,
  PublisherSwitchListener
} from '../../types/chat';
import { PublishEvent } from '../../types/chat';

interface ChatAPIInterface {
  getAblyTokenRequest(): Promise<{ data: AblyTokenRequestResponse }>;
}

/**
 * 多发布者聊天管理器
 * 支持一个管理账号管理多个发布者，每个发布者对应多个应聘者的聊天
 */
export class MultiPublisherChatManager {
  private static _instance: MultiPublisherChatManager;
  private realtime: Ably.Realtime | null = null;
  private currentAdminUser: AdminUser | null = null;
  private currentPublisher: Publisher | null = null;
  private activeChannels = new Map<string, Ably.RealtimeChannel>();
  private subscribedChannels = new Set<string>();
  private channelInfoMap = new Map<string, ChatChannelInfo>();
  
  private messageListeners: MessageListener[] = [];
  private presenceListeners: PresenceListener[] = [];
  private publisherSwitchListeners: PublisherSwitchListener[] = [];
  
  private isConnected = false;
  private isInitialized = false;
  
  private chatAPI: ChatAPIInterface;

  static getInstance(): MultiPublisherChatManager {
    if (!MultiPublisherChatManager._instance) {
      MultiPublisherChatManager._instance = new MultiPublisherChatManager();
    }
    return MultiPublisherChatManager._instance;
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

  async initialize(adminUser: AdminUser): Promise<void> {
    if (this.isInitialized) {
      this.log('MultiPublisherChatManager 已在初始化中或已初始化，跳过重复初始化');
      return;
    }

    try {
      if (this.currentAdminUser && adminUser.handle !== this.currentAdminUser.handle) {
        this.log('检测到管理员用户变更，执行完全重新初始化');
        await this.fullReset();
      }

      this.currentAdminUser = adminUser;
      await this.connectToAbly();

      this.isInitialized = true;
      this.log('MultiPublisherChatManager 初始化完成');
    } catch (error) {
      this.log(`MultiPublisherChatManager 初始化失败: ${error}`);
      this.isInitialized = false;
      throw error;
    }
  }

  async fullReset(): Promise<void> {
    this.log('执行 MultiPublisherChatManager 完全重置');

    await this.cleanupAllConnections();

    this.isConnected = false;
    this.isInitialized = false;
    this.currentAdminUser = null;
    this.currentPublisher = null;
    this.subscribedChannels.clear();
    this.channelInfoMap.clear();
  }

  private async cleanupAllConnections(): Promise<void> {
    // 清理所有活跃的频道
    for (const [channelName, channel] of this.activeChannels) {
      try {
        await channel.presence.leave();
        await channel.detach();
        this.log(`清理频道: ${channelName}`);
      } catch (error) {
        this.log(`清理频道失败 ${channelName}: ${error}`);
      }
    }
    this.activeChannels.clear();

    if (this.realtime) {
      try {
        this.realtime.close();
      } catch (error) {
        this.log(`关闭 Ably 连接失败: ${error}`);
      }
      this.realtime = null;
    }
  }

  private async connectToAbly(): Promise<void> {
    if (!this.currentAdminUser) {
      throw new Error('管理员用户未初始化');
    }

    if (this.realtime && this.isConnected && this.currentAdminUser.handle) {
      this.log('Ably 已连接，跳过重复连接');
      return;
    }

    try {
      await this.cleanupAllConnections();

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
          this.log('Ably连接成功，开始订阅管理员频道');
          this.subscribeToAdminChannel();
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

  private subscribeToAdminChannel(): void {
    if (!this.currentAdminUser || !this.realtime) return;

    const adminChannelName = ChannelManager.getMyChannel({
      handle: this.currentAdminUser.handle,
      username: this.currentAdminUser.username
    });

    if (this.subscribedChannels.has(adminChannelName)) {
      this.log(`管理员频道 ${adminChannelName} 已订阅，跳过重复订阅`);
      return;
    }

    try {
      const adminChannel = this.realtime.channels.get(adminChannelName);
      this.activeChannels.set(adminChannelName, adminChannel);

      adminChannel.subscribe((message: Ably.Message) => {
        this.handleIncomingMessage(message);
      });

      adminChannel.presence.subscribe((presenceMessage: Ably.PresenceMessage) => {
        const userHandle = parseInt(presenceMessage.clientId || '0');
        if (userHandle) {
          const isOnline = presenceMessage.action === 'enter' || presenceMessage.action === 'update';
          this.presenceListeners.forEach(listener => {
            listener(userHandle, isOnline);
          });
        }
      });

      this.subscribedChannels.add(adminChannelName);
      this.log(`订阅管理员频道: ${adminChannelName}`);
    } catch (error) {
      this.log(`订阅管理员频道失败: ${error}`);
    }
  }

  // 切换发布者并订阅对应的聊天频道
  async switchPublisher(publisher: Publisher): Promise<boolean> {
    if (!this.isConnected || !this.realtime) {
      this.log('未连接到Ably，无法切换发布者');
      return false;
    }

    const previousPublisher = this.currentPublisher;

    try {
      // 如果有之前的发布者，取消订阅其相关频道
      if (previousPublisher) {
        await this.unsubscribePublisherChannels(previousPublisher);
      }

      this.currentPublisher = publisher;

      // 订阅新发布者的频道
      await this.subscribePublisherChannels(publisher);

      // 触发发布者切换事件
      const switchEvent: PublisherSwitchEvent = {
        previousPublisher,
        currentPublisher: publisher,
        timestamp: Date.now()
      };

      this.publisherSwitchListeners.forEach(listener => {
        try {
          listener(switchEvent);
        } catch (error) {
          this.log(`发布者切换监听器错误: ${error}`);
        }
      });

      this.log(`切换到发布者: ${publisher.name} (ID: ${publisher.id})`);
      return true;
    } catch (error) {
      this.log(`切换发布者失败: ${error}`);
      return false;
    }
  }

  // 订阅发布者相关的聊天频道
  private async subscribePublisherChannels(publisher: Publisher): Promise<void> {
    if (!this.realtime) return;

    const publisherChannelName = ChannelManager.getMyChannel({
      handle: publisher.handle,
      username: publisher.name
    });

    if (!this.subscribedChannels.has(publisherChannelName)) {
      try {
        const channel = this.realtime.channels.get(publisherChannelName);
        this.activeChannels.set(publisherChannelName, channel);

        channel.subscribe((message: Ably.Message) => {
          this.handleIncomingMessage(message, publisher.id);
        });

        channel.presence.subscribe((presenceMessage: Ably.PresenceMessage) => {
          const userHandle = parseInt(presenceMessage.clientId || '0');
          if (userHandle) {
            const isOnline = presenceMessage.action === 'enter' || presenceMessage.action === 'update';
            this.presenceListeners.forEach(listener => {
              listener(userHandle, isOnline);
            });
          }
        });

        this.subscribedChannels.add(publisherChannelName);

        // 记录频道信息
        const channelInfo: ChatChannelInfo = {
          publisherId: publisher.id,
          applicantId: 0, // 发布者自己的频道
          channelName: publisherChannelName,
          isSubscribed: true,
          lastActivity: Date.now()
        };
        this.channelInfoMap.set(publisherChannelName, channelInfo);

        this.log(`订阅发布者频道: ${publisherChannelName}`);
      } catch (error) {
        this.log(`订阅发布者频道失败 ${publisherChannelName}: ${error}`);
      }
    }
  }

  // 取消订阅发布者相关的聊天频道
  private async unsubscribePublisherChannels(publisher: Publisher): Promise<void> {
    const publisherChannelName = ChannelManager.getMyChannel({
      handle: publisher.handle,
      username: publisher.name
    });

    const channel = this.activeChannels.get(publisherChannelName);
    if (channel) {
      try {
        await channel.presence.leave();
        await channel.detach();
        this.activeChannels.delete(publisherChannelName);
        this.subscribedChannels.delete(publisherChannelName);
        this.channelInfoMap.delete(publisherChannelName);
        this.log(`取消订阅发布者频道: ${publisherChannelName}`);
      } catch (error) {
        this.log(`取消订阅发布者频道失败 ${publisherChannelName}: ${error}`);
      }
    }
  }

  // 为特定申请者订阅聊天频道
  async subscribeApplicantChannel(applicant: Applicant): Promise<boolean> {
    if (!this.realtime || !this.currentPublisher) {
      this.log('无法订阅申请者频道：未连接或未选择发布者');
      return false;
    }

    const applicantChannelName = ChannelManager.getMyChannel({
      handle: applicant.handle,
      username: applicant.name
    });

    if (this.subscribedChannels.has(applicantChannelName)) {
      this.log(`申请者频道 ${applicantChannelName} 已订阅`);
      return true;
    }

    try {
      const channel = this.realtime.channels.get(applicantChannelName);
      this.activeChannels.set(applicantChannelName, channel);

      channel.subscribe((message: Ably.Message) => {
        this.handleIncomingMessage(message, this.currentPublisher!.id, applicant.id);
      });

      this.subscribedChannels.add(applicantChannelName);

      // 记录频道信息
      const channelInfo: ChatChannelInfo = {
        publisherId: this.currentPublisher.id,
        applicantId: applicant.id,
        channelName: applicantChannelName,
        isSubscribed: true,
        lastActivity: Date.now()
      };
      this.channelInfoMap.set(applicantChannelName, channelInfo);

      this.log(`订阅申请者频道: ${applicantChannelName}`);
      return true;
    } catch (error) {
      this.log(`订阅申请者频道失败 ${applicantChannelName}: ${error}`);
      return false;
    }
  }

  private async handleIncomingMessage(
    message: Ably.Message, 
    publisherId?: number, 
    applicantId?: number
  ): Promise<void> {
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

      // 如果有发布者ID和申请者ID，添加到消息中用于路由
      const extendedMessage = serverMessage as ServerMessage & { publisherId?: number; applicantId?: number };
      if (publisherId) {
        extendedMessage.publisherId = publisherId;
      }
      if (applicantId) {
        extendedMessage.applicantId = applicantId;
      }

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
    if (!this.currentAdminUser) {
      throw new Error('Admin user not initialized');
    }

    const messageId = uuidv4();

    const serverMessage: ServerMessage = {
      chatId: params.chatId,
      messageId,
      messageType: params.messageType,
      content: JSON.stringify(params.content),
      senderId: this.currentAdminUser.handle,
      receiverId: params.receiverHandle,
      timestamp: Date.now(),
      status: 0, // 发送中
    };

    return serverMessage;
  }

  async sendMessage(message: ServerMessage): Promise<boolean> {
    if (!this.currentAdminUser || !this.isConnected || !this.realtime) {
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
    if (!this.currentAdminUser || !this.isConnected || !this.realtime) {
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

  // 监听器管理
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

  addPublisherSwitchListener(listener: PublisherSwitchListener): void {
    this.publisherSwitchListeners.push(listener);
  }

  removePublisherSwitchListener(listener: PublisherSwitchListener): void {
    const index = this.publisherSwitchListeners.indexOf(listener);
    if (index > -1) {
      this.publisherSwitchListeners.splice(index, 1);
    }
  }

  async disconnect(): Promise<void> {
    this.log('开始断开 MultiPublisherChatManager 连接');

    await this.cleanupAllConnections();

    this.isConnected = false;
    this.isInitialized = false;
    this.currentAdminUser = null;
    this.currentPublisher = null;

    this.messageListeners.length = 0;
    this.presenceListeners.length = 0;
    this.publisherSwitchListeners.length = 0;

    this.log('MultiPublisherChatManager 连接已断开');
  }

  // Getters
  get isConnectedToChat(): boolean {
    return this.isConnected;
  }

  get getCurrentAdminUser(): AdminUser | null {
    return this.currentAdminUser;
  }

  get getCurrentPublisher(): Publisher | null {
    return this.currentPublisher;
  }

  get getActiveChannels(): Map<string, ChatChannelInfo> {
    return this.channelInfoMap;
  }

  async forceReinitialize(adminUser: AdminUser): Promise<void> {
    this.log('强制重新初始化 MultiPublisherChatManager');
    this.isInitialized = false;
    await this.initialize(adminUser);
  }

  private log(message: string): void {
    console.log(`[MultiPublisherChatManager] ${message}`);
  }
}