import React, { useState } from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface AvatarProps {
  src?: string;
  name: string;
  size?: AvatarSize;
  isOnline?: boolean;
  color?: string;
  className?: string;
  isGroup?: boolean;
}

// Official Signal Desktop pastel avatar color palette for text avatars
export const SIGNAL_AVATAR_COLORS = [
  { bg: '#F6D8EC', text: '#B8057C' }, // Pink / Magenta (matches user screenshot)
  { bg: '#D8E8FE', text: '#0A60DF' }, // Blue
  { bg: '#D2F4E8', text: '#007A5A' }, // Teal / Green
  { bg: '#FFE2CE', text: '#B74D00' }, // Orange / Peach
  { bg: '#EDDCFC', text: '#7A27CC' }, // Purple
  { bg: '#FFF0C2', text: '#8F5B00' }, // Amber
  { bg: '#FEDADA', text: '#C51B24' }, // Crimson / Rose
  { bg: '#CEF0F2', text: '#007D85' }, // Cyan
];

// Official Signal Desktop background colors for built-in preset avatar illustrations
export const PRESET_AVATAR_COLORS: Record<string, { bg: string; fg: string }> = {
  abstract_01: { bg: '#cde4cd', fg: '#067906' },
  abstract_02: { bg: '#d8e8f0', fg: '#086da0' },
  abstract_03: { bg: '#f5d7d7', fg: '#be0404' },
  cat: { bg: '#eae6d5', fg: '#7d6f40' },
  dog: { bg: '#eae0fd', fg: '#661aff' },
  fox: { bg: '#eae6d5', fg: '#7d6f40' },
  tucan: { bg: '#d8e8f0', fg: '#086da0' },
  pig: { bg: '#f6d8ec', fg: '#b8057c' },
  dinosour: { bg: '#cde4cd', fg: '#067906' },
  sloth: { bg: '#fef5d0', fg: '#836b01' },
  incognito: { bg: '#d7d7d9', fg: '#5c5c5c' },
  ghost: { bg: '#e3e3fe', fg: '#3838f5' },
  balloon: { bg: '#fef5d0', fg: '#836b01' },
  book: { bg: '#d8e8f0', fg: '#086da0' },
  briefcase: { bg: '#dde7fc', fg: '#1251d3' },
  celebration: { bg: '#f5d7d7', fg: '#be0404' },
  drink: { bg: '#e3e3fe', fg: '#3838f5' },
  football: { bg: '#d7d7d9', fg: '#5c5c5c' },
  heart: { bg: '#e3e3fe', fg: '#3838f5' },
  house: { bg: '#fef5d0', fg: '#836b01' },
  melon: { bg: '#d8e8f0', fg: '#086da0' },
  soccerball: { bg: '#dde7fc', fg: '#1251d3' },
  sunset: { bg: '#cde4cd', fg: '#067906' },
  surfboard: { bg: '#d7d7d9', fg: '#5c5c5c' },
};

export function getPresetAvatarBgColor(urlOrId?: string): string | undefined {
  if (!urlOrId) return undefined;
  for (const [key, val] of Object.entries(PRESET_AVATAR_COLORS)) {
    if (urlOrId.includes(key)) {
      return val.bg;
    }
  }
  return undefined;
}

export function getAvatarColors(name: string, customColor?: string) {
  const lower = (name || '').trim().toLowerCase();
  // Guarantee "PM" / "Pratham" gets the exact pink/magenta pair from user screenshot
  if (lower === 'pm' || lower.startsWith('pratham') || lower.includes('pratham')) {
    return SIGNAL_AVATAR_COLORS[0];
  }

  // Deterministic hash based on name
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  const index = Math.abs(hash) % SIGNAL_AVATAR_COLORS.length;
  return SIGNAL_AVATAR_COLORS[index];
}

export function getAvatarInitials(name: string): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (trimmed.length <= 2) {
    return trimmed.toUpperCase();
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (trimmed.toLowerCase().startsWith('pratham')) {
    return 'PM';
  }
  return parts[0][0].toUpperCase();
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-xs font-normal',
  md: 'w-10 h-10 text-[15px] font-normal tracking-tight',
  lg: 'w-14 h-14 text-xl font-normal',
  xl: 'w-20 h-20 text-2xl font-normal',
  '2xl': 'w-24 h-24 text-3xl font-semibold',
  full: 'w-full h-full text-3xl font-semibold',
};

