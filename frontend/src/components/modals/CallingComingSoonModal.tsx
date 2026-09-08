'use client';

import React from 'react';
import { SignalIcon } from '../common/SignalIcon';

interface CallingComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  callType?: 'voice' | 'video' | 'general';
}

export const CallingComingSoonModal: React.FC<CallingComingSoonModalProps> = ({
  isOpen,
  onClose,
  callType = 'general',
}) => {
  if (!isOpen) return null;

  const title =
    callType === 'video'
      ? 'Video Calling Coming Soon'
      : callType === 'voice'
      ? 'Voice Calling Coming Soon'
      : 'Calling Coming Soon';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-[#242424] border border-neutral-200 dark:border-[#383838] rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#333333] hover:bg-neutral-200 dark:hover:bg-[#404040] text-neutral-500 dark:text-neutral-300 flex items-center justify-center text-xs transition-colors"
          title="Close"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-[#2c6bed]/15 text-[#2c6bed] flex items-center justify-center mb-4">
          <SignalIcon
            name={callType === 'video' ? 'video' : 'phone'}
            className="w-8 h-8"
          />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed px-2">
          End-to-end encrypted voice and video calling are currently under active development and will be available in an upcoming update.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#2c6bed] hover:bg-[#2058c7] text-white text-xs font-semibold rounded-full transition-colors shadow-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
