'use client';

import React, { useState } from 'react';
import { SignalIcon } from '../common/SignalIcon';

interface NotificationProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  enabled: boolean;
}

export const NotificationProfilesModal: React.FC<NotificationProfilesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [profiles, setProfiles] = useState<ProfileItem[]>([
    {
      id: 'focus',
      name: 'Focus',
      desc: 'Silence all non-urgent notifications during work hours.',
      icon: '💼',
      enabled: false,
    },
    {
      id: 'sleep',
      name: 'Sleep',
      desc: 'Only allow calls from favorite contacts when asleep.',
      icon: '🌙',
      enabled: false,
    },
    {
      id: 'custom',
      name: 'Quiet Hours',
      desc: 'Block group notifications after 10 PM.',
      icon: '🧘',
      enabled: false,
    },
  ]);

  if (!isOpen) return null;

  const toggleProfile = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-[#242424] border border-neutral-200 dark:border-[#383838] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-neutral-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-[#333333]">
          <div className="flex items-center space-x-2.5">
            <SignalIcon name="moon" className="w-5 h-5 text-[#2c6bed]" />
            <h3 className="text-base font-semibold">Notification profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#333333] transition-colors cursor-pointer"
          >
            <SignalIcon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Create profiles to control which notifications you receive and when. Only people and groups you allow will be able to notify you.
          </p>

          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-neutral-100/70 dark:bg-[#1c1c1c] border border-neutral-200 dark:border-[#333333]"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-xl mt-0.5">{profile.icon}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {profile.name}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                      {profile.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleProfile(profile.id)}
                  className={
                    'w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ' +
                    (profile.enabled ? 'bg-[#2c6bed]' : 'bg-neutral-300 dark:bg-[#404040]')
                  }
                >
                  <span
                    className={
                      'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ' +
                      (profile.enabled ? 'left-5' : 'left-0.5')
                    }
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-[#333333] flex items-center justify-end bg-neutral-50/50 dark:bg-[#1f1f1f]/50">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2c6bed] hover:bg-[#2058c7] text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
