'use client';

import React, { useState } from 'react';
import { SignalIcon } from '../common/SignalIcon';
import { useChatStore } from '../../stores/useChatStore';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(true);

  const { sendPoll } = useChatStore();

  if (!isOpen) return null;

  const handleOptionChange = (index: number, value: string) => {
    const nextOptions = [...options];
    nextOptions[index] = value;

    // Automatically add a new option field if user starts typing in the last field (max 10)
    if (index === nextOptions.length - 1 && value.trim() !== '' && nextOptions.length < 10) {
      nextOptions.push('');
    }

    setOptions(nextOptions);
  };

  const handleSend = async () => {
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;

    await sendPoll(question.trim(), validOptions, allowMultiple);
    onClose();
  };

  const isValid = question.trim().length > 0 && options.map((o) => o.trim()).filter(Boolean).length >= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-[#242424] border border-[#3e3e3e] rounded-3xl w-full max-w-sm p-5 shadow-2xl text-white relative animate-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">New poll</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-[#383838] transition-colors cursor-pointer"
          >
            <SignalIcon name="x" className="w-4 h-4" />
          </button>
        </div>

        {/* Question Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Question
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question"
            autoFocus
            className="w-full px-3.5 py-2.5 bg-[#1c1c1c] border border-[#3e3e3e] rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#3b45fd]"
          />
        </div>

        {/* Options Input List */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Options
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {options.map((opt, idx) => (
              <div key={idx} className="relative flex items-center">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="w-full px-3.5 py-2.5 pr-10 bg-[#1c1c1c] border border-[#3e3e3e] rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#3b45fd]"
                />
                <button
                  type="button"
                  className="absolute right-3 text-neutral-400 hover:text-white cursor-pointer"
                  title="Emoji"
                >
                  <SignalIcon name="emoji" className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#383838] my-4" />

        {/* Allow Multiple Votes Toggle */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-white">
            Allow multiple votes
          </span>
          <button
            type="button"
            onClick={() => setAllowMultiple(!allowMultiple)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              allowMultiple ? 'bg-[#3b45fd]' : 'bg-[#404040]'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                allowMultiple ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#383838] hover:bg-[#454545] rounded-full text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!isValid}
            className="px-5 py-2 bg-[#3b45fd] hover:bg-[#323be0] disabled:opacity-40 rounded-full text-xs font-semibold text-white transition-colors cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
