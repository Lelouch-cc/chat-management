import { httpClient, ApiService } from '../lib/http';
import type { ApiResponse } from '../types/api';
import type {
  AblyTokenRequestResponse,
  AesKeyResponse,
  MessageListResponse,
  ChatSessionListResponse,
  CreateSessionResponse,
  GetUnreadMessagesParams,
  GetHistoryMessagesParams,
  CreateChatSessionParams,
} from '../types/chat-api';

/**
 * 聊天API接口类
 * 参考 hirely_flutter 项目的 ChatAPIJobbit 实现
 */
export class ChatAPI extends ApiService {
  private static readonly MIDDLEWARE_URL = '/jobbit/v1';

  /**
   * 获取Ably Token请求
   */
  static async getAblyTokenRequest(): Promise<ApiResponse<AblyTokenRequestResponse>> {
    try {
      return await httpClient.get<AblyTokenRequestResponse>(
        `${this.MIDDLEWARE_URL}/chat/token`
      );
    } catch (error) {
      console.error('获取Ably Token失败:', error);
      throw error;
    }
  }

  /**
   * 获取AES密钥
   */
  static async getAesKey(): Promise<ApiResponse<AesKeyResponse>> {
    try {
      return await httpClient.get<AesKeyResponse>(
        `${this.MIDDLEWARE_URL}/chat/key`
      );
    } catch (error) {
      console.error('获取AES密钥失败:', error);
      throw error;
    }
  }

  /**
   * 创建聊天会话
   */
  static async createChatSession(params: CreateChatSessionParams): Promise<ApiResponse<CreateSessionResponse>> {
    try {
      const requestData = {
        data: {
          target_user_handle: params.targetUserHandle,
        },
      };

      return await httpClient.post<CreateSessionResponse>(
        `${this.MIDDLEWARE_URL}/chat/session`,
        requestData
      );
    } catch (error) {
      console.error('创建聊天会话失败:', error);
      throw error;
    }
  }

  /**
   * 获取未读消息
   */
  static async getUnreadMessages(params: GetUnreadMessagesParams = {}): Promise<ApiResponse<MessageListResponse>> {
    try {
      const requestData: Record<string, unknown> = { data: {} };
      
      if (params.lastEvaluatedKey) {
        requestData.data = {
          last_evaluated_key: params.lastEvaluatedKey,
        };
      }

      return await httpClient.post<MessageListResponse>(
        `${this.MIDDLEWARE_URL}/chat/unread`,
        requestData
      );
    } catch (error) {
      console.error('获取未读消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取历史消息
   */
  static async getHistoryMessages(params: GetHistoryMessagesParams): Promise<ApiResponse<MessageListResponse>> {
    try {
      const requestData: Record<string, unknown> = {
        data: {
          chat_id: params.chatId,
        },
      };

      if (params.lastEvaluatedKey) {
        (requestData.data as Record<string, unknown>).last_evaluated_key = params.lastEvaluatedKey;
      }

      return await httpClient.post<MessageListResponse>(
        `${this.MIDDLEWARE_URL}/chat/history`,
        requestData
      );
    } catch (error) {
      console.error('获取历史消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取会话列表
   * @param pageNum 页码，从 1 开始
   */
  static async getChatSessions(pageNum: number): Promise<ApiResponse<ChatSessionListResponse>> {
    try {
      const params = {
        page_num: pageNum,
      };

      return await httpClient.get<ChatSessionListResponse>(
        `${this.MIDDLEWARE_URL}/chat/list`,
        { params }
      );
    } catch (error) {
      console.error('获取会话列表失败:', error);
      throw error;
    }
  }

  /**
   * 发送推送通知（如果需要）
   */
  static async sendPushNotification(params: {
    userHandle: number;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<ApiResponse<unknown>> {
    try {
      const requestData = {
        user_handle: params.userHandle,
        notification: {
          title: params.title,
          body: params.body,
        },
        data: params.data,
      };

      return await httpClient.post<unknown>(
        `${this.MIDDLEWARE_URL}/chat/push`,
        requestData
      );
    } catch (error) {
      console.error('发送推送通知失败:', error);
      throw error;
    }
  }

  /**
   * 标记消息为已读
   */
  static async markMessagesAsRead(params: {
    chatId: number;
    messageIds: string[];
  }): Promise<ApiResponse<unknown>> {
    try {
      const requestData = {
        data: {
          chat_id: params.chatId,
          message_ids: params.messageIds,
        },
      };

      return await httpClient.post<unknown>(
        `${this.MIDDLEWARE_URL}/chat/read`,
        requestData
      );
    } catch (error) {
      console.error('标记消息已读失败:', error);
      throw error;
    }
  }

  /**
   * 删除消息
   */
  static async deleteMessage(params: {
    chatId: number;
    messageId: string;
  }): Promise<ApiResponse<unknown>> {
    try {
      return await httpClient.delete<unknown>(
        `${this.MIDDLEWARE_URL}/chat/message`,
        {
          params: {
            chat_id: params.chatId,
            message_id: params.messageId,
          },
        }
      );
    } catch (error) {
      console.error('删除消息失败:', error);
      throw error;
    }
  }

  /**
   * 上传聊天文件
   */
  static async uploadChatFile(file: File, chatId: number): Promise<ApiResponse<{ url: string; fileId: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chat_id', chatId.toString());

      return await httpClient.request<{ url: string; fileId: string }>({
        method: 'POST',
        url: `${this.MIDDLEWARE_URL}/chat/upload`,
        body: formData,
        headers: {
          // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
        },
      });
    } catch (error) {
      console.error('上传聊天文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户在线状态
   */
  static async getUserOnlineStatus(userHandles: number[]): Promise<ApiResponse<Record<number, boolean>>> {
    try {
      const requestData = {
        data: {
          user_handles: userHandles,
        },
      };

      return await httpClient.post<Record<number, boolean>>(
        `${this.MIDDLEWARE_URL}/chat/online-status`,
        requestData
      );
    } catch (error) {
      console.error('获取用户在线状态失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户在线状态
   */
  static async updateOnlineStatus(isOnline: boolean): Promise<ApiResponse<unknown>> {
    try {
      const requestData = {
        data: {
          is_online: isOnline,
        },
      };

      return await httpClient.post<unknown>(
        `${this.MIDDLEWARE_URL}/chat/status`,
        requestData
      );
    } catch (error) {
      console.error('更新在线状态失败:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const chatAPI = new ChatAPI();