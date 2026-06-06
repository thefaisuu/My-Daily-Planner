import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle2, Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';
import PlannerLogo from '../components/PlannerLogo';

export default function AuthPages({ onAuthSuccess, initialView = 'login', onBack }) {
  const [view, setView] = useState(initialView);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const switchView = (v) => { setView(v); setErrorMsg(''); setSuccessMsg(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    try {
      if (view === 'signup') {
        if (!fullName.trim()) throw new Error('Full name is required.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
      }
      if (supabase) {
        if (view === 'login') {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          if (data?.user) onAuthSuccess(data.user);
        } else if (view === 'signup') {
          const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
          if (error) throw error;
          setSuccessMsg('Account created! Please check your email for confirmation.');
          if (data?.user && data.session) onAuthSuccess(data.user);
          else setTimeout(() => switchView('login'), 3500);
        } else if (view === 'forgot-password') {
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
          if (error) throw error;
          setSuccessMsg('Password reset link sent! Check your inbox.');
        }
      } else {
        await new Promise(r => setTimeout(r, 1200));
        if (view === 'login') {
          const u = { id: 'mock-user-123', email, user_metadata: { full_name: 'Ata UmeR' } };
          localStorage.setItem('planner_mock_session', JSON.stringify(u));
          onAuthSuccess(u);
        } else if (view === 'signup') {
          const u = { id: 'mock-user-123', email, user_metadata: { full_name: fullName } };
          localStorage.setItem('planner_mock_session', JSON.stringify(u));
          setSuccessMsg('Sign up successful! Logging in...');
          setTimeout(() => onAuthSuccess(u), 1000);
        } else {
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
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
        if (error) throw error;
      } else {
        await new Promise(r => setTimeout(r, 1000));
        const u = { id: 'google-mock-user', email: 'google.user@planner.app', user_metadata: { full_name: 'Ata UmeR (Google)' } };
        localStorage.setItem('planner_mock_session', JSON.stringify(u));
        onAuthSuccess(u);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Google authentication failed.');
      setLoading(false);
    }
  };

  const viewMeta = {
    login: { title: 'Welcome back', sub: 'Sign in to your planner' },
    signup: { title: 'Create account', sub: 'Start your journey today' },
    'forgot-password': { title: 'Reset password', sub: 'We\'ll send a link to your inbox' },
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#06060e',
      fontFamily: 'Inter, Outfit, system-ui, -apple-system, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        /* Auth Page Styles */
        .auth-orb {
          position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none;
        }
        .auth-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black, transparent);
        }
        .auth-panel-left {
          display: none;
          flex: 1; flex-direction: column; justify-content: center; align-items: flex-start;
          padding: 60px 80px;
          background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.06) 100%);
          border-right: 1px solid rgba(255,255,255,0.05);
          position: relative; overflow: hidden;
        }
        @media (min-width: 1000px) { .auth-panel-left { display: flex; } }
        .auth-panel-right {
          flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
          padding: 24px; position: relative; z-index: 1; min-height: 100vh;
        }
        .auth-form-card {
          width: 100%; max-width: 420px; position: relative;
        }
        .auth-back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6); font-size: 13px; font-weight: 600;
          padding: 8px 14px; border-radius: 10px; cursor: pointer;
          transition: all 0.2s; margin-bottom: 36px;
        }
        .auth-back-btn:hover { color: #fff; background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.2); }
        .auth-logo-area { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
        .auth-logo-name { font-size: 15px; font-weight: 800; color: rgba(255,255,255,0.9); letter-spacing: -0.3px; }
        .auth-title { font-size: 30px; font-weight: 900; color: #fff; margin: 0 0 6px; letter-spacing: -1px; line-height: 1.1; }
        .auth-sub { font-size: 14px; color: rgba(255,255,255,0.4); margin: 0 0 32px; }

        .auth-alert {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 14px; border-radius: 12px; font-size: 13px; font-weight: 600; margin-bottom: 16px;
        }
        .auth-alert-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; }
        .auth-alert-success { background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.2); color: #6ee7b7; }

        .auth-form { display: flex; flex-direction: column; gap: 14px; }
        .auth-field { display: flex; flex-direction: column; gap: 7px; }
        .auth-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); }
        .auth-input {
          width: 100%; padding: 12px 16px; border-radius: 12px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; font-size: 14px; font-weight: 500; outline: none;
          transition: all 0.2s; box-sizing: border-box;
          font-family: inherit;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.2); }
        .auth-input:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.08); box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
        .auth-input-wrap { position: relative; }
        .auth-input-pw { padding-right: 44px; }
        .auth-pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer;
          display: flex; align-items: center; justify-content: center; padding: 4px;
          transition: color 0.2s;
        }
        .auth-pw-toggle:hover { color: rgba(255,255,255,0.7); }
        .auth-forgot {
          align-self: flex-end; background: none; border: none; cursor: pointer;
          font-size: 12px; font-weight: 700; color: #818cf8; transition: color 0.2s; padding: 0;
        }
        .auth-forgot:hover { color: #a5b4fc; }

        .auth-submit {
          width: 100%; padding: 13px; border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border: none; color: #fff; font-size: 15px; font-weight: 800;
          cursor: pointer; transition: all 0.25s;
          box-shadow: 0 8px 24px rgba(99,102,241,0.35);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 4px; font-family: inherit;
        }
        .auth-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(99,102,241,0.5); }
        .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        .auth-divider {
          display: flex; align-items: center; gap: 12px; margin: 20px 0;
        }
        .auth-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .auth-divider-text { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.25); }

        .auth-google {
          width: 100%; padding: 12px; border-radius: 14px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-family: inherit;
        }
        .auth-google:hover:not(:disabled) { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.2); color: #fff; }
        .auth-google:disabled { opacity: 0.55; cursor: not-allowed; }

        .auth-switch { text-align: center; margin-top: 24px; font-size: 13px; color: rgba(255,255,255,0.35); }
        .auth-switch-btn {
          background: none; border: none; cursor: pointer;
          color: #818cf8; font-weight: 700; font-size: 13px;
          transition: color 0.2s; padding: 0;
        }
        .auth-switch-btn:hover { color: #a5b4fc; }

        /* Left panel */
        .left-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25);
          color: #a5b4fc; font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; padding: 6px 14px; border-radius: 100px; margin-bottom: 32px;
        }
        .left-h2 { font-size: 44px; font-weight: 900; color: #fff; line-height: 1.1; letter-spacing: -2px; margin: 0 0 20px; }
        .left-h2 .grad {
          background: linear-gradient(135deg, #818cf8, #c084fc, #f472b6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .left-sub { font-size: 16px; color: rgba(255,255,255,0.45); line-height: 1.7; max-width: 380px; margin: 0 0 40px; }
        .left-features { display: flex; flex-direction: column; gap: 14px; }
        .left-feat {
          display: flex; align-items: center; gap: 12px;
          font-size: 14px; color: rgba(255,255,255,0.6); font-weight: 500;
        }
        .left-feat-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .left-feat-label { font-weight: 600; color: rgba(255,255,255,0.7); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      {/* Background decorations */}
      <div className="auth-orb" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)', top: -150, left: -150 }} />
      <div className="auth-orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(168,85,247,0.1), transparent 70%)', bottom: -100, right: -100 }} />
      <div className="auth-grid" />

      {/* Left decorative panel */}
      <div className="auth-panel-left">
        <div className="auth-orb" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', top: -100, right: -100 }} />
        <div className="left-badge">
          <Sparkles size={11} strokeWidth={2} />
          Personal Productivity
        </div>
        <h2 className="left-h2">
          Make every day<br />
          <span className="grad">count</span>
        </h2>
        <p className="left-sub">
          Join thousands of people building better habits, staying focused, and living intentionally with My Daily Planner.
        </p>
        <div className="left-features">
          {[
            { color: '#ec4899', label: 'Habit Tracker', desc: 'Build streaks & routines' },
            { color: '#38bdf8', label: 'Smart Schedule', desc: 'Block time, stay on track' },
            { color: '#34d399', label: 'Mood Journal', desc: 'Understand your emotions' },
            { color: '#c084fc', label: 'Focus Timer', desc: 'Deep work with Pomodoro' },
            { color: '#fb923c', label: 'Smart Notes', desc: 'Capture ideas instantly' },
          ].map((f, i) => (
            <div key={i} className="left-feat">
              <div className="left-feat-dot" style={{ background: f.color }} />
              <span className="left-feat-label">{f.label}</span>
              <span>— {f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-form-card">
          {/* Back button */}
          {onBack && (
            <button className="auth-back-btn" onClick={onBack}>
              <ArrowLeft size={14} strokeWidth={2.5} />
              Back to Home
            </button>
          )}

          {/* Logo */}
          <div className="auth-logo-area">
            <PlannerLogo size={36} />
            <span className="auth-logo-name">My Daily Planner</span>
          </div>

          {/* Title */}
          <h1 className="auth-title">{viewMeta[view].title}</h1>
          <p className="auth-sub">{viewMeta[view].sub}</p>

          {/* Alerts */}
          {errorMsg && (
            <div className="auth-alert auth-alert-error">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} strokeWidth={2} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="auth-alert auth-alert-success">
              <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} strokeWidth={2} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {view === 'signup' && (
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input type="text" required placeholder="Enter your name" value={fullName}
                  onChange={e => setFullName(e.target.value)} className="auth-input" />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <input type="email" required placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} className="auth-input" />
            </div>

            {view !== 'forgot-password' && (
              <div className="auth-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-label">Password</label>
                  {view === 'login' && (
                    <button type="button" className="auth-forgot"
                      onClick={() => switchView('forgot-password')}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <input type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="auth-input auth-input-pw" />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </div>
              </div>
            )}

            {view === 'signup' && (
              <div className="auth-field">
                <label className="auth-label">Confirm Password</label>
                <div className="auth-input-wrap">
                  <input type={showConfirmPassword ? 'text' : 'password'} required placeholder="••••••••"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="auth-input auth-input-pw" />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirmPassword(p => !p)}>
                    {showConfirmPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <svg className="spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : view === 'login' ? 'Sign In →'
                : view === 'signup' ? 'Create Account →'
                : 'Send Reset Link →'}
            </button>
          </form>

          {/* Google OAuth */}
          {view !== 'forgot-password' && (
            <>
              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">or continue with</span>
                <div className="auth-divider-line" />
              </div>
              <button type="button" className="auth-google" disabled={loading} onClick={handleGoogleLogin}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {/* Switch view */}
          <div className="auth-switch">
            {view === 'login' ? (
              <p style={{ margin: 0 }}>
                Don't have an account?{' '}
                <button className="auth-switch-btn" onClick={() => switchView('signup')}>Sign up</button>
              </p>
            ) : view === 'signup' ? (
              <p style={{ margin: 0 }}>
                Already have an account?{' '}
                <button className="auth-switch-btn" onClick={() => switchView('login')}>Log in</button>
              </p>
            ) : (
              <button className="auth-switch-btn" onClick={() => switchView('login')}>← Back to Login</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
