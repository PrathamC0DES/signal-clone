'use client';

import React, { useEffect, useState } from 'react';
import { SignalIcon } from '../common/SignalIcon';
import { Avatar } from '../common/Avatar';
import { useCallStore } from '../../stores/useCallStore';

export const CallOverlay: React.FC = () => {
  const {
    activeCall,
    incomingCall,
    answerCall,
    declineIncomingCall,
    endActiveCall,
    toggleMute,
    toggleVideo,
    togglePip,
    isPip,
  } = useCallStore();

  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval: any;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        if (activeCall.startedAt) {
          setCallDuration(Math.floor((Date.now() - activeCall.startedAt) / 1000));
        }
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall?.status, activeCall?.startedAt]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Incoming Call Bar
  if (incomingCall) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-[#1e1e1e] border border-[#333333] shadow-2xl rounded-2xl p-4 flex items-center space-x-4 animate-bounce select-none">
        <Avatar
          name={incomingCall.caller.displayName}
          src={incomingCall.caller.avatarUrl}
          size="md"
        />

        <div>
          <h4 className="text-sm font-semibold text-white">{incomingCall.caller.displayName}</h4>
          <p className="text-xs text-neutral-400 capitalize">
            Incoming Signal {incomingCall.type} call...
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={declineIncomingCall}
            className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform active:scale-95"
            title="Decline"
          >
            <SignalIcon name="x" className="w-5 h-5" />
          </button>

          <button
            onClick={answerCall}
            className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full transition-transform active:scale-95"
            title="Answer"
          >
            <SignalIcon name="phone" className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (!activeCall) return null;

  const recipientName =
    'displayName' in activeCall.recipient
      ? activeCall.recipient.displayName
      : activeCall.recipient.name;

  return (
    <div
      className={`fixed z-50 transition-all select-none ${
        isPip
          ? 'bottom-4 right-4 w-80 h-52 rounded-2xl shadow-2xl border border-[#333333] overflow-hidden'
          : 'inset-0 bg-[#121212]/95 backdrop-blur-md flex flex-col items-center justify-center p-6'
      }`}
    >
      {/* Top Floating Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
        <button
          onClick={togglePip}
          className="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-white text-xs"
          title="Picture-in-picture"
        >
          {isPip ? 'Maximize' : 'Minimize'}
        </button>
      </div>

      {/* Main Video or Audio Screen */}
      <div className="flex flex-col items-center justify-center flex-1 w-full">
        {activeCall.type === 'video' && activeCall.isVideoEnabled ? (
          <div className="w-full h-full max-w-3xl max-h-[480px] bg-[#1a1a1a] rounded-2xl border border-[#2b2b2b] flex items-center justify-center overflow-hidden relative shadow-2xl">
            <div className="text-center text-neutral-400">
              <span className="text-4xl mb-2 block">📷</span>
              <p className="text-xs">End-to-End Encrypted Video Stream</p>
            </div>

            {/* Self preview PIP */}
            <div className="absolute bottom-3 right-3 w-28 h-20 bg-neutral-900 rounded-lg border border-neutral-700 flex items-center justify-center text-[10px] text-neutral-400">
              Your Camera
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Avatar
              name={recipientName}
              src={
                'avatarUrl' in activeCall.recipient
                  ? activeCall.recipient.avatarUrl
                  : undefined
              }
              size="xl"
              className="ring-4 ring-[#2c6bed]/30"
            />

            <div className="text-center">
              <h2 className="text-lg font-bold text-white mb-1">{recipientName}</h2>
              <div className="text-xs text-[#2c6bed] font-medium">
                {activeCall.status === 'ringing'
                  ? 'Ringing...'
                  : `Connected (${formatTimer(callDuration)})`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Calling Controls Bar */}
      <div className="flex items-center space-x-4 mt-6 bg-[#1e1e1e] px-6 py-3 rounded-full border border-[#2b2b2b] shadow-2xl">
        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full transition-colors ${
            activeCall.isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500'
              : 'bg-[#2a2a2a] text-white hover:bg-[#333333]'
          }`}
          title={activeCall.isMuted ? 'Unmute' : 'Mute'}
        >
          <SignalIcon name="mic" className="w-5 h-5" />
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${
            !activeCall.isVideoEnabled
              ? 'bg-red-500/20 text-red-400 border border-red-500'
              : 'bg-[#2a2a2a] text-white hover:bg-[#333333]'
          }`}
          title={activeCall.isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
        >
          <SignalIcon name="video" className="w-5 h-5" />
        </button>

        {/* End Call Button */}
        <button
          onClick={endActiveCall}
          className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform active:scale-95"
          title="End Call"
        >
          <SignalIcon name="phone" className="w-5 h-5 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};
