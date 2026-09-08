'use client';

import React, { useState } from 'react';
import { SignalIcon } from '../common/SignalIcon';
import { Avatar } from '../common/Avatar';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { currentUser, preferences, updatePreferences, updateProfile, logout } = useSettingsStore();
  const [activeCategory, setActiveCategory] = useState<'profile' | 'appearance' | 'privacy' | 'devices'>('profile');
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [about, setAbout] = useState(currentUser?.about || '');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async () => {
    await updateProfile({ displayName, about });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm select-none">
      <div className="bg-[#1e1e1e] border border-[#333333] rounded-2xl w-full max-w-2xl h-[520px] flex overflow-hidden shadow-2xl">
        {/* Left Navigation Tabs */}
        <div className="w-48 bg-[#181818] border-r border-[#262626] p-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Preferences
            </div>

            {[
              { id: 'profile', label: 'Profile' },
              { id: 'appearance', label: 'Appearance' },
              { id: 'privacy', label: 'Privacy' },
              { id: 'devices', label: 'Linked Devices' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id as any)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2.5 transition-colors ${
                  activeCategory === item.id
                    ? 'bg-[#2c6bed] text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-[#222222]'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Log Out Button */}
          <div className="pt-3 border-t border-[#262626]">
            {showLogoutConfirm ? (
              <div className="space-y-1.5 p-2 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                <div className="text-[11px] font-semibold text-red-400">Log out of Signal?</div>
                <div className="flex space-x-1">
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-1 rounded-lg transition-colors"
                  >
                    Log Out
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 bg-[#282828] hover:bg-[#333333] text-neutral-300 text-[11px] py-1 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center justify-between group"
              >
                <span>Log Out</span>
                <span className="text-[10px] opacity-70 group-hover:opacity-100">🚪</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
          {/* Header */}
          <div className="p-4 border-b border-[#262626] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white capitalize">{activeCategory}</h2>
            <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-white transition-colors">
              <SignalIcon name="x" className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 overflow-y-auto text-xs text-neutral-200">
            {/* Profile Tab */}
            {activeCategory === 'profile' && (
              <div className="space-y-4 max-w-md">
                <div className="flex items-center space-x-4">
                  <Avatar
                    name={displayName || 'User'}
                    src={currentUser?.avatarUrl}
                    size="xl"
                  />
                  <div>
                    <h3 className="font-semibold text-white text-base">{currentUser?.displayName}</h3>
                    <p className="text-neutral-400 text-xs">{currentUser?.phoneNumber}</p>
                    {currentUser?.username && (
                      <p className="text-[#2c6bed] text-xs">@{currentUser.username}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#282828] border border-[#383838] rounded-xl text-white text-xs focus:outline-none focus:border-[#2c6bed] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">About</label>
                  <input
                    type="text"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Available"
                    className="w-full px-3 py-2 bg-[#282828] border border-[#383838] rounded-xl text-white text-xs focus:outline-none focus:border-[#2c6bed] transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={handleSaveProfile}
                    className="bg-[#2c6bed] hover:bg-[#255bd1] text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#2c6bed]/20"
                  >
                    Save Changes
                  </button>
                  {savedSuccess && (
                    <span className="text-emerald-400 font-medium">✓ Profile saved!</span>
                  )}
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeCategory === 'appearance' && (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-neutral-400 mb-2 font-medium">Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updatePreferences({ theme: 'dark' })}
                      className={`p-3 rounded-xl border text-center font-medium transition-all ${
                        preferences.theme === 'dark'
                          ? 'border-[#2c6bed] bg-[#2c6bed]/15 text-white'
                          : 'border-[#333333] bg-[#242424] text-neutral-400 hover:text-white'
                      }`}
                    >
                      🌙 Dark (Signal Default)
                    </button>
                    <button
                      onClick={() => updatePreferences({ theme: 'light' })}
                      className={`p-3 rounded-xl border text-center font-medium transition-all ${
                        preferences.theme === 'light'
                          ? 'border-[#2c6bed] bg-[#2c6bed]/15 text-white'
                          : 'border-[#333333] bg-[#242424] text-neutral-400 hover:text-white'
                      }`}
                    >
                      ☀️ Light
                    </button>
                  </div>
                </div>

                <div className="border-t border-[#2a2a2a] pt-3">
                  <label className="flex items-center justify-between cursor-pointer py-1">
                    <div>
                      <div className="font-semibold text-white">Compact Mode</div>
                      <div className="text-neutral-400 text-[11px]">
                        Reduce chat row heights for dense displays
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.compactMode}
                      onChange={(e) => updatePreferences({ compactMode: e.target.checked })}
                      className="accent-[#2c6bed] w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeCategory === 'privacy' && (
              <div className="space-y-4 max-w-md">
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <div className="font-semibold text-white">Read Receipts</div>
                    <div className="text-neutral-400 text-[11px]">
                      See and share when messages have been read
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.readReceipts}
                    onChange={(e) => updatePreferences({ readReceipts: e.target.checked })}
                    className="accent-[#2c6bed] w-4 h-4 cursor-pointer"
                  />
                </label>

                <div className="border-t border-[#2a2a2a]" />

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <div className="font-semibold text-white">Typing Indicators</div>
                    <div className="text-neutral-400 text-[11px]">
                      See and share when messages are being typed
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.typingIndicators}
                    onChange={(e) => updatePreferences({ typingIndicators: e.target.checked })}
                    className="accent-[#2c6bed] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            )}

            {/* Linked Devices Tab */}
            {activeCategory === 'devices' && (
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-16 h-16 bg-[#262626] rounded-2xl flex items-center justify-center mb-4">
                  <SignalIcon name="phone" className="w-8 h-8 text-[#2c6bed]" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-1">Signal Web Client</h3>
                <p className="text-neutral-400 text-xs max-w-sm mb-4">
                  This browser is authenticated as an active desktop client session. All communications are private and secure.
                </p>
                <div className="bg-[#242424] border border-[#333333] px-3.5 py-2 rounded-xl text-neutral-300 font-mono text-xs">
                  Active Session ID: {currentUser?.id || 'Connected'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
