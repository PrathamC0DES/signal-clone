import { create } from 'zustand';
import { User, UserPreferences } from '../types';
import { getSignalService } from '../services';

interface SettingsStoreState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  preferences: UserPreferences;
  isSettingsModalOpen: boolean;
  isNewChatModalOpen: boolean;
  isSafetyNumberModalOpen: boolean;
  selectedContactForSafetyNumber: User | null;

  initialize: () => Promise<void>;
  loginWithOtp: (phoneNumber: string, otp: string) => Promise<User>;
  registerAccount: (phoneNumber: string, displayName: string, username?: string, avatarUrl?: string) => Promise<User>;
  logout: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setSettingsModalOpen: (open: boolean) => void;
  setNewChatModalOpen: (open: boolean) => void;
  openSafetyNumberModal: (contact: User) => void;
  closeSafetyNumberModal: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => {
  const service = getSignalService();

  return {
    currentUser: null,
    isAuthenticated: false,
    isAuthLoading: true,
    preferences: {
      theme: 'dark',
      readReceipts: true,
      typingIndicators: true,
      soundEnabled: true,
      compactMode: false,
      defaultDisappearingTimer: 0,
    },
    isSettingsModalOpen: false,
    isNewChatModalOpen: false,
    isSafetyNumberModalOpen: false,
    selectedContactForSafetyNumber: null,

    initialize: async () => {
      try {
        set({ isAuthLoading: true });
        const user = await service.getCurrentUser();
        const prefs = await service.getPreferences();
        set({
          currentUser: user,
          isAuthenticated: !!user,
          preferences: prefs,
          isAuthLoading: false,
        });

        // Apply initial theme
        if (typeof document !== 'undefined') {
          if (prefs.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (err) {
        console.error('Failed to initialize settings:', err);
        set({ currentUser: null, isAuthenticated: false, isAuthLoading: false });
      }
    },

    loginWithOtp: async (phoneNumber: string, otp: string) => {
      const { user } = await service.verifyOtp(phoneNumber, otp);
      set({ currentUser: user, isAuthenticated: true });
      return user;
    },

    registerAccount: async (phoneNumber: string, displayName: string, username?: string, avatarUrl?: string) => {
      const { user } = await service.register(phoneNumber, displayName, username, avatarUrl);
      set({ currentUser: user, isAuthenticated: true });
      return user;
    },

    logout: async () => {
      await service.logout();
      set({
        currentUser: null,
        isAuthenticated: false,
        isSettingsModalOpen: false,
      });
    },

    updatePreferences: async (updates) => {
      const updated = await service.updatePreferences(updates);
      set({ preferences: updated });

      if (updates.theme && typeof document !== 'undefined') {
        if (updates.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },

    updateProfile: async (updates) => {
      const updatedUser = await service.updateCurrentUser(updates);
      set({ currentUser: updatedUser });
    },

    setSettingsModalOpen: (isSettingsModalOpen) => set({ isSettingsModalOpen }),
    setNewChatModalOpen: (isNewChatModalOpen) => set({ isNewChatModalOpen }),
    openSafetyNumberModal: (contact) =>
      set({ isSafetyNumberModalOpen: true, selectedContactForSafetyNumber: contact }),
    closeSafetyNumberModal: () =>
      set({ isSafetyNumberModalOpen: false, selectedContactForSafetyNumber: null }),
  };
});
