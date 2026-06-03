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

function ToastNotification({ message, type, action, onDone }) {
  useEffect(() => {
    if (action) return;
    const id = setTimeout(onDone, 4000);
    return () => clearTimeout(id);
  }, [action, onDone]);

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
  const { user, setUser, authLoading, toast, setToast } = useApp();
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
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}
