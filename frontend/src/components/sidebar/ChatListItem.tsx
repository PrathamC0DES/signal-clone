'use client';

import React, { useState, useEffect } from 'react';
import { Conversation } from '../../types';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface ChatListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [, setTick] = useState(0);

  // Live timer so relative timestamps (now -> 1m -> 2m) update smoothly in real time
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    typingUsers,
    togglePinConversation,
    toggleMuteConversation,
    toggleArchiveConversation,
    deleteConversation,
  } = useChatStore();
  const { currentUser } = useSettingsStore();

  const activeTyping = (typingUsers[conversation.id] || []).filter((uid) => uid !== currentUser?.id);
  const isTyping = activeTyping.length > 0;
  const lastMsg = conversation.lastMessage;

  const isDirect = conversation.type === 'direct';
  const otherUser = isDirect ? conversation.participants.find((p) => p.id !== currentUser?.id) : null;
  const displayName = isDirect && otherUser ? otherUser.displayName : conversation.name;
  const avatarUrl = isDirect && otherUser ? (otherUser.avatarUrl || conversation.avatarUrl) : conversation.avatarUrl;

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));

    // If fresh (under 60s), show 'Now'
    if (diffMs < 60 * 1000) {
      return 'Now';
    }
    // Under an hour, show minutes (e.g. 1m, 2m, ..., 59m)
    if (diffMins < 60) {
      return `${diffMins}m`;
    }

    // Above 59 mins: use literal timings (e.g. 1:49 AM)
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setContextMenuPos(null);

  return (
    <div className="relative my-0.5">
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className={
          'group flex items-center px-3 py-2.5 rounded-xl cursor-pointer select-none transition-colors ' +
          (isActive
            ? 'bg-[#e4e4e4] dark:bg-[#313131] text-neutral-900 dark:text-white'
            : 'hover:bg-[#ebebeb] dark:hover:bg-[#272727] text-neutral-800 dark:text-neutral-200')
        }
      >
        {/* Contact Avatar */}
        <div className="relative mr-3 flex-shrink-0">
          <Avatar
            name={displayName}
            src={avatarUrl}
            size="md"
            isGroup={conversation.type === 'group'}
          />
        </div>

        {/* Name & Snippet */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span
              className={
                'text-sm truncate font-medium ' +
                (isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-white')
              }
            >
              {displayName}
            </span>

            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 ml-2 flex-shrink-0">
              {formatTimestamp(lastMsg?.timestamp || conversation.updatedAt)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center truncate mr-1">
              {isTyping ? (
                <div className="flex items-center space-x-1.5 py-1">
                  <span className="signal-typing-dot bg-neutral-900 dark:bg-white" />
                  <span className="signal-typing-dot bg-neutral-900 dark:bg-white" />
                  <span className="signal-typing-dot bg-neutral-900 dark:bg-white" />
                </div>
              ) : (
                <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {(() => {
                    if (!lastMsg) return 'No messages yet';
                    if (conversation.type === 'group') {
                      const isMe =
                        Boolean(currentUser?.id && lastMsg.senderId === currentUser.id) ||
                        (lastMsg.senderId === 'user_me' && (currentUser?.id === 'user_me' || !currentUser?.id)) ||
                        (lastMsg.senderId === 'me' && (currentUser?.id === 'me' || !currentUser?.id));
                      if (isMe) {
                        return `You: ${lastMsg.content}`;
                      }
                      const sender = conversation.participants.find((p) => p.id === lastMsg.senderId);
                      const senderName = sender?.displayName || 'Someone';
                      return `${senderName}: ${lastMsg.content}`;
                    }
                    return lastMsg.content;
                  })()}
                </span>
              )}
            </div>

            {/* Unread badge or checkmark indicator */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              {!isTyping && conversation.unreadCount && conversation.unreadCount > 0 ? (
                <span className="min-w-[18px] h-[18px] px-1 bg-[#135bef] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {conversation.unreadCount}
                </span>
              ) : !isTyping && lastMsg && (lastMsg.senderId === currentUser?.id || (lastMsg.senderId === 'user_me' && (currentUser?.id === 'user_me' || !currentUser?.id))) ? (
                <span className="inline-flex items-center">
                  {lastMsg.status === 'read' ? (
                    <SignalIcon name="read" className="w-[22px] h-[15px] text-[#2c6bed] dark:text-[#BED2FA]" />
                  ) : lastMsg.status === 'delivered' ? (
                    <SignalIcon name="double-check" className="w-[22px] h-[15px] text-neutral-400 opacity-90" />
                  ) : (
                    <SignalIcon name="check" className="w-[15px] h-[15px] text-neutral-400 opacity-80" />
                  )}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu on Right Click */}
      {contextMenuPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
            className="fixed z-50 w-44 bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-[#333333] rounded-xl shadow-2xl py-1 text-xs text-neutral-800 dark:text-neutral-200"
          >
            <button
              onClick={() => {
                togglePinConversation(conversation.id);
                closeMenu();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] hover:text-neutral-900 dark:hover:text-white"
            >
              {conversation.isPinned ? 'Unpin chat' : 'Pin chat'}
            </button>
            <button
              onClick={() => {
                toggleMuteConversation(conversation.id);
                closeMenu();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] hover:text-neutral-900 dark:hover:text-white"
            >
              {conversation.isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={() => {
                toggleArchiveConversation(conversation.id);
                closeMenu();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] hover:text-neutral-900 dark:hover:text-white"
            >
              Archive
            </button>
            <div className="my-1 border-t border-neutral-200 dark:border-[#2b2b2b]" />
            <button
              onClick={() => {
                deleteConversation(conversation.id);
                closeMenu();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-500 dark:text-red-400"
            >
              Delete chat
            </button>
          </div>
        </>
      )}
    </div>
  );
};
