'use client';

import React, { useState, useEffect } from 'react';
import { Message, User } from '../../types';
import { SignalIcon } from '../common/SignalIcon';
import { Avatar } from '../common/Avatar';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { SignalEmojiPicker } from './SignalEmojiPicker';
import { PollDetailsModal } from '../modals/PollDetailsModal';

interface MessageBubbleProps {
  message: Message;
  sender?: User;
  isMe: boolean;
  showSenderName?: boolean;
  isFirstInSequence?: boolean;
  isLastInSequence?: boolean;
  searchQuery?: string;
  isSearchTarget?: boolean;
}

const QUICK_REACTIONS = ['❤️', '👍', '👎', '😂', '😮', '😢'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  isMe,
  showSenderName,
  isFirstInSequence = true,
  isLastInSequence = true,
  searchQuery,
  isSearchTarget = false,
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showPollDetailsModal, setShowPollDetailsModal] = useState(false);
  const [forwardSearch, setForwardSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Live timer so bubble timestamps update smoothly in real time
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    conversations,
    toggleReaction,
    setReplyingToMessage,
    deleteMessage,
    pinMessage,
    forwardMessage,
    isSelectionMode,
    selectedMessageIds,
    enterSelectionMode,
    toggleSelectMessage,
    setEditingMessage,
    votePoll,
  } = useChatStore();
  const { currentUser } = useSettingsStore();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2200);
  };

  const formatMessageTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - date.getTime());
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (3600 * 1000));

    // Under 60s -> 'Now'
    if (diffMs < 60 * 1000) {
      return 'Now';
    }
    // Under 60m -> '9m', '10m' (matching screenshots)
    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    // Same day -> e.g. '1:49 AM'
    if (diffHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formattedTime = formatMessageTime(message.timestamp);

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowMoreMenu(false);
    setEditingMessage(message);
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      showToast('Copied text to clipboard');
    } catch {
      showToast('Failed to copy');
    }
    setShowMoreMenu(false);
  };

  const handleSelect = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowMoreMenu(false);
    enterSelectionMode(message.id);
  };

  const handlePin = () => {
    pinMessage(message.id);
    showToast(message.isPinned ? 'Message unpinned' : 'Message pinned');
    setShowMoreMenu(false);
  };

  const handleDelete = () => {
    deleteMessage(message.id);
    setShowMoreMenu(false);
  };

  const [targetPollMsg, setTargetPollMsg] = useState<Message | null>(null);

  if (message.type === 'system') {
    const isTimer = message.systemEventType === 'timer_changed' || message.content.toLowerCase().includes('disappearing message');
    const isPollEnded = message.systemEventType === 'poll_ended' || message.content.toLowerCase().includes('ended the poll');

    return (
      <div className="flex flex-col items-center justify-center my-3.5 select-none text-xs text-neutral-400 dark:text-neutral-400 font-normal space-y-2">
        <div className="flex items-center space-x-1.5">
          {isTimer && (
            <SignalIcon name="timer" className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          )}
          {isPollEnded && (
            <SignalIcon name="poll" className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
          )}
          <span>{message.content}</span>
        </div>
        {isPollEnded && (
          <button
            onClick={() => {
              const activeConvId = useChatStore.getState().activeConversationId;
              const allMsgs = useChatStore.getState().messages;
              const convMsgs = activeConvId ? allMsgs[activeConvId] || [] : [];
              const targetPoll =
                convMsgs.find(
                  (m) => m.type === 'poll' && message.content.includes(m.poll?.question || '___never___')
                ) || convMsgs.filter((m) => m.type === 'poll').slice(-1)[0];

              if (targetPoll) {
                setTargetPollMsg(targetPoll);
                setShowPollDetailsModal(true);
              }
            }}
            className="px-4 py-1 bg-[#282828] hover:bg-[#333333] text-white text-xs font-semibold rounded-full border border-[#3e3e3e] transition-colors cursor-pointer"
          >
            View poll
          </button>
        )}
        {targetPollMsg && (
          <PollDetailsModal
            isOpen={showPollDetailsModal}
            onClose={() => {
              setShowPollDetailsModal(false);
              setTargetPollMsg(null);
            }}
            message={targetPollMsg}
          />
        )}
      </div>
    );
  }

  // Rounded corner grouping logic matching Signal Desktop
  const getRadiusClasses = () => {
    if (isMe) {
      if (isFirstInSequence && isLastInSequence) return 'rounded-2xl';
      if (isFirstInSequence) return 'rounded-2xl rounded-br-md';
      if (isLastInSequence) return 'rounded-2xl rounded-tr-md';
      return 'rounded-l-2xl rounded-r-md';
    } else {
      if (isFirstInSequence && isLastInSequence) return 'rounded-2xl';
      if (isFirstInSequence) return 'rounded-2xl rounded-bl-md';
      if (isLastInSequence) return 'rounded-2xl rounded-tl-md';
      return 'rounded-r-2xl rounded-l-md';
    }
  };

  // Progressive expanding step limits (each click reveals significantly more text than the last)
  // Step 1: ~250 chars (~40 words)
  // Step 2: ~900 chars (adds 650 chars / ~100 words)
  // Step 3: ~2400 chars (adds 1500 chars / ~250 words)
  const [visibleChunks, setVisibleChunks] = useState(1);
  const getStepLimit = (step: number) => {
    if (step <= 1) return 250;
    if (step === 2) return 900;
    if (step === 3) return 2400;
    return 2400 + (step - 3) * 3500;
  };

  const currentLimit = getStepLimit(visibleChunks);
  const isLongMessage = message.content.length > 250;
  const hasMoreContent = isLongMessage && currentLimit < message.content.length;

  const getSlicedContent = () => {
    if (!isLongMessage || !hasMoreContent) return message.content;
    const sliced = message.content.slice(0, currentLimit);
    const lastSpace = sliced.lastIndexOf(' ');
    return (lastSpace > 180 ? sliced.slice(0, lastSpace) : sliced) + ', ...';
  };

  const displayContent = getSlicedContent();

  const isSelected = isSelectionMode && selectedMessageIds.includes(message.id);

  const renderHighlightedContent = (text: string) => {
    if (!searchQuery || !searchQuery.trim()) return text;
    const q = searchQuery.trim();
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark
          key={i}
          className={
            'px-1 py-0.5 rounded font-medium transition-all duration-200 animate-in fade-in ' +
            (isMe
              ? 'bg-white/30 text-white'
              : 'bg-[#2c6bed]/20 text-[#135bef] dark:bg-[#2c6bed]/35 dark:text-[#7ba6ff]')
          }
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      id={`msg-${message.id}`}
      onClick={isSelectionMode ? () => toggleSelectMessage(message.id) : undefined}
      className={
        'group relative flex items-center -mx-6 px-6 py-0.5 transition-all ' +
        (isSelectionMode ? 'cursor-pointer select-none ' : 'select-text ') +
        (isSelected
          ? 'bg-[#dce8fe] dark:bg-[#16253d] '
          : isSelectionMode
          ? 'hover:bg-neutral-100/50 dark:hover:bg-white/[0.03] '
          : '') +
        (message.reactions && message.reactions.length > 0
          ? 'mb-3.5 '
          : isLastInSequence
          ? 'mb-1.5 '
          : 'mb-0.5 ')
      }
    >
      {/* Click-outside dismiss backdrop for Dropdown Menu & Reaction Picker */}
      {(showMoreMenu || showReactionPicker) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            setShowMoreMenu(false);
            setShowReactionPicker(false);
            setShowFullEmojiPicker(false);
          }}
        />
      )}

      {/* Selection radio/checkbox on far left (matches media_1788824120263.png) */}
      {isSelectionMode && (
        <div className="mr-3 flex-shrink-0 self-center select-none">
          {isSelected ? (
            <div className="w-5 h-5 rounded-full bg-[#135bef] border-2 border-[#135bef] flex items-center justify-center shadow-sm">
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-neutral-400 dark:border-[#707070] bg-transparent" />
          )}
        </div>
      )}

      {/* Message Row Alignment Container */}
      <div
        className={
          'flex-1 flex flex-col min-w-0 ' +
          (isMe ? 'items-end' : 'items-start')
        }
      >
        {/* Floating Action Bar & Bubble Container */}
        <div className="relative max-w-[85%] sm:max-w-[75%] min-w-0 flex items-center">
          {/* Sender Avatar for Group Messages (left of incoming bubble) */}
          {!isMe && showSenderName && (
            isLastInSequence ? (
              <div className="mr-2 flex-shrink-0 self-end mb-0.5">
                <Avatar
                  name={sender?.displayName || 'User'}
                  src={sender?.avatarUrl}
                  size="sm"
                  className="w-7 h-7"
                />
              </div>
            ) : (
              <div className="w-7 mr-2 flex-shrink-0" />
            )
          )}

          {/* OUTGOING (isMe): Floating Action Bar TO THE LEFT of bubble */}
          {isMe && (
            <div
              className={
                'relative flex items-center space-x-1 mr-2 transition-opacity duration-150 select-none flex-shrink-0 ' +
                (isSelectionMode
                  ? 'opacity-0 pointer-events-none'
                  : showMoreMenu || showReactionPicker
                  ? 'opacity-100 z-50'
                  : 'opacity-0 group-hover:opacity-100 z-20')
              }
            >
              {/* 1. More Menu Button (...) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoreMenu(!showMoreMenu);
                    setShowReactionPicker(false);
                  }}
                  className="p-1 text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
                  title="More"
                >
                  <SignalIcon name="more" className="w-4 h-4" />
                </button>

                {/* Three-dots Menu */}
                {showMoreMenu && (
                  <div className="absolute right-full bottom-0 mr-2 bg-[#282828] dark:bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-2xl py-1.5 px-1 w-48 text-white z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowForwardModal(true);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <SignalIcon name="forward" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                      <span>Forward</span>
                    </button>

                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <SignalIcon name="edit" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={handleSelect}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <SignalIcon name="check_circle" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                      <span>Select</span>
                    </button>

                  <button
                    onClick={handleCopyText}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left"
                  >
                    <SignalIcon name="copy" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Copy text</span>
                  </button>

                  <button
                    onClick={handlePin}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left"
                  >
                    <SignalIcon name="pin" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowInfoModal(true);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left"
                  >
                    <SignalIcon name="info_i" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Info</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left text-white"
                  >
                    <SignalIcon name="trash" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Reply Button (↰) */}
            <button
              onClick={() => setReplyingToMessage(message)}
              className="p-1 text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800/80 transition-colors"
              title="Reply"
            >
              <SignalIcon name="reply" className="w-4 h-4" />
            </button>

            {/* 3. React Button (♡+) */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactionPicker(!showReactionPicker);
                  setShowFullEmojiPicker(false);
                  setShowMoreMenu(false);
                }}
                className="p-1 text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
                title="React"
              >
                <SignalIcon name="heart_plus" className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={
            'relative px-3.5 py-2 text-sm [word-break:break-word] [overflow-wrap:anywhere] transition-all min-w-0 ' +
            getRadiusClasses() +
            (isMe
              ? ' bg-[#135bef] text-white'
              : ' bg-[#f0f0f0] dark:bg-[#323232] text-neutral-900 dark:text-neutral-100') +
            (isSearchTarget ? ' ring-2 ring-[#2c6bed]/70 ring-offset-1 dark:ring-offset-[#121212] shadow-lg animate-pulse transition-all duration-300' : '')
          }
        >
          {/* Quick Reaction Bar & Full Emoji Picker */}
          {showReactionPicker && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-full mb-1.5 flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100 ${
                isMe ? 'right-0 items-end' : 'left-0 items-start'
              }`}
            >
              {showFullEmojiPicker && (
                <div className="mb-2">
                  <SignalEmojiPicker
                    onSelectEmoji={(emoji) => {
                      toggleReaction(message.id, emoji);
                      setShowReactionPicker(false);
                      setShowFullEmojiPicker(false);
                    }}
                    onClose={() => {
                      setShowFullEmojiPicker(false);
                    }}
                  />
                </div>
              )}

              <div className="bg-[#2c2c2c] dark:bg-[#2c2c2c] border border-[#3e3e3e] shadow-2xl rounded-full px-3 py-1.5 flex items-center space-x-2">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      toggleReaction(message.id, emoji);
                      setShowReactionPicker(false);
                      setShowFullEmojiPicker(false);
                    }}
                    className="text-2xl hover:scale-125 px-1 py-0.5 transition-transform cursor-pointer leading-none select-none"
                  >
                    {emoji}
                  </button>
                ))}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullEmojiPicker(!showFullEmojiPicker);
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                    showFullEmojiPicker
                      ? 'bg-[#555555] text-white'
                      : 'bg-[#404040] hover:bg-[#505050] text-neutral-200 hover:text-white'
                  }`}
                  title="More reactions"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="6" cy="12" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="18" cy="12" r="1.8" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          {/* Sender Name INSIDE Bubble for Groups */}
          {!isMe && showSenderName && isFirstInSequence && sender && (
            <div
              className="text-xs font-semibold mb-0.5 select-none"
              style={{ color: sender.color || '#22c55e' }}
            >
              {sender.displayName}
            </div>
          )}

          {/* Replying-to Preview */}
          {message.replyTo && (
            <div
              className={
                'mb-1.5 px-2.5 py-1 rounded-lg text-xs border-l-2 ' +
                (isMe
                  ? 'bg-white/10 border-white/80 text-white/90'
                  : 'bg-black/5 dark:bg-black/30 border-[#135bef] text-neutral-700 dark:text-neutral-300')
              }
            >
              <div className="font-semibold text-[10px]">{message.replyTo.senderName}</div>
              <div className="truncate text-neutral-600 dark:text-neutral-200 text-[11px]">{message.replyTo.content}</div>
            </div>
          )}

          {/* Message Content / Poll & Timestamp Flow */}
          <div className="flex flex-col">
            {message.type === 'poll' && message.poll ? (
              <div className="flex flex-col select-none py-1 min-w-[240px]">
                <h4 className="font-semibold text-base text-white mb-0.5 leading-snug">
                  {message.poll.question}
                </h4>
                <p className="text-xs text-white/80 font-normal mb-3.5">
                  {message.poll.isEnded
                    ? 'Poll · Final results'
                    : `Poll · ${message.poll.allowMultiple ? 'Select one or more' : 'Select one'}`}
                </p>

                <div className="space-y-3 mb-2">
                  {message.poll.options.map((opt) => {
                    const totalVotes = message.poll!.options.reduce((acc, o) => acc + o.voterIds.length, 0);
                    const isVotedByMe =
                      opt.voterIds.includes('user_me') ||
                      opt.voterIds.includes('me') ||
                      (currentUser && opt.voterIds.includes(currentUser.id));
                    const voteCount = opt.voterIds.length;
                    const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                    const isEnded = message.poll!.isEnded;

                    return (
                      <div
                        key={opt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isEnded) {
                            votePoll(message.id, opt.id);
                          }
                        }}
                        className={isEnded ? 'cursor-default' : 'cursor-pointer group'}
                      >
                        <div className="flex items-center justify-between space-x-2 text-sm font-medium mb-1">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {!isEnded && (
                              isVotedByMe ? (
                                <div className="w-5 h-5 rounded-full bg-white text-[#135bef] flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">
                                  ✓
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-white/70 flex-shrink-0 group-hover:border-white transition-colors" />
                              )
                            )}
                            <span className="truncate text-white">{opt.text}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            {isEnded && isVotedByMe && (
                              <div className="w-4 h-4 rounded-full bg-white text-[#135bef] flex items-center justify-center text-[10px] font-bold shadow-sm flex-shrink-0">
                                ✓
                              </div>
                            )}
                            {voteCount > 0 ? (
                              <span className="text-xs font-semibold text-white/90">{voteCount}</span>
                            ) : isEnded ? (
                              <span className="text-xs font-semibold text-white/90">0</span>
                            ) : null}
                          </div>
                        </div>

                        {/* Progress bar line matching media_1788835909392.png */}
                        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-white h-full transition-all duration-300 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Poll Footer - View votes pill button matching media_1788835909392.png */}
                <div className="flex justify-center mt-3 mb-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPollDetailsModal(true);
                    }}
                    className="px-4 py-1.5 bg-[#e6e6e6] hover:bg-white text-neutral-900 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    View votes
                  </button>
                </div>
              </div>
            ) : (
              <div className="leading-relaxed [word-break:break-word] [overflow-wrap:anywhere] whitespace-pre-wrap">
                {renderHighlightedContent(displayContent)}
                {isLongMessage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasMoreContent) {
                        setVisibleChunks((prev) => prev + 1);
                      } else {
                        setVisibleChunks(1);
                      }
                    }}
                    className={
                      'ml-1.5 font-bold hover:underline cursor-pointer inline-inline text-sm ' +
                      (isMe ? 'text-white' : 'text-[#2c6bed]')
                    }
                  >
                    {hasMoreContent ? 'Read more' : 'Show less'}
                  </button>
                )}
              </div>
            )}

            {/* Inline Timestamp + Delivery Checks + Pinned indicator */}
            {isLastInSequence && (
              <div className={`flex items-center space-x-1 text-[11px] font-normal select-none mt-1 ${isMe ? 'justify-end text-white/80' : 'justify-end text-neutral-500 dark:text-neutral-400'}`}>
                {message.isPinned && (
                  <SignalIcon name="pin" className="w-3 h-3 text-white/80 mr-0.5" />
                )}
                {message.isEdited && (
                  <span className="text-[11px] font-normal select-none mr-1">Edited</span>
                )}
                {message.isDisappearing && (
                  <SignalIcon name="timer" className={`w-3 h-3 mr-0.5 ${isMe ? 'text-white/80' : 'text-neutral-400'}`} />
                )}
                <span>{formattedTime}</span>

                {isMe && (
                  <span className="inline-flex items-center ml-0.5">
                    {message.status === 'read' ? (
                      <SignalIcon name="read" className="w-[18px] h-[12px] text-[#BED2FA]" />
                    ) : message.status === 'delivered' ? (
                      <SignalIcon name="delivered" className="w-[18px] h-[12px] text-white/90" />
                    ) : message.status === 'sent' ? (
                      <SignalIcon name="sent" className="w-[12px] h-[12px] text-white/80" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full border border-white/60 animate-spin" />
                    )}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Reaction Badge attached at bottom-right corner */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-3 right-1.5 flex items-center space-x-1 z-10 select-none">
              {message.reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReaction(message.id, r.emoji);
                  }}
                  className="flex items-center justify-center bg-[#3c3c3c] border-2 border-white dark:border-[#121212] rounded-full px-1.5 py-0.5 min-w-[28px] h-7 shadow-md hover:bg-[#484848] transition-colors cursor-pointer"
                  title="Reaction"
                >
                  <span className="text-[14px] leading-none">{r.emoji}</span>
                  {r.count > 1 && (
                    <span className="text-[11px] font-semibold text-white ml-1">
                      {r.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INCOMING (!isMe): Floating Action Bar TO THE RIGHT of bubble */}
        {!isMe && (
          <div
            className={
              'relative flex items-center space-x-1 ml-2 transition-opacity duration-150 select-none flex-shrink-0 ' +
              (isSelectionMode
                ? 'opacity-0 pointer-events-none'
                : showMoreMenu || showReactionPicker
                ? 'opacity-100 z-50'
                : 'opacity-0 group-hover:opacity-100 z-20')
            }
          >
            {/* 1. React Button (♡+) */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReactionPicker(!showReactionPicker);
                  setShowFullEmojiPicker(false);
                  setShowMoreMenu(false);
                }}
                className="p-1 text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
                title="React"
              >
                <SignalIcon name="heart_plus" className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Reply Button (↰) */}
            <button
              onClick={() => setReplyingToMessage(message)}
              className="p-1 text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
              title="Reply"
            >
              <SignalIcon name="reply" className="w-4 h-4" />
            </button>

            {/* 3. More Menu Button (...) */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreMenu(!showMoreMenu);
                  setShowReactionPicker(false);
                }}
                className="p-1 text-neutral-400 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
                title="More"
              >
                <SignalIcon name="more" className="w-4 h-4" />
              </button>

              {/* Three-dots Menu for Incoming Messages */}
              {showMoreMenu && (
                <div className="absolute left-full bottom-0 ml-2 bg-[#282828] dark:bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-2xl py-1.5 px-1 w-48 text-white z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowForwardModal(true);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <SignalIcon name="forward" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Forward</span>
                  </button>

                  <button
                    onClick={handleSelect}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <SignalIcon name="check_circle" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Select</span>
                  </button>

                  <button
                    onClick={handleCopyText}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <SignalIcon name="copy" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Copy text</span>
                  </button>

                  <button
                    onClick={handlePin}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <SignalIcon name="pin" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>{message.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowInfoModal(true);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <SignalIcon name="info_i" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Info</span>
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left text-white cursor-pointer"
                  >
                    <SignalIcon name="trash" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 bg-[#202020] text-white text-xs font-medium px-4 py-2 rounded-full shadow-2xl border border-neutral-700 z-50 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
          <SignalIcon name="check" className="w-3.5 h-3.5 text-[#135bef]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#242424] border border-[#383838] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#333333]">
              <h3 className="font-semibold text-base">Message info</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <SignalIcon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="bg-[#1c1c1c] p-3 rounded-xl border border-[#333333]">
                <div className="text-xs text-neutral-400 mb-1">Message</div>
                <div className="break-words font-medium">{message.content}</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-xs">Sent</span>
                  <span className="text-neutral-200 text-xs font-medium">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-xs">Status</span>
                  <span className="inline-flex items-center space-x-1.5 text-xs font-medium capitalize">
                    {message.status === 'read' && (
                      <SignalIcon name="read" className="w-4 h-3 text-[#BED2FA]" />
                    )}
                    {message.status === 'delivered' && (
                      <SignalIcon name="double-check" className="w-4 h-3 text-white/90" />
                    )}
                    {message.status === 'sent' && (
                      <SignalIcon name="check" className="w-3.5 h-3.5 text-white/80" />
                    )}
                    <span>{message.status}</span>
                  </span>
                </div>

                {message.isDisappearing && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-xs">Disappearing</span>
                    <span className="text-neutral-200 text-xs">
                      {message.expireTimerSeconds ? `${message.expireTimerSeconds}s` : 'Enabled'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#333333] flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#333333] hover:bg-[#3f3f3f] text-sm text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#242424] border border-[#383838] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#333333]">
              <h3 className="font-semibold text-base">Forward message</h3>
              <button
                onClick={() => setShowForwardModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <SignalIcon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-[#333333]">
              <div className="flex items-center space-x-2 bg-[#1c1c1c] px-3 py-2 rounded-xl border border-[#333333]">
                <SignalIcon name="search" className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search contacts or groups..."
                  value={forwardSearch}
                  onChange={(e) => setForwardSearch(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none text-white placeholder-neutral-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {conversations
                .filter((c) =>
                  c.name.toLowerCase().includes(forwardSearch.toLowerCase())
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#303030] transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <Avatar
                        name={c.name}
                        src={c.avatarUrl}
                        size="sm"
                        className="w-8 h-8 flex-shrink-0"
                      />
                      <span className="text-sm font-medium truncate">{c.name}</span>
                    </div>

                    <button
                      onClick={() => {
                        forwardMessage(c.id, message.content);
                        setShowForwardModal(false);
                        showToast(`Forwarded to ${c.name}`);
                      }}
                      className="px-3 py-1 bg-[#135bef] hover:bg-[#0f4ac4] text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ml-2"
                    >
                      Send
                    </button>
                  </div>
                ))}
            </div>

            <div className="p-3 border-t border-[#333333] flex justify-end">
              <button
                onClick={() => setShowForwardModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#333333] hover:bg-[#3f3f3f] text-sm text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poll Details Modal */}
      <PollDetailsModal
        isOpen={showPollDetailsModal}
        onClose={() => setShowPollDetailsModal(false)}
        message={message}
      />
    </div>
  );
};
