'use client';

import React, { useState, useMemo } from 'react';

export interface SignalEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
}

interface Category {
  id: string;
  name: string;
  icon: (active: boolean) => React.ReactNode;
  emojis: string[];
}

// Comprehensive categorized emojis matching media_1788826745301.png
const EMOJI_CATEGORIES: Category[] = [
  {
    id: 'smileys',
    name: 'Smileys & People',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-400 hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '🫠', '😉', '😊', '😇', '🥰', '😍',
      '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🫣',
      '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶',
      '🫥', '😶‍🌫️', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
      '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫',
      '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕',
      '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
      '🥹', '😦', '😧', '😨', '😰', '😥', '😢', '😭',
      '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱',
      '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️',
      '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
      '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊',
      '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
      '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶',
      '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴',
      '👀', '👁️', '👅', '👄', '💋', '🩸'
    ],
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-400 hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="7" />
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="10" cy="12" r="1" fill="currentColor" />
        <circle cx="14" cy="12" r="1" fill="currentColor" />
        <ellipse cx="12" cy="15" rx="2" ry="1" />
      </svg>
    ),
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸',
      '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦',
      '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺',
      '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌',
      '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️',
      '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙',
      '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬',
      '🐳', '🐋', '🦈', '🦭', '🐊', '🐅', '🐆', '🦓',
      '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫',
      '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖',
      '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮',
      '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦤', '🦚', '🦜',
      '🪴', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️',
      '🍀', '🍁', '🍂', '🍃', '🍄', '🌸', '💮', '🪷',
      '🌺', '🌻', '🌼', '🌷', '🌱', '☀️', '🌤️', '⛅'
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-400 hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
      '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
      '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️',
      '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
      '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴',
      '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆',
      '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝',
      '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤',
      '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡',
      '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮',
      '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜',
      '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤',
      '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸'
    ],
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-400 hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="m9.17 14.83-4.24 4.24" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
      '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌',
      '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺',
      '⛹️', '🤾', '🧗', '🏌️', '🧘', '🏇', '🚴', '🚵',
      '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️',
      '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬',
      '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸',
      '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰'
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-400 hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="8" rx="2" />
        <path d="M5 11l2-6h10l2 6" />
        <circle cx="7" cy="15" r="1.5" fill="currentColor" />
        <circle cx="17" cy="15" r="1.5" fill="currentColor" />
      </svg>
    ),
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
      '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️',
      '🛺', '🚲', '🛴', '🚏', '🛣️', '🛤️', '🛢️', '⛽',
      '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '🛟', '⛵',
      '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛫',
      '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️',
      '🚀', '🛸', '🪐', '🌠', '🌌', '⛱️', '🎆', '🎇',
      '🌋', '🗻', '🏔️', '🏕️', '⛺', '🛖', '🏠', '🏡'
    ],
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-400 hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      </svg>
    ),
    emojis: [
      '💡', '🔦', '🕯️', '🪔', '🏮', '📱', '📲', '💻',
      '⌨️', '🖥️', '🖨️', '🖱️', '💽', '💾', '💿', '📀',
      '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞',
      '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️',
      '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡',
      '🔋', '🔌', '💳', '💎', '⚖️', '🧰', '🔧', '🔨',
      '⚒️', '🛠️', '⛏️', '🪓', '🔩', '⚙️', '🪛', '🔑',
      '🗝️', '🔒', '🔓', '🔏', '🔐', '📦', '🎁', '🎈'
    ],
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-400 hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="7" y1="8" x2="11" y2="8" />
        <line x1="9" y1="6" x2="9" y2="10" />
        <line x1="13" y1="8" x2="17" y2="8" />
        <line x1="7" y1="15" x2="11" y2="15" />
        <line x1="7" y1="17" x2="11" y2="17" />
        <circle cx="15" cy="16" r="1.5" fill="currentColor" />
      </svg>
    ),
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤',
      '🤍', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓',
      '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️',
      '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
      '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶',
      '🈚', '🈸', '🈺', '💯', '♨️', '💢', '💬', '💭',
      '💤', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '❗',
      '‼️', '❓', '❔', '❕', '⚠️', '🚸', '⚡', '✨',
      '❇️', '✳️', '❎', '✅', '✔️', '➕', '➖', '➗',
      '✖️', '💲', '💱', '©️', '®️', '™️', '🔚', '🔙',
      '🔛', '🔝', '🔜', '🔘', '🔴', '🟠', '🟡', '🟢',
      '🔵', '🟣', '🟤', '⚫', '⚪', '🟥', '🟧', '🟨'
    ],
  },
  {
    id: 'flags',
    name: 'Flags',
    icon: (active) => (
      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-neutral-400 hover:text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
      '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇮🇳', '🇯🇵', '🇩🇪', '🇫🇷',
      '🇮🇹', '🇪🇸', '🇧🇷', '🇲🇽', '🇰🇷', '🇨🇳', '🇷🇺', '🇿🇦',
      '🇦🇪', '🇸🇦', '🇸🇬', '🇳🇿', '🇨🇭', '🇸🇪', '🇳🇴', '🇩🇰'
    ],
  },
];

