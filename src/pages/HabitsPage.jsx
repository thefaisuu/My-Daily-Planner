import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════════════════
   CONSTANTS & DEFAULTS
═══════════════════════════════════════════════════════ */
const PASTEL_THEMES = [
  { id: 'pink',   bg: '#fce7f3', ring: '#f9a8d4', badge: '#fbcfe8', text: '#be185d', accent: '#f472b6', icon_bg: '#fda4af' },
  { id: 'purple', bg: '#f3e8ff', ring: '#d8b4fe', badge: '#e9d5ff', text: '#7e22ce', accent: '#c084fc', icon_bg: '#c4b5fd' },
  { id: 'blue',   bg: '#eff6ff', ring: '#93c5fd', badge: '#bfdbfe', text: '#1d4ed8', accent: '#60a5fa', icon_bg: '#93c5fd' },
  { id: 'mint',   bg: '#ecfdf5', ring: '#6ee7b7', badge: '#a7f3d0', text: '#065f46', accent: '#34d399', icon_bg: '#6ee7b7' },
  { id: 'peach',  bg: '#fff7ed', ring: '#fdba74', badge: '#fed7aa', text: '#9a3412', accent: '#fb923c', icon_bg: '#fdba74' },
  { id: 'lemon',  bg: '#fefce8', ring: '#fde68a', badge: '#fef08a', text: '#854d0e', accent: '#facc15', icon_bg: '#fde68a' },
  { id: 'rose',   bg: '#fff1f2', ring: '#fda4af', badge: '#fecdd3', text: '#9f1239', accent: '#fb7185', icon_bg: '#fda4af' },
  { id: 'cyan',   bg: '#ecfeff', ring: '#67e8f9', badge: '#a5f3fc', text: '#155e75', accent: '#22d3ee', icon_bg: '#67e8f9' },
];

const EMOJI_OPTIONS = [
  '🧘','🏃','📚','💊','💧','😴','🥗','🧹','✍️','🎵',
  '🏋️','🚴','🌿','☕','🛁','🎨','📝','🌅','🙏','🥤',
  '🍎','🧠','💪','🤸','🎯','📖','🌙','⭐','💻'
];

const DEFAULT_HABITS = [
  { id: 1,  name: 'Morning Meditation', icon: '🧘', theme: 'purple', streak: 12, bestStreak: 21, doneToday: true,  createdAt: Date.now() },
  { id: 2,  name: 'Exercise 30 min',    icon: '🏃', theme: 'pink',   streak: 7,  bestStreak: 14, doneToday: true,  createdAt: Date.now() },
  { id: 3,  name: 'Read 20 pages',      icon: '📚', theme: 'blue',   streak: 4,  bestStreak: 10, doneToday: false, createdAt: Date.now() },
  { id: 4,  name: 'Take vitamins',      icon: '💊', theme: 'mint',   streak: 21, bestStreak: 30, doneToday: false, createdAt: Date.now() },
  { id: 5,  name: 'Drink 8 glasses',    icon: '💧', theme: 'cyan',   streak: 5,  bestStreak: 8,  doneToday: false, createdAt: Date.now() },
  { id: 6,  name: 'Sleep by 11 PM',     icon: '😴', theme: 'lemon',  streak: 3,  bestStreak: 7,  doneToday: false, createdAt: Date.now() },
  { id: 7,  name: 'Healthy eating',     icon: '🥗', theme: 'peach',  streak: 9,  bestStreak: 15, doneToday: true,  createdAt: Date.now() },
  { id: 8,  name: 'Evening journaling', icon: '✍️', theme: 'rose',   streak: 2,  bestStreak: 6,  doneToday: false, createdAt: Date.now() },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dbDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseHabitsFromDB(dbHabits, dbLogs) {
  const today = dbDate(new Date());
  
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dbDate(yesterdayDate);

  return (dbHabits || []).map(h => {
    const logs = (dbLogs || []).filter(l => l.habit_id === h.id);
    
    logs.sort((a, b) => b.completed_date.localeCompare(a.completed_date));

    const doneToday = logs.some(l => l.completed_date === today);
    const doneYesterday = logs.some(l => l.completed_date === yesterday);

    let streak = 0;
    if (doneToday) {
      const logToday = logs.find(l => l.completed_date === today);
      streak = logToday ? logToday.streak_count : 0;
    } else if (doneYesterday) {
      const logYesterday = logs.find(l => l.completed_date === yesterday);
      streak = logYesterday ? logYesterday.streak_count : 0;
    }

    const bestStreak = logs.length > 0 ? Math.max(...logs.map(l => l.streak_count)) : 0;

    return {
      id: h.id,
      name: h.name,
      icon: h.icon || '⭐',
      theme: h.color || 'pink',
      streak,
      bestStreak,
      doneToday,
    };
  });
}

function loadHabits() {
  try {
    const raw = localStorage.getItem('planner_habits');
    if (!raw) return [];
    const { habits, lastDate } = JSON.parse(raw);
    // Midnight reset — clear doneToday if saved on a different day
    if (lastDate !== todayKey()) {
      return habits.map(h => ({ ...h, doneToday: false }));
    }
    return habits;
  } catch { return []; }
}

function saveHabits(habits) {
  localStorage.setItem('planner_habits', JSON.stringify({ habits, lastDate: todayKey() }));
}

/* ═══════════════════════════════════════════════════════
   PROGRESS RING
═══════════════════════════════════════════════════════ */
function BigProgressRing({ done, total, darkMode }) {
  const pct  = total ? Math.round((done / total) * 100) : 0;
  const size = 160;
  const stroke = 14;
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);

  const msg =
    pct === 100 ? '🎉 All done!'
    : pct >= 75  ? '💪 Almost there!'
    : pct >= 50  ? '🌟 Halfway there!'
    : pct >= 25  ? '🚀 Keep going!'
    :              '✨ Let\'s start!';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: `conic-gradient(from 0deg, #f9a8d4, #c4b5fd, #93c5fd, #6ee7b7, #f9a8d4)`, opacity: 0.15, filter: 'blur(8px)' }} />
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={darkMode ? '#1e293b' : '#f1f5f9'} strokeWidth={stroke} />
          {/* Progress */}
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="url(#ringGrad)" strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#f9a8d4" />
              <stop offset="50%"  stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{pct}%</span>
          <span className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{done}/{total} habits</span>
        </div>
      </div>
      <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{msg}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HABIT CARD
