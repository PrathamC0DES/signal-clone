'use client';

import React, { useState, useEffect } from 'react';
import { Conversation, DisappearingTimerValue, User } from '../../types';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getSignalService } from '../../services';
import { CallingComingSoonModal } from '../modals/CallingComingSoonModal';

interface GroupDetailsViewProps {
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

const PRESET_COLORS = [
  '#2c6bed', // Signal Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

export const GroupDetailsView: React.FC<GroupDetailsViewProps> = ({
  conversation,
  onClose,
}) => {
  const {
    conversations,
    createDirectChat,
    setDisappearingTimer,
    toggleMuteConversation,
    addGroupMember,
    removeGroupMember,
    setMemberRole,
    updateGroupPermissions,
    setGroupChatColor,
    leaveGroup,
    blockGroup,
    blockGroupMember,
  } = useChatStore();

  const { currentUser } = useSettingsStore();

  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedMemberForModal, setSelectedMemberForModal] = useState<User | null>(null);
  const [showAddToAnotherGroupModal, setShowAddToAnotherGroupModal] = useState(false);
  const [callModalType, setCallModalType] = useState<'voice' | 'video' | null>(null);
  const [memberToBlock, setMemberToBlock] = useState<User | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);

  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);

  // Available contacts for adding
  const [availableContacts, setAvailableContacts] = useState<User[]>([]);

  useEffect(() => {
    getSignalService()
      .getContacts()
      .then((contacts) => {
        setAvailableContacts(contacts);
      });
  }, []);

  const adminIds = conversation.adminIds || ['user_me'];
  const isCurrentUserAdmin = adminIds.includes(currentUser?.id || 'user_me');

  const currentTimerLabel =
    TIMER_OPTIONS.find((opt) => opt.value === conversation.disappearingTimer)?.label || 'Off';

  const currentColor = conversation.color || '#2c6bed';

  const filteredParticipants = conversation.participants.filter((p) => {
    if (!searchMemberQuery.trim()) return true;
    const name = p.id === currentUser?.id ? 'You' : p.displayName;
    return name.toLowerCase().includes(searchMemberQuery.toLowerCase());
  });

  const candidatesToAdd = availableContacts.filter(
    (contact) => !conversation.participants.some((p) => p.id === contact.id)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#191919] text-neutral-900 dark:text-white overflow-y-auto select-none relative">
      {/* Top Header with Back Button and Group Title */}
      <div className="h-14 px-4 flex items-center space-x-3 border-b border-neutral-100 dark:border-transparent flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors"
          title="Back to conversation"
        >
          <SignalIcon name="chevron_left" className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <Avatar
            name={conversation.name}
            src={conversation.avatarUrl}
            size="sm"
            isGroup={true}
          />
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {conversation.name}
          </h2>
        </div>
      </div>

      {/* Main Content Area matching screenshot media_1788821667188.png */}
      <div className="w-full max-w-xl mx-auto px-6 py-6 space-y-6 pb-20">
        {/* SECTION 1: Top Options */}
        <div className="space-y-4">
          {/* 1.1 Disappearing Messages */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3.5 pr-4">
              <span className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                <SignalIcon name="timer_slash" className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Disappearing messages
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  When enabled, messages sent and received in this group will disappear after they&apos;ve been seen.
                </p>
              </div>
            </div>

            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowTimerMenu(!showTimerMenu)}
                className="flex items-center space-x-1.5 px-3 py-1 bg-neutral-100 dark:bg-[#2B2B2B] hover:bg-neutral-200 dark:hover:bg-[#383838] text-neutral-900 dark:text-white text-xs font-medium rounded-full transition-colors"
              >
                <span>{currentTimerLabel}</span>
                <SignalIcon name="chevron_down" className="w-3 h-3 text-neutral-400" />
              </button>

              {showTimerMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTimerMenu(false)} />
                  <div className="absolute right-0 top-8 w-40 bg-white dark:bg-[#242424] border border-neutral-200 dark:border-[#383838] rounded-2xl shadow-2xl py-1.5 z-50 text-xs">
                    {TIMER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={async () => {
                          setShowTimerMenu(false);
                          await setDisappearingTimer(opt.value);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-neutral-100 dark:hover:bg-[#2E2E2E] flex items-center justify-between ${
                          conversation.disappearingTimer === opt.value
                            ? 'text-[#2c6bed] font-semibold'
                            : 'text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {conversation.disappearingTimer === opt.value && (
                          <SignalIcon name="check" className="w-3.5 h-3.5 text-[#2c6bed]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 1.2 Chat Color */}
          <div
            onClick={() => setShowColorPicker(true)}
            className="flex items-center justify-between cursor-pointer py-1 group"
          >
            <div className="flex items-center space-x-3.5">
              <span className="text-neutral-500 dark:text-neutral-400">
                <SignalIcon name="color" className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                Chat color
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: currentColor }}
              />
            </div>
          </div>

          {/* 1.3 Notifications */}
          <div
            onClick={() => toggleMuteConversation(conversation.id)}
            className="flex items-center justify-between cursor-pointer py-1 group"
          >
            <div className="flex items-center space-x-3.5">
              <span className="text-neutral-500 dark:text-neutral-400">
                <SignalIcon name="bell" className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                Notifications
              </span>
            </div>
            <span className="text-xs text-neutral-400">
              {conversation.isMuted ? 'Muted' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t border-neutral-100 dark:border-[#2B2B2B]" />

        {/* SECTION 2: Members */}
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              {conversation.participants.length} members
            </h3>
            <button
              onClick={() => setIsSearchingMembers(!isSearchingMembers)}
              className="p-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Search members"
            >
              <SignalIcon name="search" className="w-4 h-4" />
            </button>
          </div>

          {/* Search box if opened */}
          {isSearchingMembers && (
            <div className="relative">
              <input
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                placeholder="Search members"
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-100 dark:bg-[#252525] text-neutral-900 dark:text-white text-xs rounded-full border border-neutral-200 dark:border-[#383838] outline-none"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <SignalIcon name="search" className="w-3.5 h-3.5" />
              </span>
            </div>
          )}

          {/* Add Members Row */}
          <div
            onClick={() => setShowAddMembersModal(true)}
            className="flex items-center space-x-3.5 py-1.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-[#2B2B2B] flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:bg-neutral-300 dark:group-hover:bg-[#383838] transition-colors">
              <SignalIcon name="plus" className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-200">
              Add members
            </span>
          </div>

          {/* Members List */}
          <div className="space-y-1.5 pt-1">
            {filteredParticipants.map((member) => {
              const isMe = member.id === currentUser?.id;
              const isAdmin = adminIds.includes(member.id);
              const displayName = isMe ? 'You' : member.displayName;

              return (
                <div
                  key={member.id}
                  onClick={() => {
                    if (!isMe) {
                      setSelectedMemberForModal(member);
                    }
                  }}
                  className={`flex items-center justify-between py-2 rounded-xl px-2 hover:bg-neutral-100 dark:hover:bg-[#242424] transition-colors relative group ${
                    !isMe ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-200 dark:border-[#333333] flex items-center justify-center flex-shrink-0">
                      <Avatar
                        name={displayName}
                        src={member.avatarUrl}
                        size="sm"
                        className="w-full h-full text-xs"
                      />
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-medium text-neutral-900 dark:text-white">
                        {displayName}
                      </span>
                      {!isMe && (
                        <span className="text-neutral-400 dark:text-neutral-500">
                          <SignalIcon name="person_circle" className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isAdmin && (
                      <span className="text-xs text-neutral-400 font-normal">
                        Admin
                      </span>
                    )}
                    {!isMe && (
                      <span className="text-neutral-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        ›
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t border-neutral-100 dark:border-[#2B2B2B]" />

        {/* SECTION 3: Options (Explicitly NO Group Link, NO Member Label) */}
        <div className="space-y-3.5">
          {/* Requests & Invites */}
          <div className="flex items-center justify-between cursor-pointer py-1 group">
            <div className="flex items-center space-x-3.5">
              <span className="text-neutral-500 dark:text-neutral-400">
                <SignalIcon name="group" className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                Requests &amp; Invites
              </span>
            </div>
            <span className="text-xs text-neutral-400">0</span>
          </div>

          {/* Permissions */}
          <div
            onClick={() => setShowPermissionsModal(true)}
            className="flex items-center justify-between cursor-pointer py-1 group"
          >
            <div className="flex items-center space-x-3.5">
              <span className="text-neutral-500 dark:text-neutral-400">
                <SignalIcon name="key" className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                Permissions
              </span>
            </div>
            <span className="text-sm text-neutral-400">›</span>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-t border-neutral-100 dark:border-[#2B2B2B]" />

        {/* SECTION 4: Danger Zone */}
        <div className="space-y-3 pt-1">
          {/* Leave group */}
          <div
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center space-x-3.5 cursor-pointer py-1 text-neutral-900 dark:text-white hover:opacity-80 transition-opacity"
          >
            <span className="text-neutral-500 dark:text-neutral-400">
              <SignalIcon name="leave" className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium">Leave group</span>
          </div>

          {/* Block group */}
          <div
            onClick={() => {
              if (confirm('Block and leave this group?')) {
                blockGroup(conversation.id);
                onClose();
              }
            }}
            className="flex items-center space-x-3.5 cursor-pointer py-1 text-red-500 hover:text-red-600 transition-colors"
          >
            <span>
              <SignalIcon name="block" className="w-5 h-5 text-red-500" />
            </span>
            <span className="text-sm font-medium">Block group</span>
          </div>

          {/* Report spam */}
          <div
            onClick={() => alert('Group reported as spam. Thank you for keeping Signal safe.')}
            className="flex items-center space-x-3.5 cursor-pointer py-1 text-red-500 hover:text-red-600 transition-colors"
          >
            <span>
              <SignalIcon name="spam" className="w-5 h-5 text-red-500" />
            </span>
            <span className="text-sm font-medium">Report spam</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Color Picker */}
      {showColorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#252525] border border-neutral-200 dark:border-[#383838] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-3">
              Chat Color
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Choose an accent color for this group chat.
            </p>
            <div className="grid grid-cols-4 gap-3 py-2">
              {PRESET_COLORS.map((col) => (
                <button
                  key={col}
                  onClick={async () => {
                    await setGroupChatColor(conversation.id, col);
                    setShowColorPicker(false);
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm ${
                    currentColor === col ? 'ring-2 ring-offset-2 ring-white scale-105' : ''
                  }`}
                  style={{ backgroundColor: col }}
                >
                  {currentColor === col && (
                    <SignalIcon name="check" className="w-5 h-5 text-white" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowColorPicker(false)}
                className="px-4 py-1.5 bg-neutral-200 dark:bg-[#333333] hover:bg-neutral-300 dark:hover:bg-[#444444] text-neutral-800 dark:text-white text-xs font-semibold rounded-full transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Members Modal */}
      {showAddMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#252525] border border-neutral-200 dark:border-[#383838] rounded-2xl w-full max-w-md p-5 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                Add Members
              </h3>
              <button
                onClick={() => setShowAddMembersModal(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
              Select contacts to add to this group.
            </p>

            <div className="flex-1 overflow-y-auto space-y-1 py-1">
              {candidatesToAdd.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">
                  All available contacts are already members of this group.
                </p>
              ) : (
                candidatesToAdd.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={async () => {
                      await addGroupMember(conversation.id, contact);
                      setShowAddMembersModal(false);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#303030] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-200 dark:border-[#333333] flex items-center justify-center flex-shrink-0">
                        <Avatar
                          name={contact.displayName}
                          src={contact.avatarUrl}
                          size="sm"
                          className="w-full h-full text-xs"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {contact.displayName}
                        </p>
                        <p className="text-xs text-neutral-400">{contact.phoneNumber}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-[#2c6bed] hover:bg-[#2058c7] text-white text-xs font-semibold rounded-full transition-colors">
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#252525] border border-neutral-200 dark:border-[#383838] rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
              Group Permissions
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Choose who can make changes to this group.
            </p>

            <div className="space-y-4 text-xs">
              {/* Edit Group Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white text-sm">
                    Edit group info
                  </p>
                  <p className="text-neutral-400">Name, avatar, disappearing messages</p>
                </div>
                <select
                  value={conversation.permissions?.editGroupInfo || 'all'}
                  onChange={async (e) => {
                    await updateGroupPermissions(conversation.id, {
                      editGroupInfo: e.target.value as 'all' | 'admin',
                    });
                  }}
                  className="bg-neutral-100 dark:bg-[#333333] text-neutral-900 dark:text-white rounded-lg px-2.5 py-1.5 outline-none"
                >
                  <option value="all">All members</option>
                  <option value="admin">Only admins</option>
                </select>
              </div>

              {/* Send Messages */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white text-sm">
                    Send messages
                  </p>
                  <p className="text-neutral-400">Send chat messages and media</p>
                </div>
                <select
                  value={conversation.permissions?.sendMessages || 'all'}
                  onChange={async (e) => {
                    await updateGroupPermissions(conversation.id, {
                      sendMessages: e.target.value as 'all' | 'admin',
                    });
                  }}
                  className="bg-neutral-100 dark:bg-[#333333] text-neutral-900 dark:text-white rounded-lg px-2.5 py-1.5 outline-none"
                >
                  <option value="all">All members</option>
                  <option value="admin">Only admins</option>
                </select>
              </div>

              {/* Add Members */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white text-sm">
                    Add other members
                  </p>
                  <p className="text-neutral-400">Invite and add contacts to this group</p>
                </div>
                <select
                  value={conversation.permissions?.addMembers || 'all'}
                  onChange={async (e) => {
                    await updateGroupPermissions(conversation.id, {
                      addMembers: e.target.value as 'all' | 'admin',
                    });
                  }}
                  className="bg-neutral-100 dark:bg-[#333333] text-neutral-900 dark:text-white rounded-lg px-2.5 py-1.5 outline-none"
                >
                  <option value="all">All members</option>
                  <option value="admin">Only admins</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-1.5 bg-[#2c6bed] hover:bg-[#2058c7] text-white text-xs font-semibold rounded-full transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Leave Group Confirmation */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-[#252525] border border-neutral-200 dark:border-[#383838] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
              Leave group?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-5 leading-relaxed">
              You will no longer be able to send or receive messages in this group.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-1.5 bg-neutral-200 dark:bg-[#333333] hover:bg-neutral-300 dark:hover:bg-[#444444] text-neutral-800 dark:text-white text-xs font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLeaveModal(false);
                  await leaveGroup(conversation.id);
                  onClose();
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-full transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Member Profile & Actions Card (matches media_1788822510802.png) */}
      {selectedMemberForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-[#2b2b2b] dark:bg-[#2b2b2b] border border-[#383838] rounded-3xl w-full max-w-[340px] p-6 shadow-2xl relative text-white">
            {/* Top Close 'X' Button */}
            <button
              onClick={() => setSelectedMemberForModal(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#3d3d3d] hover:bg-[#4d4d4d] text-neutral-300 hover:text-white flex items-center justify-center text-xs transition-colors"
              title="Close"
            >
              ✕
            </button>

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border border-neutral-600 flex items-center justify-center">
              <Avatar
                name={selectedMemberForModal.displayName}
                src={selectedMemberForModal.avatarUrl}
                size="xl"
                className="w-full h-full text-2xl"
              />
            </div>

            {/* Display Name with contact badge */}
            <div className="flex items-center justify-center space-x-1.5 mb-5">
              <h3 className="text-base font-semibold text-white tracking-tight">
                {selectedMemberForModal.displayName}
              </h3>
              <SignalIcon name="person_circle" className="w-4 h-4 text-neutral-300" />
            </div>

            {/* Action Buttons: Message, Video, Voice */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              {/* Message */}
              <div className="flex flex-col items-center">
                <button
                  onClick={async () => {
                    const memberId = selectedMemberForModal.id;
                    setSelectedMemberForModal(null);
                    await createDirectChat(memberId);
                    onClose();
                  }}
                  className="w-12 h-12 rounded-full bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Message"
                >
                  <SignalIcon name="chat" className="w-5 h-5" />
                </button>
                <span className="text-xs text-neutral-300 mt-1.5 font-medium">Message</span>
              </div>

              {/* Video */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCallModalType('video')}
                  className="w-12 h-12 rounded-full bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Video call"
                >
                  <SignalIcon name="video" className="w-5 h-5" />
                </button>
                <span className="text-xs text-neutral-300 mt-1.5 font-medium">Video</span>
              </div>

              {/* Voice */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setCallModalType('voice')}
                  className="w-12 h-12 rounded-full bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Voice call"
                >
                  <SignalIcon name="phone" className="w-5 h-5" />
                </button>
                <span className="text-xs text-neutral-300 mt-1.5 font-medium">Voice</span>
              </div>
            </div>

            {/* Options List (Strictly keep only Block, Add to another group, Make admin, Remove from group) */}
            <div className="space-y-3.5 pt-2 border-t border-[#383838]">
              {/* 1. Block */}
              <button
                onClick={() => {
                  setMemberToBlock(selectedMemberForModal);
                }}
                className="w-full flex items-center space-x-3.5 py-1 text-left text-white hover:opacity-80 transition-opacity cursor-pointer"
              >
                <SignalIcon name="block" className="w-5 h-5 text-neutral-200" />
                <span className="text-sm font-medium">Block</span>
              </button>

              {/* 2. Add to another group */}
              <button
                onClick={() => setShowAddToAnotherGroupModal(true)}
                className="w-full flex items-center space-x-3.5 py-1 text-left text-white hover:opacity-80 transition-opacity cursor-pointer"
              >
                <SignalIcon name="plus_circle" className="w-5 h-5 text-neutral-200" />
                <span className="text-sm font-medium">Add to another group</span>
              </button>

              {/* 3. Make admin / Dismiss as admin */}
              {isCurrentUserAdmin && (
                <button
                  onClick={async () => {
                    const isTargetAdmin = adminIds.includes(selectedMemberForModal.id);
                    await setMemberRole(
                      conversation.id,
                      selectedMemberForModal.id,
                      isTargetAdmin ? 'member' : 'admin'
                    );
                    setSelectedMemberForModal(null);
                  }}
                  className="w-full flex items-center space-x-3.5 py-1 text-left text-white hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <SignalIcon name="key" className="w-5 h-5 text-neutral-200" />
                  <span className="text-sm font-medium">
                    {adminIds.includes(selectedMemberForModal.id) ? 'Dismiss as admin' : 'Make admin'}
                  </span>
                </button>
              )}

              {/* 4. Remove from group */}
              {isCurrentUserAdmin && (
                <button
                  onClick={() => {
                    setMemberToRemove(selectedMemberForModal);
                  }}
                  className="w-full flex items-center space-x-3.5 py-1 text-left text-white hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <SignalIcon name="leave" className="w-5 h-5 text-neutral-200" />
                  <span className="text-sm font-medium">Remove from group</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Add to another group */}
      {showAddToAnotherGroupModal && selectedMemberForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 select-none">
          <div className="bg-[#242424] border border-[#383838] rounded-2xl w-full max-w-sm p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-white">
                Add to Another Group
              </h3>
              <button
                onClick={() => setShowAddToAnotherGroupModal(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Select a group to add {selectedMemberForModal.displayName} to:
            </p>

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {conversations.filter((c) => c.type === 'group' && c.id !== conversation.id).length === 0 ? (
                <p className="text-xs text-neutral-400 py-4 text-center">
                  No other groups found.
                </p>
              ) : (
                conversations
                  .filter((c) => c.type === 'group' && c.id !== conversation.id)
                  .map((grp) => (
                    <button
                      key={grp.id}
                      onClick={async () => {
                        await addGroupMember(grp.id, selectedMemberForModal);
                        setShowAddToAnotherGroupModal(false);
                        setSelectedMemberForModal(null);
                        alert(`Added ${selectedMemberForModal.displayName} to "${grp.name}"!`);
                      }}
                      className="w-full flex items-center space-x-3 p-2 rounded-xl hover:bg-[#303030] text-left transition-colors"
                    >
                      <Avatar name={grp.name} src={grp.avatarUrl} size="sm" isGroup={true} />
                      <span className="text-sm font-medium text-white truncate">
                        {grp.name}
                      </span>
                    </button>
                  ))
              )}
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

      {/* Member Block Modal */}
      {memberToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white dark:bg-[#252525] border border-neutral-200 dark:border-[#383838] rounded-3xl w-full max-w-sm p-6 shadow-2xl text-neutral-900 dark:text-white">
            <h3 className="text-base font-semibold mb-2">
              Block {memberToBlock.displayName}?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              They will no longer be able to message or call you.
            </p>
            <div className="flex justify-end space-x-2.5">
              <button
                onClick={() => setMemberToBlock(null)}
                className="px-4 py-2 bg-neutral-200 dark:bg-[#333333] hover:bg-neutral-300 dark:hover:bg-[#404040] text-xs font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  blockGroupMember(conversation.id, memberToBlock.id);
                  setMemberToBlock(null);
                  setSelectedMemberForModal(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded-full transition-colors text-white"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Remove Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150 select-none">
          <div className="bg-white dark:bg-[#252525] border border-neutral-200 dark:border-[#383838] rounded-3xl w-full max-w-sm p-6 shadow-2xl text-neutral-900 dark:text-white">
            <h3 className="text-base font-semibold mb-2">
              Remove {memberToRemove.displayName}?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              {memberToRemove.displayName} will be removed from this group.
            </p>
            <div className="flex justify-end space-x-2.5">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 bg-neutral-200 dark:bg-[#333333] hover:bg-neutral-300 dark:hover:bg-[#404040] text-xs font-semibold rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await removeGroupMember(conversation.id, memberToRemove.id);
                  setMemberToRemove(null);
                  setSelectedMemberForModal(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-semibold rounded-full transition-colors text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
