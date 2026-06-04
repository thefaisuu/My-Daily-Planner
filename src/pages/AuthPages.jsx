import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthPages({ onAuthSuccess, initialView = 'login', onBack }) {
  const [view, setView] = useState(initialView); // 'login' | 'signup' | 'forgot-password'
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Perform validation and invoke auth actions
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (view === 'signup') {
        if (!fullName.trim()) {
          throw new Error('Full name is required.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
      }

      if (supabase) {
        // Real Supabase Auth Flow
        if (view === 'login') {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data?.user) {
            onAuthSuccess(data.user);
          }
        } else if (view === 'signup') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              }
            }
          });
          if (error) throw error;
          setSuccessMsg('Account created! Please check your email for confirmation.');
          // Auto-login if email confirmation is disabled/not required
          if (data?.user && data.session) {
            onAuthSuccess(data.user);
          } else {
            setTimeout(() => setView('login'), 3500);
          }
        } else if (view === 'forgot-password') {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
          });
          if (error) throw error;
          setSuccessMsg('Password reset link sent! Check your inbox.');
        }
      } else {
        // Mock Auth Fallback Flow (when Supabase is offline/not set up)
        await new Promise((resolve) => setTimeout(resolve, 1200)); // simulate server response
        
        if (view === 'login') {
          const mockUser = {
            id: 'mock-user-123',
            email,
            user_metadata: { full_name: 'Ata UmeR' }
          };
          localStorage.setItem('planner_mock_session', JSON.stringify(mockUser));
          onAuthSuccess(mockUser);
        } else if (view === 'signup') {
          const mockUser = {
            id: 'mock-user-123',
            email,
            user_metadata: { full_name: fullName }
          };
          localStorage.setItem('planner_mock_session', JSON.stringify(mockUser));
          setSuccessMsg('Sign up successful! Logging in...');
          setTimeout(() => onAuthSuccess(mockUser), 1000);
        } else if (view === 'forgot-password') {
          setSuccessMsg('Mock reset link sent to ' + email + '!');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          }
        });
        if (error) throw error;
      } else {
        // Simulate google OAuth login
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockUser = {
          id: 'google-mock-user',
          email: 'google.user@planner.app',
          user_metadata: { full_name: 'Ata UmeR (Google)' }
        };
        localStorage.setItem('planner_mock_session', JSON.stringify(mockUser));
        onAuthSuccess(mockUser);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Google authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Back to landing link */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-5 left-5 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors z-50 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-2xl shadow-sm border border-slate-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      )}
      {/* Container holding form and pastel gradient backdrop card */}
      <div className="w-full max-w-md rounded-3xl p-0.5 bg-gradient-to-tr from-pink-300 via-purple-300 to-sky-300 shadow-2xl hover:shadow-pink-100 dark:hover:shadow-none transition-all duration-300">
        
        <div className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-md rounded-[23px] px-6 py-8 sm:px-8">
          
          {/* Logo / Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B6CFF] to-[#A78BFA] text-white text-2xl font-black shadow-md mb-2">
              ✨
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              My Daily Planner
            </h2>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 mt-1 uppercase tracking-widest">
              {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Get Started' : 'Reset Password'}
            </p>
          </div>

          {/* User Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600 flex items-center gap-2">
              <span>⚠️</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600 flex items-center gap-2">
              <span>✓</span>
              <span className="flex-1">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-sm text-slate-700 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-sm text-slate-700 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition-all"
              />
            </div>

            {view !== 'forgot-password' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Password
                  </label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setView('forgot-password'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-sm text-slate-700 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {view === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-4 pr-11 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-sm text-slate-700 dark:text-slate-100 font-semibold focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Primary Submit Button (in soft pink) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-extrabold text-sm shadow-lg shadow-pink-100 dark:shadow-none hover:shadow-pink-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : view === 'login' ? (
                'Login ✓'
              ) : view === 'signup' ? (
                'Create Account ✓'
              ) : (
                'Send Reset Link ✓'
              )}
            </button>
          </form>

          {/* Google OAuth (only for login & signup views) */}
          {view !== 'forgot-password' && (
            <div className="mt-5">
              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-x-0 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="relative px-3 bg-white dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  or continue with
                </span>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                {/* SVG Google Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Google</span>
              </button>
            </div>
          )}

          {/* Footer view toggles */}
          <div className="mt-6 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            {view === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => { setView('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  Sign up
                </button>
              </p>
            ) : view === 'signup' ? (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  Log in
                </button>
              </p>
            ) : (
              <button
                onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-indigo-500 hover:text-indigo-600 transition-colors"
              >
                ← Back to Login
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
