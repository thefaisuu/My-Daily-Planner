import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MOOD_MAP = {
  1: { emoji: '😔', label: 'Rough',   color: '#818cf8' },
  2: { emoji: '😐', label: 'Meh',     color: '#60a5fa' },
  3: { emoji: '🙂', label: 'Okay',    color: '#34d399' },
  4: { emoji: '😊', label: 'Good',    color: '#f472b6' },
  5: { emoji: '🤩', label: 'Amazing', color: '#fbbf24' },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Habits page uses a different key format — match it exactly */
function habitsKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function getTimePeriod(date = new Date()) {
  const hrs = date.getHours();
  if (hrs >= 5 && hrs < 12)  return 'Morning';
  if (hrs >= 12 && hrs < 17) return 'Afternoon';
  if (hrs >= 17 && hrs < 21) return 'Evening';
  return 'Night';
}

/* ── Load all real data from localStorage ── */
function loadAllData() {
  // Habits
  let habits = [];
  try {
    const raw = localStorage.getItem('planner_habits');
    if (raw) {
      const { habits: h, lastDate } = JSON.parse(raw);
      // HabitsPage uses getFullYear-getMonth-getDate (no padding, 0-indexed month)
      habits = lastDate === habitsKey() ? h : h.map(x => ({ ...x, doneToday: false }));
    }
  } catch (_) {}

  // Notes
  let notes = [];
  try {
    const raw = localStorage.getItem('planner_notes');
    if (raw) notes = JSON.parse(raw);
  } catch (_) {}

  // Water
  let water = { glasses: 0, goal: 8 };
  try {
    const raw = localStorage.getItem('planner_water');
    if (raw) {
      const parsed = JSON.parse(raw);
      water = {
        glasses: parsed.lastDate === todayKey() ? parsed.glasses : 0,
        goal:    parsed.goal ?? 8,
      };
    }
  } catch (_) {}

  // Mood — today's entry
  let mood = null;
  try {
    const raw = localStorage.getItem('planner_moods');
    if (raw) {
      const history = JSON.parse(raw);
      const entry = history[todayKey()];
      if (entry) mood = { ...entry, ...MOOD_MAP[entry.moodId] };
    }
  } catch (_) {}

  return { habits, notes, water, mood };
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════ */

/* ── Progress Ring ── */
function ProgressRing({ pct, size = 110, stroke = 11, gradient = ['#f472b6','#c084fc'] }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 1);
  const id   = `grad-${gradient[0].replace('#','')}`;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} className="dark:stroke-slate-700" />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#${id})`} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black text-slate-700 dark:text-slate-100">{Math.round(pct * 100)}%</span>
      </div>
    </div>
  );
}

