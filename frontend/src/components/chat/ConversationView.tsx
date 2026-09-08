'use client';

import React from 'react';
import { Conversation } from '../../types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ContactDetailsView } from './ContactDetailsView';
import { GroupDetailsView } from './GroupDetailsView';
import { useChatStore } from '../../stores/useChatStore';

interface ConversationViewProps {
  conversation: Conversation;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ conversation }) => {
  const { isContactDetailsOpen, setContactDetailsOpen } = useChatStore();

  if (isContactDetailsOpen) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#191919] overflow-hidden">
        {conversation.type === 'group' ? (
          <GroupDetailsView
            conversation={conversation}
            onClose={() => setContactDetailsOpen(false)}
          />
        ) : (
          <ContactDetailsView
            conversation={conversation}
            onClose={() => setContactDetailsOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#121212] overflow-hidden">
      <ChatHeader conversation={conversation} />
      <MessageList conversation={conversation} />
      <ChatInput />
    </div>
  );
};