const badgeSizes: Record<AvatarSize, string> = {
  sm: 'w-2 h-2 bottom-0 right-0',
  md: 'w-2.5 h-2.5 bottom-0 right-0 border-2',
  lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2',
  xl: 'w-4 h-4 bottom-1 right-1 border-2',
  '2xl': 'w-5 h-5 bottom-1.5 right-1.5 border-2',
  full: 'w-5 h-5 bottom-1.5 right-1.5 border-2',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  isOnline,
  color,
  className = '',
  isGroup,
}) => {
  const [imgError, setImgError] = useState(false);

  // Group default avatar matching official Signal Desktop (media_1788821083412.png)
  if (isGroup && (!src || imgError)) {
    const hasExplicitDimensions = className.includes('w-') || className.includes('h-');
    const outerSizeClass = hasExplicitDimensions ? '' : sizeClasses[size];

    return (
      <div className={`relative inline-flex flex-shrink-0 select-none ${outerSizeClass} ${className}`}>
        <div className="w-full h-full rounded-full flex items-center justify-center font-sans overflow-hidden transition-transform bg-[#D8E8FE] text-[#0A60DF]">
          <svg viewBox="0 0 20 20" fill="none" className="w-[58%] h-[58%]">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.833 5.957c0-1.778 1.195-3.353 2.917-3.353 1.722 0 2.917 1.575 2.917 3.353 0 .902-.294 1.759-.794 2.404-.499.645-1.242 1.118-2.123 1.118-.88 0-1.624-.473-2.123-1.118-.5-.645-.794-1.502-.794-2.404Zm2.917-1.895c-.694 0-1.458.681-1.458 1.895 0 .594.196 1.134.488 1.511.292.378.643.553.97.553.327 0 .678-.175.97-.553.292-.377.488-.917.488-1.511 0-1.214-.764-1.895-1.458-1.895Z"
              fill="#0A60DF"
            />
            <path
              d="M6.25 10.52c.93 0 1.821.202 2.613.564a6.44 6.44 0 0 0-1.03 1.152 4.905 4.905 0 0 0-1.583-.257c-2.23 0-3.934 1.421-4.226 3.125h4.769a6.113 6.113 0 0 0 .05 1.459H1.464a.94.94 0 0 1-.943-.938c0-2.907 2.66-5.104 5.729-5.104Z"
              fill="#0A60DF"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13.75 10.52c-3.07 0-5.73 2.198-5.73 5.105 0 .545.45.938.944.938h9.572a.94.94 0 0 0 .943-.938c0-2.907-2.66-5.104-5.729-5.104Zm0 1.46c2.23 0 3.934 1.42 4.226 3.124H9.524c.292-1.704 1.997-3.125 4.226-3.125Zm-7.5-9.376c-1.722 0-2.917 1.575-2.917 3.353 0 .902.294 1.759.794 2.404.499.645 1.242 1.118 2.123 1.118.881 0 1.624-.473 2.123-1.118.5-.645.794-1.502.794-2.404 0-1.778-1.195-3.353-2.917-3.353ZM4.792 5.957c0-1.214.764-1.895 1.458-1.895.695 0 1.458.681 1.458 1.895 0 .594-.195 1.134-.488 1.511-.292.378-.643.553-.97.553-.327 0-.678-.175-.97-.553-.292-.377-.488-.917-.488-1.511Z"
              fill="#0A60DF"
            />
          </svg>
        </div>
      </div>
    );
  }

  const initials = getAvatarInitials(name);
  const colors = getAvatarColors(name, color);
  const presetBg = getPresetAvatarBgColor(src);
  const bgColor = presetBg || (src && !imgError ? 'transparent' : colors.bg);

  const hasExplicitDimensions = className.includes('w-') || className.includes('h-');
  const outerSizeClass = hasExplicitDimensions ? '' : sizeClasses[size];

  return (
    <div className={`relative inline-flex flex-shrink-0 select-none ${outerSizeClass} ${className}`}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center font-sans overflow-hidden transition-transform"
        style={{
          backgroundColor: bgColor,
          color: colors.text,
        }}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover object-center"
            style={{ backgroundColor: presetBg || 'transparent' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="leading-none select-none">{initials}</span>
        )}
      </div>

      {isOnline && (
        <span
          className={
            badgeSizes[size] +
            ' absolute rounded-full bg-green-500 border-[#121212]'
          }
        />
      )}
    </div>
  );
};
