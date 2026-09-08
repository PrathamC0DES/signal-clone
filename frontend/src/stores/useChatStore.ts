import { create } from 'zustand';
import { Conversation, Message, DisappearingTimerValue, User, GroupPermissions, PollData } from '../types';
import { getSignalService } from '../services';
import { useSettingsStore } from './useSettingsStore';

// Human-readable label for a disappearing-timer value, matching the UI options.
export function timerLabelForValue(timer: DisappearingTimerValue): string {
  switch (timer) {
    case 30:
      return '30 seconds';
    case 300:
      return '5 minutes';
    case 3600:
      return '1 hour';
    case 86400:
      return '1 day';
    case 604800:
      return '1 week';
    case 2419200:
      return '4 weeks';
    default:
      return 'Off';
  }
}

interface ChatStoreState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // by conversationId
  typingUsers: Record<string, string[]>; // conversationId -> array of userIds typing
  searchQuery: string;
  activeFilter: 'all' | 'unread';
  isRightDrawerOpen: boolean;
  isContactDetailsOpen: boolean;
  navTabsCollapsed: boolean;
  activeTab: 'chats' | 'archive' | 'settings';
  replyingToMessage: Message | null;
  editingMessage: Message | null;
  isSelectionMode: boolean;
  selectedMessageIds: string[];
  isLoading: boolean;

  // Actions
  initialize: () => Promise<void>;
  setActiveConversation: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: 'all' | 'unread') => void;
  setActiveTab: (tab: 'chats' | 'archive' | 'settings') => void;
  toggleNavTabsCollapsed: () => void;
  setNavTabsCollapsed: (collapsed: boolean) => void;
  toggleRightDrawer: () => void;
  setRightDrawerOpen: (open: boolean) => void;
  toggleContactDetails: () => void;
  setContactDetailsOpen: (open: boolean) => void;
  setReplyingToMessage: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  enterSelectionMode: (initialMessageId?: string) => void;
  exitSelectionMode: () => void;
  toggleSelectMessage: (messageId: string) => void;
  deleteSelectedMessages: () => Promise<void>;
  markConversationUnread: (id: string) => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;
  forwardMessage: (targetConversationId: string, content: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  toggleMuteConversation: (id: string) => Promise<void>;
  toggleArchiveConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setDisappearingTimer: (timer: DisappearingTimerValue) => Promise<void>;
  createDirectChat: (userId: string) => Promise<string>;
  createGroupChat: (name: string, userIds: string[]) => Promise<string>;
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>;
  addGroupMember: (conversationId: string, user: User) => Promise<void>;
  removeGroupMember: (conversationId: string, userId: string) => Promise<void>;
  setMemberRole: (conversationId: string, userId: string, role: 'admin' | 'member') => Promise<void>;
  updateGroupPermissions: (conversationId: string, permissions: Partial<GroupPermissions>) => Promise<void>;
  setGroupChatColor: (conversationId: string, color: string) => Promise<void>;
  leaveGroup: (conversationId: string) => Promise<void>;
  blockGroup: (conversationId: string) => Promise<void>;
  isSearchModalOpen: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  toggleBlockConversation: (id: string) => Promise<void>;
  blockGroupMember: (conversationId: string, userId: string) => Promise<void>;
  sendPoll: (question: string, options: string[], allowMultiple: boolean) => Promise<void>;
  votePoll: (messageId: string, optionId: string) => Promise<void>;
  endPoll: (messageId: string) => Promise<void>;
}

