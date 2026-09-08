'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Conversation } from '../../types';
import { MessageBubble } from './MessageBubble';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface MessageListProps {
  conversation: Conversation;
}

export const MessageList: React.FC<MessageListProps> = ({ conversation }) => {
  const { messages, typingUsers, conversations, setContactDetailsOpen, searchQuery } = useChatStore();
  const { currentUser } = useSettingsStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const rawMessages = messages[conversation.id] || [];
  const conversationMessages = rawMessages.filter((m) => {
    if (m.isDisappearing && m.expiresAt) {
      return m.expiresAt > now;
    }
    return true;
  });

  const activeTypingUsers = typingUsers[conversation.id] || [];
  const otherTypingUsers = activeTypingUsers.filter((uid) => uid !== currentUser?.id);
  const isSomeoneTyping = otherTypingUsers.length > 0;

  useEffect(() => {
    if (!searchQuery.trim()) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length, conversation.id, isSomeoneTyping, searchQuery]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isFarFromBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isDirect = conversation.type === 'direct';
  const otherUser = isDirect
    ? conversation.participants.find((p) => p.id !== currentUser?.id) || conversation.participants[0]
    : null;
  const displayName = isDirect && otherUser ? otherUser.displayName : conversation.name;
  const avatarUrl = isDirect && otherUser ? (otherUser.avatarUrl || conversation.avatarUrl) : conversation.avatarUrl;

  const commonGroups = isDirect && otherUser
    ? conversations.filter(
        (c) => c.type === 'group' && c.participants.some((p) => p.id === otherUser.id)
      )
    : [];

  const formatDateDivider = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getGroupMemberSummary = () => {
    const others = conversation.participants.filter((p) => p.id !== currentUser?.id);
    if (others.length === 0) return 'Just you';
    if (others.length === 1) return `${others[0].displayName} and you`;
    if (others.length === 2) return `${others[0].displayName}, ${others[1].displayName} and you`;
    return `${others[0].displayName}, ${others[1].displayName} and ${others.length - 2} others`;
  };

  const renderCommonGroupsText = () => {
    if (commonGroups.length === 0) return 'No groups in common';
    if (commonGroups.length <= 3) {
      const names = commonGroups.map((g, idx) => (
        <React.Fragment key={g.id}>
          <strong className="font-semibold text-neutral-900 dark:text-white">{g.name}</strong>
          {idx < commonGroups.length - 1 ? ', ' : ''}
        </React.Fragment>
      ));
      return <>Member of {names}</>;
    }
    const firstThree = commonGroups.slice(0, 3).map((g, idx) => (
      <React.Fragment key={g.id}>
        <strong className="font-semibold text-neutral-900 dark:text-white">{g.name}</strong>
        {idx < 2 ? ', ' : ''}
      </React.Fragment>
    ));
    const remaining = commonGroups.length - 3;
    return <>Member of {firstThree} and {remaining} more</>;
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-6 py-4 flex flex-col bg-white dark:bg-[#121212] select-text relative"
    >

      {/* 1. Contact or Group Intro Card */}
      {isDirect ? (
        <div className="flex justify-center mt-10 mb-6 select-none">
          <div
            onClick={() => setContactDetailsOpen(true)}
            className="relative w-80 bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-[#2B2B2B] rounded-[32px] pt-10 pb-5 px-6 flex flex-col items-center text-center cursor-pointer hover:bg-neutral-50/80 dark:hover:bg-[#232323] transition-colors group"
          >
            {/* Avatar overlapping top border */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <Avatar name={displayName} src={avatarUrl} size="xl" className="w-20 h-20 shadow-md" />
            </div>

            <div className="flex items-center space-x-1 font-semibold text-neutral-900 dark:text-white text-lg">
              <span>{displayName}</span>
              <SignalIcon name="chevron_right" className="w-4 h-4 text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors" />
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-normal">
              <SignalIcon name="group" className="w-4 h-4 text-neutral-400 dark:text-neutral-400 flex-shrink-0" />
              <span>{renderCommonGroupsText()}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center mt-10 mb-6 select-none">
          <div
            onClick={() => setContactDetailsOpen(true)}
            className="relative w-80 bg-white dark:bg-[#1E1E1E] border border-neutral-200 dark:border-[#2B2B2B] rounded-[32px] pt-10 pb-5 px-6 flex flex-col items-center text-center cursor-pointer hover:bg-neutral-50/80 dark:hover:bg-[#232323] transition-colors group"
          >
            {/* Avatar overlapping top border */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <Avatar
                name={conversation.name}
                src={conversation.avatarUrl}
                size="xl"
                isGroup={true}
                className="w-20 h-20 shadow-md"
              />
            </div>

            <div className="flex items-center space-x-1 font-semibold text-neutral-900 dark:text-white text-lg">
              <span>{conversation.name}</span>
              <SignalIcon name="chevron_right" className="w-4 h-4 text-neutral-400 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors" />
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-normal">
              <SignalIcon name="group" className="w-4 h-4 text-neutral-400 dark:text-neutral-400 flex-shrink-0" />
              <span>{getGroupMemberSummary()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Message Thread */}
      <div className="flex flex-col space-y-1">
        {conversationMessages.length === 0 && !isDirect && (
          <>
            <div className="flex justify-center my-4 select-none">
              <span className="text-neutral-500 dark:text-neutral-400 text-xs font-normal">
                Today
              </span>
            </div>
            <div className="flex items-center justify-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400 my-3 select-none">
              <SignalIcon name="group" className="w-3.5 h-3.5" />
              <span>You created the group.</span>
            </div>
          </>
        )}

        {conversationMessages.map((msg, index) => {
          const prevMsg = conversationMessages[index - 1];
          const nextMsg = conversationMessages[index + 1];
          const isMe =
            Boolean(currentUser?.id && msg.senderId === currentUser.id) ||
            (msg.senderId === 'user_me' && (currentUser?.id === 'user_me' || !currentUser?.id)) ||
            (msg.senderId === 'me' && (currentUser?.id === 'me' || !currentUser?.id));
          const sender = conversation.participants.find((p) => p.id === msg.senderId);

          const showDateDivider =
            !prevMsg ||
            new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

          const isSameSenderPrev = prevMsg && prevMsg.senderId === msg.senderId;
          const isCloseTimePrev = prevMsg && Math.abs(msg.timestamp - prevMsg.timestamp) < 60 * 1000;
          const isFirstInSequence = !isSameSenderPrev || !isCloseTimePrev || showDateDivider;

          const isSameSenderNext = nextMsg && nextMsg.senderId === msg.senderId;
          const isCloseTimeNext = nextMsg && Math.abs(nextMsg.timestamp - msg.timestamp) < 60 * 1000;
          const isNextDateDivider = nextMsg && new Date(nextMsg.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
          const isLastInSequence = !isSameSenderNext || !isCloseTimeNext || isNextDateDivider;

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className="flex justify-center my-4 select-none">
                  <span className="text-neutral-500 dark:text-neutral-400 text-xs font-normal">
                    {formatDateDivider(msg.timestamp)}
                  </span>
                </div>
              )}

              {index === 0 && !isDirect && (
                <div className="flex items-center justify-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400 my-3 select-none">
                  <SignalIcon name="group" className="w-3.5 h-3.5" />
                  <span>You created the group.</span>
                </div>
              )}

              <MessageBubble
                message={msg}
                sender={sender}
                isMe={isMe}
                showSenderName={conversation.type === 'group'}
                isFirstInSequence={isFirstInSequence}
                isLastInSequence={isLastInSequence}
                searchQuery={searchQuery}
              />
            </React.Fragment>
          );
        })}

        {/* Typing Indicator Bubble (matches Signal Desktop screenshot media_1788812502709.png) */}
        {isSomeoneTyping && (
          <div className="flex justify-start my-1 animate-in fade-in duration-200">
            <div className="h-[32px] px-3.5 inline-flex items-center justify-center rounded-[18px] bg-[#f0f0f0] dark:bg-[#323232]">
              <div className="flex items-center space-x-1.5">
                <span className="signal-typing-dot-bubble" />
                <span className="signal-typing-dot-bubble" />
                <span className="signal-typing-dot-bubble" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={bottomRef} />

      {/* Floating Scroll to Bottom button (matches Signal Desktop screenshot media_1788819975421.png) */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-16 right-6 w-9 h-9 rounded-full bg-white dark:bg-[#2c2c2c] border border-neutral-200 dark:border-[#383838] shadow-md flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#333333] transition-all z-20 cursor-pointer"
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <SignalIcon name="chevron_down" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
