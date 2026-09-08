'use client';

import React, { useState } from 'react';
import { User } from '../../types';
import { SignalIcon } from '../common/SignalIcon';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface SafetyNumberModalProps {
  contact: User;
  onClose: () => void;
}

export const SafetyNumberModal: React.FC<SafetyNumberModalProps> = ({ contact, onClose }) => {
  const [isVerified, setIsVerified] = useState(contact.isVerified || false);
  const { updateProfile } = useSettingsStore();

  const handleToggleVerified = () => {
    setIsVerified(!isVerified);
  };

  // Format safety number in 12 blocks of 5 digits
  const blocks = contact.safetyNumber ? contact.safetyNumber.split(' ') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm select-none">
      <div className="bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-[#333333] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-[#2b2b2b] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[#2c6bed]">
              <SignalIcon name="safety_number" className="w-5 h-5" />
            </span>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Verify Safety Number</h3>
          </div>

          <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
            <SignalIcon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-xs text-neutral-600 dark:text-neutral-300 text-center mb-4 leading-relaxed">
            If you wish to verify the security of your end-to-end encryption with{' '}
            <strong className="text-neutral-900 dark:text-white">{contact.displayName}</strong>, compare the numbers above
            with the numbers on their device or scan the QR code.
          </p>

          {/* QR Code graphic */}
          <div className="p-4 bg-white rounded-xl shadow-lg mb-6 flex flex-col items-center">
            <div className="w-44 h-44 bg-neutral-900 flex items-center justify-center rounded p-2 text-white text-center text-xs font-mono">
              <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-white">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${
                      (i * 7 + 3) % 2 === 0 ? 'bg-black' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-neutral-600 font-mono mt-2 uppercase tracking-widest font-semibold">
              Signal Cryptographic Identity
            </span>
          </div>

          {/* Safety Number Grid */}
          <div className="w-full bg-neutral-100 dark:bg-[#161616] border border-neutral-200 dark:border-[#2b2b2b] rounded-xl p-3 mb-5 font-mono text-xs text-neutral-800 dark:text-neutral-200">
            <div className="grid grid-cols-3 gap-2 text-center tracking-widest font-semibold">
              {blocks.map((block, idx) => (
                <span key={idx} className="bg-neutral-200 dark:bg-[#222222] py-1 px-1.5 rounded">
                  {block}
                </span>
              ))}
            </div>
          </div>

          {/* Verification Switch Button */}
          <button
            onClick={handleToggleVerified}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
              isVerified
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-[#2c6bed] text-white hover:bg-[#255dd1]'
            }`}
          >
            <SignalIcon name="check" className="w-4 h-4" />
            <span>{isVerified ? 'Marked as Verified' : 'Mark as Verified'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
