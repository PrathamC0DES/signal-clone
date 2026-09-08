'use client';

import React, { useState } from 'react';
import { Conversation, DisappearingTimerValue } from '../../types';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface ConversationDetailsDrawerProps {
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

export const ConversationDetailsDrawer: React.FC<ConversationDetailsDrawerProps> = ({
  conversation,
  onClose,
}) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'media' | 'files' | 'audio'>('media');
  const { setDisappearingTimer, toggleMuteConversation, deleteConversation } = useChatStore();
  const { openSafetyNumberModal } = useSettingsStore();

  const isDirect = conversation.type === 'direct' && conversation.id !== 'conv_note_to_self';
  const otherUser = isDirect ? conversation.participants.find((p) => p.id !== 'user_me') : null;

  return (
    <aside className="w-80 flex-shrink-0 bg-[#1b1b1b] border-l border-[#262626] flex flex-col h-full overflow-y-auto select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#242424] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">
          {isDirect ? 'Contact Details' : 'Group Details'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-[#252525]"
        >
          <SignalIcon name="x" className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Profile Info */}
      <div className="p-6 flex flex-col items-center border-b border-[#242424]">
        <Avatar
          name={conversation.name}
          src={conversation.avatarUrl}
          color={conversation.color}
          size="xl"
          className="mb-3"
          isGroup={conversation.type === 'group'}
        />

        <h2 className="text-base font-semibold text-white text-center mb-1">
          {conversation.name}
        </h2>

        {isDirect && otherUser && (
          <>
            <span className="text-xs text-neutral-400 mb-1">{otherUser.phoneNumber}</span>
            {otherUser.about && (
              <span className="text-xs text-neutral-300 text-center italic mt-1 px-4">
                "{otherUser.about}"
              </span>
            )}
          </>
        )}

        {!isDirect && (
          <span className="text-xs text-neutral-400">
            {conversation.participants.length} group members
          </span>
        )}
      </div>

      {/* Disappearing Messages Section */}
      <div className="p-4 border-b border-[#242424]">
        <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-300 mb-2">
          <SignalIcon name="timer" className="w-4 h-4 text-[#2c6bed]" />
          <span>Disappearing Messages</span>
        </div>

        <select
          value={conversation.disappearingTimer}
          onChange={(e) => setDisappearingTimer(Number(e.target.value) as DisappearingTimerValue)}
          className="w-full bg-[#262626] border border-[#333333] text-neutral-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#2c6bed]"
        >
          {TIMER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-neutral-500 mt-1.5 leading-normal">
          When enabled, messages sent and received in this chat will disappear after they have been seen.
        </p>
      </div>

      {/* Cryptographic Safety Number Verification */}
      {isDirect && otherUser && (
        <div className="p-4 border-b border-[#242424]">
          <button
            onClick={() => openSafetyNumberModal(otherUser)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#242424] hover:bg-[#2e2e2e] transition-colors border border-[#333333] text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-[#2c6bed]">
                <SignalIcon name="safety_number" className="w-5 h-5" />
              </span>
              <div>
                <div className="text-xs font-semibold text-white">View Safety Number</div>
                <div className="text-[11px] text-neutral-400">Verify end-to-end encryption</div>
              </div>
            </div>
            <span className="text-neutral-500">➔</span>
          </button>
        </div>
      )}

      {/* Shared Media Tabs */}
      <div className="p-4 border-b border-[#242424]">
        <div className="flex items-center space-x-2 border-b border-[#2d2d2d] pb-2 mb-3">
          {(['media', 'files', 'audio'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMediaTab(tab)}
              className={`text-xs font-semibold px-2 py-1 rounded transition-colors uppercase ${
                activeMediaTab === tab ? 'text-[#2c6bed] bg-[#2c6bed]/10' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="text-center py-6 text-neutral-500 text-xs">
          No shared {activeMediaTab} in this chat
        </div>
      </div>

      {/* Mute & Dangerous Controls */}
      <div className="p-4 space-y-2 mt-auto">
        <button
          onClick={() => toggleMuteConversation(conversation.id)}
          className="w-full py-2 px-3 rounded-lg bg-[#242424] hover:bg-[#2b2b2b] text-neutral-200 text-xs font-medium flex items-center justify-between transition-colors"
        >
          <span>{conversation.isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
          <span>{conversation.isMuted ? '🔔' : '🔕'}</span>
        </button>

        <button
          onClick={() => {
            deleteConversation(conversation.id);
            onClose();
          }}
          className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium flex items-center justify-between transition-colors"
        >
          <span>Delete conversation</span>
          <SignalIcon name="trash" className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
