'use client';

import React, { useEffect, useState } from 'react';
import { NavSidebar } from '../components/nav/NavSidebar';
import { LeftPane } from '../components/sidebar/LeftPane';
import { ConversationView } from '../components/chat/ConversationView';
import { ConversationDetailsDrawer } from '../components/drawer/ConversationDetailsDrawer';
import { SettingsModal } from '../components/modals/SettingsModal';
import { SafetyNumberModal } from '../components/modals/SafetyNumberModal';
import { AuthScreen } from '../components/auth/AuthScreen';
import { useChatStore } from '../stores/useChatStore';
import { useSettingsStore } from '../stores/useSettingsStore';

import { SettingsLeftPane, SettingsCategory } from '../components/settings/SettingsLeftPane';
import { SettingsMainPane } from '../components/settings/SettingsMainPane';
import { SignalIcon } from '../components/common/SignalIcon';

export default function SignalWebApp() {
  const {
    conversations,
    activeConversationId,
    activeTab,
    isRightDrawerOpen,
    setRightDrawerOpen,
    initialize: initChat,
    toggleNavTabsCollapsed,
    toastMessage,
  } = useChatStore();

  const {
    isAuthenticated,
    isAuthLoading,
    initialize: initSettings,
    isSettingsModalOpen,
    setSettingsModalOpen,
    isNewChatModalOpen,
    setNewChatModalOpen,
    isSafetyNumberModalOpen,
    closeSafetyNumberModal,
    selectedContactForSafetyNumber,
  } = useSettingsStore();

  const [mounted, setMounted] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>('profile');
  const [sidebarWidth, setSidebarWidth] = useState<number>(320);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('signal_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 64 && parsed <= 500) {
          setSidebarWidth(parsed);
        }
      }
    }
  }, []);

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      let newWidth = startWidth + delta;
      if (newWidth < 120) {
        newWidth = 72; // Snap to compact avatar-only mode
      } else if (newWidth > 480) {
        newWidth = 480;
      }
      setSidebarWidth(newWidth);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setIsDragging(false);

      const delta = upEvent.clientX - startX;
      let finalWidth = startWidth + delta;
      if (finalWidth < 120) {
        finalWidth = 72;
      } else if (finalWidth > 480) {
        finalWidth = 480;
      }
      setSidebarWidth(finalWidth);
      if (typeof window !== 'undefined') {
        localStorage.setItem('signal_sidebar_width', String(finalWidth));
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleDoubleClickResizer = () => {
    const nextWidth = sidebarWidth < 160 ? 320 : 72;
    setSidebarWidth(nextWidth);
    if (typeof window !== 'undefined') {
      localStorage.setItem('signal_sidebar_width', String(nextWidth));
    }
  };

  useEffect(() => {
    setMounted(true);
    initSettings();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') || (e.altKey && e.key.toLowerCase() === 't')) {
        e.preventDefault();
        toggleNavTabsCollapsed();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initSettings, toggleNavTabsCollapsed]);

  useEffect(() => {
    if (isAuthenticated) {
      initChat();
    }
  }, [isAuthenticated, initChat]);

  // Prevent hydration mismatch during initial SSR
  if (!mounted || isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#121212] select-none">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-[#2c6bed] rounded-3xl flex items-center justify-center animate-pulse shadow-lg shadow-[#2c6bed]/30 mb-3">
            <svg viewBox="0 0 20 20" fill="white" className="w-10 h-10">
              <path d="M1.563 10a8.437 8.437 0 1 1 4.57 7.5l-3.386 1.22c-.912.328-1.795-.554-1.466-1.467l1.218-3.385A8.404 8.404 0 0 1 1.563 10ZM10 3.02a6.98 6.98 0 0 0-6.154 10.275c.15.28.186.622.071.94l-1.04 2.887 2.888-1.04c.318-.114.66-.078.94.072A6.98 6.98 0 1 0 10 3.021Z" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-neutral-400">Signal</span>
        </div>
      </div>
    );
  }

  // 1. If not authenticated, render the Signal Onboarding / Login / OTP Screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // 2. If authenticated, render full Signal Messenger interface
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 antialiased font-sans select-none">
      {/* 1. Left Navigation Bar */}
      <NavSidebar />

      {/* 2. Conversations List & Search OR Settings Left Pane */}
      {activeTab === 'settings' ? (
        <SettingsLeftPane
          width={sidebarWidth}
          activeCategory={settingsCategory}
          onSelectCategory={setSettingsCategory}
        />
      ) : (
        <LeftPane width={sidebarWidth} />
      )}

      {/* Draggable Resizer Divider between Left Pane and Chat */}
      <div
        onMouseDown={handleStartResize}
        onDoubleClick={handleDoubleClickResizer}
        className="w-2 -ml-1 flex-shrink-0 cursor-col-resize z-20 relative select-none flex items-center justify-center bg-transparent"
        title="Drag to resize, double-click to collapse/expand"
      >
        <div
          className={`w-[1px] h-full transition-colors ${
            isDragging
              ? 'bg-neutral-400 dark:bg-[#777777] w-[2px]'
              : 'bg-neutral-200 dark:bg-[#262626]'
          }`}
        />
      </div>

      {/* 3. Main Window OR Settings Main Pane */}
      {activeTab === 'settings' ? (
        <SettingsMainPane activeCategory={settingsCategory} />
      ) : activeConversation ? (
        <ConversationView conversation={activeConversation} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#121212] text-neutral-500 text-sm">
          <img src="/images/signal-logo.svg" alt="Signal" className="w-20 h-20 opacity-30 mb-4" />
          <p className="font-semibold text-neutral-600 dark:text-neutral-400">Signal for Web</p>
          <p className="text-xs text-neutral-500 mt-1">Select a conversation to begin messaging</p>
        </div>
      )}

      {/* 4. Collapsible Right Contact/Group Details Drawer */}
      {isRightDrawerOpen && activeConversation && (
        <ConversationDetailsDrawer
          conversation={activeConversation}
          onClose={() => setRightDrawerOpen(false)}
        />
      )}

      {/* Global Modals & Call Overlay */}
      {isSettingsModalOpen && <SettingsModal onClose={() => setSettingsModalOpen(false)} />}
      {isSafetyNumberModalOpen && selectedContactForSafetyNumber && (
        <SafetyNumberModal
          contact={selectedContactForSafetyNumber}
          onClose={closeSafetyNumberModal}
        />
      )}

      {/* Global In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#202020] text-white text-xs font-medium px-4 py-2 rounded-full shadow-2xl border border-neutral-700 z-50 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
          <SignalIcon name="check" className="w-3.5 h-3.5 text-[#2c6bed]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
