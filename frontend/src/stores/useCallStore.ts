import { create } from 'zustand';
import { CallSession, CallType } from '../types';
import { getSignalService } from '../services';

interface CallStoreState {
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  isCallOverlayVisible: boolean;
  isPip: boolean;

  startCall: (conversationId: string, type: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  declineIncomingCall: () => Promise<void>;
  endActiveCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  togglePip: () => void;
  toggleSpeaker: () => void;
}

export const useCallStore = create<CallStoreState>((set, get) => {
  const service = getSignalService();

  if (typeof window !== 'undefined') {
    service.subscribeToEvents({
      onIncomingCall: (call) => {
        set({ incomingCall: call });
        try {
          const audio = new Audio('/sounds/ringtone_minimal.ogg');
          audio.loop = true;
          audio.play().catch(() => {});
        } catch {}
      },
      onCallEnded: () => {
        set({ activeCall: null, incomingCall: null, isCallOverlayVisible: false });
      },
    });
  }

  return {
    activeCall: null,
    incomingCall: null,
    isCallOverlayVisible: false,
    isPip: false,

    startCall: async (conversationId, type) => {
      const session = await service.initiateCall(conversationId, type);
      set({
        activeCall: session,
        isCallOverlayVisible: true,
      });

      // Play ringing sound
      try {
        const audio = new Audio('/sounds/notification_simple-01.ogg');
        audio.play().catch(() => {});
      } catch {}
    },

    answerCall: async () => {
      const { incomingCall } = get();
      if (!incomingCall) return;
      const session = await service.answerCall(incomingCall.callId);
      set({
        activeCall: session,
        incomingCall: null,
        isCallOverlayVisible: true,
      });
    },

    declineIncomingCall: async () => {
      const { incomingCall } = get();
      if (!incomingCall) return;
      await service.endCall(incomingCall.callId);
      set({ incomingCall: null });
    },

    endActiveCall: async () => {
      const { activeCall } = get();
      if (!activeCall) return;
      await service.endCall(activeCall.callId);
      set({ activeCall: null, isCallOverlayVisible: false });
    },

    toggleMute: () => {
      const { activeCall } = get();
      if (!activeCall) return;
      set({ activeCall: { ...activeCall, isMuted: !activeCall.isMuted } });
    },

    toggleVideo: () => {
      const { activeCall } = get();
      if (!activeCall) return;
      set({ activeCall: { ...activeCall, isVideoEnabled: !activeCall.isVideoEnabled } });
    },

    togglePip: () => {
      set((state) => ({ isPip: !state.isPip }));
    },

    toggleSpeaker: () => {
      const { activeCall } = get();
      if (!activeCall) return;
      set({ activeCall: { ...activeCall, isSpeakerOn: !activeCall.isSpeakerOn } });
    },
  };
});