const EMOJI_KEYWORDS: Record<string, string[]> = {
  '❤️': ['heart', 'love', 'red heart', 'valentine'],
  '👍': ['thumb', 'thumbs up', 'like', 'approve', 'yes', 'good', 'ok'],
  '👎': ['thumb', 'thumbs down', 'dislike', 'no', 'bad'],
  '😂': ['laugh', 'lol', 'haha', 'crying laughter', 'joy', 'happy'],
  '😮': ['surprise', 'wow', 'open mouth', 'gasp', 'shocked'],
  '😢': ['cry', 'sad', 'tear', 'weep', 'crying'],
  '🔥': ['fire', 'flame', 'hot', 'lit'],
  '🎉': ['tada', 'party', 'celebrate', 'congrats'],
  '👏': ['clap', 'applause', 'bravo'],
  '🙏': ['pray', 'thank', 'thanks', 'please', 'folded hands'],
  '✨': ['sparkle', 'magic', 'shine', 'stars', 'star'],
  '😍': ['heart eyes', 'love', 'crush', 'in love'],
  '😎': ['cool', 'sunglasses', 'chill'],
  '😭': ['loudly crying', 'sob', 'crying', 'sad'],
  '🤔': ['thinking', 'hmm', 'think', 'ponder'],
  '💀': ['skull', 'dead', 'skeleton', 'death'],
  '💯': ['100', 'hundred', 'perfect', 'score'],
  '🐶': ['dog', 'puppy', 'pet', 'animal'],
  '🐱': ['cat', 'kitty', 'kitten', 'pet'],
  '🍕': ['pizza', 'food', 'slice'],
  '☕': ['coffee', 'tea', 'cup', 'drink'],
  '⚽': ['soccer', 'football', 'ball', 'sport'],
  '🚗': ['car', 'automobile', 'vehicle', 'drive'],
  '💡': ['bulb', 'light', 'idea', 'lamp'],
  '🚩': ['flag', 'red flag'],
  '✅': ['check', 'done', 'yes', 'verified'],
  '❌': ['cross', 'x', 'wrong', 'cancel'],
  '🚀': ['rocket', 'launch', 'space', 'fast'],
};

export const SignalEmojiPicker: React.FC<SignalEmojiPickerProps> = ({
  onSelectEmoji,
  onClose,
  className = '',
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategory = useMemo(() => {
    return EMOJI_CATEGORIES.find((c) => c.id === activeCategoryId) || EMOJI_CATEGORIES[0];
  }, [activeCategoryId]);

  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return activeCategory.emojis;
    }

    const matched: string[] = [];
    for (const cat of EMOJI_CATEGORIES) {
      for (const emoji of cat.emojis) {
        const keywords = EMOJI_KEYWORDS[emoji] || [];
        const matchesKeyword = keywords.some((k) => k.includes(q));
        const matchesCategory = cat.name.toLowerCase().includes(q);
        if (matchesKeyword || matchesCategory) {
          if (!matched.includes(emoji)) {
            matched.push(emoji);
          }
        }
      }
    }

    if (matched.length === 0) {
      return activeCategory.emojis.slice(0, 16);
    }
    return matched;
  }, [searchQuery, activeCategory]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-[#252525] border border-[#383838] shadow-2xl rounded-2xl flex flex-col w-[330px] h-[410px] overflow-hidden text-white select-none z-50 animate-in fade-in zoom-in-95 duration-100 ${className}`}
    >
      {/* 1. Header: Search Bar & Settings Gear */}
      <div className="p-2.5 pb-2 flex items-center space-x-2 border-b border-[#303030]/60">
        <div className="flex-1 flex items-center bg-[#363636] rounded-full px-3 py-1.5 space-x-2">
          <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search emoji"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[13px] text-white placeholder-neutral-400 outline-none w-full"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-neutral-400 hover:text-white"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Settings Gear Button */}
        <button
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer flex-shrink-0"
          title="Settings"
          onClick={() => {}}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>

      {/* 2. Category Title / Subheader */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-[#303030]/40">
        <span className="text-[13px] font-semibold text-neutral-300">
          {searchQuery ? `Search results (${filteredEmojis.length})` : activeCategory.name}
        </span>
        <div className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-400 cursor-pointer">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </div>
      </div>

      {/* 3. 8-Column Emoji Grid */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 scrollbar-thin scrollbar-thumb-neutral-700">
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, idx) => (
            <button
              key={`${emoji}-${idx}`}
              onClick={() => {
                onSelectEmoji(emoji);
                onClose?.();
              }}
              className="w-9 h-9 flex items-center justify-center text-[22px] hover:bg-white/15 rounded-lg transition-transform hover:scale-125 cursor-pointer leading-none"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Bottom Category Tab Bar (8 categories) */}
      <div className="px-2 py-1.5 border-t border-[#333333] flex items-center justify-between bg-[#1f1f1f]">
        {EMOJI_CATEGORIES.map((cat) => {
          const isActive = !searchQuery && activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategoryId(cat.id);
                setSearchQuery('');
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
              title={cat.name}
            >
              {cat.icon(isActive)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
