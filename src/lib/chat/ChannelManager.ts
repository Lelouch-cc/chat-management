interface User {
  handle: number;
  username: string;
}

export class ChannelManager {
  static getMyChannel(user: User): string {
    const userHandle = user?.handle ?? 0;
    return `chat:mailbox:${userHandle}`;
  }

  static getSendChannel(targetUserHandle: number): string {
    return `chat:mailbox:${targetUserHandle}`;
  }

  static getReadChannel(): string {
    return 'chat:ack:server';
  }
}