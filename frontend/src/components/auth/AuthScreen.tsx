'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useChatStore } from '../../stores/useChatStore';
import { getSignalService } from '../../services';
import { Avatar } from '../common/Avatar';
import { SignalIcon } from '../common/SignalIcon';

export const AuthScreen: React.FC = () => {
  const { loginWithOtp, registerAccount } = useSettingsStore();
  const { initialize: initChat } = useChatStore();

  const [stage, setStage] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const fullPhoneNumber = `${countryCode} ${phoneDigits}`.trim();

  const demoAccounts = [
    { name: 'Pratham', phone: '+1 555-0199', code: '+1', num: '555-0199' },
    { name: 'Satvik Sharma', phone: '+1 555-0155', code: '+1', num: '555-0155' },
    { name: 'Sarah Connor', phone: '+1 555-0142', code: '+1', num: '555-0142' },
    { name: 'Alex Miller', phone: '+1 555-0187', code: '+1', num: '555-0187' },
  ];

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setCountryCode(acc.code);
    setPhoneDigits(acc.num);
    setError(null);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneDigits.trim()) {
      setError('Please enter a valid phone number');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await getSignalService().requestOtp(fullPhoneNumber);
      setStage('otp');
      setOtpDigits(['1', '2', '3', '4', '5', '6']); // prefill mock code for convenience
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await loginWithOtp(fullPhoneNumber, code);
      // If user has default name and wants to set profile, can go to profile stage
      if (user.displayName.startsWith('User ') && !user.avatarUrl) {
        setDisplayName(user.displayName);
        setStage('profile');
      } else {
        await initChat();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code. Use mock code: 123456');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please provide a display name');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await registerAccount(fullPhoneNumber, displayName.trim(), username.trim() || undefined, avatarUrl || undefined);
      await initChat();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste
      const pasted = val.replace(/\D/g, '').slice(0, 6).split('');
      const next = [...otpDigits];
      pasted.forEach((char, i) => {
        if (i < 6) next[i] = char;
      });
      setOtpDigits(next);
      const focusIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[focusIndex]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = val;
    setOtpDigits(next);

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#121212] flex flex-col items-center justify-center p-4 select-none font-sans text-neutral-100">
      {/* Background Decorative Blur */}
      <div className="absolute w-96 h-96 bg-[#2c6bed]/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-[#2c6bed]/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

      <div className="relative w-full max-w-md bg-[#1b1b1b] border border-[#2b2b2b] rounded-3xl shadow-2xl p-8 z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Signal Logo Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-[#2c6bed] rounded-3xl flex items-center justify-center shadow-lg shadow-[#2c6bed]/30 mb-4">
            <svg viewBox="0 0 20 20" fill="white" className="w-10 h-10">
              <path d="M1.563 10a8.437 8.437 0 1 1 4.57 7.5l-3.386 1.22c-.912.328-1.795-.554-1.466-1.467l1.218-3.385A8.404 8.404 0 0 1 1.563 10ZM10 3.02a6.98 6.98 0 0 0-6.154 10.275c.15.28.186.622.071.94l-1.04 2.887 2.888-1.04c.318-.114.66-.078.94.072A6.98 6.98 0 1 0 10 3.021Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Signal for Web</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Say &ldquo;hello&rdquo; to privacy. Free, end-to-end encrypted messaging.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* STAGE 1: Phone Number Input */}
        {stage === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Enter your phone number
              </label>
              <div className="flex space-x-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-[#242424] border border-[#333333] text-neutral-100 text-sm rounded-xl px-3 py-2.5 focus:border-[#2c6bed] focus:outline-none"
                >
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+33">🇫🇷 +33</option>
                </select>
                <input
                  type="tel"
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value)}
                  placeholder="555-0199"
                  autoFocus
                  className="flex-1 bg-[#242424] border border-[#333333] text-neutral-100 placeholder-neutral-500 text-sm rounded-xl px-3.5 py-2.5 focus:border-[#2c6bed] focus:bg-[#282828] focus:outline-none transition-all"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5">
                Verification is mocked with OTP <code className="text-[#2c6bed] font-mono">123456</code>.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phoneDigits.trim()}
              className="w-full bg-[#2c6bed] hover:bg-[#255bd1] disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-[#2c6bed]/20 flex items-center justify-center space-x-2"
            >
              {loading ? <span>Sending Code...</span> : <span>Continue</span>}
            </button>

            {/* Quick-Fill Demo Accounts for Reviewer */}
            <div className="pt-4 border-t border-[#262626]">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2 text-center">
                Or Quick-Fill Demo Profile
              </div>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.name}
                    type="button"
                    onClick={() => handleSelectDemo(acc)}
                    className="p-2 bg-[#222222] hover:bg-[#2c6bed]/20 hover:border-[#2c6bed]/50 border border-[#2e2e2e] rounded-xl text-left transition-colors flex items-center space-x-2 group"
                  >
                    <Avatar name={acc.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-neutral-200 group-hover:text-white truncate">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate">{acc.phone}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* STAGE 2: Verification Code Input */}
        {stage === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center">
              <h2 className="text-base font-semibold text-white">Verify Phone Number</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Enter the 6-digit code sent to <span className="font-semibold text-white">{fullPhoneNumber}</span>
              </p>
            </div>

            <div className="p-2.5 bg-[#2c6bed]/10 border border-[#2c6bed]/30 rounded-xl text-[11px] text-[#2c6bed] text-center">
              💡 Mock Verification: code is <strong className="font-mono text-white text-xs">123456</strong>
            </div>

            {/* 6 OTP Boxes */}
            <div className="flex justify-between space-x-2 my-4">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-lg font-bold bg-[#242424] border border-[#333333] rounded-xl text-white focus:border-[#2c6bed] focus:bg-[#282828] focus:outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length < 6}
              className="w-full bg-[#2c6bed] hover:bg-[#255bd1] disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-[#2c6bed]/20 flex items-center justify-center space-x-2"
            >
              {loading ? <span>Verifying...</span> : <span>Verify & Continue</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setStage('phone');
                setError(null);
              }}
              className="w-full text-center text-xs text-neutral-400 hover:text-white pt-1 transition-colors"
            >
              ← Edit phone number
            </button>
          </form>
        )}

        {/* STAGE 3: Profile Setup */}
        {stage === 'profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div className="text-center">
              <h2 className="text-base font-semibold text-white">Set Up Your Profile</h2>
              <p className="text-xs text-neutral-400 mt-1">Your profile is end-to-end encrypted.</p>
            </div>

            <div className="flex flex-col items-center my-3">
              <div className="relative group cursor-pointer">
                <Avatar name={displayName || 'User'} src={avatarUrl} size="lg" />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <SignalIcon name="camera" className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-[11px] text-neutral-500 mt-1.5">Profile Photo</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jane Doe"
                required
                className="w-full bg-[#242424] border border-[#333333] text-neutral-100 placeholder-neutral-500 text-sm rounded-xl px-3.5 py-2.5 focus:border-[#2c6bed] focus:bg-[#282828] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Username <span className="text-neutral-500">(optional)</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-neutral-500 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-8 bg-[#242424] border border-[#333333] text-neutral-100 placeholder-neutral-500 text-sm rounded-xl px-3.5 py-2.5 focus:border-[#2c6bed] focus:bg-[#282828] focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full bg-[#2c6bed] hover:bg-[#255bd1] disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-[#2c6bed]/20 flex items-center justify-center space-x-2"
            >
              {loading ? <span>Saving Profile...</span> : <span>Finish Setup</span>}
            </button>
          </form>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-neutral-500">
        Signal Clone &bull; SDE Fullstack Assignment &bull; Next.js + FastAPI + SQLite
      </div>
    </div>
  );
};

