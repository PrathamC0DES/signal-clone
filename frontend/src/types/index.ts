export type UserStatus = 'online' | 'offline' | 'typing';

export interface User {
  id: string;
  phoneNumber: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  about?: string;
  safetyNumber: string;
  isVerified?: boolean;
  color?: string;
  lastSeen?: number;
}

export type ConversationType = 'direct' | 'group';
export type DisappearingTimerValue = 0 | 30 | 300 | 3600 | 28800 | 86400 | 604800 | 2419200 | number;

export interface Attachment {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  duration?: number;
  waveform?: number[];
  width?: number;
  height?: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface PollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface PollData {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  isEnded?: boolean;
}

export type MessageDeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageContentType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'system' | 'poll';

export interface QuotedMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentThumbnail?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  timestamp: number;
  content: string;
  type: MessageContentType;
  status: MessageDeliveryStatus;
  reactions: Reaction[];
  attachments?: Attachment[];
  replyTo?: QuotedMessage;
  poll?: PollData;
  isDisappearing?: boolean;
  expireTimerSeconds?: DisappearingTimerValue;
  expiresAt?: number;
  isNoteToSelf?: boolean;
  systemEventType?: 'timer_changed' | 'group_created' | 'safety_number_changed' | 'call_event' | 'member_removed' | 'user_blocked' | 'poll_ended';
  isEdited?: boolean;
  isPinned?: boolean;
}

export interface GroupPermissions {
  editGroupInfo: 'all' | 'admin';
  sendMessages: 'all' | 'admin';
  addMembers: 'all' | 'admin';
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  avatarUrl?: string;
  color?: string;
  participants: User[];
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  unreadCount: number;
  lastMessage?: Message;
  draftText?: string;
  disappearingTimer: DisappearingTimerValue;
  createdAt: number;
  updatedAt: number;
  adminIds?: string[];
  permissions?: GroupPermissions;
  isBlocked?: boolean;
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'connected' | 'ended' | 'reconnecting';
export type CallDirection = 'incoming' | 'outgoing';

export interface CallSession {
  callId: string;
  conversationId: string;
  caller: User;
  recipient: User | Conversation;
  type: CallType;
  direction: CallDirection;
  status: CallStatus;
  startedAt?: number;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeakerOn: boolean;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  readReceipts: boolean;
  typingIndicators: boolean;
  soundEnabled: boolean;
  compactMode: boolean;
  defaultDisappearingTimer: DisappearingTimerValue;
}
