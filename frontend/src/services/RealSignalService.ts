import { ISignalService } from './ISignalService';
import {
  User,
  Conversation,
  Message,
  MessageContentType,
  CallSession,
  DisappearingTimerValue,
  UserPreferences,
  Attachment,
} from '../types';

export class RealSignalService implements ISignalService {
  private apiBase: string;
  private wsBase: string;
  private activeUserId: string = '';
  private token: string | null = null;
  private ws: WebSocket | null = null;
  private eventHandlers: Array<Parameters<ISignalService['subscribeToEvents']>[0]> = [];
  private reconnectTimer: any = null;

  constructor() {
    this.apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const wsProto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.wsBase = process.env.NEXT_PUBLIC_WS_URL || `${wsProto}//localhost:8000/ws`;

    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('signal_token') || sessionStorage.getItem('signal_token') || null;
      this.activeUserId = sessionStorage.getItem('signal_active_user_id') || localStorage.getItem('signal_user_id') || '';
      if (this.activeUserId) {
        this.connectWebSocket();
      }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (this.activeUserId) {
      headers['X-User-Id'] = this.activeUserId;
    }
    return headers;
  }

  private connectWebSocket() {
    if (typeof window === 'undefined' || !this.activeUserId) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(`${this.wsBase}/${this.activeUserId}`);

      this.ws.onopen = () => {
        console.log(`[Signal WS] Connected as ${this.activeUserId}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: evtType, data } = payload;

          this.eventHandlers.forEach((h) => {
            if (evtType === 'message_received' && h.onMessageReceived) {
              h.onMessageReceived(this.mapMessage(data));
            } else if (evtType === 'message_status' && h.onMessageStatusUpdated) {
              h.onMessageStatusUpdated(data.message_id, data.status);
            } else if (evtType === 'message_reaction' && h.onMessageReaction) {
              h.onMessageReaction(data.message_id, data.reactions);
            } else if (evtType === 'typing_status' && h.onTypingStatusChanged) {
              h.onTypingStatusChanged(data.conversation_id, data.user_id, data.is_typing);
            } else if (evtType === 'presence' && h.onUserPresenceChanged) {
              h.onUserPresenceChanged(data.user_id, data.is_online ? 'online' : 'offline');
            }
          });
        } catch (err) {
          console.error('[Signal WS] Parse error', err);
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (!this.reconnectTimer && this.activeUserId) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectWebSocket();
          }, 2000);
        }
      };

      this.ws.onerror = (e) => {
        console.warn('[Signal WS] Error', e);
      };
    } catch (err) {
      console.error('[Signal WS] Setup failed', err);
    }
  }

  async requestOtp(phoneNumber: string): Promise<{ status: string; mockOtp: string; message: string }> {
    const res = await fetch(`${this.apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
    if (!res.ok) throw new Error('Failed to request verification code');
    const data = await res.json();
    return {
      status: data.status,
      mockOtp: data.mock_otp || '123456',
      message: data.message || 'Use OTP 123456',
    };
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${this.apiBase}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber, otp }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Invalid verification code. Enter 123456.');
    }
    const data = await res.json();
    this.token = data.token;
    this.activeUserId = data.user.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('signal_token', data.token);
      localStorage.setItem('signal_user_id', data.user.id);
      sessionStorage.setItem('signal_active_user_id', data.user.id);
    }
    this.connectWebSocket();
    const mapped = this.mapUser(data.user);
    this.eventHandlers.forEach((h) => h.onUserSwitched?.(mapped));
    return { token: data.token, user: mapped };
  }

  async register(phoneNumber: string, displayName: string, username?: string, avatarUrl?: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${this.apiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phoneNumber,
        display_name: displayName,
        username,
        avatar_url: avatarUrl,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    const data = await res.json();
    this.token = data.token;
    this.activeUserId = data.user.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('signal_token', data.token);
      localStorage.setItem('signal_user_id', data.user.id);
      sessionStorage.setItem('signal_active_user_id', data.user.id);
    }
    this.connectWebSocket();
    const mapped = this.mapUser(data.user);
    this.eventHandlers.forEach((h) => h.onUserSwitched?.(mapped));
    return { token: data.token, user: mapped };
  }

  async logout(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.token = null;
    this.activeUserId = '';
    if (typeof window !== 'undefined') {
      localStorage.removeItem('signal_token');
      localStorage.removeItem('signal_user_id');
      sessionStorage.removeItem('signal_active_user_id');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token && !this.activeUserId) {
      return null;
    }
    try {
      const res = await fetch(`${this.apiBase}/auth/me`, { headers: this.getHeaders() });
      if (!res.ok) {
        if (res.status === 401) {
          await this.logout();
        }
        return null;
      }
      const u = await res.json();
      this.activeUserId = u.id;
      return this.mapUser(u);
    } catch {
      return null;
    }
  }

  private timerStringToSeconds(timer: string | number): DisappearingTimerValue {
    if (typeof timer === 'number') return timer as DisappearingTimerValue;
    switch (timer) {
      case '30s': return 30;
      case '5m': return 300;
      case '1h': return 3600;
      case '1d': return 86400;
      case '1w': return 604800;
      case '4w': return 2419200;
      default: return 0;
    }
  }

