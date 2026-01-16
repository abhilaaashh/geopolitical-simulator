'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Map Supabase error messages to user-friendly messages
function getErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please check your email and click the confirmation link.',
    'User already registered': 'An account with this email already exists. Try signing in instead.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
    'Unable to validate email address: invalid format': 'Please enter a valid email address.',
    'Email rate limit exceeded': 'Too many attempts. Please wait a few minutes and try again.',
    'For security purposes, you can only request this once every 60 seconds': 'Please wait a moment before trying again.',
  };
  
  return errorMap[error] || error;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate confirm password for sign up
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) {
          setError(getErrorMessage(error));
        } else {
          // Account created, now sign them in automatically
          const { error: signInError } = await signIn(email, password);
          if (signInError) {
            setSuccess('Account created! You can now sign in.');
            setMode('signin');
            setPassword('');
            setConfirmPassword('');
          } else {
            resetForm();
            onClose();
          }
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(getErrorMessage(error));
        } else {
          resetForm();
          onClose();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    if (newMode !== mode) {
      setMode(newMode);
      setError(null);
      setSuccess(null);
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handleClose = () => {
    resetForm();
    setMode('signin');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal Container - Flexbox centering */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <div 
              className="glass-card p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Welcome</h2>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex mb-6 bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => switchMode('signin')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === 'signin'
                      ? 'bg-game-accent text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchMode('signup')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === 'signup'
                      ? 'bg-game-accent text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-6">
                {mode === 'signin'
                  ? 'Sign in to access your saved games and continue your scenarios.'
                  : 'Create an account to save your progress and share your scenarios with others.'}
              </p>

              {/* Error */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success */}
              <AnimatePresence mode="wait">
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <p className="text-green-300 text-sm">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-game-accent focus:ring-1 focus:ring-game-accent/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-game-accent focus:ring-1 focus:ring-game-accent/50 transition-all"
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      Must be at least 6 characters
                    </p>
                  )}
                </div>

                {/* Confirm Password (Sign Up only) */}
                <AnimatePresence>
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required={mode === 'signup'}
                          autoComplete="new-password"
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-game-accent focus:ring-1 focus:ring-game-accent/50 transition-all"
                        />
                      </div>
                      {password && confirmPassword && password !== confirmPassword && (
                        <p className="mt-1.5 text-xs text-red-400">
                          Passwords do not match
                        </p>
                      )}
                      {password && confirmPassword && password === confirmPassword && (
                        <p className="mt-1.5 text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Passwords match
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={isLoading || (mode === 'signup' && password !== confirmPassword)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-game-accent text-white rounded-xl font-medium hover:bg-game-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5" />
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </>
                  )}
                </button>
              </form>

              {/* Footer hint */}
              <p className="mt-6 text-center text-xs text-gray-500">
                {mode === 'signin' 
                  ? 'Your game sessions will sync across devices'
                  : 'You\'ll be signed in automatically after creating your account'}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
