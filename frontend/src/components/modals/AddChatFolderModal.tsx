'use client';

import React, { useState } from 'react';
import { SignalIcon } from '../common/SignalIcon';
import { useChatStore } from '../../stores/useChatStore';
import { Avatar } from '../common/Avatar';

interface AddChatFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddChatFolderModal: React.FC<AddChatFolderModalProps> = ({ isOpen, onClose }) => {
  const { conversations } = useChatStore();
  const [folderName, setFolderName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!folderName.trim()) return;
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-[#242424] border border-neutral-200 dark:border-[#383838] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-neutral-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-[#333333]">
          <div className="flex items-center space-x-2.5">
            <SignalIcon name="folder_plus" className="w-5 h-5 text-[#2c6bed]" />
            <h3 className="text-base font-semibold">Add chat folder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#333333] transition-colors cursor-pointer"
          >
            <SignalIcon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              placeholder="e.g. Work, Family, Friends"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-[#1a1a1a] border border-neutral-200 dark:border-[#3a3a3a] rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-white outline-none focus:border-[#2c6bed]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
              Include chats ({selectedIds.length} selected)
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {conversations.map((conv) => {
                const isSelected = selectedIds.includes(conv.id);
                return (
                  <div
                    key={conv.id}
                    onClick={() => toggleSelect(conv.id)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#2c2c2c] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <Avatar
                        name={conv.name}
                        src={conv.avatarUrl}
                        size="sm"
                        isGroup={conv.type === 'group'}
                        className="w-8 h-8 flex-shrink-0"
                      />
                      <span className="text-sm font-medium truncate">{conv.name}</span>
                    </div>

                    <div
                      className={
                        'w-5 h-5 rounded-md border flex items-center justify-center transition-colors ' +
                        (isSelected
                          ? 'bg-[#2c6bed] border-[#2c6bed] text-white'
                          : 'border-neutral-400 dark:border-[#555555]')
                      }
                    >
                      {isSelected && <SignalIcon name="check" className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {successToast && (
            <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium text-center">
              Chat folder created successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-[#333333] flex items-center justify-end space-x-2.5 bg-neutral-50/50 dark:bg-[#1f1f1f]/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#333333] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!folderName.trim()}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2c6bed] hover:bg-[#2058c7] disabled:opacity-50 text-white transition-colors cursor-pointer"
          >
            Create folder
          </button>
        </div>
      </div>
    </div>
  );
};