  private secondsToTimerString(seconds: DisappearingTimerValue): string {
    switch (seconds) {
      case 30: return '30s';
      case 300: return '5m';
      case 3600: return '1h';
      case 86400: return '1d';
      case 604800: return '1w';
      case 2419200: return '4w';
      default: return 'off';
    }
  }

  private mapAttachment(att: any): Attachment {
    return {
      id: att.id,
      url: att.file_url || att.url || '',
      fileName: att.file_name || att.fileName || 'file',
      fileSize: att.file_size || att.fileSize || 0,
      mimeType: att.mime_type || att.mimeType || 'application/octet-stream',
    };
  }

  private mapMessage(m: any): Message {
    let type: MessageContentType = m.type || 'text';
    let poll = m.poll;
    const rawContent = m.content || '';

    if (rawContent.startsWith('__POLL__:')) {
      type = 'poll';
      try {
        poll = JSON.parse(rawContent.substring(9));
      } catch {}
    }

    return {
      id: m.id,
      conversationId: m.conversation_id || m.conversationId,
      senderId: m.sender_id || m.senderId,
      content: rawContent,
      timestamp: m.timestamp || Date.now(),
      type: type,
      status: m.status || 'sent',
      replyTo: m.reply_to ? {
        id: m.reply_to.id,
        senderId: m.reply_to.senderId || '',
        senderName: m.reply_to.senderName || 'User',
        content: m.reply_to.content || '',
      } : undefined,
      reactions: m.reactions || [],
      attachments: (m.attachments || []).map((a: any) => this.mapAttachment(a)),
      isDisappearing: !!m.expires_at,
      poll: poll,
    };
  }

  private mapUser(u: any): User {
    return {
      id: u.id,
      phoneNumber: u.phone_number || u.phoneNumber || '',
      displayName: u.display_name || u.displayName || 'User',
      username: u.username || '',
      avatarUrl: u.avatar_url || u.avatarUrl || '',
      about: u.about || 'Available',
      safetyNumber: '42891 03829 10482 91048 29104 82910',
      isVerified: true,
      lastSeen: u.last_seen || u.lastSeen,
    };
  }

  private mapConversation(c: any): Conversation {
    return {
      id: c.id,
      type: c.type,
      name: c.name || 'Conversation',
      avatarUrl: c.avatar_url || c.avatarUrl,
      participants: (c.participants || []).map((p: any) => this.mapUser(p)),
      lastMessage: c.last_message ? this.mapMessage(c.last_message) : undefined,
      unreadCount: c.unread_count || c.unreadCount || 0,
      isPinned: c.is_pinned || c.isPinned || false,
      isMuted: c.is_muted || c.isMuted || false,
      isArchived: c.is_archived || c.isArchived || false,
      disappearingTimer: this.timerStringToSeconds(c.disappearing_timer || c.disappearingTimer || 'off'),
      createdAt: c.created_at || Date.now() - 3600000,
      updatedAt: c.updated_at || c.updatedAt || Date.now(),
    };
  }

