'use client';

import React, { useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { SignalIcon } from '../common/SignalIcon';
import { Avatar } from '../common/Avatar';
import { ChatListItem } from './ChatListItem';
import { NewChatPanel } from '../modals/NewChatModal';

import { AddChatFolderModal } from '../modals/AddChatFolderModal';

interface LeftPaneProps {
  width?: number;
}

export const LeftPane: React.FC<LeftPaneProps> = ({ width = 320 }) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
    navTabsCollapsed,
    toggleNavTabsCollapsed,
    setActiveTab,
    messages,
  } = useChatStore();

  const { currentUser, setSettingsModalOpen } = useSettingsStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [isViewingArchive, setIsViewingArchive] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMs < 60 * 1000) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getMessageTitle = (msg: any, conv: any) => {
    const isMe = msg.senderId === currentUser?.id || msg.senderId === 'user_me';
    const isDirect = conv.type === 'direct';
    const otherUser = isDirect
      ? conv.participants.find((p: any) => p.id !== currentUser?.id) || conv.participants[0]
      : null;
    const otherName = isDirect && otherUser ? otherUser.displayName : conv.name;

    if (isMe) {
      return `You to ${otherName}`;
    } else {
      const sender = conv.participants.find((p: any) => p.id === msg.senderId);
      const senderName = sender ? sender.displayName : 'Someone';
      return isDirect ? `${senderName} to You` : `${senderName} to ${conv.name}`;
    }
  };

  const matchingGlobalMessages = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: { message: any; conversation: any }[] = [];

    for (const conv of conversations) {
      const convMsgs = messages[conv.id] || [];
      for (const msg of convMsgs) {
        if (msg.type !== 'system' && msg.content && msg.content.toLowerCase().includes(q)) {
          results.push({ message: msg, conversation: conv });
        }
      }
    }

    return results.sort((a, b) => b.message.timestamp - a.message.timestamp);
  }, [searchQuery, conversations, messages]);

  const filtered = conversations.filter((c) => {
    if (isViewingArchive) {
      if (!c.isArchived) return false;
    } else {
      if (c.isArchived) return false;
    }
    if (filterUnread && !((c.unreadCount || 0) > 0)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchMsg = c.lastMessage?.content.toLowerCase().includes(q);
      return matchName || matchMsg;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const timeA = a.lastMessage?.timestamp || a.updatedAt;
    const timeB = b.lastMessage?.timestamp || b.updatedAt;
    return timeB - timeA;
  });

  // Compact icon-only view matching media_1788825136915.png & media_1788825165615.png
  if (width < 160) {
    return (
      <div
        style={{ width: `${width}px` }}
        className="flex-shrink-0 bg-[#f6f6f6] dark:bg-[#1E1E1E] flex flex-col items-center h-full select-none py-2.5 border-r border-neutral-200 dark:border-[#232323]"
      >
        {/* Single centered vertical column matching media_1788825830853.png */}
        <div className="flex flex-col items-center space-y-3 mb-4 w-full">
          {/* 1. Hamburger menu (three lines) — only when left nav rail is collapsed */}
          {navTabsCollapsed && (
            <button
              onClick={toggleNavTabsCollapsed}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 dark:text-neutral-300 hover:text-white hover:bg-neutral-200 dark:hover:bg-[#282828] transition-colors cursor-pointer"
              title="Show tabs"
              aria-label="Show tabs"
            >
              <SignalIcon name="menu" className="w-5 h-5" />
            </button>
          )}

          {/* 2. Compose icon */}
          <button
            onClick={() => setShowNewChat(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 dark:text-neutral-300 hover:text-white hover:bg-neutral-200 dark:hover:bg-[#282828] transition-colors cursor-pointer"
            title="New Chat"
          >
            <SignalIcon name="compose" className="w-5 h-5" />
          </button>

          {/* 3. More (...) button */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 dark:text-neutral-300 hover:text-white hover:bg-neutral-200 dark:hover:bg-[#282828] transition-colors cursor-pointer"
              title="More options"
            >
              <SignalIcon name="more" className="w-5 h-5" />
            </button>

            {/* Three-dots Menu */}
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute left-12 top-0 w-52 bg-[#282828] dark:bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-2xl py-1.5 px-1 z-40 text-white select-none animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setIsViewingArchive(!isViewingArchive);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left text-white cursor-pointer"
                  >
                    <SignalIcon name="archive" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>{isViewingArchive ? 'Back to chats' : 'View Archive'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowAddFolderModal(true);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left text-white cursor-pointer"
                  >
                    <SignalIcon name="folder_plus" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Add chat folder</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 4. Vertical Avatar Stack matching media_1788825830853.png */}
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center space-y-3 px-1 scrollbar-none">
          {sorted.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                title={conv.name}
                className={`relative flex items-center justify-center transition-all cursor-pointer ${
                  isActive
                    ? 'w-12 h-12 rounded-2xl bg-[#323232] dark:bg-[#323232] shadow-sm'
                    : 'w-10 h-10 rounded-full hover:opacity-85'
                }`}
              >
                <Avatar
                  name={conv.name}
                  src={conv.avatarUrl}
                  size="md"
                  isGroup={conv.type === 'group'}
                  className={isActive ? 'w-9 h-9' : 'w-10 h-10'}
                />

                {conv.unreadCount > 0 && !isActive && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#2c6bed] rounded-full border border-white dark:border-[#1E1E1E]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modals */}
        <AddChatFolderModal
          isOpen={showAddFolderModal}
          onClose={() => setShowAddFolderModal(false)}
        />
      </div>
    );
  }

  // Show the inline New Chat panel (replaces the chat list, no overlay)
  if (showNewChat) {
    return (
      <div
        style={{ width: `${width}px` }}
        className="flex-shrink-0 bg-[#f6f6f6] dark:bg-[#1E1E1E] border-r border-neutral-200 dark:border-[#232323] flex flex-col h-full select-none overflow-hidden"
      >
        <NewChatPanel onClose={() => setShowNewChat(false)} />
      </div>
    );
  }

  return (
    <div
      style={{ width: `${width}px` }}
      className="flex-shrink-0 bg-[#f6f6f6] dark:bg-[#1E1E1E] border-r border-neutral-200 dark:border-[#232323] flex flex-col h-full select-none"
    >
      {/* 1. Header: Title + Compose + More */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            {isViewingArchive ? (
              <button
                onClick={() => setIsViewingArchive(false)}
                className="p-1 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer flex items-center space-x-1.5"
                title="Back to chats"
              >
                <SignalIcon name="chevron_left" className="w-5 h-5" />
                <span className="text-base font-semibold text-neutral-900 dark:text-white">Archived</span>
              </button>
            ) : (
              <>
                {navTabsCollapsed && (
                  <button
                    onClick={toggleNavTabsCollapsed}
                    className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
                    title="Show tabs"
                    aria-label="Show tabs"
                  >
                    <SignalIcon name="menu" className="w-5 h-5" />
                  </button>
                )}
                <h1 className="text-lg font-semibold text-neutral-900 dark:text-white tracking-tight">Chats</h1>
              </>
            )}
          </div>

          <div className="relative flex items-center space-x-0.5 text-neutral-700 dark:text-white">
            {/* Compose button — opens inline panel */}
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
              title="New Chat"
            >
              <SignalIcon name="compose" className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
              title="More options"
            >
              <SignalIcon name="more" className="w-5 h-5" />
            </button>

            {/* More Menu Dropdown */}
            {showMoreMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)} />
                <div className="absolute right-0 top-10 w-52 bg-[#282828] dark:bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-2xl py-1.5 px-1 z-50 text-white select-none animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setIsViewingArchive(!isViewingArchive);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left text-white cursor-pointer"
                  >
                    <SignalIcon name="archive" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>{isViewingArchive ? 'Back to chats' : 'View Archive'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowAddFolderModal(true);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left text-white cursor-pointer"
                  >
                    <SignalIcon name="folder_plus" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Add chat folder</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2. Search Box + Filter Icon */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center bg-[#e8e8e8] dark:bg-[#2C2C2C] rounded-full px-3 py-1.5 border border-transparent dark:border-[#444444] transition-all min-w-0">
            {activeConversation && searchQuery && (
              <div className="flex items-center space-x-1 bg-[#3c3c3c] text-white text-xs px-2 py-0.5 rounded-full mr-1.5 flex-shrink-0 select-none">
                <Avatar
                  name={activeConversation.name}
                  src={activeConversation.avatarUrl}
                  size="sm"
                  className="w-3.5 h-3.5"
                />
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-neutral-300 ml-0.5 cursor-pointer"
                >
                  <SignalIcon name="x" className="w-3 h-3" />
                </button>
              </div>
            )}
            {(!activeConversation || !searchQuery) && (
              <SignalIcon name="search" className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mr-2" />
            )}
            <input
              id="main-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={filterUnread ? 'Search unread chats' : 'Search'}
              className="flex-1 bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 text-sm outline-none border-none focus:outline-none min-w-0"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-neutral-400 hover:text-white transition-colors p-0.5 flex-shrink-0 cursor-pointer ml-1"
                title="Clear search"
              >
                <SignalIcon name="x" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter button — blue filled circle when active */}
          <button
            onClick={() => setFilterUnread(!filterUnread)}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              filterUnread ? 'bg-[#2c6bed] text-white' : 'text-neutral-700 dark:text-white hover:opacity-70'
            }`}
            title={filterUnread ? 'Clear filter' : 'Filter by unread'}
          >
            <SignalIcon name="filter" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Filtered by unread label */}
      {filterUnread && (
        <div className="px-4 pb-1">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-white">Filtered by unread</p>
        </div>
      )}

      {/* 4. Conversation List & Messages Search Results */}
      <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-1">
        {searchQuery.trim() ? (
          <div>
            <div className="px-3 py-1.5 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Messages
            </div>

            {matchingGlobalMessages.length === 0 ? (
              <div className="px-3 py-4 text-xs text-neutral-400 italic">
                No messages found
              </div>
            ) : (
              <div className="space-y-1">
                {matchingGlobalMessages.map(({ message: msg, conversation: conv }) => {
                  const isMe = msg.senderId === currentUser?.id || msg.senderId === 'user_me';
                  const title = getMessageTitle(msg, conv);
                  const activeUser = isMe
                    ? currentUser
                    : conv.participants.find((p: any) => p.id === msg.senderId);
                  const displayAvatar = isMe
                    ? currentUser?.avatarUrl || conv.avatarUrl
                    : activeUser?.avatarUrl || conv.avatarUrl;

                  return (
                    <button
                      key={msg.id}
                      onClick={async () => {
                        await setActiveConversation(conv.id);
                        setTimeout(() => {
                          const el = document.getElementById(`msg-${msg.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }, 150);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-2xl hover:bg-neutral-200/60 dark:hover:bg-[#282828] transition-colors text-left cursor-pointer group"
                    >
                      <Avatar
                        name={title}
                        src={displayAvatar}
                        size="md"
                        className="w-10 h-10 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                            {title}
                          </span>
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex-shrink-0 ml-2">
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                          {msg.content}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 pb-12">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {isViewingArchive
                ? 'No archived chats'
                : filterUnread
                ? 'No unread chats'
                : 'No active chats'}
            </p>
            {filterUnread && (
              <button
                onClick={() => setFilterUnread(false)}
                className="px-5 py-2 bg-neutral-200 dark:bg-[#2C2C2C] hover:bg-neutral-300 dark:hover:bg-[#383838] text-neutral-900 dark:text-white text-sm font-semibold rounded-full transition-colors cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          sorted.map((conv) => (
            <ChatListItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onClick={() => setActiveConversation(conv.id)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <AddChatFolderModal
        isOpen={showAddFolderModal}
        onClose={() => setShowAddFolderModal(false)}
      />
    </div>
  );
};