export const useChatStore = create<ChatStoreState>((set, get) => {
  const service = getSignalService();

  // Setup WebSocket / Realtime subscription
  if (typeof window !== 'undefined') {
    service.subscribeToEvents({
      onMessageReceived: (message) => {
        const { messages, conversations, activeConversationId } = get();
        const convMessages = messages[message.conversationId] || [];

        let nextMessages: Message[];

        if (message.type === 'poll' && message.poll) {
          const existingPollIdx = convMessages.findIndex(
            (m) =>
              m.id === message.id ||
              (m.type === 'poll' && m.poll?.question === message.poll?.question)
          );

          if (existingPollIdx !== -1) {
            const existingMsg = convMessages[existingPollIdx];
            const wasEnded = existingMsg.poll?.isEnded;
            const isNowEnded = message.poll.isEnded;

            nextMessages = convMessages.map((m, idx) =>
              idx === existingPollIdx
                ? { ...m, poll: message.poll, content: message.content }
                : m
            );

            if (!wasEnded && isNowEnded) {
              const activeUserId =
                (service as any).activeUserId || localStorage.getItem('signal_user_id') || 'user_me';
              const isMe =
                message.senderId === activeUserId ||
                (activeUserId === 'user_me' && (message.senderId === 'user_me' || message.senderId === 'me'));
              const sysMsg: Message = {
                id: `sys_end_poll_${Date.now()}`,
                conversationId: message.conversationId,
                senderId: 'system',
                content: `${isMe ? 'You' : 'A participant'} ended the poll: ${message.poll.question}`,
                timestamp: Date.now(),
                type: 'system',
                status: 'read',
                reactions: [],
                systemEventType: 'poll_ended',
              };
              const sysExists = nextMessages.some(
                (m) => m.type === 'system' && m.systemEventType === 'poll_ended' && m.content.includes(message.poll!.question)
              );
              if (!sysExists) {
                nextMessages.push(sysMsg);
              }
            }
          } else {
            nextMessages = [...convMessages, message];
          }
        } else {
          const exists = convMessages.some((m) => m.id === message.id);
          nextMessages = exists
            ? convMessages.map((m) => (m.id === message.id ? message : m))
            : [...convMessages, message];
        }

        set({
          messages: {
            ...messages,
            [message.conversationId]: nextMessages,
          },
        });

        // Update conversation in list
        const updated = conversations.map((c) =>
          c.id === message.conversationId
            ? {
                ...c,
                lastMessage: message,
                unreadCount: c.id === activeConversationId ? 0 : c.unreadCount + 1,
                updatedAt: message.timestamp,
              }
            : c
        );
        set({ conversations: updated });

        if (message.conversationId === activeConversationId) {
          service.markConversationAsRead(activeConversationId);
        }

        // Play incoming notification sound if allowed
        try {
          const audio = new Audio('/sounds/notification.ogg');
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch {}
      },
      onMessageStatusUpdated: (messageId, status) => {
        const { messages, conversations } = get();
        const updatedMessages: Record<string, Message[]> = {};
        for (const [convId, list] of Object.entries(messages)) {
          updatedMessages[convId] = list.map((m) =>
            m.id === messageId ? { ...m, status } : m
          );
        }
        const updatedConversations = conversations.map((c) =>
          c.lastMessage && c.lastMessage.id === messageId
            ? { ...c, lastMessage: { ...c.lastMessage, status } }
            : c
        );
        set({ messages: updatedMessages, conversations: updatedConversations });
      },
      onMessageReaction: (messageId, reactions) => {
        const { messages } = get();
        const updatedMessages: Record<string, Message[]> = {};
        for (const [convId, list] of Object.entries(messages)) {
          updatedMessages[convId] = list.map((m) =>
            m.id === messageId ? { ...m, reactions } : m
          );
        }
        set({ messages: updatedMessages });
      },
      onTypingStatusChanged: (conversationId, userId, isTyping) => {
        const { typingUsers } = get();
        const current = typingUsers[conversationId] || [];
        const next = isTyping
          ? Array.from(new Set([...current, userId]))
          : current.filter((id) => id !== userId);
        set({
          typingUsers: {
            ...typingUsers,
            [conversationId]: next,
          },
        });

        if (isTyping) {
          // Auto-clear after 4.5s of inactivity if stop_typing wasn't received
          setTimeout(() => {
            const latest = get().typingUsers[conversationId] || [];
            if (latest.includes(userId)) {
              set({
                typingUsers: {
                  ...get().typingUsers,
                  [conversationId]: latest.filter((id) => id !== userId),
                },
              });
            }
          }, 4500);
        }
      },
    });
  }

  return {
    conversations: [],
    activeConversationId: null,
    messages: {},
    typingUsers: {},
    searchQuery: '',
    activeFilter: 'all',
    isRightDrawerOpen: false,
    isContactDetailsOpen: false,
    navTabsCollapsed: false,
    activeTab: 'chats',
    replyingToMessage: null,
    editingMessage: null,
    isSelectionMode: false,
    selectedMessageIds: [],
    isLoading: true,
    isSearchModalOpen: false,
    toastMessage: null,

    showToast: (msg: string) => {
      set({ toastMessage: msg });
      setTimeout(() => {
        if (get().toastMessage === msg) {
          set({ toastMessage: null });
        }
      }, 3000);
    },

    initialize: async () => {
      if (typeof window !== 'undefined') {
        const savedCollapsed = localStorage.getItem('signal_nav_tabs_collapsed') === 'true';
        if (savedCollapsed) {
          set({ navTabsCollapsed: true });
        }
      }
      try {
        set({ isLoading: true });
        const convs = await service.getConversations();
        const enhancedConvs = convs.map((c) => {
          if (c.type === 'group') {
            return {
              ...c,
              adminIds: c.adminIds && c.adminIds.length > 0 ? c.adminIds : ['user_me'],
              permissions: c.permissions || {
                editGroupInfo: 'all',
                sendMessages: 'all',
                addMembers: 'all',
              },
            };
          }
          return c;
        });
        set({ conversations: enhancedConvs, isLoading: false });
        const currentActive = get().activeConversationId;
        const activeExists = currentActive && enhancedConvs.some((c) => c.id === currentActive);
        if (!activeExists && convs.length > 0) {
          get().setActiveConversation(convs[0].id);
        } else if (!activeExists && convs.length === 0) {
          set({ activeConversationId: null });
        }
      } catch (err) {
        console.error('Failed to initialize chats:', err);
        set({ isLoading: false });
      }
    },

    setActiveConversation: async (id: string) => {
      set({
        activeConversationId: id,
        replyingToMessage: null,
        editingMessage: null,
        isSelectionMode: false,
        selectedMessageIds: [],
        isContactDetailsOpen: false,
      });
      try {
        const msgs = await service.getMessages(id);
        set((state) => ({
          messages: { ...state.messages, [id]: msgs },
        }));
        await service.markConversationAsRead(id);
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, unreadCount: 0 } : c
          ),
        }));
      } catch (err) {
        console.error(`Failed to load messages for ${id}:`, err);
      }
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setActiveFilter: (activeFilter) => set({ activeFilter }),
    setActiveTab: (activeTab) => set({ activeTab }),
    toggleNavTabsCollapsed: () =>
      set((state) => {
        const next = !state.navTabsCollapsed;
        if (typeof window !== 'undefined') {
          localStorage.setItem('signal_nav_tabs_collapsed', String(next));
        }
        return { navTabsCollapsed: next };
      }),
    setNavTabsCollapsed: (collapsed) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('signal_nav_tabs_collapsed', String(collapsed));
      }
      set({ navTabsCollapsed: collapsed });
    },
    toggleRightDrawer: () => set((state) => ({ isRightDrawerOpen: !state.isRightDrawerOpen })),
    setRightDrawerOpen: (open) => set({ isRightDrawerOpen: open }),
    toggleContactDetails: () => set((state) => ({ isContactDetailsOpen: !state.isContactDetailsOpen })),
    setContactDetailsOpen: (open) => set({ isContactDetailsOpen: open }),
    setReplyingToMessage: (message) => set({ replyingToMessage: message, editingMessage: null }),
    setEditingMessage: (message) => set({ editingMessage: message, replyingToMessage: null }),
    enterSelectionMode: (initialMessageId) => set({
      isSelectionMode: true,
      selectedMessageIds: initialMessageId ? [initialMessageId] : [],
    }),
    exitSelectionMode: () => set({
      isSelectionMode: false,
      selectedMessageIds: [],
    }),
    toggleSelectMessage: (messageId) => {
      const { selectedMessageIds } = get();
      const isSelected = selectedMessageIds.includes(messageId);
      const next = isSelected
        ? selectedMessageIds.filter((id) => id !== messageId)
        : [...selectedMessageIds, messageId];
      if (next.length === 0) {
        set({ isSelectionMode: false, selectedMessageIds: [] });
      } else {
        set({ selectedMessageIds: next });
      }
    },
    deleteSelectedMessages: async () => {
      const { activeConversationId, selectedMessageIds, messages } = get();
      if (!activeConversationId || selectedMessageIds.length === 0) return;
      for (const id of selectedMessageIds) {
        await service.deleteMessage(id);
      }
      const current = messages[activeConversationId] || [];
      set({
        messages: {
          ...messages,
          [activeConversationId]: current.filter((m) => !selectedMessageIds.includes(m.id)),
        },
        isSelectionMode: false,
        selectedMessageIds: [],
      });
    },
    markConversationUnread: async (id: string) => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, unreadCount: Math.max(1, c.unreadCount || 1) } : c
        ),
      }));
    },

    sendMessage: async (content: string, attachments?: File[]) => {
      const { activeConversationId, replyingToMessage } = get();
      if (!activeConversationId) return;

      const newMsg = await service.sendMessage(
        activeConversationId,
        content,
        replyingToMessage?.id,
        attachments
      );

      const convMessages = get().messages[activeConversationId] || [];
      const exists = convMessages.some((m) => m.id === newMsg.id);
      const nextMessages = exists
        ? convMessages.map((m) => (m.id === newMsg.id ? newMsg : m))
        : [...convMessages, newMsg];

      set((state) => ({
        messages: {
          ...state.messages,
          [activeConversationId]: nextMessages,
        },
        replyingToMessage: null,
        conversations: state.conversations.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: newMsg, updatedAt: newMsg.timestamp }
            : c
        ),
      }));

      // Play sent pop sound
      try {
        const audio = new Audio('/sounds/pop.ogg');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {}
    },

    deleteMessage: async (messageId: string) => {
      const { activeConversationId } = get();
      if (!activeConversationId) return;
      await service.deleteMessage(messageId);
      set((state) => ({
        messages: {
          ...state.messages,
          [activeConversationId]: (state.messages[activeConversationId] || []).filter(
            (m) => m.id !== messageId
          ),
        },
      }));
    },

    toggleReaction: async (messageId: string, emoji: string) => {
      const { activeConversationId, messages } = get();
      if (!activeConversationId) return;
      const msg = (messages[activeConversationId] || []).find((m) => m.id === messageId);
      const hasReacted = msg?.reactions.some((r) => r.emoji === emoji && r.userIds.includes('user_me'));
      if (hasReacted) {
        await service.removeReaction(messageId, emoji);
      } else {
        await service.addReaction(messageId, emoji);
      }
    },

    editMessage: async (messageId: string, newContent: string) => {
      const { activeConversationId, messages } = get();
      if (!activeConversationId) return;
      const convMessages = messages[activeConversationId] || [];
      const updated = convMessages.map((m) =>
        m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
      );
      set({
        messages: {
          ...messages,
          [activeConversationId]: updated,
        },
      });
    },

    pinMessage: async (messageId: string) => {
      const { activeConversationId, messages } = get();
      if (!activeConversationId) return;
      const convMessages = messages[activeConversationId] || [];
      const updated = convMessages.map((m) =>
        m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
      );
      set({
        messages: {
          ...messages,
          [activeConversationId]: updated,
        },
      });
    },

    forwardMessage: async (targetConversationId: string, content: string) => {
      await service.sendMessage(targetConversationId, content);
      const targetMessages = get().messages[targetConversationId] || [];
      const newMsg: Message = {
        id: `msg_fwd_${Date.now()}`,
        conversationId: targetConversationId,
        senderId: 'user_me',
        content,
        timestamp: Date.now(),
        type: 'text',
        status: 'sent',
        reactions: [],
      };
      set((state) => ({
        messages: {
          ...state.messages,
          [targetConversationId]: [...targetMessages, newMsg],
        },
        conversations: state.conversations.map((c) =>
          c.id === targetConversationId
            ? { ...c, lastMessage: newMsg, updatedAt: newMsg.timestamp }
            : c
        ),
      }));
    },

    togglePinConversation: async (id: string) => {
      await service.togglePinConversation(id);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, isPinned: !c.isPinned } : c
        ),
      }));
    },

    toggleMuteConversation: async (id: string) => {
      await service.toggleMuteConversation(id);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, isMuted: !c.isMuted } : c
        ),
      }));
    },

    toggleArchiveConversation: async (id: string) => {
      await service.toggleArchiveConversation(id);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, isArchived: !c.isArchived } : c
        ),
      }));
    },

    deleteConversation: async (id: string) => {
      await service.deleteConversation(id);
      const remaining = get().conversations.filter((c) => c.id !== id);
      set({
        conversations: remaining,
        activeConversationId: remaining.length > 0 ? remaining[0].id : null,
      });
    },

    setDisappearingTimer: async (timer: DisappearingTimerValue) => {
      const { activeConversationId } = get();
      if (!activeConversationId) return;
      await service.setDisappearingTimer(activeConversationId, timer);

      // Signal shows an in-chat notice when the disappearing timer is changed.
      const timerLabel = timerLabelForValue(timer);
      const noticeText =
        timer === 0
          ? 'You turned off disappearing messages.'
          : `You set the disappearing message time to ${timerLabel}.`;

      const sysMsg: Message = {
        id: `sys_timer_${Date.now()}`,
        conversationId: activeConversationId,
        senderId: 'system',
        content: noticeText,
        timestamp: Date.now(),
        type: 'system',
        status: 'read',
        reactions: [],
        systemEventType: 'timer_changed',
      };

      const curMsgs = get().messages[activeConversationId] || [];
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === activeConversationId
            ? {
                ...c,
                disappearingTimer: timer,
                lastMessage: sysMsg,
                updatedAt: Date.now(),
              }
            : c
        ),
        messages: {
          ...state.messages,
          [activeConversationId]: [...curMsgs, sysMsg],
        },
      }));
    },

    createDirectChat: async (userId: string) => {
      const conv = await service.createDirectConversation(userId);
      set((state) => ({
        conversations: [conv, ...state.conversations.filter((c) => c.id !== conv.id)],
      }));
      await get().setActiveConversation(conv.id);
      return conv.id;
    },

    createGroupChat: async (name: string, userIds: string[]) => {
      const group = await service.createGroupConversation(name, userIds);
      const enhancedGroup: Conversation = {
        ...group,
        adminIds: group.adminIds || ['user_me'],
        permissions: group.permissions || {
          editGroupInfo: 'all',
          sendMessages: 'all',
          addMembers: 'all',
        },
      };
      set((state) => ({
        conversations: [enhancedGroup, ...state.conversations],
      }));
      await get().setActiveConversation(enhancedGroup.id);
      return enhancedGroup.id;
    },

    setTyping: async (conversationId: string, isTyping: boolean) => {
      await service.setTypingStatus(conversationId, isTyping);
    },

    addGroupMember: async (conversationId: string, user: User) => {
      set((state) => ({
        conversations: state.conversations.map((c) => {
          if (c.id !== conversationId) return c;
          if (c.participants.some((p) => p.id === user.id)) return c;
          return {
            ...c,
            participants: [...c.participants, user],
          };
        }),
      }));
    },

    removeGroupMember: async (conversationId: string, userId: string) => {
      const conv = get().conversations.find((c) => c.id === conversationId);
      const member = conv?.participants.find((p) => p.id === userId);
      const memberName = member?.displayName || 'Member';

      const sysMsg: Message = {
        id: `sys_remove_${Date.now()}`,
        conversationId,
        senderId: 'system',
        content: `You removed ${memberName} from the group.`,
        timestamp: Date.now(),
        type: 'system',
        status: 'read',
        reactions: [],
        systemEventType: 'member_removed',
      };

      const curMsgs = get().messages[conversationId] || [];

      set((state) => ({
        conversations: state.conversations.map((c) => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            participants: c.participants.filter((p) => p.id !== userId),
            adminIds: (c.adminIds || []).filter((id) => id !== userId),
            lastMessage: sysMsg,
            updatedAt: Date.now(),
          };
        }),
        messages: {
          ...state.messages,
          [conversationId]: [...curMsgs, sysMsg],
        },
      }));

      get().showToast(`${memberName} removed from group`);
    },

    toggleBlockConversation: async (id: string) => {
      const conv = get().conversations.find((c) => c.id === id);
      if (!conv) return;
      const nextBlocked = !conv.isBlocked;
      const content = nextBlocked
        ? `You blocked this contact.`
        : `You unblocked this contact.`;

      const sysMsg: Message = {
        id: `sys_block_${Date.now()}`,
        conversationId: id,
        senderId: 'system',
        content,
        timestamp: Date.now(),
        type: 'system',
        status: 'read',
        reactions: [],
        systemEventType: 'user_blocked',
      };

      const curMsgs = get().messages[id] || [];

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id
            ? { ...c, isBlocked: nextBlocked, lastMessage: sysMsg, updatedAt: Date.now() }
            : c
        ),
        messages: {
          ...state.messages,
          [id]: [...curMsgs, sysMsg],
        },
      }));

      get().showToast(nextBlocked ? `Blocked ${conv.name}` : `Unblocked ${conv.name}`);
    },

    blockGroupMember: async (conversationId: string, userId: string) => {
      const conv = get().conversations.find((c) => c.id === conversationId);
      const member = conv?.participants.find((p) => p.id === userId);
      const memberName = member?.displayName || 'Member';

      const sysMsg: Message = {
        id: `sys_block_grp_${Date.now()}`,
        conversationId,
        senderId: 'system',
        content: `You blocked ${memberName}.`,
        timestamp: Date.now(),
        type: 'system',
        status: 'read',
        reactions: [],
        systemEventType: 'user_blocked',
      };

      const curMsgs = get().messages[conversationId] || [];

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [...curMsgs, sysMsg],
        },
      }));

      get().showToast(`Blocked ${memberName}`);
    },

    setMemberRole: async (conversationId: string, userId: string, role: 'admin' | 'member') => {
      set((state) => ({
        conversations: state.conversations.map((c) => {
          if (c.id !== conversationId) return c;
          const currentAdmins = c.adminIds || ['user_me'];
          const nextAdmins = role === 'admin'
            ? Array.from(new Set([...currentAdmins, userId]))
            : currentAdmins.filter((id) => id !== userId);
          return {
            ...c,
            adminIds: nextAdmins,
          };
        }),
      }));
    },

    updateGroupPermissions: async (conversationId: string, permissions: Partial<GroupPermissions>) => {
      set((state) => ({
        conversations: state.conversations.map((c) => {
          if (c.id !== conversationId) return c;
          return {
            ...c,
            permissions: {
              editGroupInfo: c.permissions?.editGroupInfo || 'all',
              sendMessages: c.permissions?.sendMessages || 'all',
              addMembers: c.permissions?.addMembers || 'all',
              ...permissions,
            },
          };
        }),
      }));
    },

    setGroupChatColor: async (conversationId: string, color: string) => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, color } : c
        ),
      }));
    },

    leaveGroup: async (conversationId: string) => {
      const { activeConversationId, conversations } = get();
      const nextConversations = conversations.filter((c) => c.id !== conversationId);
      set({
        conversations: nextConversations,
        activeConversationId: activeConversationId === conversationId
          ? (nextConversations[0]?.id || null)
          : activeConversationId,
        isContactDetailsOpen: false,
      });
    },

    blockGroup: async (conversationId: string) => {
      const { conversations } = get();
      set({
        conversations: conversations.map((c) =>
          c.id === conversationId ? { ...c, isArchived: true, isMuted: true } : c
        ),
        isContactDetailsOpen: false,
      });
    },

    sendPoll: async (question: string, options: string[], allowMultiple: boolean) => {
      const { activeConversationId } = get();
      if (!activeConversationId) return;

      const pollData: PollData = {
        question,
        options: options.map((optText, idx) => ({
          id: `opt_${idx}_${Date.now()}`,
          text: optText,
          voterIds: [],
        })),
        allowMultiple,
      };

      const serializedContent = `__POLL__:${JSON.stringify(pollData)}`;
      const pollMessage = await service.sendMessage(activeConversationId, serializedContent);

      const curMsgs = get().messages[activeConversationId] || [];
      const exists = curMsgs.some((m) => m.id === pollMessage.id);
      const nextMessages = exists
        ? curMsgs.map((m) => (m.id === pollMessage.id ? pollMessage : m))
        : [...curMsgs, pollMessage];

      set((state) => ({
        messages: {
          ...state.messages,
          [activeConversationId]: nextMessages,
        },
        conversations: state.conversations.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: pollMessage, updatedAt: pollMessage.timestamp }
            : c
        ),
      }));

      try {
        const audio = new Audio('/sounds/pop.ogg');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {}
    },

    votePoll: async (messageId: string, optionId: string) => {
      const { activeConversationId, messages } = get();
      if (!activeConversationId) return;
      const convMsgs = messages[activeConversationId] || [];

      // Find active user ID
      const activeUserId = (service as any).activeUserId || localStorage.getItem('signal_user_id') || 'user_me';

      const targetMsg = convMsgs.find((m) => m.id === messageId);
      if (!targetMsg || !targetMsg.poll) return;

      const isMulti = targetMsg.poll.allowMultiple;
      const newOptions = targetMsg.poll.options.map((opt) => {
        const isTargetOpt = opt.id === optionId;
        const hasVoted = opt.voterIds.includes(activeUserId);

        if (isTargetOpt) {
          return {
            ...opt,
            voterIds: hasVoted
              ? opt.voterIds.filter((uid) => uid !== activeUserId)
              : [...opt.voterIds, activeUserId],
          };
        } else if (!isMulti) {
          return {
            ...opt,
            voterIds: opt.voterIds.filter((uid) => uid !== activeUserId),
          };
        }
        return opt;
      });

      const updatedPoll: PollData = {
        ...targetMsg.poll,
        options: newOptions,
      };

      const updatedMsg: Message = {
        ...targetMsg,
        poll: updatedPoll,
        content: `__POLL__:${JSON.stringify(updatedPoll)}`,
      };

      set({
        messages: {
          ...messages,
          [activeConversationId]: convMsgs.map((m) => (m.id === messageId ? updatedMsg : m)),
        },
      });

      // Broadcast updated poll status
      try {
        await service.sendMessage(activeConversationId, `__POLL__:${JSON.stringify(updatedPoll)}`);
      } catch {}
    },

    endPoll: async (messageId: string) => {
      const { activeConversationId, messages } = get();
      if (!activeConversationId) return;
      const convMsgs = messages[activeConversationId] || [];

      const targetMsg = convMsgs.find((m) => m.id === messageId);
      if (!targetMsg || !targetMsg.poll) return;

      const activeUserId = (service as any).activeUserId || localStorage.getItem('signal_user_id') || 'user_me';
      const currentUser = useSettingsStore.getState().currentUser;
      const isCreator =
        targetMsg.senderId === activeUserId ||
        targetMsg.senderId === 'user_me' ||
        targetMsg.senderId === 'me' ||
        (currentUser && targetMsg.senderId === currentUser.id);

      if (!isCreator) return;

      const updatedPoll: PollData = {
        ...targetMsg.poll,
        isEnded: true,
      };

      const updatedMsg: Message = {
        ...targetMsg,
        poll: updatedPoll,
        content: `__POLL__:${JSON.stringify(updatedPoll)}`,
      };

      const sysMsg: Message = {
        id: `sys_end_poll_${Date.now()}`,
        conversationId: activeConversationId,
        senderId: 'system',
        content: `You ended the poll: ${targetMsg.poll.question}`,
        timestamp: Date.now(),
        type: 'system',
        status: 'read',
        reactions: [],
        systemEventType: 'poll_ended' as any,
      };

      const updatedList = convMsgs.map((m) => (m.id === messageId ? updatedMsg : m));

      set({
        messages: {
          ...messages,
          [activeConversationId]: [...updatedList, sysMsg],
        },
        conversations: get().conversations.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: sysMsg, updatedAt: Date.now() }
            : c
        ),
      });

      try {
        await service.sendMessage(activeConversationId, `__POLL__:${JSON.stringify(updatedPoll)}`);
      } catch {}
    },
  };
});
