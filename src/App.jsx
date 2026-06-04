import { useEffect, useState } from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SchedulePage from './pages/SchedulePage';
import HabitsPage from './pages/HabitsPage';
import FocusTimerPage from './pages/FocusTimerPage';
import MoodPage from './pages/MoodPage';
import NotesPage from './pages/NotesPage';
import WaterPage from './pages/WaterPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import AuthPages from './pages/AuthPages';
import LandingPage from './pages/LandingPage';
/* ── Programmatic synth chime sound ── */
const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.25);
    
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.08); // A5
    gain2.gain.setValueAtTime(0.12, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch (e) {
    console.warn('Failed to play notification audio:', e);
  }
};

function ToastNotification({ message, type, action, playSound, onDone }) {
  useEffect(() => {
    if (playSound) {
      playNotificationSound();
    }
    if (action) return;
    const id = setTimeout(onDone, 4000);
    return () => clearTimeout(id);
  }, [message, type, action, playSound, onDone]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-black animate-bounce-in min-w-[280px] max-w-sm
      ${type === 'success' ? 'bg-emerald-500 text-white' : type === 'error' ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'}`}>
      <div className="flex items-center gap-3">
        <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>{message}</span>
      </div>
      {action && (
        <button
          onClick={() => {
            action.callback();
            onDone();
          }}
          className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-extrabold transition-all cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function PageRenderer() {
  const { activeNav } = useApp();

  const renderPage = () => {
    switch (activeNav) {
      case 'Dashboard':      return <Dashboard />;
      case 'Schedule':       return <SchedulePage />;
      case 'Habits':         return <HabitsPage />;
      case 'Focus Timer':    return <FocusTimerPage />;
      case 'Mood':           return <MoodPage />;
      case 'Notes':          return <NotesPage />;
      case 'Water':          return <WaterPage />;
      case 'Notifications':  return <NotificationsPage />;
      case 'Settings':       return <SettingsPage />;
      default:               return <Dashboard />;
    }
  };

  return (
    <div key={activeNav} className="page-transition h-full w-full">
      {renderPage()}
    </div>
  );
}

export default function App() {
  const { user, setUser, authLoading, toast, setToast, confirmModal, closeConfirm } = useApp();
  const [authView, setAuthView] = useState(null); // null = landing, 'login' | 'signup' = auth modal

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-[#5B6CFF]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">Restoring session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView) {
      return (
        <AuthPages
          initialView={authView}
          onAuthSuccess={(usr) => { setUser(usr); setAuthView(null); }}
          onBack={() => setAuthView(null)}
        />
      );
    }
    return (
      <LandingPage
        onLogin={() => setAuthView('login')}
        onSignup={() => setAuthView('signup')}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <PageRenderer />
        </main>
      </div>
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          action={toast.action}
          playSound={toast.playSound}
          onDone={() => setToast(null)}
        />
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        isDanger={confirmModal.isDanger}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}

/* ── Custom Confirm Modal ── */
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, isDanger }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onCancel}
      />
      
      {/* Card container */}
      <div 
        className="relative bg-white border border-slate-100 shadow-2xl rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 z-10 scale-in-center"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors text-lg cursor-pointer"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md ${
            isDanger ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-indigo-50 text-indigo-500 border border-indigo-100'
          }`}>
            {isDanger ? '⚠️' : 'ℹ️'}
          </div>

          {/* Title */}
          <h3 className="text-lg font-black text-slate-800 tracking-tight">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all text-center cursor-pointer"
          >
            {cancelText || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-2xl text-white font-bold text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all text-center cursor-pointer ${
              isDanger 
                ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:shadow-rose-100'
                : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:shadow-indigo-100'
            }`}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
