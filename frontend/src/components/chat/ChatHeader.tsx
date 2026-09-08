'use client';

import React, { useState } from 'react';
import { Conversation } from '../../types';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

import { CallingComingSoonModal } from '../modals/CallingComingSoonModal';

interface ChatHeaderProps {
  conversation: Conversation;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation }) => {
  const {
    setContactDetailsOpen,
    typingUsers,
    togglePinConversation,
    toggleMuteConversation,
    toggleArchiveConversation,
    deleteConversation,
    enterSelectionMode,
    markConversationUnread,
    setDisappearingTimer,
    removeGroupMember,
    toggleBlockConversation,
  } = useChatStore();
  const { currentUser } = useSettingsStore();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDisappearingSubmenu, setShowDisappearingSubmenu] = useState(false);
  const [showMuteSubmenu, setShowMuteSubmenu] = useState(false);
  const [showCustomTimerModal, setShowCustomTimerModal] = useState(false);
  const [customTimerNumber, setCustomTimerNumber] = useState(10);
  const [customTimerUnit, setCustomTimerUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('minutes');
  const [callModalType, setCallModalType] = useState<'voice' | 'video' | null>(null);
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);

  const isTyping = (typingUsers[conversation.id] || []).some((uid) => uid !== currentUser?.id);
  const isDirect = conversation.type === 'direct';
  const otherUser = isDirect ? conversation.participants.find((p) => p.id !== currentUser?.id) || conversation.participants[0] : null;

  const chatTitle = isDirect && otherUser ? otherUser.displayName : conversation.name;
  const avatarUrl = isDirect && otherUser ? (otherUser.avatarUrl || conversation.avatarUrl) : conversation.avatarUrl;

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return 'Off';
    if (seconds === 30) return '30 seconds';
    if (seconds === 300) return '5 minutes';
    if (seconds === 3600) return '1 hour';
    if (seconds === 28800) return '8 hours';
    if (seconds === 86400) return '1 day';
    if (seconds === 604800) return '1 week';
    if (seconds === 2419200) return '4 weeks';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 604800) return `${Math.round(seconds / 86400)} days`;
    return `${Math.round(seconds / 604800)} weeks`;
  };

  const disappearingPresets = [
    { label: 'Off', value: 0 },
    { label: '4 weeks', value: 2419200 },
    { label: '1 week', value: 604800 },
    { label: '1 day', value: 86400 },
    { label: '8 hours', value: 28800 },
    { label: '1 hour', value: 3600 },
    { label: '5 minutes', value: 300 },
    { label: '30 seconds', value: 30 },
  ];

  const mutePresets = [
    '1 hour',
    '8 hours',
    '1 day',
    '1 week',
    'Until...',
    'Always',
  ];

  const handleApplyCustomTimer = () => {
    const mult = customTimerUnit === 'seconds' ? 1 : customTimerUnit === 'minutes' ? 60 : customTimerUnit === 'hours' ? 3600 : 86400;
    const totalSeconds = Math.max(1, Number(customTimerNumber) || 1) * mult;
    setDisappearingTimer(totalSeconds);
    setShowCustomTimerModal(false);
    setShowMoreMenu(false);
    setShowDisappearingSubmenu(false);
  };

  const handleLeaveGroup = () => {
    setShowMoreMenu(false);
    setShowLeaveGroupModal(true);
  };

  return (
    <header className="h-14 px-4 bg-white dark:bg-[#191919] border-b border-neutral-100 dark:border-transparent flex items-center justify-between select-none z-10">
      {/* Left: Avatar + Name + Contact Badge + Subtitle */}
      <div
        onClick={() => setContactDetailsOpen(true)}
        className="flex items-center space-x-2.5 cursor-pointer group"
      >
        <Avatar
          name={chatTitle}
          src={avatarUrl}
          size="sm"
          isGroup={conversation.type === 'group'}
        />

        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center space-x-1.5">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors truncate">
              {chatTitle}
            </h2>

            {/* Contact Badge next to name */}
            {isDirect && (
              <span className="text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white transition-colors flex-shrink-0">
                <SignalIcon name="person_circle" className="w-4 h-4" />
              </span>
            )}
          </div>

          {/* Subtitle */}
          {isTyping ? (
            <span className="text-[#2c6bed] text-xs font-normal italic animate-pulse leading-none mt-0.5">
              typing...
            </span>
          ) : conversation.disappearingTimer > 0 ? (
            <div className="flex items-center space-x-1 text-xs text-neutral-400 dark:text-neutral-400 font-normal leading-none mt-0.5">
              <SignalIcon name="timer" className="w-3 h-3 text-neutral-400 flex-shrink-0" />
              <span>{formatDuration(conversation.disappearingTimer)}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right: Video Call, Voice Call, Search, More */}
      <div className="flex items-center space-x-0.5 text-neutral-700 dark:text-white">
        {/* Video Call */}
        <button
          onClick={() => setCallModalType('video')}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#242424] transition-colors"
          title="Video call"
        >
          <SignalIcon name="video" className="w-5 h-5" />
        </button>

        {/* Voice Call */}
        <button
          onClick={() => setCallModalType('voice')}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#242424] transition-colors"
          title="Voice call"
        >
          <SignalIcon name="phone" className="w-5 h-5" />
        </button>

        {/* Search */}
        <button
          onClick={() => {
            const el = document.getElementById('main-search-input') as HTMLInputElement | null;
            if (el) {
              el.focus();
              el.select();
            }
          }}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#242424] transition-colors cursor-pointer"
          title="Search"
        >
          <SignalIcon name="search" className="w-5 h-5" />
        </button>

        {/* More Options */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              setShowDisappearingSubmenu(false);
              setShowMuteSubmenu(false);
            }}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#242424] transition-colors text-neutral-700 dark:text-white"
            title="More options"
          >
            <SignalIcon name="more" className="w-5 h-5" />
          </button>

          {showMoreMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowDisappearingSubmenu(false);
                  setShowMuteSubmenu(false);
                }}
              />
              <div className="absolute right-0 top-10 w-64 bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-2xl py-1.5 px-1 z-50 text-white select-none animate-in fade-in zoom-in-95 duration-100">
                {/* 1. Disappearing messages */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    setShowDisappearingSubmenu(true);
                    setShowMuteSubmenu(false);
                  }}
                >
                  <button
                    onClick={() => {
                      setShowDisappearingSubmenu(!showDisappearingSubmenu);
                      setShowMuteSubmenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <SignalIcon name="timer" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                      <span>Disappearing messages</span>
                    </div>
                    <SignalIcon name="chevron_right" className="w-4 h-4 text-neutral-400" />
                  </button>

                  {/* Disappearing messages left submenu */}
                  {showDisappearingSubmenu && (
                    <div
                      className="absolute right-full top-0 mr-1.5 w-48 bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-2xl py-1.5 px-1 z-50 text-white select-none animate-in fade-in slide-in-from-right-2 duration-100"
                      onMouseLeave={() => setShowDisappearingSubmenu(false)}
                    >
                      {disappearingPresets.map((opt) => {
                        const isSelected = conversation.disappearingTimer === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setDisappearingTimer(opt.value);
                              setShowDisappearingSubmenu(false);
                              setShowMoreMenu(false);
                            }}
                            className="w-full flex items-center px-3 py-1.5 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                          >
                            <span className="w-5 flex-shrink-0 text-sm font-semibold text-white">
                              {isSelected ? '✓' : ''}
                            </span>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}

                      <button
                        onClick={() => {
                          setShowDisappearingSubmenu(false);
                          setShowMoreMenu(false);
                          setShowCustomTimerModal(true);
                        }}
                        className="w-full flex items-center px-3 py-1.5 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left border-t border-neutral-700/50 mt-1 pt-1.5 cursor-pointer"
                      >
                        <span className="w-5 flex-shrink-0" />
                        <span>Custom time...</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Mute notifications */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    setShowMuteSubmenu(true);
                    setShowDisappearingSubmenu(false);
                  }}
                >
                  <button
                    onClick={() => {
                      setShowMuteSubmenu(!showMuteSubmenu);
                      setShowDisappearingSubmenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <SignalIcon name="bell_slash" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                      <span>Mute notifications</span>
                    </div>
                    <SignalIcon name="chevron_right" className="w-4 h-4 text-neutral-400" />
                  </button>

                  {/* Mute notifications left submenu */}
                  {showMuteSubmenu && (
                    <div
                      className="absolute right-full top-0 mr-1.5 w-52 bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-2xl py-2 px-1 z-50 text-white select-none animate-in fade-in slide-in-from-right-2 duration-100"
                      onMouseLeave={() => setShowMuteSubmenu(false)}
                    >
                      <div className="px-3 py-1 text-[13px] text-neutral-400 font-normal select-none">
                        Mute this chat for...
                      </div>
                      {mutePresets.map((label) => (
                        <button
                          key={label}
                          onClick={() => {
                            toggleMuteConversation(conversation.id);
                            setShowMuteSubmenu(false);
                            setShowMoreMenu(false);
                          }}
                          className="w-full flex items-center px-3 py-2 text-[14px] font-normal hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer text-white"
                        >
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Chat settings / Group settings */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setContactDetailsOpen(true);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left cursor-pointer"
                >
                  <SignalIcon name="settings" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                  <span>{conversation.type === 'group' ? 'Group settings' : 'Chat settings'}</span>
                </button>

                {/* 4. All media */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setContactDetailsOpen(true);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left"
                >
                  <SignalIcon name="album" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                  <span>All media</span>
                </button>

                {/* Divider 1 */}
                <div className="my-1 border-t border-neutral-700/60" />

                {/* 5. Select messages */}
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    enterSelectionMode();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left"
                >
                  <SignalIcon name="check_circle" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                  <span>Select messages</span>
                </button>

                {/* Divider 2 */}
                <div className="my-1 border-t border-neutral-700/60" />

                {/* 6. Mark as unread */}
                <button
                  onClick={() => {
                    markConversationUnread(conversation.id);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left"
                >
                  <SignalIcon name="message_badge" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                  <span>Mark as unread</span>
                </button>

                {/* 7. Pin chat */}
                <button
                  onClick={() => {
                    togglePinConversation(conversation.id);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left"
                >
                  <SignalIcon name="pin" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                  <span>{conversation.isPinned ? 'Unpin chat' : 'Pin chat'}</span>
                </button>

                {/* 8. Archive */}
                <button
                  onClick={() => {
                    toggleArchiveConversation(conversation.id);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left"
                >
                  <SignalIcon name="archive" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                  <span>{conversation.isArchived ? 'Unarchive' : 'Archive'}</span>
                </button>

                {/* 9. Block */}
                <button
                  onClick={() => {
                    toggleBlockConversation(conversation.id);
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left"
                >
                  <SignalIcon name="block" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                  <span>{conversation.isBlocked ? 'Unblock' : 'Block'}</span>
                </button>

                {/* 10. Delete */}
                <button
                  onClick={() => {
                    if (confirm(`Delete conversation with ${chatTitle}?`)) {
                      deleteConversation(conversation.id);
                    }
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left text-white"
                >
                  <SignalIcon name="trash" className="w-[18px] h-[18px] text-white flex-shrink-0" />
                  <span>Delete</span>
                </button>

                {/* 11. Leave group */}
                {conversation.type === 'group' && (
                  <button
                    onClick={handleLeaveGroup}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-[13.5px] hover:bg-[#383838] rounded-xl transition-colors text-left text-[#ff5b5b]"
                  >
                    <SignalIcon name="leave" className="w-[18px] h-[18px] text-[#ff5b5b] flex-shrink-0" />
                    <span>Leave group</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Disappearing Timer Modal */}
      {showCustomTimerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#242424] border border-[#383838] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-white p-5">
            <h3 className="font-semibold text-base mb-2">Custom Disappearing Timer</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Set a custom duration after which messages in this chat will disappear.
            </p>
            <div className="flex items-center gap-3 mb-5">
              <input
                type="number"
                min="1"
                value={customTimerNumber}
                onChange={(e) => setCustomTimerNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-3 py-2 bg-[#1c1c1c] border border-[#3e3e3e] rounded-xl text-white text-sm focus:outline-none"
              />
              <select
                value={customTimerUnit}
                onChange={(e) => setCustomTimerUnit(e.target.value as any)}
                className="flex-1 px-3 py-2 bg-[#1c1c1c] border border-[#3e3e3e] rounded-xl text-white text-sm focus:outline-none"
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCustomTimerModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomTimer}
                className="px-4 py-2 rounded-xl bg-[#2c6bed] hover:bg-[#255dd1] text-sm font-medium transition-colors"
              >
                Set timer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calling Coming Soon Modal */}
      <CallingComingSoonModal
        isOpen={!!callModalType}
        onClose={() => setCallModalType(null)}
        callType={callModalType || 'general'}
      />

      {/* Leave Group Confirmation Modal */}
      {showLeaveGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white dark:bg-[#252525] border border-neutral-200 dark:border-[#383838] rounded-3xl w-full max-w-sm p-6 shadow-2xl text-neutral-900 dark:text-white">
            <h3 className="text-base font-semibold mb-2">Leave group?</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Are you sure you want to leave {conversation.name}? You will no longer be able to send or receive messages in this group.
            </p>
            <div className="flex justify-end space-x-2.5">
              <button
                onClick={() => setShowLeaveGroupModal(false)}
                className="px-4 py-2 bg-neutral-200 dark:bg-[#333333] hover:bg-neutral-300 dark:hover:bg-[#404040] text-xs font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLeaveGroupModal(false);
                  if (currentUser) {
                    await removeGroupMember(conversation.id, currentUser.id);
                  }
                  deleteConversation(conversation.id);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded-full transition-colors text-white"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
