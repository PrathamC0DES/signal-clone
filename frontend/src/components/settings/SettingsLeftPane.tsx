'use client';

import React, { useEffect } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useChatStore } from '../../stores/useChatStore';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';

export type SettingsCategory =
  | 'profile'
  | 'privacy'
  | 'appearance'
  | 'notifications';

interface SettingsLeftPaneProps {
  activeCategory: SettingsCategory;
  onSelectCategory: (category: SettingsCategory) => void;
  width?: number;
}

export const SettingsLeftPane: React.FC<SettingsLeftPaneProps> = ({
  activeCategory,
  onSelectCategory,
  width = 320,
}) => {
  const { currentUser } = useSettingsStore();
  const { navTabsCollapsed, toggleNavTabsCollapsed, setActiveTab } = useChatStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTab('chats');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  const navItems: Array<{ id: SettingsCategory; label: string; icon: React.ReactNode }> = [
    { id: 'privacy', label: 'Privacy', icon: <SignalIcon name="lock" className="w-5 h-5" /> },
    { id: 'appearance', label: 'Appearance', icon: <SignalIcon name="appearance" className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <SignalIcon name="bell" className="w-5 h-5" /> },
  ];

  return (
    <aside
      style={{ width: `${Math.max(width, 240)}px` }}
      className="flex-shrink-0 bg-white dark:bg-[#191919] border-r border-neutral-200 dark:border-[#262626] flex flex-col h-full select-none"
    >
      {/* Header */}
      <div className="h-14 px-4 flex items-center space-x-2">
        {navTabsCollapsed && (
          <button
            onClick={toggleNavTabsCollapsed}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors"
            title="Show tabs"
            aria-label="Show tabs"
          >
            <SignalIcon name="menu" className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white tracking-tight">Settings</h1>
      </div>

      <div className="px-3 py-1 flex-1 overflow-y-auto space-y-1">
        {/* User Profile Card matching media_1788818855662.png */}
        <div
          onClick={() => onSelectCategory('profile')}
          className={`p-3 rounded-2xl flex items-center space-x-3 cursor-pointer transition-colors ${
            activeCategory === 'profile'
              ? 'bg-neutral-100 dark:bg-[#2A2A2A] text-neutral-900 dark:text-white'
              : 'hover:bg-neutral-100 dark:hover:bg-[#242424] text-neutral-700 dark:text-neutral-200'
          }`}
        >
          <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
            <Avatar
              name={currentUser?.displayName || 'User'}
              src={currentUser?.avatarUrl}
              size="md"
              className="w-full h-full text-base font-semibold"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
              {currentUser?.displayName || 'Signal User'}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              {currentUser?.phoneNumber || 'No phone number'}
            </div>
          </div>
        </div>

        {/* Space between profile card and navigation list */}
        <div className="pt-2 space-y-0.5">
          {navItems.map((item) => {
            const isSelected = activeCategory === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectCategory(item.id)}
                className={`w-full flex items-center space-x-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-neutral-100 dark:bg-[#2A2A2A] text-neutral-900 dark:text-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#222222]'
                }`}
              >
                <span className={isSelected ? 'text-[#2c6bed] dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sign Out Button at Bottom of Settings */}
      <div className="p-3 border-t border-neutral-200 dark:border-[#262626]">
        <button
          onClick={async () => {
            const { logout } = useSettingsStore.getState();
            const { setActiveTab } = useChatStore.getState();
            await logout();
            setActiveTab('chats');
          }}
          className="w-full flex items-center space-x-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left text-red-500 hover:bg-red-500/10 cursor-pointer"
        >
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};
