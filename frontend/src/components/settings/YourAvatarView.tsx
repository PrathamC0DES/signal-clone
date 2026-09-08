'use client';

import React, { useState, useRef } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { SignalIcon } from '../common/SignalIcon';
import { getSignalService } from '../../services';
import { getPresetAvatarBgColor } from '../common/Avatar';

interface YourAvatarViewProps {
  onClose: () => void;
}

const PRESET_AVATARS = [
  { id: 'avatar_abstract_01', src: '/images/avatars/avatar_abstract_01.svg' },
  { id: 'avatar_abstract_02', src: '/images/avatars/avatar_abstract_02.svg' },
  { id: 'avatar_abstract_03', src: '/images/avatars/avatar_abstract_03.svg' },
  { id: 'avatar_fox', src: '/images/avatars/avatar_fox.svg' },
  { id: 'avatar_dog', src: '/images/avatars/avatar_dog.svg' },
  { id: 'avatar_cat', src: '/images/avatars/avatar_cat.svg' },
  { id: 'avatar_tucan', src: '/images/avatars/avatar_tucan.svg' },
  { id: 'avatar_pig', src: '/images/avatars/avatar_pig.svg' },
  { id: 'avatar_dinosour', src: '/images/avatars/avatar_dinosour.svg' },
  { id: 'avatar_sloth', src: '/images/avatars/avatar_sloth.svg' },
  { id: 'avatar_incognito', src: '/images/avatars/avatar_incognito.svg' },
  { id: 'avatar_ghost', src: '/images/avatars/avatar_ghost.svg' },
];

const COLOR_OPTIONS = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7',
  '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4',
  '#10b981', '#84cc16', '#eab308', '#f97316'
];

