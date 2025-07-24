import type { ServerMessage } from '../types/chat';
import type { ChatMessageContent, TextContent, ImageContent, FileContent, MessageType } from '../types/chat-api';

/**
 * 消息内容解析工具
 * 参考 hirely_flutter 项目的消息解析逻辑
 */
export class MessageParser {
  /**
   * 解析消息内容
   */
  static parseMessageContent(message: ServerMessage): ChatMessageContent | null {
    if (!message.content) return null;

    try {
      const contentMap = JSON.parse(message.content);

      switch (message.messageType) {
        case MessageType.TEXT:
          return {
            type: 'text',
            text: contentMap.text || '',
          } as TextContent;

        case MessageType.IMAGE:
          return {
            type: 'image',
            url: contentMap.url || '',
            width: contentMap.width || 0,
            height: contentMap.height || 0,
          } as ImageContent;

        case MessageType.FILE:
          return {
            type: 'file',
            url: contentMap.url || '',
            filename: contentMap.filename || '',
            size: contentMap.size || 0,
            mimeType: contentMap.mimeType,
          } as FileContent;

        default:
          return null;
      }
    } catch (error) {
      console.error('解析消息内容失败:', error);
      return null;
    }
  }

  /**
   * 获取消息内容的文本描述
   */
  static getMessageContentText(message: ServerMessage): string {
    if (!message.content) return '';

    try {
      const contentMap = JSON.parse(message.content);

      switch (message.messageType) {
        case MessageType.TEXT:
          return contentMap.text || '';

        case MessageType.IMAGE:
          return '[图片]';

        case MessageType.FILE:
          return `[文件] ${contentMap.filename || '未知文件'}`;

        default:
          return '';
      }
    } catch (error) {
      console.error('解析消息文本失败:', error);
      return '';
    }
  }

  /**
   * 创建文本消息内容
   */
  static createTextContent(text: string): string {
    const content: TextContent = {
      type: 'text',
      text,
    };
    return JSON.stringify(content);
  }

  /**
   * 创建图片消息内容
   */
  static createImageContent(url: string, width: number, height: number): string {
    const content: ImageContent = {
      type: 'image',
      url,
      width,
      height,
    };
    return JSON.stringify(content);
  }

  /**
   * 创建文件消息内容
   */
  static createFileContent(
    url: string,
    filename: string,
    size: number,
    mimeType?: string
  ): string {
    const content: FileContent = {
      type: 'file',
      url,
      filename,
      size,
      mimeType,
    };
    return JSON.stringify(content);
  }

  /**
   * 验证消息内容格式
   */
  static validateMessageContent(content: string, messageType: number): boolean {
    try {
      const contentMap = JSON.parse(content);

      switch (messageType) {
        case MessageType.TEXT:
          return typeof contentMap.text === 'string';

        case MessageType.IMAGE:
          return (
            typeof contentMap.url === 'string' &&
            typeof contentMap.width === 'number' &&
            typeof contentMap.height === 'number'
          );

        case MessageType.FILE:
          return (
            typeof contentMap.url === 'string' &&
            typeof contentMap.filename === 'string' &&
            typeof contentMap.size === 'number'
          );

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
}

/**
 * 扩展 ServerMessage 添加解析方法
 */
export function extendServerMessage(message: ServerMessage): ServerMessage & {
  getDecodedContent(): ChatMessageContent | null;
  getMessageContentText(): string;
} {
  return {
    ...message,
    getDecodedContent: () => MessageParser.parseMessageContent(message),
    getMessageContentText: () => MessageParser.getMessageContentText(message),
  };
}