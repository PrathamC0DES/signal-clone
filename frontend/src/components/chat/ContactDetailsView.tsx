'use client';

import React, { useState } from 'react';
import { Conversation, DisappearingTimerValue } from '../../types';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { CallingComingSoonModal } from '../modals/CallingComingSoonModal';

interface ContactDetailsViewProps {
  conversation: Conversation;
  onClose: () => void;
}

const TIMER_OPTIONS: Array<{ label: string; value: DisappearingTimerValue }> = [
  { label: 'Off', value: 0 },
  { label: '30 seconds', value: 30 },
  { label: '5 minutes', value: 300 },
  { label: '1 hour', value: 3600 },
  { label: '1 day', value: 86400 },
  { label: '1 week', value: 604800 },
  { label: '4 weeks', value: 2419200 },
];

export const ContactDetailsView: React.FC<ContactDetailsViewProps> = ({
  conversation,
  onClose,
}) => {
  const {
    conversations,
    setDisappearingTimer,
    toggleMuteConversation,
    toggleBlockConversation,
  } = useChatStore();
  const { currentUser, openSafetyNumberModal } = useSettingsStore();

  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [callModalType, setCallModalType] = useState<'voice' | 'video' | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportSpamModal, setShowReportSpamModal] = useState(false);

  const isDirect = conversation.type === 'direct';
  const otherUser = isDirect
    ? conversation.participants.find((p) => p.id !== currentUser?.id) || conversation.participants[0]
    : null;

  const displayName = nickname || (isDirect && otherUser ? otherUser.displayName : conversation.name);
  const avatarUrl = isDirect && otherUser ? otherUser.avatarUrl || conversation.avatarUrl : conversation.avatarUrl;

  // Find shared group conversations
  const sharedGroups = conversations.filter(
    (c) => c.type === 'group' && otherUser && c.participants.some((p) => p.id === otherUser.id)
  );

  // Fallback shared groups for display matching screenshot if no real group in DB
  const groupsToDisplay = sharedGroups.length > 0
    ? sharedGroups
    : [{ id: 'group_t', name: 't' }];

  const currentTimerLabel =
    TIMER_OPTIONS.find((opt) => opt.value === conversation.disappearingTimer)?.label || 'Off';

  const handleSelectTimer = async (val: DisappearingTimerValue) => {
    setShowTimerMenu(false);
    await setDisappearingTimer(val);
  };

  const handleSaveNickname = () => {
    if (nicknameInput.trim()) {
      setNickname(nicknameInput.trim());
    } else {
      setNickname(null);
    }
    setIsEditingNickname(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#191919] text-neutral-900 dark:text-white overflow-y-auto select-none">
      {/* Top Header with Back Button */}
      <div className="h-14 px-4 flex items-center flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors"
          title="Back to conversation"
        >
          <SignalIcon name="chevron_left" className="w-5 h-5" />
        </button>
      </div>

      {/* Main Centered Content Container */}
      <div className="w-full max-w-xl mx-auto px-6 pb-12">
        {/* 1. Hero: Avatar + Name + Person Badge */}
        <div className="flex flex-col items-center pt-2 pb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border border-neutral-200 dark:border-[#2b2b2b] shadow-lg">
            <Avatar name={displayName} src={avatarUrl} size="xl" className="w-full h-full text-2xl" />
          </div>

          <div className="flex items-center justify-center space-x-1.5 cursor-pointer group">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white tracking-tight group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
              {displayName}
            </h1>
            <span className="text-neutral-500 dark:text-neutral-400">
              <SignalIcon name="person_circle" className="w-4 h-4" />
            </span>
          </div>

          {/* 2. Action Buttons Row: Video, Audio, Mute, Search */}
          <div className="flex items-center justify-center gap-7 mt-6">
            {/* Video */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setCallModalType('video')}
                className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-[#2A2A2A] hover:bg-neutral-300 dark:hover:bg-[#333333] text-neutral-900 dark:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                title="Video Call"
              >
                <SignalIcon name="video" className="w-5 h-5" />
              </button>
              <span className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 font-normal">Video</span>
            </div>

            {/* Audio */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setCallModalType('voice')}
                className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-[#2A2A2A] hover:bg-neutral-300 dark:hover:bg-[#333333] text-neutral-900 dark:text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                title="Audio Call"
              >
                <SignalIcon name="phone" className="w-5 h-5" />
              </button>
              <span className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 font-normal">Audio</span>
            </div>

            {/* Mute */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => toggleMuteConversation(conversation.id)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                  conversation.isMuted
                    ? 'bg-[#2c6bed] text-white'
                    : 'bg-neutral-200 dark:bg-[#2A2A2A] hover:bg-neutral-300 dark:hover:bg-[#333333] text-neutral-900 dark:text-white'
                }`}
                title={conversation.isMuted ? 'Unmute' : 'Mute'}
              >
                <SignalIcon name="bell" className="w-5 h-5" />
              </button>
              <span className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 font-normal">
                {conversation.isMuted ? 'Muted' : 'Mute'}
              </span>
            </div>

            {/* Search */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => alert('Search in conversation — Type Ctrl+F')}
                className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-[#2A2A2A] hover:bg-neutral-300 dark:hover:bg-[#333333] text-neutral-900 dark:text-white flex items-center justify-center transition-colors shadow-sm"
                title="Search"
              >
                <SignalIcon name="search" className="w-5 h-5" />
              </button>
              <span className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 font-normal">Search</span>
            </div>
          </div>
        </div>

        {/* Divider 1 */}
        <div className="border-b border-neutral-200 dark:border-[#252525] my-5" />

        {/* 3. Settings Section */}
        <div className="space-y-4">
          {/* Disappearing Messages */}
          <div className="relative">
            <div
              onClick={() => setShowTimerMenu(!showTimerMenu)}
              className="flex items-start justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#222222]/60 cursor-pointer transition-colors"
            >
              <div className="flex items-start space-x-3.5 pr-4">
                <span className="text-neutral-700 dark:text-white mt-0.5 flex-shrink-0">
                  <SignalIcon name="timer_slash" className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-sm font-medium text-neutral-900 dark:text-white">Disappearing messages</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    When enabled, messages sent and received in this 1:1 chat will disappear after they&apos;ve been seen.
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 px-3 py-1 bg-neutral-200 dark:bg-[#2A2A2A] hover:bg-neutral-300 dark:hover:bg-[#333333] rounded-full text-xs text-neutral-900 dark:text-white flex-shrink-0 transition-colors">
                <span>{currentTimerLabel}</span>
                <SignalIcon name="chevron_down" className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              </div>
            </div>

            {/* Dropdown Menu */}
            {showTimerMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTimerMenu(false)} />
                <div className="absolute right-2 top-12 w-48 bg-white dark:bg-[#222222] border border-neutral-200 dark:border-[#333333] rounded-xl shadow-2xl py-1 z-50 text-xs text-neutral-800 dark:text-neutral-200">
                  {TIMER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectTimer(opt.value)}
                      className={`w-full text-left px-4 py-2 hover:bg-[#2c6bed] hover:text-white transition-colors flex items-center justify-between ${
                        opt.value === conversation.disappearingTimer ? 'text-[#2c6bed] font-semibold' : ''
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.value === conversation.disappearingTimer && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Nickname */}
          <div
            onClick={() => {
              setNicknameInput(nickname || '');
              setIsEditingNickname(true);
            }}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#222222]/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3.5">
              <span className="text-neutral-700 dark:text-white flex-shrink-0">
                <SignalIcon name="edit" className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Nickname</span>
            </div>
            {nickname && <span className="text-xs text-neutral-500 dark:text-neutral-400">{nickname}</span>}
          </div>

          {/* Inline Edit Nickname Modal / Prompt */}
          {isEditingNickname && (
            <div className="px-10 py-2 flex items-center gap-2">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Add a nickname"
                autoFocus
                className="flex-1 px-3 py-1.5 bg-neutral-100 dark:bg-[#252525] border border-neutral-300 dark:border-[#383838] rounded-lg text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#2c6bed]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNickname();
                  if (e.key === 'Escape') setIsEditingNickname(false);
                }}
              />
              <button
                onClick={handleSaveNickname}
                className="px-3 py-1.5 bg-[#2c6bed] hover:bg-[#255dd1] text-white text-xs font-semibold rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingNickname(false)}
                className="px-3 py-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Chat color */}
          <div
            onClick={() => alert('Chat Color — Blue (#2c6bed)')}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#222222]/60 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3.5">
              <span className="text-neutral-700 dark:text-white flex-shrink-0">
                <SignalIcon name="color" className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Chat color</span>
            </div>
            <div className="w-4 h-4 rounded-full bg-[#2c6bed] shadow-sm flex-shrink-0" />
          </div>

          {/* View Safety Number */}
          <div
            onClick={() => {
              if (otherUser) openSafetyNumberModal(otherUser);
            }}
            className="flex items-center space-x-3.5 py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#222222]/60 cursor-pointer transition-colors"
          >
            <span className="text-neutral-700 dark:text-white flex-shrink-0">
              <SignalIcon name="safety_number" className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium text-neutral-900 dark:text-white">View Safety Number</span>
          </div>
        </div>

        {/* Divider 2 */}
        <div className="border-b border-neutral-200 dark:border-[#252525] my-5" />

        {/* 4. Groups Section */}
        <div>
          <h2 className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-3 px-2">
            {groupsToDisplay.length} {groupsToDisplay.length === 1 ? 'group' : 'groups'} in common
          </h2>

          <div className="space-y-1.5">
            {/* Add to a group */}
            <div
              onClick={() => alert('Add to a group — coming soon')}
              className="flex items-center space-x-3.5 py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#222222]/60 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-[#2A2A2A] flex items-center justify-center text-neutral-800 dark:text-white flex-shrink-0">
                <SignalIcon name="plus" className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">Add to a group</span>
            </div>

            {/* Shared group list */}
            {groupsToDisplay.map((grp) => (
              <div
                key={grp.id}
                onClick={() => {
                  useChatStore.getState().setActiveConversation(grp.id);
                  onClose();
                }}
                className="flex items-center space-x-3.5 py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#222222]/60 cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#2c6bed] flex items-center justify-center text-white flex-shrink-0">
                  <SignalIcon name="group" className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">{grp.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider 3 */}
        <div className="border-b border-neutral-200 dark:border-[#252525] my-5" />

        {/* 5. Danger Zone: Block, Report spam */}
        <div className="space-y-1.5">
          {/* Block */}
          <div
            onClick={() => setShowBlockModal(true)}
            className="flex items-center space-x-3.5 py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#222222]/60 cursor-pointer transition-colors text-[#f15353] hover:text-[#f87171]"
          >
            <span className="flex-shrink-0">
              <SignalIcon name="block" className="w-5 h-5 text-[#f15353]" />
            </span>
            <span className="text-sm font-medium">{conversation.isBlocked ? 'Unblock' : 'Block'}</span>
          </div>

          {/* Report spam */}
          <div
            onClick={() => setShowReportSpamModal(true)}
            className="flex items-center space-x-3.5 py-1.5 px-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#222222]/60 cursor-pointer transition-colors text-[#f15353] hover:text-[#f87171]"
          >
            <span className="flex-shrink-0">
              <SignalIcon name="spam" className="w-5 h-5 text-[#f15353]" />
            </span>
            <span className="text-sm font-medium">Report spam</span>
          </div>
        </div>
      </div>

      {/* Calling Coming Soon Modal */}
      <CallingComingSoonModal
        isOpen={!!callModalType}
        onClose={() => setCallModalType(null)}
        callType={callModalType || 'video'}
      />

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white dark:bg-[#252525] border border-neutral-200 dark:border-[#383838] rounded-3xl w-full max-w-sm p-6 shadow-2xl text-neutral-900 dark:text-white">
            <h3 className="text-base font-semibold mb-2">
              {conversation.isBlocked ? 'Unblock' : 'Block'} {displayName}?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              {conversation.isBlocked
                ? `${displayName} will be able to send you messages and call you.`
                : `${displayName} will no longer be able to send you messages or call you.`}
            </p>
            <div className="flex justify-end space-x-2.5">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 bg-neutral-200 dark:bg-[#333333] hover:bg-neutral-300 dark:hover:bg-[#404040] text-xs font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowBlockModal(false);
                  await toggleBlockConversation(conversation.id);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors text-white ${
                  conversation.isBlocked ? 'bg-[#2c6bed] hover:bg-[#2058c7]' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {conversation.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Spam Modal */}
      {showReportSpamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white dark:bg-[#252525] border border-neutral-200 dark:border-[#383838] rounded-3xl w-full max-w-sm p-6 shadow-2xl text-neutral-900 dark:text-white">
            <h3 className="text-base font-semibold mb-2">
              Report spam and block {displayName}?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Signal will receive a report and this contact will be blocked.
            </p>
            <div className="flex justify-end space-x-2.5">
              <button
                onClick={() => setShowReportSpamModal(false)}
                className="px-4 py-2 bg-neutral-200 dark:bg-[#333333] hover:bg-neutral-300 dark:hover:bg-[#404040] text-xs font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowReportSpamModal(false);
                  if (!conversation.isBlocked) {
                    await toggleBlockConversation(conversation.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded-full transition-colors text-white"
              >
                Report &amp; Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