export const YourAvatarView: React.FC<YourAvatarViewProps> = ({ onClose }) => {
  const { currentUser, updateProfile } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<'photo' | 'text'>('photo');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(
    currentUser?.avatarUrl || ''
  );
  const [customText, setCustomText] = useState<string>(
    currentUser?.displayName
      ? currentUser.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
      : 'PM'
  );
  const [selectedBgColor, setSelectedBgColor] = useState<string>('#ec4899');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCustomTextMode = activeTab === 'text';

  const handlePresetSelect = (src: string) => {
    setSelectedAvatarUrl(src);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAvatarUrl(data.url);
      } else {
        // Fallback: local data URL
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setSelectedAvatarUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Upload error:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isCustomTextMode) {
        // Clear avatarUrl so it uses text initials avatar
        await updateProfile({ avatarUrl: '' });
      } else {
        await updateProfile({ avatarUrl: selectedAvatarUrl });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save avatar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#191919] text-neutral-900 dark:text-white overflow-y-auto select-none">
      {/* Header */}
      <div className="relative h-14 px-4 flex items-center justify-between flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors"
          title="Back"
        >
          <SignalIcon name="chevron_left" className="w-5 h-5" />
        </button>

        <h1 className="text-sm font-semibold text-neutral-900 dark:text-white">Your Avatar</h1>

        <div className="w-9" /> {/* Spacer for balance */}
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-xl mx-auto px-6 flex-1 flex flex-col items-center pt-2">
        {/* Large Avatar Preview */}
        <div
          className="w-24 h-24 rounded-full overflow-hidden mb-5 border-2 border-neutral-300 dark:border-[#2b2b2b] shadow-xl flex items-center justify-center"
          style={{
            backgroundColor: isCustomTextMode
              ? selectedBgColor
              : (getPresetAvatarBgColor(selectedAvatarUrl) || 'transparent'),
          }}
        >
          {isCustomTextMode || !selectedAvatarUrl ? (
            <div
              className="w-full h-full flex items-center justify-center text-white text-3xl font-semibold tracking-wide"
              style={{ backgroundColor: selectedBgColor }}
            >
              {customText || 'PM'}
            </div>
          ) : (
            <img
              src={selectedAvatarUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover object-center"
              style={{ backgroundColor: getPresetAvatarBgColor(selectedAvatarUrl) || 'transparent' }}
            />
          )}
        </div>

        {/* Two-tab Toggle: Photo / Aa Text matching media_1788818893778.png */}
        <div className="flex items-center gap-3 mb-6">
          {/* Photo tab */}
          <button
            onClick={() => {
              setActiveTab('photo');
              if (fileInputRef.current && activeTab === 'photo') {
                fileInputRef.current.click();
              }
            }}
            className={`w-16 h-14 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all ${
              activeTab === 'photo'
                ? 'bg-neutral-200 dark:bg-[#383838] text-neutral-900 dark:text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-[#252525] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-[#2e2e2e]'
            }`}
            title="Choose Photo or Avatar"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm3.25-.75a.75.75 0 0 0-.75.75v9.5c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-9.5a.75.75 0 0 0-.75-.75H3.25Zm10 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM4.5 13.5l3.5-4.5 3 3.5 2-2.5 3 3.5h-11.5Z" clipRule="evenodd" />
            </svg>
            <span className="text-[11px] font-medium leading-none">Photo</span>
          </button>

          {/* Aa Text tab */}
          <button
            onClick={() => setActiveTab('text')}
            className={`w-16 h-14 rounded-xl flex flex-col items-center justify-center space-y-0.5 transition-all ${
              activeTab === 'text'
                ? 'bg-neutral-200 dark:bg-[#383838] text-neutral-900 dark:text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-[#252525] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-[#2e2e2e]'
            }`}
            title="Text Avatar"
          >
            <span className="text-base font-semibold leading-tight">Aa</span>
            <span className="text-[11px] font-medium leading-none">Text</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Divider */}
        <div className="w-full border-b border-neutral-200 dark:border-[#262626] mb-6" />

        {/* Photo Mode: Presets Grid matching media_1788818893778.png */}
        {activeTab === 'photo' && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Select an avatar</h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#2c6bed] hover:underline"
              >
                Upload from device
              </button>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3 justify-items-center">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedAvatarUrl === preset.src;
                const presetBg = getPresetAvatarBgColor(preset.src) || '#e5e5e5';
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.src)}
                    className={`w-12 h-12 rounded-full overflow-hidden p-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-[#2c6bed] ring-offset-2 ring-offset-white dark:ring-offset-[#191919] scale-105 shadow-md'
                        : 'hover:scale-105 opacity-90 hover:opacity-100 border border-transparent'
                    }`}
                    style={{ backgroundColor: presetBg }}
                  >
                    <img
                      src={preset.src}
                      alt={preset.id}
                      className="w-full h-full object-cover object-center rounded-full"
                      style={{ backgroundColor: presetBg }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Aa Text Mode: Initials & Colors */}
        {activeTab === 'text' && (
          <div className="w-full space-y-5">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                Initials
              </label>
              <input
                type="text"
                maxLength={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value.toUpperCase())}
                placeholder="PM"
                className="w-28 px-3 py-2 bg-neutral-100 dark:bg-[#252525] border border-neutral-300 dark:border-[#383838] rounded-xl text-sm font-semibold text-neutral-900 dark:text-white tracking-widest text-center focus:outline-none focus:border-[#2c6bed]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-2">
                Background color
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_OPTIONS.map((color) => {
                  const isSelected = selectedBgColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedBgColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full transition-all ${
                        isSelected
                          ? 'ring-2 ring-neutral-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-[#191919] scale-110'
                          : 'hover:scale-105'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions: Cancel, Save matching media_1788818893778.png */}
        <div className="w-full flex items-center justify-end space-x-3 mt-auto pt-10 pb-8">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-200 dark:bg-[#2A2A2A] hover:bg-neutral-300 dark:hover:bg-[#333333] text-neutral-900 dark:text-white rounded-full text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-[#2c6bed] hover:bg-[#255dd1] text-white rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
