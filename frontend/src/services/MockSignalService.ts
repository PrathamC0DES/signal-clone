import { User, Conversation, Message, MessageContentType, CallSession, DisappearingTimerValue, UserPreferences } from '../types';
import { ISignalService } from './ISignalService';
import { CURRENT_USER, INITIAL_CONTACTS, INITIAL_CONVERSATIONS, INITIAL_MESSAGES, DEFAULT_PREFERENCES } from './mockData';

export class MockSignalService implements ISignalService {
  private allUsers: User[] = [CURRENT_USER, ...INITIAL_CONTACTS];
  private currentUserId: string = CURRENT_USER.id;
  private conversations: Conversation[] = [...INITIAL_CONVERSATIONS];
  private messages: Record<string, Message[]> = { ...INITIAL_MESSAGES };
  private preferences: UserPreferences = { ...DEFAULT_PREFERENCES };
  private activeCall: CallSession | null = null;
  private channel: BroadcastChannel | null = null;
  private eventHandlers: Array<{
    onMessageReceived?: (message: Message) => void;
    onMessageStatusUpdated?: (messageId: string, status: Message['status']) => void;
    onMessageReaction?: (messageId: string, reactions: Message['reactions']) => void;
    onTypingStatusChanged?: (conversationId: string, userId: string, isTyping: boolean) => void;
    onUserPresenceChanged?: (userId: string, status: 'online' | 'offline', lastSeen?: number) => void;
    onIncomingCall?: (call: CallSession) => void;
    onCallEnded?: (callId: string) => void;
    onUserSwitched?: (user: User) => void;
  }> = [];

  constructor() {
    this.loadFromStorage();
    this.initBroadcastChannel();
  }

