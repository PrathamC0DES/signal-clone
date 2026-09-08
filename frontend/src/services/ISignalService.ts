import { User, Conversation, Message, CallSession, DisappearingTimerValue, UserPreferences } from '../types';

export interface ISignalService {
  getCurrentUser(): Promise<User | null>;
  requestOtp(phoneNumber: string): Promise<{ status: string; mockOtp: string; message: string }>;
  verifyOtp(phoneNumber: string, otp: string): Promise<{ token: string; user: User }>;
  register(phoneNumber: string, displayName: string, username?: string, avatarUrl?: string): Promise<{ token: string; user: User }>;
  logout(): Promise<void>;
  getAllMockUsers(): Promise<User[]>;
  switchUser(userId: string): Promise<User>;
  updateCurrentUser(updates: Partial<User>): Promise<User>;
  getPreferences(): Promise<UserPreferences>;
  updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences>;
  getConversations(): Promise<Conversation[]>;
  getConversationById(id: string): Promise<Conversation | null>;
  createDirectConversation(recipientUserId: string): Promise<Conversation>;
  createGroupConversation(name: string, participantIds: string[]): Promise<Conversation>;
  togglePinConversation(conversationId: string): Promise<boolean>;
  toggleMuteConversation(conversationId: string): Promise<boolean>;
  toggleArchiveConversation(conversationId: string): Promise<boolean>;
  deleteConversation(conversationId: string): Promise<boolean>;
  setDisappearingTimer(conversationId: string, timerSeconds: DisappearingTimerValue): Promise<boolean>;
  getMessages(conversationId: string): Promise<Message[]>;
  sendMessage(conversationId: string, content: string, replyToId?: string, attachments?: File[]): Promise<Message>;
  deleteMessage(messageId: string): Promise<boolean>;
  addReaction(messageId: string, emoji: string): Promise<void>;
  removeReaction(messageId: string, emoji: string): Promise<void>;
  markConversationAsRead(conversationId: string): Promise<void>;
  setTypingStatus(conversationId: string, isTyping: boolean): Promise<void>;
  searchContacts(query: string): Promise<User[]>;
  getContacts(): Promise<User[]>;
  initiateCall(conversationId: string, type: 'audio' | 'video'): Promise<CallSession>;
  answerCall(callId: string): Promise<CallSession>;
  endCall(callId: string): Promise<void>;
  subscribeToEvents(handlers: {
    onMessageReceived?: (message: Message) => void;
    onMessageStatusUpdated?: (messageId: string, status: Message['status']) => void;
    onMessageReaction?: (messageId: string, reactions: Message['reactions']) => void;
    onTypingStatusChanged?: (conversationId: string, userId: string, isTyping: boolean) => void;
    onUserPresenceChanged?: (userId: string, status: 'online' | 'offline', lastSeen?: number) => void;
    onIncomingCall?: (call: CallSession) => void;
    onCallEnded?: (callId: string) => void;
    onUserSwitched?: (user: User) => void;
  }): () => void;
}