  async getAllMockUsers(): Promise<User[]> {
    const res = await fetch(`${this.apiBase}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    const list = await res.json();
    return list.map((u: any) => this.mapUser(u));
  }

  async switchUser(userId: string): Promise<User> {
    this.activeUserId = userId;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('signal_active_user_id', userId);
      localStorage.setItem('signal_user_id', userId);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectWebSocket();
    const user = await this.getCurrentUser();
    if (user) {
      this.eventHandlers.forEach((h) => h.onUserSwitched?.(user));
      return user;
    }
    throw new Error('User not found');
  }

  async updateCurrentUser(updates: Partial<User>): Promise<User> {
    const res = await fetch(`${this.apiBase}/auth/me`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        display_name: updates.displayName,
        username: updates.username,
        avatar_url: updates.avatarUrl,
        about: updates.about,
      }),
    });
    if (!res.ok) throw new Error('Failed to update user profile');
    const u = await res.json();
    return this.mapUser(u);
  }

  async getPreferences(): Promise<UserPreferences> {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('signal_user_preferences');
      if (saved) return JSON.parse(saved);
    }
    return {
      theme: 'dark',
      soundEnabled: true,
      readReceipts: true,
      typingIndicators: true,
      compactMode: false,
      defaultDisappearingTimer: 0,
    };
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const cur = await this.getPreferences();
    const merged = { ...cur, ...updates };
    if (typeof window !== 'undefined') {
      localStorage.setItem('signal_user_preferences', JSON.stringify(merged));
    }
    return merged;
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      const res = await fetch(`${this.apiBase}/conversations`, { headers: this.getHeaders() });
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((c: any) => this.mapConversation(c));
    } catch (err) {
      console.warn('Failed to get conversations:', err);
      return [];
    }
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const res = await fetch(`${this.apiBase}/conversations/${id}`, { headers: this.getHeaders() });
    if (!res.ok) return null;
    const c = await res.json();
    return this.mapConversation(c);
  }

  async createDirectConversation(recipientUserId: string): Promise<Conversation> {
    const res = await fetch(`${this.apiBase}/conversations/direct`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ user_id: recipientUserId }),
    });
    if (!res.ok) throw new Error('Failed to create direct conversation');
    const c = await res.json();
    return this.mapConversation(c);
  }

  async createGroupConversation(name: string, participantIds: string[]): Promise<Conversation> {
    const res = await fetch(`${this.apiBase}/conversations/group`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, member_ids: participantIds }),
    });
    if (!res.ok) throw new Error('Failed to create group conversation');
    const c = await res.json();
    return this.mapConversation(c);
  }

  async togglePinConversation(conversationId: string): Promise<boolean> {
    const conv = await this.getConversationById(conversationId);
    if (!conv) return false;
    const nextPin = !conv.isPinned;
    await fetch(`${this.apiBase}/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ is_pinned: nextPin }),
    });
    return nextPin;
  }

  async toggleMuteConversation(conversationId: string): Promise<boolean> {
    const conv = await this.getConversationById(conversationId);
    if (!conv) return false;
    const nextMute = !conv.isMuted;
    await fetch(`${this.apiBase}/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ is_muted: nextMute }),
    });
    return nextMute;
  }

  async toggleArchiveConversation(conversationId: string): Promise<boolean> {
    const conv = await this.getConversationById(conversationId);
    if (!conv) return false;
    const nextArchive = !conv.isArchived;
    await fetch(`${this.apiBase}/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ is_archived: nextArchive }),
    });
    return nextArchive;
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    const res = await fetch(`${this.apiBase}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  async setDisappearingTimer(conversationId: string, timerSeconds: DisappearingTimerValue): Promise<boolean> {
    const timerStr = this.secondsToTimerString(timerSeconds);
    const res = await fetch(`${this.apiBase}/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ disappearing_timer: timerStr }),
    });
    return res.ok;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const res = await fetch(`${this.apiBase}/conversations/${conversationId}/messages`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((m: any) => this.mapMessage(m));
    } catch (err) {
      console.warn('Failed to get messages:', err);
      return [];
    }
  }

  async sendMessage(conversationId: string, content: string, replyToId?: string, attachments?: File[]): Promise<Message> {
    let uploadedAttachments: any[] = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', file);
        const upRes = await fetch(`${this.apiBase}/upload`, {
          method: 'POST',
          body: formData,
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          uploadedAttachments.push({
            file_url: upData.url,
            file_name: upData.filename,
            file_size: upData.size,
            mime_type: upData.mime_type,
          });
        }
      }
    }

    const res = await fetch(`${this.apiBase}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        content,
        reply_to_id: replyToId,
        type: uploadedAttachments.length > 0 ? 'image' : 'text',
        attachments: uploadedAttachments,
      }),
    });

    if (!res.ok) throw new Error('Failed to send message');
    const msg = await res.json();
    return this.mapMessage(msg);
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const res = await fetch(`${this.apiBase}/messages/${messageId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    await fetch(`${this.apiBase}/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ emoji }),
    });
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await fetch(`${this.apiBase}/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ emoji }),
    });
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    await fetch(`${this.apiBase}/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  async setTypingStatus(conversationId: string, isTyping: boolean): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          event: isTyping ? 'start_typing' : 'stop_typing',
          data: { conversation_id: conversationId },
        })
      );
    }
  }

  async searchContacts(query: string): Promise<User[]> {
    const res = await fetch(`${this.apiBase}/contacts/search?q=${encodeURIComponent(query)}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) return [];
    const list = await res.json();
    return list.map((u: any) => this.mapUser(u));
  }

  async getContacts(): Promise<User[]> {
    const res = await fetch(`${this.apiBase}/contacts`, { headers: this.getHeaders() });
    if (!res.ok) return [];
    const list = await res.json();
    return list.map((u: any) => this.mapUser(u));
  }

  async initiateCall(conversationId: string, type: 'audio' | 'video'): Promise<CallSession> {
    const user = (await this.getCurrentUser())!;
    return {
      callId: `call_${Date.now()}`,
      conversationId,
      caller: user,
      recipient: user,
      direction: 'outgoing',
      type,
      status: 'ringing',
      startedAt: Date.now(),
      isMuted: false,
      isVideoEnabled: type === 'video',
      isSpeakerOn: true,
    };
  }

  async answerCall(callId: string): Promise<CallSession> {
    const user = (await this.getCurrentUser())!;
    return {
      callId: callId,
      conversationId: 'conv_sarah',
      caller: user,
      recipient: user,
      direction: 'incoming',
      type: 'video',
      status: 'connected',
      startedAt: Date.now(),
      isMuted: false,
      isVideoEnabled: true,
      isSpeakerOn: true,
    };
  }

  async endCall(callId: string): Promise<void> {}

  subscribeToEvents(handlers: Parameters<ISignalService['subscribeToEvents']>[0]): () => void {
    this.eventHandlers.push(handlers);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handlers);
    };
  }
}