/* ── Greeting Banner ── */
function GreetingBanner({ now, habits, water, mood }) {
  const { user } = useApp();
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Ata';
  
  const hrs = now.getHours();
  const { text, icon } =
    hrs < 12 ? { text: 'Good Morning',   icon: '🌅' }
  : hrs < 17 ? { text: 'Good Afternoon', icon: '☀️' }
  :            { text: 'Good Evening',   icon: '🌙' };

  const done  = habits.filter(h => h.doneToday).length;
  const total = habits.length;
  const streak = habits.length ? Math.max(...habits.map(h => h.streak), 0) : 0;

  return (
    <div className="card col-span-full relative overflow-hidden !p-0"
      style={{ background: 'linear-gradient(120deg, #5B6CFF 0%, #8DB4FF 50%, #A78BFA 100%)' }}>
      <div className="relative p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-white/80 text-sm font-bold flex items-center gap-2">
            <span className="text-xl">{icon}</span> {text}
          </p>
          <h2 className="text-white text-3xl sm:text-4xl font-black mt-1 tracking-tight">Hello, {displayName}! 👋</h2>
          <p className="text-white/70 text-sm mt-1.5 font-semibold">
            {DAYS[now.getDay()]}, {MONTHS[now.getMonth()]} {now.getDate()} · Let's make today count ✨
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[
            { v: `🔥 ${streak}`, l: 'best streak' },
            { v: `✅ ${done}/${total}`, l: 'habits today' },
            { v: mood ? `${mood.emoji} ${mood.label}` : '😊 —', l: 'mood today' },
          ].map((s, i) => (
            <div key={i} className="px-4 py-2.5 rounded-2xl bg-white/20 backdrop-blur-sm text-center">
              <p className="text-white font-black text-base">{s.v}</p>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Daily Summary Row ── */
function DailySummary({ habits, water, mood, sessions }) {
  const doneHabits  = habits.filter(h => h.doneToday).length;
  const totalHabits = habits.length;
  return (
    <div className="col-span-full">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x">
        {[
          { icon: '✅', label: 'Habits',  value: totalHabits ? `${doneHabits} / ${totalHabits}` : 'No habits',   bg: 'bg-pink-100',   tc: 'text-pink-700'   },
          { icon: '💧', label: 'Water',   value: `${water.glasses} / ${water.goal} glasses`,                       bg: 'bg-blue-100',   tc: 'text-blue-700'   },
          { icon: '⏱️', label: 'Focus',   value: `${sessions} session${sessions !== 1 ? 's' : ''}`,               bg: 'bg-purple-100', tc: 'text-purple-700' },
          { icon: '😊', label: 'Mood',    value: mood ? `${mood.emoji} ${mood.label}` : 'Not logged',             bg: 'bg-yellow-100', tc: 'text-yellow-700' },
          { icon: '📝', label: 'Notes',   value: `${JSON.parse(localStorage.getItem('planner_notes') || '[]').length} notes`, bg: 'bg-emerald-100', tc: 'text-emerald-700' },
        ].map((p, i) => (
          <div key={i} className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl ${p.bg} flex-shrink-0 snap-start`}>
            <span className="text-xl leading-none">{p.icon}</span>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wide ${p.tc} opacity-70`}>{p.label}</p>
              <p className={`text-sm font-black ${p.tc}`}>{p.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Habit Progress Card ── */
function HabitProgressCard({ habits, navigate, darkMode }) {
  const done  = habits.filter(h => h.doneToday).length;
  const total = habits.length;
  const pct   = total ? done / total : 0;
  const ringColors = ['#f472b6','#c084fc','#60a5fa','#34d399','#fb923c'];

  if (!total) return (
    <div className={`card flex flex-col items-center justify-center gap-3 min-h-48`}>
      <span className="text-4xl">🌱</span>
      <p className={`font-black text-slate-600 dark:text-slate-300`}>No habits yet</p>
      <button onClick={() => navigate('Habits')} className="btn-primary text-xs py-2 px-4">
        + Add your first habit
      </button>
    </div>
  );

  return (
    <div className="card flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-700 dark:text-slate-100 text-base">✅ Habit Progress</h3>
        <span className="badge bg-pink-100 text-pink-600">{done}/{total} done</span>
      </div>
      <div className="flex items-center gap-5">
        <ProgressRing pct={pct} gradient={['#f472b6','#c084fc']} />
        <div className="flex-1 space-y-2 min-w-0">
          {habits.slice(0, 5).map((h, i) => (
            <div key={h.id} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: h.doneToday ? ringColors[i % ringColors.length] : '#e2e8f0' }} />
              <span className={`text-xs font-semibold truncate flex-1 ${h.doneToday ? 'text-slate-600 dark:text-slate-300 line-through opacity-60' : 'text-slate-600 dark:text-slate-300'}`}>
                {h.emoji} {h.name}
              </span>
              <span className="text-[10px] font-black flex-shrink-0"
                style={{ color: h.doneToday ? '#34d399' : '#cbd5e1' }}>
                {h.doneToday ? '✓' : '—'}
              </span>
            </div>
          ))}
          {habits.length > 5 && (
            <p className="text-[10px] text-slate-400 font-semibold">+{habits.length - 5} more habits</p>
          )}
        </div>
      </div>
      {/* Bar */}
      <div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          <span>Today's progress</span><span>{Math.round(pct*100)}%</span>
        </div>
        <div className="h-2 bg-pink-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${pct*100}%`, background: 'linear-gradient(to right,#f472b6,#c084fc)' }} />
        </div>
      </div>
      <button onClick={() => navigate('Habits')} className="text-xs font-bold text-pink-500 hover:text-pink-700 transition-colors text-left">
        View all habits →
      </button>
    </div>
  );
}

/* ── Water Card ── */
function WaterCard({ water, navigate, darkMode }) {
  const { glasses, goal } = water;
  const pct = goal ? Math.min(glasses / goal, 1) : 0;
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-700 dark:text-slate-100 text-base">💧 Water Intake</h3>
        <span className="text-sm font-black text-blue-500">{glasses}/{goal} glasses</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: goal }).map((_, i) => (
          <div key={i} className={`relative w-9 h-12 rounded-b-2xl rounded-t-lg border-2 overflow-hidden transition-all
            ${i < glasses ? 'border-blue-300' : 'border-slate-200 dark:border-slate-600'}`}>
            {i < glasses && <div className="absolute inset-0 bg-gradient-to-t from-blue-400 to-blue-300" />}
            {i >= glasses && <div className="absolute inset-0 bg-slate-50 dark:bg-slate-700" />}
          </div>
        ))}
      </div>
      <div className="h-2.5 bg-blue-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct*100}%`, background: 'linear-gradient(to right,#60a5fa,#38bdf8)' }} />
      </div>
      <button onClick={() => navigate('Water')} className="text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors">
        Open Water Tracker →
      </button>
    </div>
  );
}

/* ── Mood Card ── */
function MoodCard({ mood, navigate }) {
  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-700 dark:text-slate-100 text-base">😊 Today's Mood</h3>
        {mood && <span className="text-xs font-bold text-slate-400">{timeAgo(new Date(mood.savedAt).getTime())}</span>}
      </div>
      {mood ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <span className="text-6xl">{mood.emoji}</span>
          <p className="font-black text-lg" style={{ color: mood.color }}>{mood.label}</p>
          {mood.note && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center px-2 line-clamp-2">
              "{mood.note}"
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6">
          <span className="text-4xl">🌿</span>
          <p className="text-sm font-semibold text-slate-500">Mood not logged yet today</p>
          <button onClick={() => navigate('Mood')} className="btn-primary text-xs py-2 px-4">
            Log your mood
          </button>
        </div>
      )}
      <button onClick={() => navigate('Mood')} className="text-xs font-bold text-pink-500 hover:text-pink-700 transition-colors">
        Open Mood Journal →
      </button>
    </div>
  );
}

/* ── Notes Card ── */
const NOTE_COLORS = {
  pink:   { bg: '#fdf2f8', border: '#f9a8d4', text: '#831843', accent: '#f472b6' },
  purple: { bg: '#f5f3ff', border: '#c4b5fd', text: '#4c1d95', accent: '#a78bfa' },
  blue:   { bg: '#eff6ff', border: '#93c5fd', text: '#1e3a8a', accent: '#60a5fa' },
  mint:   { bg: '#ecfdf5', border: '#6ee7b7', text: '#064e3b', accent: '#34d399' },
  peach:  { bg: '#fff7ed', border: '#fdba74', text: '#7c2d12', accent: '#fb923c' },
  lemon:  { bg: '#fefce8', border: '#fde68a', text: '#713f12', accent: '#facc15' },
  rose:   { bg: '#fff1f2', border: '#fda4af', text: '#881337', accent: '#fb7185' },
  slate:  { bg: '#f8fafc', border: '#cbd5e1', text: '#1e293b', accent: '#94a3b8' },
};

function NotesCard({ notes, navigate, darkMode }) {
  const recent = [...notes]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt)
    .slice(0, 4);

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-700 dark:text-slate-100 text-base">📝 Recent Notes</h3>

      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <span className="text-4xl">📋</span>
          <p className="text-sm font-semibold text-slate-500">No notes yet</p>
          <button onClick={() => navigate('Notes')} className="btn-primary text-xs py-2 px-4">
            Create your first note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recent.map(note => {
            const c = NOTE_COLORS[note.color] || NOTE_COLORS.pink;
            return (
              <div key={note.id}
                onClick={() => navigate('Notes')}
                className="p-3.5 rounded-2xl border cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                style={{ background: darkMode ? `${c.accent}12` : c.bg, borderColor: darkMode ? `${c.accent}30` : c.border }}>
                {note.pinned && <span className="text-xs">📌 </span>}
                {note.title && (
                  <p className="font-black text-sm leading-snug mb-1 truncate"
                    style={{ color: darkMode ? '#f1f5f9' : c.text }}>
                    {note.title}
                  </p>
                )}
                <p className="text-xs leading-relaxed line-clamp-2"
                  style={{ color: darkMode ? '#94a3b8' : c.text + 'aa' }}>
                  {note.body}
                </p>
                <p className="text-[10px] mt-1.5 font-semibold" style={{ color: c.accent }}>
                  {timeAgo(note.updatedAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => navigate('Notes')} className="text-xs font-bold text-pink-500 hover:text-pink-700 transition-colors text-center">
        View all notes →
      </button>
    </div>
  );
}

/* ── Schedule-driven Today's Tasks card ── */
const SLOT_HOURS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
const CAT_COLORS = {
  work:     { dot: '#5B6CFF', bg: 'bg-indigo-100',  text: 'text-indigo-700'  },
  personal: { dot: '#A78BFA', bg: 'bg-violet-100',  text: 'text-violet-700'  },
  health:   { dot: '#22C55E', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  focus:    { dot: '#8DB4FF', bg: 'bg-sky-100',     text: 'text-sky-700'     },
  break:    { dot: '#F59E0B', bg: 'bg-amber-100',   text: 'text-amber-700'   },
};

function slotLabel(hour) {
  const ampm = hour < 12 ? 'AM' : 'PM';
  const h12  = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:00 ${ampm}`;
}

function loadScheduleSlots() {
  try {
    const raw = localStorage.getItem('planner_schedule');
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}

function PriorityTasksCard({ navigate, darkMode }) {
  const { user } = useApp();
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(false);
  const now         = new Date();
  const currentHour = now.getHours();

  const loadSlots = useCallback(async () => {
    if (!supabase || !user) {
      try {
        const raw = localStorage.getItem('planner_schedule');
        setSlots(raw ? JSON.parse(raw) : {});
      } catch (_) {
        setSlots({});
      }
      return;
    }

    setLoading(true);
    try {
      const todayISO = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const today = todayISO();
      console.log('Dashboard loading slots for today:', today, 'user:', user.id);
      const { data, error } = await supabase
        .from('schedule_tasks')
        .select('date, time_slot, task, completed')
        .eq('user_id', user.id)
        .eq('date', today);

      if (error) throw error;

      console.log('Dashboard slots data from DB:', data);

      const init = {};
      SLOT_HOURS.forEach(h => {
        init[h] = { task: '', done: false, cat: 'work', startTime: `${String(h).padStart(2,'0')}:00`, endTime: `${String(Math.min(h + 1, 23)).padStart(2,'0')}:00` };
      });

      if (data) {
        data.forEach(row => {
          const hour = parseInt(row.time_slot);
          if (!isNaN(hour) && init[hour] !== undefined) {
            let parsedTask = row.task;
            let cat = 'work';
            let startTime = `${String(hour).padStart(2,'0')}:00`;
            let endTime = `${String(Math.min(hour + 1, 23)).padStart(2,'0')}:00`;
            try {
              if (row.task.startsWith('{')) {
                const json = JSON.parse(row.task);
                parsedTask = json.task || '';
                cat = json.cat || 'work';
                startTime = json.startTime || startTime;
                endTime = json.endTime || endTime;
              }
            } catch (_) {}

            init[hour] = {
              task: parsedTask,
              done: row.completed,
              cat,
              startTime,
              endTime
            };
          }
        });
      }
      console.log('Dashboard final slots map:', init);
      setSlots(init);
    } catch (err) {
      console.error('Failed to load dashboard schedule tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  /* Re-read when schedule changes */
  useEffect(() => {
    window.addEventListener('planner-data-changed', loadSlots);
    return () => window.removeEventListener('planner-data-changed', loadSlots);
  }, [loadSlots]);

  const getMins = (timeStr, defaultHour) => {
    if (timeStr) {
      const [h, m] = timeStr.split(':').map(Number);
      if (!isNaN(h)) return h * 60 + (m || 0);
    }
    return defaultHour * 60;
  };

  const nowMin = now.getHours() * 60 + now.getMinutes();

  /* Build display list: current slot + next 2 with tasks, sorted chronologically */
  const filled = SLOT_HOURS
    .filter(h => slots[h]?.task?.trim())
    .map(h => {
      const slot = slots[h];
      const startMin = getMins(slot.startTime, h);
      const endMin = getMins(slot.endTime, h + 1);
      const isCurrent = nowMin >= startMin && nowMin < endMin;
      const isPast = nowMin >= endMin;
      
      const timeLabel = (t) => {
        if (!t) return '';
        const [hStr, mStr] = t.split(':');
        const hVal = parseInt(hStr);
        const mVal = parseInt(mStr || '0');
        if (isNaN(hVal)) return t;
        const ampm = hVal < 12 ? 'AM' : 'PM';
        const h12 = hVal === 0 ? 12 : hVal > 12 ? hVal - 12 : hVal;
        return `${h12}:${String(mVal).padStart(2,'0')} ${ampm}`;
      };

      return {
        hour: h,
        label: slot.startTime ? timeLabel(slot.startTime) : slotLabel(h),
        startMin,
        endMin,
        isCurrent,
        isPast,
        ...slot
      };
    })
    .sort((a, b) => a.startMin - b.startMin);

  const current  = filled.find(s => s.isCurrent) || null;
  const upcoming = filled.filter(s => !s.isPast && !s.isCurrent).slice(0, current ? 2 : 3);
  const display  = [...(current ? [current] : []), ...upcoming];

  const doneCount  = filled.filter(s => s.done).length;
  const totalCount = filled.length;

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-700 dark:text-slate-100 text-base">📅 Today's Schedule</h3>
        <span className="badge bg-indigo-100 text-indigo-600">
          {doneCount}/{totalCount} done
        </span>
      </div>

      {/* Slots */}
      {display.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <span className="text-4xl">📅</span>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No tasks scheduled today</p>
          <button onClick={() => navigate('Schedule')} className="btn-primary text-xs py-2 px-4">
            Open Schedule
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {display.map(slot => {
            const cat = CAT_COLORS[slot.cat] || CAT_COLORS.work;
            return (
              <div key={slot.hour}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all
                  ${slot.isCurrent
                    ? darkMode
                      ? 'border-indigo-500/40 bg-indigo-500/10'
                      : 'border-indigo-200 bg-indigo-50'
                    : darkMode
                      ? 'border-slate-700/50 bg-slate-800/40'
                      : 'border-slate-100 bg-white/60'
                  }
                  ${slot.done ? 'opacity-55' : ''}`}
              >
                {/* Current indicator pulse */}
                {slot.isCurrent && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                    style={{ background: '#5B6CFF' }} />
                )}

                {/* Done tick */}
                {!slot.isCurrent && (
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0
                    ${slot.done ? 'border-transparent' : 'border-indigo-200 dark:border-slate-600'}`}
                    style={slot.done ? { background: 'linear-gradient(135deg,#5B6CFF,#A78BFA)' } : {}}>
                    {slot.done && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate
                    ${slot.done
                      ? 'line-through text-slate-400'
                      : darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                    {slot.task}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.dot }} />
                    <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {slot.label}
                    </span>
                    {slot.isCurrent && (
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wide">· Now</span>
                    )}
                  </div>
                </div>

                {/* Category badge */}
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full capitalize flex-shrink-0 ${cat.bg} ${cat.text}`}>
                  {slot.cat}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <button onClick={() => navigate('Schedule')}
        className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors text-center">
        View all in Schedule →
      </button>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
      {/* Greeting Banner skeleton */}
      <div className="h-44 w-full rounded-3xl bg-slate-200 dark:bg-slate-700" />
      
      {/* Daily Summary skeleton */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-36 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
        ))}
      </div>
      
      {/* Widgets grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`h-60 rounded-3xl bg-slate-200 dark:bg-slate-700 ${i === 5 ? 'col-span-full' : ''}`} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { darkMode, setActiveNav, user } = useApp();
  const [now,     setNow]     = useState(new Date());
  const [data,    setData]    = useState({ habits: [], notes: [], water: { glasses: 0, goal: 8 }, mood: null });
  const [sessions]            = useState(0); // focus sessions from timer (resets on page reload)

  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  const loadAllDBData = useCallback(async () => {
    if (isInitialLoad.current) {
      setLoading(true);
    }
    if (!supabase || !user) {
      const fallbackData = loadAllData();
      setData(fallbackData);
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
      return fallbackData;
    }

    try {
      const today = todayKey();
      
      const [waterRes, habitsRes, logsRes, notesRes, moodRes] = await Promise.all([
        supabase
          .from('water_logs')
          .select('glasses, goal')
          .eq('user_id', user.id)
          .eq('logged_date', today)
          .maybeSingle(),
        supabase
          .from('habits')
          .select('id, name, icon, color')
          .eq('user_id', user.id),
        supabase
          .from('habit_logs')
          .select('habit_id, completed_date, streak_count')
          .eq('user_id', user.id),
        supabase
          .from('notes')
          .select('id, title, body, color, pinned, created_at')
          .eq('user_id', user.id),
        supabase
          .from('mood_logs')
          .select('mood, note')
          .eq('user_id', user.id)
          .eq('logged_date', today)
          .maybeSingle()
      ]);

      if (waterRes.error) throw waterRes.error;
      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;
      if (notesRes.error) throw notesRes.error;
      if (moodRes.error) throw moodRes.error;

      const waterData = waterRes.data;
      const dbHabits = habitsRes.data;
      const dbLogs = logsRes.data;
      const notesData = notesRes.data;
      const moodData = moodRes.data;

      const water = {
        glasses: waterData ? waterData.glasses : 0,
        goal: waterData ? waterData.goal : 8
      };

      const habits = [];
      if (dbHabits) {
        const todayDate = today;
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth()+1).padStart(2,'0')}-${String(yesterdayDate.getDate()).padStart(2,'0')}`;

        dbHabits.forEach(h => {
          const logs = (dbLogs || []).filter(l => l.habit_id === h.id);
          logs.sort((a, b) => b.completed_date.localeCompare(a.completed_date));

          const doneToday = logs.some(l => l.completed_date === todayDate);
          const doneYesterday = logs.some(l => l.completed_date === yesterday);

          let streak = 0;
          if (doneToday) {
            const logToday = logs.find(l => l.completed_date === todayDate);
            streak = logToday ? logToday.streak_count : 0;
          } else if (doneYesterday) {
            const logYesterday = logs.find(l => l.completed_date === yesterday);
            streak = logYesterday ? logYesterday.streak_count : 0;
          }

          const bestStreak = logs.length > 0 ? Math.max(...logs.map(l => l.streak_count)) : 0;

          habits.push({
            id: h.id,
            name: h.name,
            icon: h.icon || '⭐',
            theme: h.color || 'pink',
            streak,
            bestStreak,
            doneToday
          });
        });
      }

      const notes = (notesData || []).map(row => ({
        id: row.id,
        title: row.title || '',
        body: row.body || '',
        color: row.color || 'pink',
        pinned: row.pinned,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.created_at).getTime(),
      }));

      let mood = null;
      if (moodData) {
        const moodId = Number(moodData.mood);
        mood = {
          moodId,
          note: moodData.note || '',
          ...MOOD_MAP[moodId]
        };
      }

      const freshData = { habits, notes, water, mood };
      setData(freshData);
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
      return freshData;
    } catch (err) {
      console.error('Failed to load dashboard data from DB:', err);
      const fallbackData = loadAllData();
      setData(fallbackData);
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
      return fallbackData;
    }
  }, [user]);

  useEffect(() => {
    loadAllDBData();
  }, [loadAllDBData]);

  /* Refresh data every 30s */
  useEffect(() => {
    const id = setInterval(loadAllDBData, 30_000);
    return () => clearInterval(id);
  }, [loadAllDBData]);

  /* Re-read on planner-data-changed event */
  useEffect(() => {
    const handler = () => {
      loadAllDBData();
    };
    window.addEventListener('planner-data-changed', handler);
    return () => window.removeEventListener('planner-data-changed', handler);
  }, [loadAllDBData]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const navigate = useCallback((page) => setActiveNav(page), [setActiveNav]);
  const { habits, notes, water, mood } = data;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Greeting (full width) ── */}
        <GreetingBanner now={now} habits={habits} water={water} mood={mood} />

        {/* ── Daily Summary (full width) ── */}
        <DailySummary habits={habits} water={water} mood={mood} sessions={sessions} />

        {/* ── Habit Progress ── */}
        <HabitProgressCard habits={habits} navigate={navigate} darkMode={darkMode} />

        {/* ── Water ── */}
        <WaterCard water={water} navigate={navigate} darkMode={darkMode} />

        {/* ── Tasks ── */}
        <PriorityTasksCard navigate={navigate} darkMode={darkMode} />

        {/* ── Mood ── */}
        <MoodCard mood={mood} navigate={navigate} />

        {/* ── Notes (full width) ── */}
        <div className="col-span-full">
          <NotesCard notes={notes} navigate={navigate} darkMode={darkMode} />
        </div>

      </div>
    </div>
  );
}
