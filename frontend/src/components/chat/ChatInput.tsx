'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SignalIcon } from '../common/SignalIcon';
import { useChatStore } from '../../stores/useChatStore';
import { SignalEmojiPicker } from './SignalEmojiPicker';
import { CreatePollModal } from '../modals/CreatePollModal';

export const ChatInput: React.FC = () => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const {
    sendMessage,
    replyingToMessage,
    setReplyingToMessage,
    setTyping,
    activeConversationId,
    editingMessage,
    setEditingMessage,
    editMessage,
    isSelectionMode,
    selectedMessageIds,
    exitSelectionMode,
    deleteSelectedMessages,
    conversations,
    forwardMessage,
    toggleBlockConversation,
    showToast,
  } = useChatStore();

  const [editText, setEditText] = useState('');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardSearch, setForwardSearch] = useState('');

  useEffect(() => {
    if (editingMessage) {
      setEditText(editingMessage.content);
    }
  }, [editingMessage]);

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return;
    await editMessage(editingMessage.id, editText.trim());
    setEditingMessage(null);
  };

  useEffect(() => {
    return () => {
      if (isTypingRef.current && activeConversationId) {
        setTyping(activeConversationId, false);
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeConversationId, setTyping]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    if (!activeConversationId) return;

    if (val.trim().length > 0) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        setTyping(activeConversationId, true);
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(activeConversationId, false);
        isTypingRef.current = false;
      }, 3000);
    } else {
      if (isTypingRef.current) {
        setTyping(activeConversationId, false);
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (text.trim()) {
      sendMessage(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      if (activeConversationId) {
        setTyping(activeConversationId, false);
        isTypingRef.current = false;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      sendMessage(`Sent file: ${files[0].name}`, Array.from(files));
      setShowAttachmentMenu(false);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      sendMessage(`Sent media: ${files[0].name}`, Array.from(files));
      setShowAttachmentMenu(false);
    }
  };

  const currentConversation = conversations.find((c) => c.id === activeConversationId);
  if (currentConversation?.isBlocked) {
    return (
      <div className="bg-white dark:bg-[#191919] border-t border-neutral-100 dark:border-transparent px-4 py-4 flex items-center justify-center space-x-3 select-none">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          You have blocked this contact.
        </span>
        <button
          onClick={() => toggleBlockConversation(currentConversation.id)}
          className="text-sm font-semibold text-[#2c6bed] hover:underline cursor-pointer"
        >
          Unblock
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#191919] border-t border-neutral-100 dark:border-transparent px-4 py-2.5 flex flex-col relative select-none">
      {/* Replying Banner if active */}
      {!isSelectionMode && !editingMessage && replyingToMessage && (
        <div className="flex items-center justify-between bg-neutral-100 dark:bg-[#1f1f1f] border-l-4 border-[#135bef] px-3 py-1.5 rounded-r-md mb-2 text-xs">
          <div className="flex flex-col truncate pr-2">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Replying to {replyingToMessage.replyTo?.senderName || 'Message'}
            </span>
            <span className="text-neutral-500 dark:text-neutral-400 truncate">{replyingToMessage.content}</span>
          </div>

          <button
            onClick={() => setReplyingToMessage(null)}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1"
          >
            <SignalIcon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
          <div className="absolute bottom-full left-4 mb-2 z-40">
            <SignalEmojiPicker
              onSelectEmoji={(emoji) => {
                if (editingMessage) {
                  setEditText((prev) => prev + emoji);
                } else {
                  setText((prev) => prev + emoji);
                }
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        </>
      )}

      {/* Attachment Menu Popover (matches media_1788834807872.png) */}
      {showAttachmentMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowAttachmentMenu(false)} />
          <div className="absolute bottom-full right-3 mb-3 z-40 bg-[#282828] border border-[#3e3e3e] rounded-[20px] p-1.5 shadow-2xl min-w-[195px] flex flex-col space-y-0.5 text-white animate-in fade-in zoom-in-95 duration-100 select-none">
            <button
              onClick={() => {
                setShowAttachmentMenu(false);
                mediaInputRef.current?.click();
              }}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#383838] transition-colors w-full text-left text-[14px] font-medium cursor-pointer text-white"
            >
              <SignalIcon name="album" className="w-[18px] h-[18px] text-white flex-shrink-0" />
              <span>Photos &amp; videos</span>
            </button>
            <button
              onClick={() => {
                setShowAttachmentMenu(false);
                fileInputRef.current?.click();
              }}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#383838] transition-colors w-full text-left text-[14px] font-medium cursor-pointer text-white"
            >
              <SignalIcon name="file" className="w-[18px] h-[18px] text-white flex-shrink-0" />
              <span>File</span>
            </button>
            <button
              onClick={() => {
                setShowAttachmentMenu(false);
                setShowCreatePollModal(true);
              }}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-[#383838] transition-colors w-full text-left text-[14px] font-medium cursor-pointer text-white"
            >
              <SignalIcon name="poll" className="w-[18px] h-[18px] text-white flex-shrink-0" />
              <span>Poll</span>
            </button>

            {/* Downward triangle caret pointing to + button */}
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-[#282828] border-r border-b border-[#3e3e3e] rotate-45" />
          </div>
        </>
      )}

      {/* 1. SELECTION MODE BAR */}
      {isSelectionMode ? (
        <div className="flex items-center justify-between w-full py-1 text-white select-none">
          <div className="flex items-center space-x-3">
            <button
              onClick={exitSelectionMode}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close"
            >
              <SignalIcon name="x" className="w-5 h-5" />
            </button>
            <span className="text-sm font-normal text-white">{selectedMessageIds.length} selected</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={deleteSelectedMessages}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Delete selected"
            >
              <SignalIcon name="trash" className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowForwardModal(true)}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Forward selected"
            >
              <SignalIcon name="forward" className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : editingMessage ? (
        /* 2. EDIT MESSAGE BAR */
        <div className="flex items-center space-x-2 w-full">
          {/* Left: Emoji Icon */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-neutral-700 dark:text-white hover:opacity-80 transition-opacity rounded-full"
            title="Emoji"
          >
            <SignalIcon name="emoji" className="w-5 h-5" />
          </button>

          {/* Center: Edit capsule */}
          <div className="flex-1 flex flex-col justify-center bg-[#2e2e2e] dark:bg-[#2e2e2e] rounded-2xl px-4 py-2 relative min-h-[56px]">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-white mb-0.5 select-none">
              <SignalIcon name="edit" className="w-3.5 h-3.5 text-white" />
              <span>Edit message</span>
            </div>

            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  setEditingMessage(null);
                }
              }}
              rows={1}
              className="w-full bg-transparent text-sm text-white placeholder-neutral-400 focus:outline-none resize-none leading-normal select-text pr-20"
              autoFocus
            />

            {/* Action buttons on right: Cancel and Save */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              <button
                onClick={() => setEditingMessage(null)}
                className="w-7 h-7 rounded-full bg-[#484848] hover:bg-[#585858] flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Cancel"
              >
                <SignalIcon name="x" className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveEdit}
                className="w-7 h-7 rounded-full bg-[#135bef] hover:bg-[#0f4ac4] flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Save"
              >
                <SignalIcon name="check" className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3. NORMAL MESSAGE INPUT BAR */
        <div className="flex items-center space-x-3 w-full">
          {/* Center: Message Pill Container */}
          <div className="flex-1 flex items-center bg-[#f0f0f0] dark:bg-[#28292a] rounded-full px-4 py-2 border border-transparent focus-within:border-neutral-300 dark:focus-within:border-[#383a3c] transition-colors min-h-[42px]">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Signal message"
              rows={1}
              className="w-full bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none resize-none max-h-24 leading-normal select-text"
            />
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleMediaUpload}
          />

          {/* Right Action Icons: Mic (non-recording clickable) or Send */}
          {text.trim() ? (
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-full bg-[#2c6bed] hover:bg-[#255bd1] text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
              title="Send"
            >
              <SignalIcon name="send" className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                showToast('Voice message recording is not available.');
              }}
              className="p-2 text-neutral-300 hover:text-white transition-colors rounded-full cursor-pointer"
              title="Voice Message"
            >
              <SignalIcon name="mic" className="w-6 h-6" />
            </button>
          )}

          {/* Right Action Icon: Plus Button for Attachment Popover */}
          <button
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="w-10 h-10 rounded-full bg-[#2e3032] hover:bg-[#383a3c] text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Add attachment"
          >
            <SignalIcon name="plus" className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#242424] border border-[#383838] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl text-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#333333]">
              <h3 className="font-semibold text-base">Forward message</h3>
              <button
                onClick={() => setShowForwardModal(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <SignalIcon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-[#333333]">
              <div className="flex items-center space-x-2 bg-[#1c1c1c] px-3 py-2 rounded-xl border border-[#333333]">
                <SignalIcon name="search" className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search contacts or groups..."
                  value={forwardSearch}
                  onChange={(e) => setForwardSearch(e.target.value)}
                  className="bg-transparent text-sm w-full outline-none text-white placeholder-neutral-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {conversations
                .filter((c) =>
                  c.name.toLowerCase().includes(forwardSearch.toLowerCase())
                )
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#303030] transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <span className="text-sm font-medium truncate">{c.name}</span>
                    </div>

                    <button
                      onClick={async () => {
                        const { messages, activeConversationId } = useChatStore.getState();
                        const selectedMsgs = (messages[activeConversationId || ''] || []).filter((m) =>
                          selectedMessageIds.includes(m.id)
                        );
                        for (const m of selectedMsgs) {
                          await forwardMessage(c.id, m.content);
                        }
                        setShowForwardModal(false);
                        exitSelectionMode();
                      }}
                      className="px-3 py-1 bg-[#135bef] hover:bg-[#0f4ac4] text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 ml-2"
                    >
                      Send
                    </button>
                  </div>
                ))}
            </div>

            <div className="p-3 border-t border-[#333333] flex justify-end">
              <button
                onClick={() => setShowForwardModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#333333] hover:bg-[#3f3f3f] text-sm text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={showCreatePollModal}
        onClose={() => setShowCreatePollModal(false)}
      />
    </div>
  );
};
