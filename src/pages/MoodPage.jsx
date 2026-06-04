import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import PastelIcon from '../components/PastelIcon';
import { ChevronLeft, ChevronRight, Check, Calendar, Flame, FileText, Edit2, Save, BarChart2, List, Frown, Meh, Smile, Laugh } from 'lucide-react';

const ICON_MAP = { Frown, Meh, Smile, Laugh };

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const MOODS = [
  { id: 1, iconName: 'Frown', label: 'Rough',    color: '#818cf8', bg: '#eef2ff', darkBg: '#1e1b4b', glow: '#818cf830', ring: '#818cf8' },
  { id: 2, iconName: 'Meh',   label: 'Neutral',  color: '#60a5fa', bg: '#eff6ff', darkBg: '#1e3a5f', glow: '#60a5fa30', ring: '#60a5fa' },
  { id: 3, iconName: 'Smile', label: 'Okay',     color: '#34d399', bg: '#ecfdf5', darkBg: '#064e3b', glow: '#34d39930', ring: '#34d399' },
  { id: 4, iconName: 'Smile', label: 'Good',     color: '#3B66E8', bg: '#fdf2f8', darkBg: '#4a0e2b', glow: '#3B66E830', ring: '#3B66E8' },
  { id: 5, iconName: 'Laugh', label: 'Amazing',  color: '#fbbf24', bg: '#fffbeb', darkBg: '#451a03', glow: '#fbbf2430', ring: '#fbbf24' },
];
const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.id, m]));

const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ── Seed demo data ── */
function seedData() {
  const data = {};
  const notes = [
    'Feeling a bit off today, rough morning.',
    'Just an average day, nothing special.',
    'Getting better! Had a productive afternoon.',
    'Really enjoyed spending time with family.',
    'Best day in weeks! Everything clicked.',
    'Tired but okay.',
    'Productive work day.',
    'Bit stressed about deadlines.',
    'Great workout session!',
    'Feeling grateful today',
    'Rough commute but otherwise fine',
    'Amazing sunset walk',
    'Low energy, need rest.',
    'Accomplished a lot today!',
  ];
  const today = new Date();
  for (let i = 60; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateStr(d);
    if (Math.random() > 0.15) {
      const moodId = Math.floor(Math.random() * 5) + 1;
      data[key] = {
        moodId,
        note: Math.random() > 0.4 ? notes[Math.floor(Math.random() * notes.length)] : '',
        savedAt: new Date(d).toISOString(),
      };
    }
  }
  return data;
}

