'use client';

import React, { useState } from 'react';
import { SettingsCategory } from './SettingsLeftPane';
import { ProfileView } from './ProfileView';
import { YourAvatarView } from './YourAvatarView';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { SignalIcon } from '../common/SignalIcon';

const AppearanceSettingsView: React.FC = () => {
  const { preferences, updatePreferences } = useSettingsStore();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeOptions = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  const currentThemeLabel =
    preferences.theme === 'light'
      ? 'Light'
      : preferences.theme === 'dark'
      ? 'Dark'
      : 'System';

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#191919] text-neutral-900 dark:text-white overflow-y-auto select-none p-8">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-6">Appearance</h2>
      <div className="max-w-xl bg-neutral-50 dark:bg-[#232323] border border-neutral-200 dark:border-[#2f2f2f] rounded-2xl p-2">
        {/* Language Row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/80 dark:border-neutral-700/50">
          <div className="flex items-center space-x-3">
            <SignalIcon name="globe" className="w-5 h-5 text-neutral-700 dark:text-white" />
            <span className="text-sm font-medium text-neutral-900 dark:text-white">Language</span>
          </div>
          <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">System</span>
        </div>

        {/* Theme Row */}
        <div className="flex items-center justify-between px-4 py-3 relative">
          <div className="flex items-center space-x-3">
            <SignalIcon name="appearance" className="w-5 h-5 text-neutral-700 dark:text-white" />
            <span className="text-sm font-medium text-neutral-900 dark:text-white">Theme</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="text-sm font-normal text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {currentThemeLabel}
            </button>

            {/* Theme Dropdown Popover (matches media_1788835566724.png) */}
            {showThemeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#282828] border border-[#3e3e3e] shadow-2xl rounded-2xl py-1.5 px-1 z-50 text-white select-none animate-in fade-in zoom-in-95 duration-100">
                  {themeOptions.map((opt) => {
                    const isSelected =
                      (opt.value === 'dark' && preferences.theme === 'dark') ||
                      (opt.value === 'light' && preferences.theme === 'light') ||
                      (opt.value === 'system' && preferences.theme !== 'dark' && preferences.theme !== 'light');

                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          updatePreferences({ theme: opt.value as any });
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center px-3 py-2 text-sm font-normal rounded-xl transition-colors text-left cursor-pointer ${
                          isSelected ? 'bg-[#383838] text-white font-medium' : 'hover:bg-[#343434] text-neutral-300'
                        }`}
                      >
                        <span className="w-5 flex-shrink-0 text-sm font-semibold text-white">
                          {isSelected ? '✓' : ''}
                        </span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingsMainPaneProps {
  activeCategory: SettingsCategory;
}

export const SettingsMainPane: React.FC<SettingsMainPaneProps> = ({ activeCategory }) => {
  const { preferences, updatePreferences, logout } = useSettingsStore();
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  // If in edit avatar mode, show the full YourAvatarView
  if (isEditingAvatar) {
    return <YourAvatarView onClose={() => setIsEditingAvatar(false)} />;
  }

  // Profile view (matches media_1788818855662.png)
  if (activeCategory === 'profile') {
    return <ProfileView onEditPhoto={() => setIsEditingAvatar(true)} />;
  }

  // Appearance view (matches media_1788835566724.png)
  if (activeCategory === 'appearance') {
    return <AppearanceSettingsView />;
  }

  // Privacy view
  if (activeCategory === 'privacy') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#191919] text-neutral-900 dark:text-white overflow-y-auto select-none p-8">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-6">Privacy</h2>
        <div className="max-w-md space-y-5">
          <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-[#262626]">
            <div>
              <div className="text-sm font-medium text-neutral-900 dark:text-white">Read Receipts</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                See and share when messages have been read
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.readReceipts}
              onChange={(e) => updatePreferences({ readReceipts: e.target.checked })}
              className="w-4 h-4 accent-[#2c6bed] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-[#262626]">
            <div>
              <div className="text-sm font-medium text-neutral-900 dark:text-white">Typing Indicators</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                See and share when messages are being typed
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.typingIndicators}
              onChange={(e) => updatePreferences({ typingIndicators: e.target.checked })}
              className="w-4 h-4 accent-[#2c6bed] cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  // Notifications view
  if (activeCategory === 'notifications') {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#191919] text-neutral-900 dark:text-white overflow-y-auto select-none p-8">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-6">Notifications</h2>
        <div className="max-w-md space-y-5">
          <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-[#262626]">
            <div>
              <div className="text-sm font-medium text-neutral-900 dark:text-white">Message Sounds</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Play sound for incoming and outgoing messages
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.soundEnabled}
              onChange={(e) => updatePreferences({ soundEnabled: e.target.checked })}
              className="w-4 h-4 accent-[#2c6bed] cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
};
