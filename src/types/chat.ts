// Common interfaces for chat features

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
  username?: string; // Made optional as it might not always be present
  email?: string; // Added for user search functionality
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar: string;
  timestamp: any;
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  edited: boolean;
  editedAt?: any;
  reactions: {
    [emoji: string]: string[]; // userIds que reaccionaron con este emoji
  };
  isTemporary?: boolean;
  expiresAt?: any;
  isEncrypted?: boolean;
  reportedBy?: string[];
  attachments?: {
    type: 'image' | 'file' | 'audio';
    url: string;
    name?: string;
    size?: number;
  }[];
  replyTo?: {
    id: string;
    text: string;
    userId: string;
    userName: string;
  };
}

export interface ChatUserInfo {
  id: string;
  displayName: string;
  photoURL?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: any;
  isTyping?: boolean;
  blockedBy?: string[];
}

export interface Chat {
  id: string;
  participants: string[];
  isGroup: boolean;
  groupName?: string;
  groupImage?: string;
  groupDescription?: string;
  groupSettings?: {
    onlyAdminsCanPost: boolean;
    onlyAdminsCanAddMembers: boolean;
    allowMemberInvites: boolean;
    messageRetentionDays: number;
  };
  roles: {
    [userId: string]: 'admin' | 'moderator' | 'member';
  };
  lastMessage?: {
    text?: string;
    content?: string;
    timestamp: any;
    senderId?: string;
  };
  unreadCount?: number;
  userInfo?: ChatUserInfo;
  blockedUsers?: string[];
  createdAt: any;
  createdBy: string;
}

export interface MessageFilter {
  type?: 'text' | 'media' | 'file' | 'link';
  fromDate?: Date;
  toDate?: Date;
  fromUser?: string;
  containsText?: string;
  hasReactions?: boolean;
  isEncrypted?: boolean;
} 