
export interface User {
  id: string;
  name: string;
  password?: string;
  avatarUrl?: string;
  color: string;
  isOnline: boolean;
  coins: number; // Nuevo sistema de economía
}

export interface Attachment {
  type: 'image' | 'video';
  url: string; // Base64
  name: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
  attachment?: Attachment; // Nuevo soporte para archivos
  stickerUrl?: string; // Nuevo soporte para stickers/gifs
}

export interface ChatState {
  messages: Message[];
  users: Record<string, User>;
}

export enum AppView {
  AUTH = 'AUTH',
  CHAT = 'CHAT',
}

export type ChatEventType = 'MESSAGE' | 'JOIN' | 'PRESENCE' | 'LEAVE' | 'USER_UPDATE';

export interface ChatEventPayload {
  type: ChatEventType;
  user?: User;
  message?: Message;
}
