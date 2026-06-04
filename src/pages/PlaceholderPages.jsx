import { useApp } from '../context/AppContext';

function PlaceholderPage({ icon, title, subtitle, accentColor }) {
  const { darkMode } = useApp();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 animate-fade-in">
      <div className={`w-24 h-24 rounded-3xl ${accentColor} flex items-center justify-center text-5xl shadow-xl mb-6 animate-bounce-in`}>
        {icon}
      </div>
      <h2 className={`text-3xl font-black mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{title}</h2>
      <p className={`text-base font-medium text-center max-w-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>
      <div className="mt-8 flex gap-3">
        <button className="btn-primary">Get Started ✨</button>
        <button className="btn-secondary">Learn More</button>
      </div>
    </div>
  );
}

export function SchedulePage() {
  return <PlaceholderPage icon="S" title="Schedule" subtitle="Plan your day, week and month with beautiful calendar views." accentColor="bg-blue-100" />;
}

export function HabitsPage() {
  return <PlaceholderPage icon="H" title="Habit Tracker" subtitle="Build powerful habits and track your streaks over time." accentColor="bg-sky-100" />;
}

export function FocusTimerPage() {
  return <PlaceholderPage icon="F" title="Focus Timer" subtitle="Pomodoro-style focus sessions to supercharge your productivity." accentColor="bg-lavender-100" />;
}

export function MoodPage() {
  return <PlaceholderPage icon="M" title="Mood Journal" subtitle="Track your emotional wellbeing and identify patterns." accentColor="bg-yellow-100" />;
}

export function NotesPage() {
  return <PlaceholderPage icon="N" title="Notes" subtitle="Capture ideas, thoughts and plans in your personal notebook." accentColor="bg-emerald-100" />;
}

export function WaterPage() {
  return <PlaceholderPage icon="W" title="Water Tracker" subtitle="Stay hydrated by tracking your daily water intake." accentColor="bg-blue-100" />;
}

export function AIAssistantPage() {
  return <PlaceholderPage icon="A" title="AI Assistant" subtitle="Your personal AI coach for planning, motivation and advice." accentColor="bg-blue-100" />;
}

export function SettingsPage() {
  return <PlaceholderPage icon="S" title="Settings" subtitle="Customize your planner experience to fit your lifestyle." accentColor="bg-slate-100" />;
}