function loadMoods() {
  try {
    const raw = localStorage.getItem('planner_moods');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {};
}

function saveMoods(data) {
  localStorage.setItem('planner_moods', JSON.stringify(data));
}

/* ═══════════════════════════════════════════════════════
   MOOD SELECTOR
═══════════════════════════════════════════════════════ */
function MoodSelector({ selected, onSelect, darkMode }) {
  return (
    <div className="flex items-end justify-center gap-1.5 sm:gap-5">
      {MOODS.map((m, i) => {
        const isSelected = selected === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="flex flex-col items-center gap-2 transition-all duration-300 group"
            style={{ transform: isSelected ? 'translateY(-6px)' : 'translateY(0)' }}
          >
            {/* Emoji bubble */}
            <div
              className={`rounded-3xl flex items-center justify-center transition-all duration-300 relative
                ${isSelected ? 'w-14 h-14 sm:w-[88px] sm:h-[88px]' : 'w-10 h-10 sm:w-[68px] sm:h-[68px]'}
              `}
              style={{
                background: isSelected
                  ? `radial-gradient(circle at 35% 30%, ${m.color}40, ${m.color}20)`
                  : darkMode ? '#1e293b' : '#f8fafc',
                border: `2px solid ${isSelected ? m.color : 'transparent'}`,
                boxShadow: isSelected
                  ? `0 8px 32px ${m.glow}, 0 0 0 6px ${m.color}20`
                  : 'none',
              }}
            >
              {(() => {
                const IconComp = ICON_MAP[m.iconName] || Smile;
                return (
                  <IconComp
                    size={isSelected ? 36 : 28}
                    strokeWidth={1.5}
                    style={{ color: isSelected ? m.color : (darkMode ? '#94a3b8' : '#64748b') }}
                    className="transition-all duration-300"
                  />
                );
              })()}
              {/* Glow ring */}
              {isSelected && (
                <div className="absolute inset-0 rounded-3xl animate-ping opacity-20"
                  style={{ background: m.color, animationDuration: '2s' }} />
              )}
            </div>
            {/* Label */}
            <span
              className="text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200"
              style={{ color: isSelected ? m.color : darkMode ? '#64748b' : '#94a3b8' }}
            >
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   7-DAY HISTORY CHART
═══════════════════════════════════════════════════════ */
function WeekChart({ history, darkMode }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key  = dateStr(d);
    const entry = history[key];
    return { d, key, entry, isToday: i === 6 };
  });

  const maxId = 5;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        {days.map(({ d, key, entry, isToday }, i) => {
          const mood = entry ? MOOD_MAP[entry.moodId] : null;
          const barH = mood ? (mood.id / maxId) * 100 : 8;

          return (
            <div key={key} className="flex-1 flex flex-col items-center gap-2">
              {/* Emoji */}
              <div className="text-xl leading-none h-8 flex items-center">
                {mood ? (
                  (() => {
                    const Icon = ICON_MAP[mood.iconName] || Smile;
                    return <Icon size={18} style={{ color: mood.color }} strokeWidth={1.5} />;
                  })()
                ) : (
                  <span className={`text-sm ${darkMode ? 'text-slate-700' : 'text-slate-200'}`}>·</span>
                )}
              </div>

              {/* Bar */}
              <div className="w-full flex justify-center">
                <div
                  className="w-6 rounded-t-xl transition-all duration-700 relative"
                  style={{
                    height: `${Math.max(barH, 8)}px`,
                    background: mood
                      ? `linear-gradient(to top, ${mood.color}cc, ${mood.color}55)`
                      : darkMode ? '#1e293b' : '#f1f5f9',
                    boxShadow: mood ? `0 4px 12px ${mood.glow}` : 'none',
                  }}
                >
                  {isToday && (
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Day label */}
              <div className="text-center">
                <p className={`text-[10px] font-black uppercase tracking-wider
                  ${isToday ? 'text-[#4F7CFF]' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {DAYS_SHORT[d.getDay()]}
                </p>
                <p className={`text-[9px] font-semibold ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                  {d.getDate()}
                </p>
              </div>

              {/* Mood label */}
              {mood && (
                <p className="text-[9px] font-bold text-center leading-tight" style={{ color: mood.color }}>
                  {mood.label}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MONTHLY CALENDAR
═══════════════════════════════════════════════════════ */
function MonthCalendar({ history, darkMode }) {
  const [viewDate, setViewDate] = useState(new Date());
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date();

  const prevMonth = () => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; });
  const nextMonth = () => setViewDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const avgMoodId = () => {
    const entries = Object.entries(history).filter(([k]) => {
      const d = new Date(k + 'T00:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    });
    if (!entries.length) return null;
    const avg = entries.reduce((s, [,v]) => s + v.moodId, 0) / entries.length;
    return Math.round(avg);
  };

  const monthAvg = avgMoodId();
  const monthAvgMood = monthAvg ? MOOD_MAP[monthAvg] : null;

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer
            ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-[#4F7CFF]'}`}>
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </button>

        <div className="text-center">
          <p className={`font-black text-base ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
            {MONTHS[month]} {year}
          </p>
          {monthAvgMood && (
            <p className="text-xs font-bold flex items-center justify-center gap-1" style={{ color: monthAvgMood.color }}>
              avg {(() => {
                const Icon = ICON_MAP[monthAvgMood.iconName] || Smile;
                return <Icon size={12} strokeWidth={2} className="inline-block" />;
              })()} {monthAvgMood.label}
            </p>
          )}
        </div>

        <button onClick={nextMonth}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer
            ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-[#4F7CFF]'}`}>
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_SHORT.map(d => (
          <div key={d} className={`text-center text-[10px] font-black uppercase tracking-wider py-1
            ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const key  = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const entry = history[key];
          const mood = entry ? MOOD_MAP[entry.moodId] : null;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

          return (
            <div key={key}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 hover:scale-110 cursor-default group
                ${isToday ? 'ring-2 ring-pink-400 ring-offset-1' : ''}`}
              style={{
                background: mood
                  ? `linear-gradient(135deg, ${mood.color}30, ${mood.color}15)`
                  : darkMode ? '#1e293b' : '#f8fafc',
              }}
              title={entry ? `${mood?.label}${entry.note ? ` · ${entry.note.slice(0, 40)}` : ''}` : ''}
            >
              <span className={`text-[10px] font-black leading-none mb-0.5
                ${isToday ? 'text-[#4F7CFF]' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {day}
              </span>
              {mood && (
                (() => {
                  const Icon = ICON_MAP[mood.iconName] || Smile;
                  return <Icon size={14} style={{ color: mood.color }} strokeWidth={2} />;
                })()
              )}
              {!mood && <span className={`text-xs ${darkMode ? 'text-slate-700' : 'text-slate-200'}`}>·</span>}

              {/* Tooltip */}
              {entry?.note && (
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold w-40 text-center pointer-events-none z-20
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg
                  ${darkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 border border-slate-100'}`}>
                  {entry.note.slice(0, 60)}{entry.note.length > 60 ? '…' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RECENT ENTRIES (mobile-friendly horizontal scroll)
═══════════════════════════════════════════════════════ */
function RecentEntries({ history, darkMode }) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key   = dateStr(d);
    const entry = history[key];
    return { d, key, entry };
  }).filter(x => x.entry);

  if (!days.length) return (
    <div className={`text-center py-6 text-sm font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
      No entries yet. Start tracking your mood!
    </div>
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-none">
      {days.map(({ d, key, entry }) => {
        const mood = MOOD_MAP[entry.moodId];
        const label = d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
        return (
          <div key={key}
            className="flex-shrink-0 w-32 rounded-2xl p-3 snap-start transition-all hover:scale-105 cursor-default"
            style={{ background: `linear-gradient(135deg, ${mood.color}22, ${mood.color}0a)`, border: `1.5px solid ${mood.color}40` }}
          >
            <div className="flex justify-center mb-2">
              {(() => {
                const Icon = ICON_MAP[mood.iconName] || Smile;
                return <Icon size={24} style={{ color: mood.color }} strokeWidth={1.5} />;
              })()}
            </div>
            <p className="text-xs font-black text-center" style={{ color: mood.color }}>{mood.label}</p>
            <p className={`text-[10px] text-center font-semibold mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
            {entry.note && (
              <p className={`text-[10px] mt-2 leading-relaxed line-clamp-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                "{entry.note}"
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STATS STRIP
═══════════════════════════════════════════════════════ */
function StatsStrip({ history, darkMode }) {
  const entries = Object.entries(history);
  const total   = entries.length;
  if (!total) return null;

  const freq = [1,2,3,4,5].map(id => ({
    id,
    count: entries.filter(([,v]) => v.moodId === id).length,
  })).sort((a,b) => b.count - a.count);

  const topMood = MOOD_MAP[freq[0].id];
  const streak  = (() => {
    let s = 0;
    const d = new Date();
    while (true) {
      const k = dateStr(d);
      if (!history[k]) break;
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  })();

  const avgId = Math.round(entries.reduce((s,[,v]) => s + v.moodId, 0) / total);
  const avgMood = MOOD_MAP[avgId] || MOODS[2];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { isMood: true, iconName: topMood.iconName, label: 'Most frequent', val: topMood.label, color: topMood.color, bg: `${topMood.color}15` },
        { isMood: true, iconName: avgMood.iconName, label: 'Average mood',  val: avgMood.label, color: avgMood.color, bg: `${avgMood.color}15` },
        { iconName: 'Calendar', colorType: 'notes',          label: 'Total entries', val: total },
        { iconName: 'Flame',    colorType: 'schedule',       label: 'Day streak',    val: `${streak} days` },
      ].map((s, i) => (
        <div key={i} className={`rounded-2xl p-4 flex flex-col gap-1.5 ${darkMode ? 'bg-slate-800/70 border border-slate-700/50' : 'bg-white/80 border border-slate-100'} shadow-sm`}>
          {s.isMood ? (
            <PastelIcon name={s.iconName} colorType="mood" circleSize="w-8 h-8" size={16} />
          ) : (
            <PastelIcon name={s.iconName} colorType={s.colorType} circleSize="w-8 h-8" size={16} />
          )}
          <div className="mt-1">
            <p className={`text-lg font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'} leading-none`}>{s.val}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUCCESS TOAST
═══════════════════════════════════════════════════════ */
function Toast({ mood, visible, darkMode }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in pointer-events-none">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl
        ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-blue-100'}`}
        style={{ boxShadow: `0 8px 32px ${mood?.glow || '#3B66E830'}` }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `linear-gradient(135deg, ${mood?.color}40, ${mood?.color}20)` }}>
          {(() => {
            const Icon = ICON_MAP[mood?.iconName] || Smile;
            return <Icon size={18} style={{ color: mood?.color }} strokeWidth={1.5} />;
          })()}
        </div>
        <div>
          <p className={`text-sm font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
            Mood saved!
          </p>
          <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Feeling <span className="font-black" style={{ color: mood?.color }}>{mood?.label}</span> today
          </p>
        </div>
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: mood?.color }}>
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}

function MoodSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse max-w-7xl mx-auto">
      <div className="space-y-5">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-56 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-80 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-32 rounded-3xl bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MOOD PAGE
═══════════════════════════════════════════════════════ */
export default function MoodPage() {
  const { darkMode, user, showToast } = useApp();
  const [history,   setHistory]   = useState({});
  const [selected,  setSelected]  = useState(null);
  const [note,      setNote]       = useState('');
  const [toast,     setToast]      = useState(false);
  const [charCount, setCharCount]  = useState(0);
  const [loading,   setLoading]   = useState(false);

  const today = todayStr();
  const todayEntry = history[today];
  const todayMood  = todayEntry ? MOOD_MAP[todayEntry.moodId] : null;

  // Load from DB or fallback
  const loadMoodData = useCallback(async () => {
    if (!supabase || !user) {
      const nextHistory = loadMoods();
      setHistory(nextHistory);
      const todayE = nextHistory[today];
      if (todayE) {
        setSelected(todayE.moodId);
        setNote(todayE.note || '');
        setCharCount((todayE.note || '').length);
      } else {
        setSelected(null);
        setNote('');
        setCharCount(0);
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('logged_date, mood, note')
        .eq('user_id', user.id);

      if (error) throw error;

      const dbHistory = {};
      if (data) {
        data.forEach(row => {
          dbHistory[row.logged_date] = {
            moodId: Number(row.mood),
            note: row.note || '',
            savedAt: row.logged_date + 'T12:00:00.000Z'
          };
        });
      }

      setHistory(dbHistory);

      const todayE = dbHistory[today];
      if (todayE) {
        setSelected(todayE.moodId);
        setNote(todayE.note || '');
        setCharCount((todayE.note || '').length);
      } else {
        setSelected(null);
        setNote('');
        setCharCount(0);
      }
    } catch (err) {
      console.error('Failed to load mood logs:', err);
      // Fallback
      const nextHistory = loadMoods();
      setHistory(nextHistory);
      const todayE = nextHistory[today];
      if (todayE) {
        setSelected(todayE.moodId);
        setNote(todayE.note || '');
        setCharCount((todayE.note || '').length);
      }
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  // Load water data on mount
  useEffect(() => {
    loadMoodData();
  }, [loadMoodData]);

  /* Listen to custom event to reload mood entries */
  useEffect(() => {
    const handler = () => {
      loadMoodData();
    };
    window.addEventListener('planner-data-changed', handler);
    return () => window.removeEventListener('planner-data-changed', handler);
  }, [loadMoodData]);

  const syncMoodToDB = async (moodId, noteText, prevHistory) => {
    localStorage.setItem('last_action_mood', new Date().toISOString());
    if (!supabase || !user) {
      const updated = {
        ...prevHistory,
        [today]: { moodId, note: noteText.trim(), savedAt: new Date().toISOString() },
      };
      setHistory(updated);
      saveMoods(updated);
      window.dispatchEvent(new Event('planner-data-changed'));
      setToast(true);
      setTimeout(() => setToast(false), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('mood_logs')
        .upsert({
          user_id: user.id,
          logged_date: today,
          mood: String(moodId),
          note: noteText.trim()
        }, { onConflict: 'user_id,logged_date' });

      if (error) throw error;
      window.dispatchEvent(new Event('planner-data-changed'));
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } catch (err) {
      console.error('Failed to sync mood log:', err);
      // Revert optimistic updates
      setHistory(prevHistory);
      showToast('Failed to save mood log', 'error', {
        label: 'Retry',
        callback: () => syncMoodToDB(moodId, noteText, prevHistory)
      });
    }
  };

  const handleSave = useCallback(() => {
    if (!selected) return;
    const prevHistory = { ...history };
    // Optimistically update locally
    const nextHistory = {
      ...history,
      [today]: { moodId: selected, note: note.trim(), savedAt: new Date().toISOString() }
    };
    setHistory(nextHistory);
    syncMoodToDB(selected, note, prevHistory);
  }, [selected, note, history, today, user]);

  const handleNote = (val) => {
    if (val.length > 280) return;
    setNote(val);
    setCharCount(val.length);
  };

  const sel = selected ? MOOD_MAP[selected] : null;

  return (
    <>
      <Toast mood={sel} visible={toast} darkMode={darkMode} />

      <div className="min-h-screen animate-fade-in p-4 sm:p-6 lg:p-8">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-6">
          <PastelIcon name="Smile" colorType="mood" circleSize="w-12 h-12" size={22} />
          <div>
            <h1 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'} leading-none`}>
              Mood Journal
            </h1>
            <p className={`text-sm font-semibold mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
              {todayMood && (
                <span className="ml-2 inline-flex items-center gap-1">
                  · Today: {(() => {
                    const Icon = ICON_MAP[todayMood.iconName] || Smile;
                    return <Icon size={12} className="inline-block" style={{ color: todayMood.color }} strokeWidth={2.5} />;
                  })()} {todayMood.label}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Desktop: 2-col, Mobile: 1-col ── */}
        {loading ? (
          <MoodSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ════ LEFT COLUMN ════ */}
            <div className="space-y-5">

              {/* Mood selector card */}
              <div className={`rounded-3xl p-4 sm:p-8 border shadow-sm
                ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-white/90'}
                ${sel ? `shadow-lg` : ''}`}
                style={sel ? { boxShadow: `0 8px 32px ${sel.glow}` } : {}}
              >
                {/* Heading */}
                <div className="text-center mb-8">
                  <h2 className={`text-lg font-black mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                    How are you feeling today?
                  </h2>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {sel ? `You selected: ${sel.label}` : 'Tap an icon to log your mood'}
                  </p>
                </div>

                {/* Big emoji buttons */}
                <MoodSelector selected={selected} onSelect={setSelected} darkMode={darkMode} />

                {/* Selected mood banner */}
                {sel && (
                  <div className="mt-8 py-3 px-5 rounded-2xl text-center animate-fade-in"
                    style={{ background: `linear-gradient(135deg, ${sel.color}22, ${sel.color}0a)`, border: `1px solid ${sel.color}30` }}>
                    <p className="text-sm font-black flex items-center justify-center gap-1.5" style={{ color: sel.color }}>
                      {(() => {
                        const Icon = ICON_MAP[sel.iconName] || Smile;
                        return <Icon size={16} strokeWidth={2} />;
                      })()} {
                        sel.id === 1 ? "It's okay to not be okay"
                        : sel.id === 2 ? "A quiet day is still a good day"
                        : sel.id === 3 ? "You're doing just fine"
                        : sel.id === 4 ? "Glad you're feeling good!"
                        : "What an amazing day!"
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Note textarea */}
              <div className={`rounded-3xl p-6 border shadow-sm
                ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-white/90'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-black text-base flex items-center gap-1.5 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                    <FileText size={16} className="text-[#4F7CFF]" strokeWidth={1.5} />
                    <span>Mood Note</span>
                  </h3>
                  <span className={`text-xs font-bold ${charCount > 240 ? 'text-rose-400' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    {charCount}/280
                  </span>
                </div>
                <textarea
                  value={note}
                  onChange={e => handleNote(e.target.value)}
                  placeholder="What's on your mind? How was your day? Write anything…"
                  rows={5}
                  className={`w-full rounded-2xl p-4 text-sm font-medium resize-none outline-none transition-all
                    focus:ring-2 border
                    ${darkMode
                      ? 'bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-pink-400/30 focus:border-pink-400/50'
                      : 'bg-slate-50/80 border-slate-200 text-slate-700 placeholder-slate-400 focus:ring-pink-300/50 focus:border-pink-300'
                    }`}
                />

                {/* Quick prompts */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <p className={`text-[11px] font-black uppercase tracking-wider w-full ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Quick prompts
                  </p>
                  {['Grateful for…', 'Today I accomplished…', 'I felt challenged by…', 'Tomorrow I want to…'].map(p => (
                    <button key={p}
                      onClick={() => handleNote(note ? `${note} ${p}` : p)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:scale-105
                        ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-[#4F7CFF]'}`}>
                      {p}
                    </button>
                  ))}
                </div>

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={!selected}
                  className={`w-full mt-5 py-3.5 rounded-2xl text-sm font-black text-white transition-all duration-200
                    ${selected
                      ? 'hover:shadow-xl hover:-translate-y-0.5 active:scale-95'
                      : 'opacity-40 cursor-not-allowed'
                    }`}
                  style={{
                    background: selected
                      ? `linear-gradient(135deg, ${sel?.color}, ${sel?.color}bb)`
                      : '#94a3b8',
                    boxShadow: selected ? `0 8px 24px ${sel?.glow}` : 'none',
                  }}
                >
                  {todayEntry ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Edit2 size={15} strokeWidth={1.5} />
                      <span>Update Today's Mood</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Save size={15} strokeWidth={1.5} />
                      <span>Save Mood</span>
                    </span>
                  )}
                </button>
              </div>

              {/* Stats strip */}
              <StatsStrip history={history} darkMode={darkMode} />
            </div>

            {/* ════ RIGHT COLUMN ════ */}
            <div className="space-y-5">

              {/* 7-day chart */}
              <div className={`rounded-3xl p-6 border shadow-sm
                ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-white/90'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 size={16} className="text-[#7DD3FC]" strokeWidth={1.5} />
                  <h3 className={`font-black text-base ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                    Last 7 Days
                  </h3>
                </div>
                <WeekChart history={history} darkMode={darkMode} />
              </div>

              {/* Monthly calendar */}
              <div className={`rounded-3xl p-6 border shadow-sm
                ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-white/90'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={16} className="text-[#4F7CFF]" strokeWidth={1.5} />
                  <h3 className={`font-black text-base ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                    Monthly View
                  </h3>
                </div>
                <MonthCalendar history={history} darkMode={darkMode} />
              </div>

              {/* Recent entries — horizontal scroll */}
              <div className={`rounded-3xl p-6 border shadow-sm
                ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-white/90'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <List size={16} className="text-[#9B8AAE]" strokeWidth={1.5} />
                  <h3 className={`font-black text-base ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                    Recent Entries
                  </h3>
                </div>
                <RecentEntries history={history} darkMode={darkMode} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
