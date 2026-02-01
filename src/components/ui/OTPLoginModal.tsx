'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { useAuth } from '@/lib/AuthContext';
import {
  initRecaptcha,
  sendOTP,
  verifyOTP,
  signInWithGoogle,
  ConfirmationResult
} from '@/lib/firebase';
import { RecaptchaVerifier } from 'firebase/auth';

interface OTPLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function OTPLoginModal({
  isOpen,
  onClose,
  onLoginSuccess
}: OTPLoginModalProps) {
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [userType, setUserType] = useState<'customer' | 'electrician'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);

    try {
      // Initialize reCAPTCHA if not already done
      if (!recaptchaRef.current) {
        recaptchaRef.current = initRecaptcha('recaptcha-container');
      }

      // Send OTP
      const result = await sendOTP(phoneNumber, recaptchaRef.current);
      setConfirmationResult(result);
      setStep('otp');
      setTimer(60);
      setIsLoading(false);

      // Start countdown
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Send OTP error:', err);
      setError('Failed to send OTP. Please try again.');
      setIsLoading(false);
      // Reset recaptcha on error
      recaptchaRef.current = null;
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.');
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP with Firebase
      await verifyOTP(confirmationResult, otp);

      // Save user to Google Sheets
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          authProvider: 'phone',
          userType: userType
        })
      });

      const data = await response.json();

      if (data.success) {
        login(data.user);
        resetForm();
        onClose();

        // Check if user is a registered electrician (regardless of selected userType)
        // This ensures returning technicians are always redirected to their dashboard
        if (data.user.isElectrician && data.user.electricianStatus === 'VERIFIED') {
          window.location.href = '/electrician-dashboard';
        } else if (data.user.isElectrician && data.user.electricianStatus === 'PENDING') {
          window.location.href = '/electrician-pending';
        } else if (userType === 'electrician' && !data.user.isElectrician) {
          // New electrician who hasn't registered yet
          window.location.href = '/electrician';
        } else {
          onLoginSuccess?.();
        }
      } else {
        setError('Failed to save user data. Please try again.');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const firebaseUser = await signInWithGoogle();

      // Save user to Google Sheets
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          authProvider: 'google',
          userType: userType
        })
      });

      const data = await response.json();

      if (data.success) {
        login(data.user);
        resetForm();
        onClose();

        // Check if user is a registered electrician (regardless of selected userType)
        // This ensures returning technicians are always redirected to their dashboard
        if (data.user.isElectrician && data.user.electricianStatus === 'VERIFIED') {
          window.location.href = '/electrician-dashboard';
        } else if (data.user.isElectrician && data.user.electricianStatus === 'PENDING') {
          window.location.href = '/electrician-pending';
        } else if (userType === 'electrician' && !data.user.isElectrician) {
          // New electrician who hasn't registered yet
          window.location.href = '/electrician';
        } else {
          onLoginSuccess?.();
        }
      } else {
        setError('Failed to save user data. Please try again.');
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Google sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setError('');
    setTimer(0);
    setConfirmationResult(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Premium Overlay */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 z-40 transition-opacity duration-300 backdrop-blur-xl"
        onClick={handleClose}
      />

      {/* Premium Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30 glow-blue relative">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-pink-500/5 pointer-events-none" />

          {/* reCAPTCHA container (invisible) */}
          <div id="recaptcha-container"></div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 hover:bg-cyan-500/20 rounded-lg transition-all duration-300 glow-blue hover:animate-pulse-glow z-10"
          >
            <svg
              className="w-6 h-6 text-cyan-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="relative pt-12 px-8 pb-6 border-b border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center animate-pulse-glow">
                <span className="text-white text-2xl">⚡</span>
              </div>
              <div>
                <span className="font-bold text-2xl text-glow">Local</span>
                <span className="font-bold text-2xl text-glow block">Electrician</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-cyan-100 bg-clip-text text-transparent mb-2">
              {step === 'phone' ? 'Login / Signup' : 'Verify OTP'}
            </h2>
            <p className="text-gray-400 text-sm">
              {step === 'phone'
                ? 'Enter your mobile number or use Google to continue'
                : `We've sent a verification code to +91 ${phoneNumber}`}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={step === 'phone' ? handlePhoneSubmit : handleOTPSubmit}
            className="relative p-8 space-y-5"
          >
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm animate-slide-up">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {step === 'phone' ? (
              <>
                {/* User Type Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    I am a:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType('customer')}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${userType === 'customer'
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                        }`}
                    >
                      <span className="text-2xl block mb-1">🏠</span>
                      <span className={`text-sm font-semibold ${userType === 'customer' ? 'text-cyan-300' : 'text-gray-400'}`}>Customer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('electrician')}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${userType === 'electrician'
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                        }`}
                    >
                      <span className="text-2xl block mb-1">👷</span>
                      <span className={`text-sm font-semibold ${userType === 'electrician' ? 'text-green-300' : 'text-gray-400'}`}>Electrician</span>
                    </button>
                  </div>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                    Mobile Number
                  </label>
                  <div className="flex gap-0 overflow-hidden rounded-xl border border-cyan-500/30 bg-gray-800/50 hover:bg-gray-800/80 hover:border-cyan-500/50 transition-all duration-300">
                    <div className="flex items-center px-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-r border-cyan-500/20">
                      <span className="text-cyan-400 font-bold">+91</span>
                    </div>
                    <input
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(value.slice(0, 10));
                      }}
                      maxLength={10}
                      required
                      disabled={isLoading}
                      className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none text-lg font-semibold"
                    />
                  </div>
                </div>

                {/* Send OTP Button */}
                <button
                  type="submit"
                  disabled={isLoading || phoneNumber.length !== 10}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 ${phoneNumber.length === 10 && !isLoading
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 glow-blue'
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending OTP...
                    </span>
                  ) : (
                    'Send OTP →'
                  )}
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-900 text-gray-400">or continue with</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                {/* Facebook Sign In (coming soon) */}
                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-xl font-semibold bg-[#1877F2]/20 text-[#1877F2] border border-[#1877F2]/30 cursor-not-allowed flex items-center justify-center gap-3 opacity-50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook (Coming Soon)
                </button>
              </>
            ) : (
              <>
                {/* OTP Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold bg-gradient-to-r from-pink-300 to-red-300 bg-clip-text text-transparent">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setOtp(value.slice(0, 6));
                    }}
                    maxLength={6}
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-4 text-center text-4xl tracking-widest font-bold bg-gray-800/50 border-2 border-pink-500/30 rounded-xl text-pink-400 placeholder-gray-600 focus:outline-none focus:border-pink-500/60 focus:bg-gray-800/80 transition-all duration-300"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    {timer > 0 ? (
                      <span>Code expires in <span className="text-pink-400 font-bold">{timer}s</span></span>
                    ) : (
                      <>Code expired. <button
                        type="button"
                        onClick={() => {
                          setStep('phone');
                          setOtp('');
                          recaptchaRef.current = null;
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        Request new code
                      </button></>
                    )}
                  </p>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6 || timer === 0}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 ${otp.length === 6 && timer > 0 && !isLoading
                    ? 'bg-gradient-to-r from-pink-500 to-red-600 hover:from-pink-600 hover:to-red-700 glow-pink'
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Login'
                  )}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp('');
                    setError('');
                    recaptchaRef.current = null;
                  }}
                  className="w-full text-cyan-400 py-2 rounded-lg font-semibold hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                >
                  ← Change Number
                </button>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="relative px-8 py-6 border-t border-cyan-500/20 text-center text-sm text-gray-400">
            <p>
              By continuing, you agree to our{' '}
              <a href="/terms-and-conditions" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Terms & Conditions
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
