'use client';

import React from 'react';
import { SignalIcon } from '../common/SignalIcon';

interface StoriesComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoriesComingSoonModal: React.FC<StoriesComingSoonModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-[#242424] border border-neutral-200 dark:border-[#383838] rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center relative text-neutral-900 dark:text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-neutral-100 dark:bg-[#333333] hover:bg-neutral-200 dark:hover:bg-[#404040] text-neutral-500 dark:text-neutral-300 flex items-center justify-center text-xs transition-colors cursor-pointer"
          title="Close"
        >
          ✕
        </button>

        {/* Stories Icon Circle with gradient ring */}
        <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#2c6bed] via-[#7b42f6] to-[#ec4899] mb-4 shadow-lg shadow-[#2c6bed]/20">
          <div className="w-full h-full rounded-full bg-white dark:bg-[#242424] flex items-center justify-center text-[#2c6bed]">
            <SignalIcon name="stories" className="w-8 h-8" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Stories Coming Soon
        </h3>

        {/* Description */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed px-2">
          End-to-end encrypted stories are currently under active development. Soon you will be able to share ephemeral photos, videos, and updates that disappear after 24 hours.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#2c6bed] hover:bg-[#2058c7] text-white text-xs font-semibold rounded-full transition-colors shadow-sm cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
