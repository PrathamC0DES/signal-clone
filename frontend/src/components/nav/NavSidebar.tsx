'use client';

import React, { useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { SignalIcon } from '../common/SignalIcon';
import { CallingComingSoonModal } from '../modals/CallingComingSoonModal';
import { StoriesComingSoonModal } from '../modals/StoriesComingSoonModal';

export const NavSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    conversations,
    navTabsCollapsed,
    toggleNavTabsCollapsed,
  } = useChatStore();
  const { setSettingsModalOpen } = useSettingsStore();
  const [showCallComingSoon, setShowCallComingSoon] = useState(false);
  const [showStoriesComingSoon, setShowStoriesComingSoon] = useState(false);

  const unreadChatsCount = conversations
    .filter((c) => !c.isArchived)
    .reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <aside
      className={`w-14 flex-shrink-0 bg-[#f6f6f6] dark:bg-[#1C1C1C] border-r border-neutral-200 dark:border-transparent flex flex-col items-center pt-2 pb-3 gap-1 select-none z-20 transition-all duration-200 ${
        navTabsCollapsed ? 'hidden' : 'flex'
      }`}
    >
      {/* 1. Hamburger — plain icon, NO background box */}
      <button
        onClick={toggleNavTabsCollapsed}
        className="w-10 h-10 flex items-center justify-center text-neutral-700 dark:text-white hover:text-neutral-900 dark:hover:text-white/70 transition-colors"
        title="Hide tabs"
        aria-label="Hide tabs"
      >
        <SignalIcon name="menu" className="w-5 h-5" />
      </button>

      {/* 2. Chats Tab — small rounded rectangle when active */}
      <button
        onClick={() => setActiveTab('chats')}
        className={
          'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ' +
          (activeTab === 'chats'
            ? 'bg-neutral-200 dark:bg-[#2A2A2A] text-neutral-900 dark:text-white'
            : 'text-neutral-900 dark:text-white hover:bg-neutral-200/60 dark:hover:bg-[#252525]')
        }
        title="Chats"
      >
        <SignalIcon
          name={activeTab === 'chats' ? 'chat_fill' : 'chat'}
          className="w-5 h-5"
        />
        {unreadChatsCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[#f6f6f6] dark:border-[#1C1C1C]">
            {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
          </span>
        )}
      </button>

      {/* 3. Calls Button — matches media_1788822692149.png */}
      <button
        onClick={() => setShowCallComingSoon(true)}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-900 dark:text-white hover:bg-neutral-200/60 dark:hover:bg-[#252525] transition-all"
        title="Calls"
      >
        <SignalIcon name="phone" className="w-5 h-5" />
      </button>

      {/* 4. Stories Button — matches media_1788822692149.png */}
      <button
        onClick={() => setShowStoriesComingSoon(true)}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-900 dark:text-white hover:bg-neutral-200/60 dark:hover:bg-[#252525] transition-all cursor-pointer"
        title="Stories"
      >
        <SignalIcon name="stories" className="w-5 h-5" />
      </button>

      {/* 5. Spacer pushes settings to bottom */}
      <div className="flex-1" />

      {/* Calling Coming Soon Modal */}
      <CallingComingSoonModal
        isOpen={showCallComingSoon}
        onClose={() => setShowCallComingSoon(false)}
        callType="general"
      />

      {/* Stories Coming Soon Modal */}
      <StoriesComingSoonModal
        isOpen={showStoriesComingSoon}
        onClose={() => setShowStoriesComingSoon(false)}
      />

      {/* 4. Settings — highlighted rounded box when active matching media_1788818855662.png */}
      <button
        onClick={() => setActiveTab(activeTab === 'settings' ? 'chats' : 'settings')}
        className={
          'w-10 h-10 rounded-xl flex items-center justify-center transition-all ' +
          (activeTab === 'settings'
            ? 'bg-neutral-200 dark:bg-[#2A2A2A] text-neutral-900 dark:text-white'
            : 'text-neutral-600 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-[#252525]')
        }
        title="Settings"
      >
        <SignalIcon name="settings" className="w-5 h-5" />
      </button>
    </aside>
  );
};
