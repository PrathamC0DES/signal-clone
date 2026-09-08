'use client';

import React, { useState, useEffect } from 'react';
import { User, DisappearingTimerValue } from '../../types';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';
import { getSignalService } from '../../services';
import { useChatStore } from '../../stores/useChatStore';

interface NewChatPanelProps {
  onClose: () => void;
}

type GroupCreationStep = 'members' | 'details';

export const NewChatPanel: React.FC<NewChatPanelProps> = ({ onClose }) => {
  const [contacts, setContacts] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupStep, setGroupStep] = useState<GroupCreationStep>('members');
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [disappearingTimer, setDisappearingTimerState] = useState<DisappearingTimerValue>(0);

  const { createDirectChat, createGroupChat, setDisappearingTimer } = useChatStore();

  useEffect(() => {
    getSignalService()
      .getContacts()
      .then((c) => setContacts(c));
  }, []);

  const filtered = contacts.filter((c) =>
    c.displayName.toLowerCase().includes(query.toLowerCase()) ||
    c.phoneNumber.includes(query)
  );

  const handleSelectContact = async (userId: string) => {
    if (isCreatingGroup) {
      setSelectedUserIds((prev) =>
        prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
      );
    } else {
      await createDirectChat(userId);
      onClose();
    }
  };

  const handleRemoveMember = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUserIds.length === 0) return;
    const newGroupId = await createGroupChat(groupName.trim(), selectedUserIds);
    if (disappearingTimer > 0) {
      await setDisappearingTimer(disappearingTimer);
    }
    onClose();
  };

  const selectedUsers = contacts.filter((c) => selectedUserIds.includes(c.id));

  // --- Step 2: Name This Group (matches media_1788834498606.png) ---
  if (isCreatingGroup && groupStep === 'details') {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#1E1E1E] text-neutral-900 dark:text-white select-none">
        {/* Header */}
        <div className="flex items-center px-4 pt-3 pb-2.5 border-b border-neutral-200 dark:border-neutral-800/80">
          <button
            onClick={() => setGroupStep('members')}
            className="w-8 h-8 -ml-2 flex items-center justify-center text-neutral-700 dark:text-white hover:opacity-70 transition-opacity flex-shrink-0 cursor-pointer"
            title="Back to choose members"
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white ml-1.5">
            Name this group
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center">
          {/* Group photo circle matching media_1788834498606.png */}
          <div className="relative cursor-pointer mb-6">
            <Avatar name="Group" isGroup={true} className="w-24 h-24 text-4xl" />
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border-2 border-white dark:border-[#1E1E1E] flex items-center justify-center shadow-md text-black">
              <SignalIcon name="camera" className="w-3.5 h-3.5 text-black" />
            </div>
          </div>

          {/* Group name input matching media_1788834498606.png */}
          <div className="w-full mb-6">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name (required)"
              autoFocus
              className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-[#252525] rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-300 dark:border-[#383838] focus:outline-none focus:border-[#3b45fd]"
            />
          </div>

          {/* Disappearing messages row matching media_1788834498606.png */}
          <div className="w-full flex items-center justify-between py-1 mb-6">
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              Disappearing messages
            </span>
            <div className="relative">
              <select
                value={disappearingTimer}
                onChange={(e) => setDisappearingTimerState(Number(e.target.value) as DisappearingTimerValue)}
                className="appearance-none bg-neutral-200 dark:bg-[#2a2a2a] border border-neutral-300 dark:border-[#383838] text-neutral-900 dark:text-white text-xs font-medium px-3.5 py-1.5 pr-7 rounded-full focus:outline-none cursor-pointer"
              >
                <option value={0}>Off</option>
                <option value={30}>30 seconds</option>
                <option value={300}>5 minutes</option>
                <option value={3600}>1 hour</option>
                <option value={28800}>8 hours</option>
                <option value={86400}>1 day</option>
                <option value={604800}>1 week</option>
                <option value={2419200}>4 weeks</option>
              </select>
              <SignalIcon name="chevron_down" className="w-3 h-3 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Members section matching media_1788834498606.png */}
          <div className="w-full">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
              Members
            </h3>
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {selectedUsers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 px-1.5 group hover:bg-neutral-100 dark:hover:bg-[#252525] rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Avatar name={member.displayName} src={member.avatarUrl} size="md" />
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="text-sm font-normal text-neutral-900 dark:text-white truncate">
                        {member.displayName}
                      </span>
                      <span className="text-neutral-400 dark:text-neutral-400">
                        <SignalIcon name="person_circle" className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemoveMember(e, member.id)}
                    className="text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove member"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: Create Button */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim()}
            className="px-6 py-2 bg-[#3b45fd] hover:bg-[#323be0] disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg cursor-pointer disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    );
  }

  // --- Step 1: Choose Members (matches media_1788834447609.png) ---
  if (isCreatingGroup && groupStep === 'members') {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#1E1E1E] text-neutral-900 dark:text-white select-none relative">
        {/* Header */}
        <div className="flex items-center px-4 pt-3 pb-2.5">
          <button
            onClick={() => {
              setIsCreatingGroup(false);
              setSelectedUserIds([]);
            }}
            className="w-8 h-8 -ml-2 flex items-center justify-center text-neutral-700 dark:text-white hover:opacity-70 transition-opacity flex-shrink-0 cursor-pointer"
            title="Back to new chat"
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white ml-1.5">
            Choose members
          </h2>
        </div>

        {/* Search input */}
        <div className="px-3 pb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <SignalIcon name="search" className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, username, or number"
              autoFocus
              className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-[#2a2a2a] rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-[#3a3a3a] focus:outline-none"
            />
          </div>
        </div>

        {/* Selected Contact Chips */}
        {selectedUsers.length > 0 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {selectedUsers.map((user) => {
              const firstName = user.displayName.split(' ')[0];
              return (
                <div
                  key={user.id}
                  className="inline-flex items-center gap-1.5 bg-neutral-200 dark:bg-[#383838] pl-1 pr-2 py-0.5 rounded-full text-xs text-neutral-900 dark:text-white animate-in fade-in zoom-in-95 duration-100"
                >
                  <Avatar
                    name={user.displayName}
                    src={user.avatarUrl}
                    className="w-5 h-5 text-[9px] font-semibold flex-shrink-0"
                  />
                  <span className="font-medium max-w-[90px] truncate">{firstName}</span>
                  <button
                    onClick={(e) => handleRemoveMember(e, user.id)}
                    className="w-3.5 h-3.5 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-bold ml-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Contacts Section Label */}
        <div className="px-4 pt-1 pb-1">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Contacts</h3>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-16">
          {filtered.map((contact) => {
            const isSelected = selectedUserIds.includes(contact.id);
            return (
              <div
                key={contact.id}
                onClick={() => handleSelectContact(contact.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-neutral-100 dark:bg-[#2b2b2b]'
                    : 'hover:bg-neutral-100 dark:hover:bg-[#252525]'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar
                    name={contact.displayName}
                    src={contact.avatarUrl}
                    color={contact.color}
                    size="md"
                  />
                  <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {contact.displayName}
                  </span>
                </div>

                {/* Circular selection indicator on right */}
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-[#3b45fd] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                    ✓
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-neutral-400 dark:border-neutral-600 bg-transparent flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Right "Next" button */}
        {selectedUserIds.length > 0 && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={() => setGroupStep('details')}
              className="px-5 py-2 bg-[#3b45fd] hover:bg-[#323be0] text-white rounded-lg text-sm font-semibold shadow-xl transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>Next</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Default: New Chat Panel ---
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1E1E1E] text-neutral-900 dark:text-white select-none">
      {/* Header */}
      <div className="flex items-center px-4 pt-3 pb-2">
        <button
          onClick={onClose}
          className="w-8 h-8 -ml-2 flex items-center justify-center text-neutral-700 dark:text-white hover:opacity-70 transition-opacity flex-shrink-0 cursor-pointer"
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white ml-1.5">
          New chat
        </h2>
      </div>

      {/* Search bar */}
      <div className="px-3 pb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <SignalIcon name="search" className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, username, or number"
            autoFocus
            className="w-full pl-8 pr-4 py-2 bg-neutral-100 dark:bg-[#2a2a2a] rounded-xl text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-[#3a3a3a] focus:outline-none"
          />
        </div>
      </div>

      {/* Action rows */}
      <div className="px-2 mb-1 space-y-0.5">
        {/* New group */}
        <button
          onClick={() => {
            setIsCreatingGroup(true);
            setGroupStep('members');
            setSelectedUserIds([]);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-100 dark:hover:bg-[#252525] rounded-xl transition-colors text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-neutral-800 dark:text-white" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-900 dark:text-white">New group</span>
        </button>

        {/* Find by username */}
        <button
          onClick={() => alert('Find by username — coming soon')}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-100 dark:hover:bg-[#252525] rounded-xl transition-colors text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
            <span className="text-neutral-800 dark:text-white text-lg font-medium leading-none">@</span>
          </div>
          <span className="text-sm font-medium text-neutral-900 dark:text-white">Find by username</span>
        </button>

        {/* Find by phone number */}
        <button
          onClick={() => alert('Find by phone number — coming soon')}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-100 dark:hover:bg-[#252525] rounded-xl transition-colors text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
            <span className="text-neutral-800 dark:text-white text-lg font-medium leading-none">#</span>
          </div>
          <span className="text-sm font-medium text-neutral-900 dark:text-white">Find by phone number</span>
        </button>
      </div>

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-3 py-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">Contacts</p>
        {filtered.map((contact) => (
          <div
            key={contact.id}
            onClick={() => handleSelectContact(contact.id)}
            className="flex items-center px-3 py-2 hover:bg-neutral-100 dark:hover:bg-[#252525] rounded-xl cursor-pointer transition-colors"
          >
            <Avatar name={contact.displayName} src={contact.avatarUrl} color={contact.color} size="md" className="mr-3 flex-shrink-0" />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">{contact.displayName}</span>
              <SignalIcon name="check_circle" className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
