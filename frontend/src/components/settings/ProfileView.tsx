'use client';

import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useChatStore } from '../../stores/useChatStore';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';

interface ProfileViewProps {
  onEditPhoto: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onEditPhoto }) => {
  const { currentUser, updateProfile } = useSettingsStore();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [about, setAbout] = useState(currentUser?.about || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setAbout(currentUser.about || '');
      setUsername(currentUser.username || '');
    }
  }, [currentUser]);

  const handleBlurSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || currentUser.displayName,
        about: about.trim(),
        username: username.trim(),
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#191919] text-neutral-900 dark:text-white overflow-y-auto select-none">
      {/* Top Header */}
      <div className="h-14 px-6 flex items-center justify-center flex-shrink-0">
        <h1 className="text-sm font-semibold text-neutral-900 dark:text-white">Profile</h1>
      </div>

      {/* Profile Form Container */}
      <div className="w-full max-w-xl mx-auto px-6 pt-4 pb-12 flex flex-col items-center">
        {/* Large Avatar + Edit Photo Pill Button matching media_1788818855662.png */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border border-neutral-200 dark:border-[#2b2b2b] shadow-lg flex items-center justify-center">
            <Avatar
              name={currentUser?.displayName || 'User'}
              src={currentUser?.avatarUrl}
              size="2xl"
              className="w-full h-full"
            />
          </div>

          <button
            onClick={onEditPhoto}
            className="px-3.5 py-1 bg-neutral-200 dark:bg-[#2A2A2A] hover:bg-neutral-300 dark:hover:bg-[#333333] text-neutral-900 dark:text-white text-xs font-medium rounded-full cursor-pointer transition-colors shadow-sm"
          >
            Edit photo
          </button>
        </div>

        {/* Profile Fields matching media_1788818855662.png */}
        <div className="w-full space-y-6">
          {/* 1. Name & About Block */}
          <div className="space-y-4">
            {/* Display Name */}
            <div className="flex items-center space-x-3.5">
              <span className="text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                <SignalIcon name="user_profile" className="w-5 h-5" />
              </span>
              <div className="flex-1">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={handleBlurSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleBlurSave()}
                  placeholder="Your Name"
                  className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border-b border-transparent hover:border-neutral-300 dark:hover:border-[#333333] focus:border-[#2c6bed] focus:outline-none py-1 transition-colors"
                />
              </div>
            </div>

            {/* About */}
            <div className="flex items-center space-x-3.5">
              <span className="text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                <SignalIcon name="edit" className="w-5 h-5" />
              </span>
              <div className="flex-1">
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  onBlur={handleBlurSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleBlurSave()}
                  placeholder="About"
                  className="w-full bg-transparent text-sm text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 dark:placeholder-neutral-500 border-b border-transparent hover:border-neutral-300 dark:hover:border-[#333333] focus:border-[#2c6bed] focus:outline-none py-1 transition-colors"
                />
              </div>
            </div>

            {/* Explanatory subtitle */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 pl-8 leading-relaxed max-w-md">
              Your profile and changes to it will be visible to people you message, contacts and groups.
            </p>
          </div>

          {/* 2. Username Block */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center space-x-3.5">
              <span className="text-neutral-500 dark:text-neutral-400 flex-shrink-0 w-5 text-center font-semibold text-sm">
                @
              </span>
              <div className="flex-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={handleBlurSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleBlurSave()}
                  placeholder="Username"
                  className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border-b border-transparent hover:border-neutral-300 dark:hover:border-[#333333] focus:border-[#2c6bed] focus:outline-none py-1 transition-colors"
                />
              </div>
            </div>

            {/* Explanatory subtitle */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 pl-8 leading-relaxed max-w-md">
              People can now message you using your optional username so you don&apos;t have to give out your phone number.
            </p>
          </div>

          {/* 3. Sign Out Button */}
          <div className="pt-6 border-t border-neutral-200 dark:border-[#2b2b2b] flex justify-start">
            <button
              onClick={async () => {
                const { logout } = useSettingsStore.getState();
                const { setActiveTab } = useChatStore.getState();
                await logout();
                setActiveTab('chats');
              }}
              className="px-5 py-2.5 rounded-full bg-red-600/10 hover:bg-red-600/20 text-red-500 text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
