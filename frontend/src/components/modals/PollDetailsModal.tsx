'use client';

import React from 'react';
import { Message, User } from '../../types';
import { SignalIcon } from '../common/SignalIcon';
import { Avatar } from '../common/Avatar';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface PollDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message;
}

export const PollDetailsModal: React.FC<PollDetailsModalProps> = ({
  isOpen,
  onClose,
  message,
}) => {
  const { conversations, endPoll } = useChatStore();
  const { currentUser } = useSettingsStore();

  if (!isOpen || !message.poll) return null;

  // Gather all participants across conversations to look up voter names & avatars
  const allUsersMap = new Map<string, User>();
  if (currentUser) {
    allUsersMap.set(currentUser.id, currentUser);
    allUsersMap.set('user_me', currentUser);
  }
  conversations.forEach((c) => {
    c.participants.forEach((p) => {
      allUsersMap.set(p.id, p);
    });
  });

  const getVoterUser = (userId: string): User => {
    return (
      allUsersMap.get(userId) || {
        id: userId,
        phoneNumber: '',
        username: '',
        displayName: userId === 'user_me' || userId === currentUser?.id ? (currentUser?.displayName || 'Pratham Mishra') : 'User',
        avatarUrl: '/avatars/ghost.svg',
        safetyNumber: '',
      }
    );
  };

  const isCreator =
    message.senderId === 'user_me' ||
    message.senderId === 'me' ||
    (currentUser && message.senderId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-[#242424] border border-[#3e3e3e] rounded-3xl w-full max-w-sm p-5 shadow-2xl text-white relative animate-in zoom-in-95 duration-100">
        {/* Header matching media_1788835520898.png */}
        <div className="relative flex items-center justify-center mb-4">
          <h3 className="text-base font-semibold text-white">Poll details</h3>
          <button
            onClick={onClose}
            className="absolute right-0 w-7 h-7 rounded-full bg-[#383838] hover:bg-[#484848] flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <SignalIcon name="x" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Question Field */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
            Question
          </label>
          <div className="w-full px-3.5 py-2.5 bg-[#1c1c1c] border border-[#3e3e3e] rounded-xl text-sm text-neutral-200">
            {message.poll.question}
          </div>
        </div>

        {/* Options & Voters List matching media_1788835520898.png */}
        <div className="space-y-4 max-h-60 overflow-y-auto pr-1 mb-6">
          {message.poll.options.map((opt, idx) => {
            const voteCount = opt.voterIds.length;
            const isLast = idx === message.poll!.options.length - 1;

            return (
              <div
                key={opt.id}
                className={!isLast ? 'border-b border-[#333333] pb-3.5' : 'pb-1'}
              >
                {/* Option Header: Text & Vote Count */}
                <div className="flex items-center justify-between text-sm font-bold text-white mb-2">
                  <span>{opt.text}</span>
                  {voteCount > 0 && (
                    <div className="flex items-center space-x-1 text-xs font-semibold text-white/90">
                      <span>★</span>
                      <span>{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                    </div>
                  )}
                </div>

                {/* Voters or No Votes */}
                {voteCount === 0 ? (
                  <p className="text-xs text-neutral-400 font-normal">
                    No votes
                  </p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {opt.voterIds.map((vid) => {
                      const voter = getVoterUser(vid);
                      return (
                        <div key={vid} className="flex items-center space-x-3">
                          <Avatar
                            name={voter.displayName}
                            src={voter.avatarUrl}
                            size="sm"
                            className="w-8 h-8 flex-shrink-0"
                          />
                          <span className="text-sm font-medium text-white truncate">
                            {voter.displayName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: End poll button (only shown if creator or poll is ended) */}
        {(isCreator || message.poll?.isEnded) && (
          <div className="flex justify-center">
            <button
              onClick={async () => {
                if (isCreator && !message.poll?.isEnded) {
                  await endPoll(message.id);
                }
                onClose();
              }}
              disabled={message.poll?.isEnded || !isCreator}
              className={`px-5 py-2 text-white rounded-full text-xs font-semibold transition-colors ${
                message.poll?.isEnded
                  ? 'bg-[#383838] opacity-70 cursor-default'
                  : 'bg-[#383838] hover:bg-[#484848] cursor-pointer'
              }`}
            >
              {message.poll?.isEnded ? 'Poll ended' : 'End poll'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