═══════════════════════════════════════════════════════ */
function HabitCard({ habit, onToggle, onDelete, onEditClick, darkMode }) {
  const theme = PASTEL_THEMES.find(t => t.id === habit.theme) || PASTEL_THEMES[0];
  const [pressing, setPressing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCheck = () => {
    setPressing(true);
    setTimeout(() => setPressing(false), 300);
    onToggle(habit.id);
  };

  return (
    <div
      className={`relative rounded-3xl border-2 p-5 transition-all duration-300 group
        ${habit.doneToday
          ? 'border-transparent shadow-lg scale-[1.01]'
          : darkMode ? 'border-slate-700/60 hover:border-slate-600' : 'border-transparent hover:border-white hover:shadow-lg'
        }`}
      style={{
        background: habit.doneToday
          ? darkMode
            ? `linear-gradient(135deg, ${theme.ring}22, ${theme.accent}15)`
            : `linear-gradient(135deg, ${theme.bg}, white)`
          : darkMode ? '#1e293b' : 'white',
        boxShadow: habit.doneToday
          ? `0 8px 32px ${theme.ring}40`
          : darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Icon + Actions row */}
      <div className="flex items-start justify-between mb-4">
        {/* Icon blob */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${theme.ring}, ${theme.icon_bg})` }}>
          {habit.icon}
        </div>

        {/* Actions layout: Edit pencil, Delete trash, Complete checkbox */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Edit button */}
          <button
            onClick={() => onEditClick(habit)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200
              ${darkMode
                ? 'bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            title="Edit habit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          {/* Delete button */}
          <button
            onClick={() => setShowConfirm(true)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200
              ${darkMode
                ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
            title="Delete habit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          {/* Complete checkbox */}
          <button
            onClick={handleCheck}
            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-300
              ${pressing ? 'scale-90' : habit.doneToday ? 'scale-105' : 'hover:scale-110'}
              ${habit.doneToday ? 'border-transparent shadow-md' : ''}`}
            style={habit.doneToday
              ? { background: `linear-gradient(135deg, ${theme.accent}, ${theme.ring})`, boxShadow: `0 4px 12px ${theme.ring}60` }
              : { borderColor: theme.ring }
            }
            aria-label={habit.doneToday ? 'Mark incomplete' : 'Mark complete'}
          >
            {habit.doneToday && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Name */}
      <p className={`font-black text-base mb-1 leading-snug transition-all ${
        habit.doneToday
          ? 'line-through opacity-60'
          : darkMode ? 'text-slate-100' : 'text-slate-700'
      }`}>
        {habit.name}
      </p>

      {/* Streak row */}
      <div className="flex items-center gap-2 mt-3">
        {/* Current streak */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
          style={{ background: theme.badge }}>
          <span className="text-sm">🔥</span>
          <span className="text-xs font-black" style={{ color: theme.text }}>{habit.streak} day{habit.streak !== 1 ? 's' : ''}</span>
        </div>

        {/* Best streak */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <span className="text-xs">🏆</span>
          <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Best: {habit.bestStreak}</span>
        </div>

        {/* Done badge */}
        {habit.doneToday && (
          <span className="ml-auto text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: theme.badge, color: theme.text }}>
            Done ✓
          </span>
        )}
      </div>

      {/* Progress mini bar */}
      <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: darkMode ? '#334155' : theme.badge }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: habit.doneToday ? '100%' : '0%',
            background: `linear-gradient(to right, ${theme.accent}, ${theme.ring})`
          }}
        />
      </div>

      {/* Delete confirmation overlay */}
      {showConfirm && (
        <div className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center gap-3 z-20"
          style={{ background: darkMode ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)', backdropFilter: 'blur(4px)' }}>
          <p className={`text-sm font-black text-center px-4 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
            Delete "{habit.name}"?
          </p>
          <p className={`text-xs text-center px-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            This will reset your streak.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >Cancel</button>
            <button
              onClick={() => { onDelete(habit.id); setShowConfirm(false); }}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors"
            >Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ADD HABIT MODAL
═══════════════════════════════════════════════════════ */
function AddHabitModal({ onClose, onAdd, onEdit, habitToEdit, darkMode }) {
  const [name, setName]     = useState(habitToEdit?.name || '');
  const [icon, setIcon]     = useState(habitToEdit?.icon || '⭐');
  const [theme, setTheme]   = useState(habitToEdit?.theme || 'pink');
  const [step, setStep]     = useState(1); // 1=name, 2=icon, 3=theme
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmoji, setCustomEmoji]         = useState('');
  const nameRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleAdd = () => {
    if (!name.trim()) return;
    if (habitToEdit) {
      onEdit({ ...habitToEdit, name: name.trim(), icon, theme });
    } else {
      onAdd({ name: name.trim(), icon, theme });
    }
    onClose();
  };

  const selectedTheme = PASTEL_THEMES.find(t => t.id === theme) || PASTEL_THEMES[0];

  const handleBackdrop = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-bounce-in
          ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-pink-100'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${selectedTheme.bg}, white)` }}>
          <div>
            <h2 className={`text-xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              {habitToEdit ? '✏️ Edit Habit' : '✨ New Habit'}
            </h2>
            <p className={`text-xs font-semibold mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {habitToEdit ? 'Modify your daily habit settings' : 'Build a new daily habit'}
            </p>
          </div>
          <button onClick={onClose}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors
              ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-white hover:bg-slate-50 text-slate-400'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Preview card */}
          <div className="rounded-2xl p-4 flex items-center gap-3 border"
            style={{ background: selectedTheme.bg, borderColor: selectedTheme.ring + '60' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `linear-gradient(135deg, ${selectedTheme.ring}, ${selectedTheme.icon_bg})` }}>
              {icon}
            </div>
            <div>
              <p className="font-black text-slate-700" style={{ color: selectedTheme.text }}>
                {name || 'Your habit name'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs">🔥</span>
                <span className="text-xs font-bold" style={{ color: selectedTheme.text }}>
                  {habitToEdit ? `${habitToEdit.streak} day streak` : '0 day streak'}
                </span>
              </div>
            </div>
          </div>

          {/* Habit name */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Habit Name *
            </label>
            <input
              ref={nameRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && handleAdd()}
              placeholder="e.g. Morning meditation, Read 20 pages…"
              className={`w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none border-2 transition-all
                ${darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-pink-400'
                  : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400 focus:border-pink-300 focus:bg-white'
                }`}
            />
          </div>

          {/* Emoji picker */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Choose Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setIcon(e)}
                  className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all duration-150 hover:scale-110
                    ${icon === e
                      ? 'scale-110 shadow-md ring-2'
                      : darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    }`}
                  style={icon === e ? { background: selectedTheme.bg, ringColor: selectedTheme.ring } : {}}
                >
                  {e}
                </button>
              ))}
              {/* Plus Button to add custom emojis */}
              <button
                onClick={() => setShowCustomInput(prev => !prev)}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all duration-150 hover:scale-110 border-2 border-dashed
                  ${showCustomInput 
                    ? 'border-pink-500 text-pink-500 scale-110' 
                    : darkMode ? 'border-slate-700 hover:bg-slate-700 text-slate-400' : 'border-slate-300 hover:bg-slate-100 text-slate-500'}`}
                title="Choose custom emoji"
              >
                ➕
              </button>
            </div>

            {/* Custom Emoji input panel */}
            {showCustomInput && (
              <div className="mt-3 flex items-center gap-2 animate-bounce-in">
                <input
                  type="text"
                  maxLength={5}
                  value={customEmoji}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomEmoji(val);
                    if (val.trim()) setIcon(val.trim());
                  }}
                  placeholder="Paste or type any emoji here…"
                  className={`flex-1 px-4 py-2 rounded-2xl text-sm font-semibold outline-none border-2 transition-all
                    ${darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-pink-400'
                      : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400 focus:border-pink-300'
                    }`}
                />
                <span className="text-[10px] font-bold text-slate-400 max-w-28 leading-tight">
                  Press Win+. or Cmd+Ctrl+Space
                </span>
              </div>
            )}
          </div>

          {/* Theme picker */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Card Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {PASTEL_THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className={`w-9 h-9 rounded-xl border-2 transition-all duration-150 hover:scale-110
                    ${theme === t.id ? 'scale-110 border-slate-500 shadow-md' : 'border-transparent'}`}
                  style={{ background: `linear-gradient(135deg, ${t.ring}, ${t.bg})` }}
                  title={t.id}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-colors
                ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Cancel
            </button>
            <button onClick={handleAdd} disabled={!name.trim()}
              className={`flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all
                ${name.trim()
                  ? 'hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
                  : 'opacity-40 cursor-not-allowed'
                }`}
              style={{ background: name.trim() ? `linear-gradient(135deg, ${selectedTheme.accent}, ${selectedTheme.ring})` : '#94a3b8' }}
            >
              {habitToEdit ? 'Save Changes ✓' : 'Add Habit ✨'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HabitsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="flex gap-2">
            <div className="w-16 h-6 rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="w-20 h-6 rounded-xl bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HABITS PAGE
═══════════════════════════════════════════════════════ */
export default function HabitsPage() {
  const { darkMode, user, showToast } = useApp();
  const [habits, setHabits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState(null);
  const [filter, setFilter]   = useState('all'); // 'all' | 'done' | 'pending'
  const [loading, setLoading]   = useState(false);

  const loadHabitsData = useCallback(async () => {
    if (!supabase || !user) {
      setHabits(loadHabits());
      return;
    }
    setLoading(true);
    try {
      const { data: dbHabits, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, icon, color')
        .eq('user_id', user.id);

      if (habitsError) throw habitsError;

      const { data: dbLogs, error: logsError } = await supabase
        .from('habit_logs')
        .select('habit_id, completed_date, streak_count')
        .eq('user_id', user.id);

      if (logsError) throw logsError;

      const formattedHabits = parseHabitsFromDB(dbHabits, dbLogs);
      setHabits(formattedHabits);
    } catch (err) {
      console.error('Failed to load habits:', err);
      setHabits(loadHabits());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHabitsData();
  }, [loadHabitsData]);

  /* Persist local storage only as cached backup */
  useEffect(() => {
    if (habits.length > 0) {
      saveHabits(habits);
    }
  }, [habits]);

  /* Re-read when clear all data is called */
  useEffect(() => {
    const handler = () => {
      loadHabitsData();
    };
    window.addEventListener('planner-data-changed', handler);
    return () => window.removeEventListener('planner-data-changed', handler);
  }, [loadHabitsData]);

  /* Midnight reset timer */
  useEffect(() => {
    const check = () => {
      loadHabitsData();
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [loadHabitsData]);

  /* Toggle done */
  const handleToggle = useCallback(async (id) => {
    const prevHabits = [...habits];
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const nowDone = !habit.doneToday;
    const nextStreak = nowDone ? habit.streak + 1 : Math.max(0, habit.streak - 1);
    const nextBestStreak = nowDone ? Math.max(habit.bestStreak, nextStreak) : habit.bestStreak;

    // Optimistically update
    setHabits(prev => prev.map(h => h.id === id ? {
      ...h,
      doneToday: nowDone,
      streak: nextStreak,
      bestStreak: nextBestStreak
    } : h));
    showToast(nowDone ? 'Habit logged ✓' : 'Habit log removed');

    if (!supabase || !user) {
      window.dispatchEvent(new Event('planner-data-changed'));
      return;
    }

    try {
      const today = dbDate(new Date());
      if (nowDone) {
        const { error } = await supabase
          .from('habit_logs')
          .insert({
            habit_id: id,
            user_id: user.id,
            completed_date: today,
            streak_count: nextStreak
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', id)
          .eq('user_id', user.id)
          .eq('completed_date', today);

        if (error) throw error;
      }
      window.dispatchEvent(new Event('planner-data-changed'));
    } catch (err) {
      console.error('Failed to toggle habit log:', err);
      setHabits(prevHabits);
      showToast('Failed to toggle habit', 'error', {
        label: 'Retry',
        callback: () => handleToggle(id)
      });
    }
  }, [habits, user, showToast]);

  /* Delete */
  const handleDelete = useCallback(async (id) => {
    const prevHabits = [...habits];
    setHabits(prev => prev.filter(h => h.id !== id));
    showToast('Habit deleted');

    if (!supabase || !user) {
      window.dispatchEvent(new Event('planner-data-changed'));
      return;
    }

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      window.dispatchEvent(new Event('planner-data-changed'));
    } catch (err) {
      console.error('Failed to delete habit:', err);
      setHabits(prevHabits);
      showToast('Failed to delete habit', 'error', {
        label: 'Retry',
        callback: () => handleDelete(id)
      });
    }
  }, [habits, user, showToast]);

  /* Add new */
  const handleAdd = useCallback(async ({ name, icon, theme }) => {
    const prevHabits = [...habits];
    const tempId = 'temp-' + Date.now();
    const tempHabit = {
      id: tempId,
      name, icon, theme,
      streak: 0,
      bestStreak: 0,
      doneToday: false,
    };

    setHabits(prev => [...prev, tempHabit]);
    showToast('Habit created ✓');

    if (!supabase || !user) {
      window.dispatchEvent(new Event('planner-data-changed'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name,
          icon,
          color: theme
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const savedHabit = {
          id: data.id,
          name: data.name,
          icon: data.icon || '⭐',
          theme: data.color || 'pink',
          streak: 0,
          bestStreak: 0,
          doneToday: false
        };
        setHabits(prev => prev.map(h => h.id === tempId ? savedHabit : h));
        window.dispatchEvent(new Event('planner-data-changed'));
      }
    } catch (err) {
      console.error('Failed to add habit:', err);
      setHabits(prevHabits);
      showToast('Failed to add habit', 'error', {
        label: 'Retry',
        callback: () => handleAdd({ name, icon, theme })
      });
    }
  }, [habits, user, showToast]);

  /* Edit existing */
  const handleEdit = useCallback(async (updatedHabit) => {
    const prevHabits = [...habits];
    setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    showToast('Habit updated ✓');

    if (!supabase || !user) {
      window.dispatchEvent(new Event('planner-data-changed'));
      return;
    }

    try {
      const { error } = await supabase
        .from('habits')
        .update({
          name: updatedHabit.name,
          icon: updatedHabit.icon,
          color: updatedHabit.theme
        })
        .eq('id', updatedHabit.id)
        .eq('user_id', user.id);

      if (error) throw error;
      window.dispatchEvent(new Event('planner-data-changed'));
    } catch (err) {
      console.error('Failed to update habit:', err);
      setHabits(prevHabits);
      showToast('Failed to update habit', 'error', {
        label: 'Retry',
        callback: () => handleEdit(updatedHabit)
      });
    }
  }, [habits, user, showToast]);

  const handleEditClick = useCallback((habit) => {
    setHabitToEdit(habit);
    setShowModal(true);
  }, []);

  /* Filtered list */
  const filtered = habits.filter(h =>
    filter === 'all'     ? true
    : filter === 'done'  ? h.doneToday
    : !h.doneToday
  );

  const doneCount    = habits.filter(h => h.doneToday).length;
  const total        = habits.length;
  const totalStreak  = habits.reduce((s, h) => s + h.streak, 0);
  const longestStreak = Math.max(0, ...habits.map(h => h.bestStreak));

  return (
    <>
      {/* ── Modal ── */}
      {showModal && (
        <AddHabitModal
          darkMode={darkMode}
          habitToEdit={habitToEdit}
          onClose={() => { setShowModal(false); setHabitToEdit(null); }}
          onAdd={handleAdd}
          onEdit={handleEdit}
        />
      )}

      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              ✅ Habit Tracker
            </h1>
            <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
              &nbsp;·&nbsp;{doneCount}/{total} completed today
            </p>
          </div>

        </div>

        {/* ── Top summary row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-center">

          {/* Big progress ring */}
          <div className={`rounded-3xl p-6 flex flex-col items-center gap-1
            ${darkMode
              ? 'bg-slate-800/60 border border-slate-700/50'
              : 'bg-white/80 border border-pink-100/80'
            } shadow-sm`}>
            <BigProgressRing done={doneCount} total={total} darkMode={darkMode} />
          </div>

          {/* Stats cards */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '✅', val: `${doneCount}/${total}`, label: 'Today\'s done',  color: 'from-pink-400 to-rose-400',    bg: 'bg-pink-50   dark:bg-pink-900/20'   },
              { icon: '🔥', val: totalStreak,              label: 'Total streak',  color: 'from-orange-400 to-amber-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
              { icon: '🏆', val: longestStreak,            label: 'Best streak',   color: 'from-purple-400 to-violet-400',bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { icon: '📅', val: total,                    label: 'Total habits',  color: 'from-blue-400 to-cyan-400',    bg: 'bg-blue-50   dark:bg-blue-900/20'   },
            ].map((s, i) => (
              <div key={i} className={`rounded-2xl p-4 ${s.bg} border border-white/60 dark:border-slate-700/40 shadow-sm`}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg shadow-sm mb-3`}>
                  {s.icon}
                </div>
                <p className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{s.val}</p>
                <p className={`text-xs font-bold mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {[
            { id: 'all',     label: `All (${total})` },
            { id: 'pending', label: `Pending (${total - doneCount})` },
            { id: 'done',    label: `Done (${doneCount})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-200
                ${filter === f.id
                  ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md shadow-pink-200/50'
                  : darkMode
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    : 'bg-white text-slate-500 hover:bg-pink-50 hover:text-pink-600 border border-slate-100'
                }`}
            >
              {f.label}
            </button>
          ))}

          {/* Sort (cosmetic for now) */}
          <div className="ml-auto">
            <select className={`text-xs font-bold px-3 py-2 rounded-2xl border outline-none cursor-pointer
              ${darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-white border-slate-200 text-slate-600'
              }`}>
              <option>Sort: Default</option>
              <option>Sort: Streak ↓</option>
              <option>Sort: Name A–Z</option>
            </select>
          </div>
        </div>

        {/* ── Habits grid ── */}
        {loading ? (
          <HabitsSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl
              ${darkMode ? 'bg-slate-800' : 'bg-pink-50'}`}>
              {filter === 'done' ? '🎉' : '🌱'}
            </div>
            <p className={`text-lg font-black ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {filter === 'done' ? 'No completed habits yet' : 'All habits done!'}
            </p>
            <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {filter === 'done' ? 'Start checking off your habits!' : '🎉 Amazing work today!'}
            </p>
            {filter !== 'done' && (
              <button onClick={() => { setHabitToEdit(null); setShowModal(true); }} className="btn-primary mt-2">
                + Add a new habit
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEditClick={handleEditClick}
                darkMode={darkMode}
              />
            ))}
          </div>
        )}

        {/* ── Bottom tip ── */}
        {habits.length > 0 && (
          <p className={`mt-8 text-center text-xs font-semibold ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
            🌙 Habits reset automatically at midnight · Hover a card to delete it
          </p>
        )}
      </div>

      {/* Floating Action Button (FAB) to Add Habit */}
      <button
        onClick={() => { setHabitToEdit(null); setShowModal(true); }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 group"
        aria-label="Add new habit"
        title="Add new habit"
      >
        <svg
          className="w-7 h-7 transition-transform group-hover:rotate-90 duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </>
  );
}