  private initBroadcastChannel() {
    if (typeof window === 'undefined') return;
    try {
      this.channel = new BroadcastChannel('signal_web_sync');
      this.channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'SYNC_STATE') {
          this.loadFromStorage();
        } else if (type === 'MESSAGE_SENT') {
          const msg: Message = payload;
          if (!this.messages[msg.conversationId]) this.messages[msg.conversationId] = [];
          if (!this.messages[msg.conversationId].some(m => m.id === msg.id)) {
            this.messages[msg.conversationId].push(msg);
          }
          this.syncConversationLastMessage(msg);
          for (const h of this.eventHandlers) h.onMessageReceived?.(msg);
        } else if (type === 'STATUS_UPDATED') {
          const { messageId, status } = payload;
          for (const convId in this.messages) {
            const m = this.messages[convId].find(m => m.id === messageId);
            if (m) m.status = status;
          }
          for (const h of this.eventHandlers) h.onMessageStatusUpdated?.(messageId, status);
        } else if (type === 'REACTION_UPDATED') {
          const { messageId, reactions } = payload;
          for (const convId in this.messages) {
            const m = this.messages[convId].find(m => m.id === messageId);
            if (m) m.reactions = reactions;
          }
          for (const h of this.eventHandlers) h.onMessageReaction?.(messageId, reactions);
        } else if (type === 'TYPING_CHANGED') {
          const { conversationId, userId, isTyping } = payload;
          for (const h of this.eventHandlers) h.onTypingStatusChanged?.(conversationId, userId, isTyping);
        }
      };
    } catch {}
  }

  private syncConversationLastMessage(msg: Message) {
    const conv = this.conversations.find(c => c.id === msg.conversationId);
    if (conv) {
      conv.lastMessage = msg;
      if (msg.senderId !== this.currentUserId) {
        conv.unreadCount += 1;
      }
      conv.updatedAt = msg.timestamp;
      this.persist();
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      // Session storage determines user in this specific browser tab/window!
      const activeId = sessionStorage.getItem('signal_active_user_id') || localStorage.getItem('signal_active_user_id');
      if (activeId && this.allUsers.some(u => u.id === activeId)) {
        this.currentUserId = activeId;
      }

      const storedConvs = localStorage.getItem('signal_web_conversations');
      if (storedConvs) this.conversations = JSON.parse(storedConvs);

      const storedMsgs = localStorage.getItem('signal_web_messages');
      if (storedMsgs) this.messages = JSON.parse(storedMsgs);

      const storedPrefs = localStorage.getItem('signal_web_prefs');
      if (storedPrefs) this.preferences = JSON.parse(storedPrefs);
    } catch {}
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('signal_web_conversations', JSON.stringify(this.conversations));
      localStorage.setItem('signal_web_messages', JSON.stringify(this.messages));
      localStorage.setItem('signal_web_prefs', JSON.stringify(this.preferences));
      this.channel?.postMessage({ type: 'SYNC_STATE' });
    } catch {}
  }

  async getAllMockUsers(): Promise<User[]> {
    return [...this.allUsers];
  }

  async switchUser(userId: string): Promise<User> {
    const found = this.allUsers.find(u => u.id === userId);
    if (!found) throw new Error('User not found');
    this.currentUserId = userId;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('signal_active_user_id', userId);
      localStorage.setItem('signal_active_user_id', userId);
    }
    for (const h of this.eventHandlers) h.onUserSwitched?.(found);
    return found;
  }

  async requestOtp(phoneNumber: string): Promise<{ status: string; mockOtp: string; message: string }> {
    return { status: 'otp_sent', mockOtp: '123456', message: 'Use OTP 123456 to verify' };
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<{ token: string; user: User }> {
    let user = this.allUsers.find((u) => u.phoneNumber === phoneNumber);
    if (!user) {
      user = {
        id: `user_${Date.now()}`,
        phoneNumber,
        displayName: `User ${phoneNumber.slice(-4)}`,
        username: `user_${phoneNumber.slice(-4)}`,
        avatarUrl: '',
        safetyNumber: '11111 22222 33333 44444 55555 66666',
        isVerified: true,
      };
      this.allUsers.push(user);
    }
    this.currentUserId = user.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('signal_token', `mock_token_${user.id}`);
      sessionStorage.setItem('signal_active_user_id', user.id);
    }
    for (const h of this.eventHandlers) h.onUserSwitched?.(user);
    return { token: `mock_token_${user.id}`, user: { ...user } };
  }

  async register(phoneNumber: string, displayName: string, username?: string, avatarUrl?: string): Promise<{ token: string; user: User }> {
    let user = this.allUsers.find((u) => u.phoneNumber === phoneNumber);
    if (user) {
      user.displayName = displayName;
      if (username) user.username = username;
      if (avatarUrl) user.avatarUrl = avatarUrl;
    } else {
      user = {
        id: `user_${Date.now()}`,
        phoneNumber,
        displayName,
        username: username || displayName.toLowerCase().replace(/\s+/g, '_'),
        avatarUrl: avatarUrl || '',
        safetyNumber: '11111 22222 33333 44444 55555 66666',
        isVerified: true,
      };
      this.allUsers.push(user);
    }
    this.currentUserId = user.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('signal_token', `mock_token_${user.id}`);
      sessionStorage.setItem('signal_active_user_id', user.id);
    }
    for (const h of this.eventHandlers) h.onUserSwitched?.(user);
    return { token: `mock_token_${user.id}`, user: { ...user } };
  }

  async logout(): Promise<void> {
    this.currentUserId = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('signal_token');
      sessionStorage.removeItem('signal_active_user_id');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.currentUserId) return null;
    const user = this.allUsers.find(u => u.id === this.currentUserId);
    return user ? { ...user } : null;
  }

  async updateCurrentUser(updates: Partial<User>): Promise<User> {
    const user = this.allUsers.find(u => u.id === this.currentUserId) || this.allUsers[0];
    Object.assign(user, updates);
    return { ...user };
  }

  async getPreferences(): Promise<UserPreferences> {
    return { ...this.preferences };
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    this.preferences = { ...this.preferences, ...updates };
    this.persist();
    return { ...this.preferences };
  }

  async getConversations(): Promise<Conversation[]> {
    return [...this.conversations];
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const conv = this.conversations.find((c) => c.id === id);
    return conv ? { ...conv } : null;
  }

  async createDirectConversation(recipientUserId: string): Promise<Conversation> {
    const existing = this.conversations.find(
      (c) => c.type === 'direct' && c.participants.some((p) => p.id === recipientUserId)
    );
    if (existing) return existing;

    const currentUser = (await this.getCurrentUser()) || this.allUsers[0];
    const contact = this.allUsers.find((c) => c.id === recipientUserId);
    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      type: 'direct',
      name: contact ? contact.displayName : 'Contact',
      avatarUrl: contact?.avatarUrl,
      color: contact?.color || '#2c6bed',
      participants: contact ? [currentUser, contact] : [currentUser],
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCount: 0,
      disappearingTimer: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.conversations.unshift(newConv);
    this.persist();
    return newConv;
  }

  async createGroupConversation(name: string, participantIds: string[]): Promise<Conversation> {
    const currentUser = (await this.getCurrentUser()) || this.allUsers[0];
    const members = this.allUsers.filter((c) => participantIds.includes(c.id));
    const newGroup: Conversation = {
      id: 'group_' + Date.now(),
      type: 'group',
      name,
      avatarUrl: '/images/avatars/avatar_celebration.svg',
      color: '#2c6bed',
      participants: [currentUser, ...members],
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCount: 0,
      disappearingTimer: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastMessage: {
        id: 'msg_sys_' + Date.now(),
        conversationId: 'group_' + Date.now(),
        senderId: currentUser.id,
        timestamp: Date.now(),
        content: 'You created group "' + name + '"',
        type: 'system',
        status: 'sent',
        reactions: [],
      }
    };

    this.conversations.unshift(newGroup);
    this.messages[newGroup.id] = [newGroup.lastMessage!];
    this.persist();
    return newGroup;
  }

  async togglePinConversation(conversationId: string): Promise<boolean> {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return false;
    conv.isPinned = !conv.isPinned;
    this.persist();
    return conv.isPinned;
  }

  async toggleMuteConversation(conversationId: string): Promise<boolean> {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return false;
    conv.isMuted = !conv.isMuted;
    this.persist();
    return conv.isMuted;
  }

  async toggleArchiveConversation(conversationId: string): Promise<boolean> {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return false;
    conv.isArchived = !conv.isArchived;
    this.persist();
    return conv.isArchived;
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    this.conversations = this.conversations.filter((c) => c.id !== conversationId);
    delete this.messages[conversationId];
    this.persist();
    return true;
  }

  async setDisappearingTimer(conversationId: string, timerSeconds: DisappearingTimerValue): Promise<boolean> {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return false;
    conv.disappearingTimer = timerSeconds;

    const sysMsg: Message = {
      id: 'msg_timer_' + Date.now(),
      conversationId,
      senderId: this.currentUserId,
      timestamp: Date.now(),
      content: timerSeconds === 0 ? 'You turned off disappearing messages.' : 'You set the disappearing message time to ' + this.formatDuration(timerSeconds) + '.',
      type: 'system',
      status: 'sent',
      reactions: [],
      systemEventType: 'timer_changed',
    };

    if (!this.messages[conversationId]) this.messages[conversationId] = [];
    this.messages[conversationId].push(sysMsg);
    conv.lastMessage = sysMsg;
    conv.updatedAt = Date.now();
    this.persist();
    this.channel?.postMessage({ type: 'MESSAGE_SENT', payload: sysMsg });
    return true;
  }

  private formatDuration(seconds: number): string {
    if (seconds === 0) return 'off';
    if (seconds === 30) return '30 seconds';
    if (seconds === 300) return '5 minutes';
    if (seconds === 3600) return '1 hour';
    if (seconds === 28800) return '8 hours';
    if (seconds === 86400) return '1 day';
    if (seconds === 604800) return '1 week';
    if (seconds === 2419200) return '4 weeks';
    if (seconds < 60) return seconds + ' seconds';
    if (seconds < 3600) return Math.round(seconds / 60) + ' minutes';
    if (seconds < 86400) return Math.round(seconds / 3600) + ' hours';
    if (seconds < 604800) return Math.round(seconds / 86400) + ' days';
    return Math.round(seconds / 604800) + ' weeks';
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messages[conversationId] ? [...this.messages[conversationId]] : [];
  }

  async sendMessage(conversationId: string, content: string, replyToId?: string, attachments?: File[]): Promise<Message> {
    const conv = this.conversations.find((c) => c.id === conversationId);
    let replySnippet: Message['replyTo'];
    if (replyToId && this.messages[conversationId]) {
      const parent = this.messages[conversationId].find((m) => m.id === replyToId);
      if (parent) {
        const sender = this.allUsers.find(u => u.id === parent.senderId);
        replySnippet = {
          id: parent.id,
          senderId: parent.senderId,
          senderName: sender?.displayName || 'Unknown',
          content: parent.content,
        };
      }
    }

    let type: MessageContentType = 'text';
    let pollData = undefined;
    if (content.startsWith('__POLL__:')) {
      type = 'poll';
      try {
        pollData = JSON.parse(content.substring(9));
      } catch {}
    } else if (attachments && attachments.length > 0) {
      type = attachments[0].type.startsWith('image/') ? 'image' : 'file';
    }

    const newMessage: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversationId,
      senderId: this.currentUserId,
      timestamp: Date.now(),
      content,
      type,
      status: 'sent',
      reactions: [],
      replyTo: replySnippet,
      poll: pollData,
      isDisappearing: Boolean(conv?.disappearingTimer && conv.disappearingTimer > 0),
      expireTimerSeconds: conv?.disappearingTimer,
      expiresAt: conv?.disappearingTimer ? Date.now() + conv.disappearingTimer * 1000 : undefined,
    };

    if (!this.messages[conversationId]) this.messages[conversationId] = [];
    this.messages[conversationId].push(newMessage);

    if (conv) {
      conv.lastMessage = newMessage;
      conv.updatedAt = Date.now();
    }
    this.persist();

    // Broadcast message to all open tabs / windows instantly!
    this.channel?.postMessage({ type: 'MESSAGE_SENT', payload: newMessage });

    // Progress status to delivered
    setTimeout(() => {
      newMessage.status = 'delivered';
      this.channel?.postMessage({
        type: 'STATUS_UPDATED',
        payload: { messageId: newMessage.id, status: 'delivered' }
      });
      for (const h of this.eventHandlers) h.onMessageStatusUpdated?.(newMessage.id, 'delivered');
      this.persist();
    }, 400);

    return newMessage;
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    for (const convId in this.messages) {
      const idx = this.messages[convId].findIndex((m) => m.id === messageId);
      if (idx !== -1) {
        this.messages[convId].splice(idx, 1);
        this.persist();
        return true;
      }
    }
    return false;
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    for (const convId in this.messages) {
      const msg = this.messages[convId].find((m) => m.id === messageId);
      if (msg) {
        const existing = msg.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          if (!existing.userIds.includes(this.currentUserId)) {
            existing.userIds.push(this.currentUserId);
            existing.count += 1;
          }
        } else {
          msg.reactions.push({ emoji, count: 1, userIds: [this.currentUserId] });
        }
        this.persist();
        this.channel?.postMessage({
          type: 'REACTION_UPDATED',
          payload: { messageId, reactions: msg.reactions }
        });
        for (const handler of this.eventHandlers) {
          handler.onMessageReaction?.(messageId, msg.reactions);
        }
        return;
      }
    }
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    for (const convId in this.messages) {
      const msg = this.messages[convId].find((m) => m.id === messageId);
      if (msg) {
        const existing = msg.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          existing.userIds = existing.userIds.filter((id) => id !== this.currentUserId);
          existing.count -= 1;
          if (existing.count <= 0) {
            msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
          }
        }
        this.persist();
        this.channel?.postMessage({
          type: 'REACTION_UPDATED',
          payload: { messageId, reactions: msg.reactions }
        });
        for (const handler of this.eventHandlers) {
          handler.onMessageReaction?.(messageId, msg.reactions);
        }
        return;
      }
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      this.persist();
    }
    // Mark messages as read by current user
    if (this.messages[conversationId]) {
      for (const m of this.messages[conversationId]) {
        if (m.senderId !== this.currentUserId && m.status !== 'read') {
          m.status = 'read';
          this.channel?.postMessage({
            type: 'STATUS_UPDATED',
            payload: { messageId: m.id, status: 'read' }
          });
          for (const h of this.eventHandlers) h.onMessageStatusUpdated?.(m.id, 'read');
        }
      }
    }
  }

  async searchContacts(query: string): Promise<User[]> {
    const q = query.toLowerCase();
    return this.allUsers.filter(
      (c) => c.id !== this.currentUserId && (c.displayName.toLowerCase().includes(q) || c.username.toLowerCase().includes(q) || c.phoneNumber.includes(q))
    );
  }

  async getContacts(): Promise<User[]> {
    return this.allUsers.filter(u => u.id !== this.currentUserId);
  }

  async setTypingStatus(conversationId: string, isTyping: boolean): Promise<void> {
    if (this.channel) {
      this.channel.postMessage({
        type: 'TYPING_STATUS',
        payload: { conversationId, userId: this.currentUserId, isTyping },
      });
    }
    for (const h of this.eventHandlers) {
      h.onTypingStatusChanged?.(conversationId, this.currentUserId, isTyping);
    }
  }

  async initiateCall(conversationId: string, type: 'audio' | 'video'): Promise<CallSession> {
    const currentUser = (await this.getCurrentUser()) || this.allUsers[0];
    const conv = this.conversations.find((c) => c.id === conversationId);
    const recipient = conv ? (conv.type === 'direct' ? conv.participants.find((p) => p.id !== this.currentUserId) || conv : conv) : this.allUsers[1];

    const session: CallSession = {
      callId: 'call_' + Date.now(),
      conversationId,
      caller: currentUser,
      recipient: recipient as User,
      type,
      direction: 'outgoing',
      status: 'ringing',
      isMuted: false,
      isVideoEnabled: type === 'video',
      isSpeakerOn: true,
    };

    this.activeCall = session;
    this.channel?.postMessage({
      type: 'INCOMING_CALL',
      payload: { ...session, direction: 'incoming' }
    });

    setTimeout(() => {
      if (this.activeCall && this.activeCall.callId === session.callId) {
        this.activeCall.status = 'connected';
        this.activeCall.startedAt = Date.now();
      }
    }, 3000);

    return session;
  }

  async answerCall(callId: string): Promise<CallSession> {
    if (!this.activeCall || this.activeCall.callId !== callId) {
      throw new Error('Call session not found');
    }
    this.activeCall.status = 'connected';
    this.activeCall.startedAt = Date.now();
    return this.activeCall;
  }

  async endCall(callId: string): Promise<void> {
    if (this.activeCall && this.activeCall.callId === callId) {
      this.activeCall.status = 'ended';
      for (const handler of this.eventHandlers) {
        handler.onCallEnded?.(callId);
      }
      this.activeCall = null;
    }
  }

  subscribeToEvents(handlers: {
    onMessageReceived?: (message: Message) => void;
    onMessageStatusUpdated?: (messageId: string, status: Message['status']) => void;
    onMessageReaction?: (messageId: string, reactions: Message['reactions']) => void;
    onTypingStatusChanged?: (conversationId: string, userId: string, isTyping: boolean) => void;
    onUserPresenceChanged?: (userId: string, status: 'online' | 'offline', lastSeen?: number) => void;
    onIncomingCall?: (call: CallSession) => void;
    onCallEnded?: (callId: string) => void;
    onUserSwitched?: (user: User) => void;
  }): () => void {
    this.eventHandlers.push(handlers);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handlers);
    };
  }
}
