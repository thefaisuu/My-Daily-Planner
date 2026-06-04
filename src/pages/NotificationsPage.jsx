import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import PastelIcon from '../components/PastelIcon';

const MOOD_MAP = {
  1: { emoji: '😔', label: 'Rough' },
  2: { emoji: '😐', label: 'Neutral' },
  3: { emoji: '🙂', label: 'Okay' },
  4: { emoji: '😊', label: 'Good' },
  5: { emoji: '🤩', label: 'Amazing' },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const FILTERS = ['All', 'Habits', 'Schedule', 'Water', 'Mood', 'Notes', 'Focus Timer'];

function timeAgo(dateString) {
  if (!dateString) return 'just now';
  try {
    const ts = new Date(dateString).getTime();
    if (isNaN(ts)) return dateString;
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 0)     return 'just now';
    if (s < 60)    return 'just now';
    if (s < 3600)  return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  } catch (_) {
    return dateString;
  }
}

export default function NotificationsPage() {
  const { setActiveNav, user } = useApp();
  const [filter,  setFilter]  = useState('All');
  const [cleared, setCleared] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    const today = todayKey();
    
    let habitsDone = 0;
    let habitsTotal = 0;
    let waterGlasses = 0;
    let waterGoal = 8;
    let tasksDone = 0;
    let tasksTotal = 0;
    let moodLabel = '';
    let notesCount = 0;

    if (supabase) {
      try {
        const [waterRes, habitsRes, logsRes, moodRes, scheduleRes, notesRes] = await Promise.all([
          supabase.from('water_logs').select('glasses, goal').eq('user_id', user.id).eq('logged_date', today).maybeSingle(),
          supabase.from('habits').select('id').eq('user_id', user.id),
          supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('completed_date', today),
          supabase.from('mood_logs').select('mood').eq('user_id', user.id).eq('logged_date', today).maybeSingle(),
          supabase.from('schedule_tasks').select('completed').eq('user_id', user.id).eq('date', today),
          supabase.from('notes').select('id', { count: 'exact' }).eq('user_id', user.id)
        ]);

        if (waterRes.data) {
          waterGlasses = waterRes.data.glasses;
          waterGoal = waterRes.data.goal;
        }
        if (habitsRes.data) habitsTotal = habitsRes.data.length;
        if (logsRes.data) habitsDone = logsRes.data.length;
        if (moodRes.data) {
          const mVal = Number(moodRes.data.mood);
          if (MOOD_MAP[mVal]) moodLabel = MOOD_MAP[mVal].label;
        }
        if (scheduleRes.data) {
          tasksTotal = scheduleRes.data.length;
          tasksDone = scheduleRes.data.filter(t => t.completed).length;
        }
        if (notesRes.count !== null) {
          notesCount = notesRes.count;
        }
      } catch (e) {
        console.warn('Failed to load notifications stats from Supabase:', e);
      }
    } else {
      try {
        const rawWater = localStorage.getItem('planner_water');
        if (rawWater) {
          const parsed = JSON.parse(rawWater);
          if (parsed.lastDate === today) {
            waterGlasses = parsed.glasses;
            waterGoal = parsed.goal ?? 8;
          }
        }
        const rawHabits = localStorage.getItem('planner_habits');
        if (rawHabits) {
          const parsed = JSON.parse(rawHabits);
          habitsTotal = parsed.habits?.length || 0;
          habitsDone = parsed.habits?.filter(h => h.doneToday).length || 0;
        }
        const rawMoods = localStorage.getItem('planner_moods');
        if (rawMoods) {
          const history = JSON.parse(rawMoods);
          const entry = history[today];
          if (entry && MOOD_MAP[entry.moodId]) {
            moodLabel = MOOD_MAP[entry.moodId].label;
          }
        }
        const rawNotes = localStorage.getItem('planner_notes');
        if (rawNotes) {
          notesCount = JSON.parse(rawNotes).length;
        }
        const rawSchedule = localStorage.getItem('planner_schedule');
        if (rawSchedule) {
          const slots = JSON.parse(rawSchedule);
          const activeSlots = Object.keys(slots).filter(h => slots[h]?.task?.trim());
          tasksTotal = activeSlots.length;
          tasksDone = activeSlots.filter(h => slots[h]?.done).length;
        }
      } catch (_) {}
    }

    // Fetch last action timestamps
    const timeHabit = localStorage.getItem('last_action_habit') || '';
    const timeWater = localStorage.getItem('last_action_water') || '';
    const timeSchedule = localStorage.getItem('last_action_schedule') || '';
    const timeMood = localStorage.getItem('last_action_mood') || '';
    const timeNotes = localStorage.getItem('last_action_notes') || '';

    const list = [];
    let idx = 1;

    // Load Focus Timer completions
    try {
      const rawFocus = localStorage.getItem('planner_focus_completions');
      if (rawFocus) {
        const parsed = JSON.parse(rawFocus);
        const today = todayKey();
        const todayCompletions = parsed.filter(c => c.timestamp && c.timestamp.startsWith(today));
        todayCompletions.forEach((fc, fidx) => {
          list.push({
            id: `focus-${fc.id || fidx}`,
            iconName: 'Timer',
            colorType: 'timer',
            text: 'Focus session completed! 🏆',
            sub: `Session #${fc.sessionNumber} (${fc.duration}m) completed successfully.`,
            page: 'Focus Timer',
            time: fc.timestamp,
            color: '#a78bfa',
            bg: 'bg-purple-50/50',
            badge: 'bg-purple-100 text-purple-700'
          });
        });
      }
    } catch (_) {}

    if (habitsDone > 0) {
      list.push({
        id: idx++,
        iconName: 'CheckSquare',
        colorType: 'habits',
        text: `${habitsDone} habit${habitsDone !== 1 ? 's' : ''} completed today!`,
        sub: habitsDone === habitsTotal ? 'All habits completed! Perfect streak! 🔥' : 'Keep the streak going 🔥',
        page: 'Habits',
        time: timeHabit || new Date().toISOString(),
        color: '#A78BFA',
        bg: 'bg-violet-50',
        badge: 'bg-violet-100 text-violet-700'
      });
    }

    if (waterGlasses > 0) {
      const goalReached = waterGlasses >= waterGoal;
      list.push({
        id: idx++,
        iconName: 'Droplet',
        colorType: 'water',
        text: goalReached ? 'Water goal reached! 🎉' : 'Hydration logged',
        sub: goalReached ? `${waterGlasses}/${waterGoal} glasses — amazing hydration!` : `You are at ${waterGlasses}/${waterGoal} glasses`,
        page: 'Water',
        time: timeWater || new Date().toISOString(),
        color: '#8DB4FF',
        bg: 'bg-sky-50',
        badge: 'bg-sky-100 text-sky-700'
      });
    }

    if (tasksDone > 0) {
      const allDone = tasksDone === tasksTotal;
      list.push({
        id: idx++,
        iconName: 'Calendar',
        colorType: 'schedule',
        text: allDone ? 'All events completed! 🏆' : `${tasksDone}/${tasksTotal} tasks completed`,
        sub: allDone ? 'Outstanding job staying on schedule!' : 'Keep ticking off your day plan.',
        page: 'Schedule',
        time: timeSchedule || new Date().toISOString(),
        color: '#F59E0B',
        bg: 'bg-amber-50',
        badge: 'bg-amber-100 text-amber-700'
      });
    }

    if (moodLabel) {
      list.push({
        id: idx++,
        iconName: 'Smile',
        colorType: 'mood',
        text: 'Mood logged today',
        sub: `You are feeling "${moodLabel}" today.`,
        page: 'Mood',
        time: timeMood || new Date().toISOString(),
        color: '#22C55E',
        bg: 'bg-emerald-50',
        badge: 'bg-emerald-100 text-emerald-700'
      });
    }

    if (notesCount > 0) {
      list.push({
        id: idx++,
        iconName: 'FileText',
        colorType: 'notes',
        text: 'Notes captured',
        sub: `You have saved ${notesCount} active note${notesCount !== 1 ? 's' : ''}`,
        page: 'Notes',
        time: timeNotes || new Date().toISOString(),
        color: '#f472b6',
        bg: 'bg-pink-50',
        badge: 'bg-pink-100 text-pink-700'
      });
    }

    // Sort list by time descending
    list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    setNotifications(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    window.addEventListener('planner-data-changed', loadNotifications);
    return () => window.removeEventListener('planner-data-changed', loadNotifications);
  }, [loadNotifications]);

  const visible = notifications.filter(n =>
    !cleared.has(n.id) && (filter === 'All' || n.page === filter)
  );

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 animate-fade-in">

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <PastelIcon name="Bell" colorType="default" circleSize="w-12 h-12" size={22} />
          <div>
            <h1 className="text-2xl font-black text-slate-700 leading-tight">Notifications</h1>
            <p className="text-sm font-semibold text-slate-500 mt-0.5">
              {visible.length} notification{visible.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {cleared.size < notifications.length && notifications.length > 0 && (
          <button
            onClick={() => setCleared(new Set(notifications.map(n => n.id)))}
            className="text-xs font-black text-slate-400 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-rose-50 border border-slate-200 hover:border-rose-200 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 hover:scale-105
              ${filter === f
                ? 'text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            style={filter === f ? { background: 'linear-gradient(135deg,#5B6CFF,#8DB4FF)' } : {}}>
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <PastelIcon name="BellOff" colorType="default" circleSize="w-20 h-20" size={36} />
          <p className="text-lg font-black text-slate-600">All caught up!</p>
          <p className="text-sm text-slate-400">No notifications here.</p>
          <button onClick={() => setFilter('All')} className="btn-primary text-sm mt-2">
            Show all
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {visible.map(n => (
            <div key={n.id}
              className={`group relative flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-200 cursor-pointer ${n.bg} hover:scale-[1.01]`}
              onClick={() => setActiveNav(n.page)}
            >
              {/* Icon */}
              <PastelIcon name={n.iconName} colorType={n.colorType} circleSize="w-12 h-12" size={20} className="shadow-sm bg-white" />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-700 text-sm">{n.text}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.sub}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0 mt-0.5">{timeAgo(n.time)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${n.badge}`}>
                    → {n.page}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Tap to open →
                  </span>
                </div>
              </div>

              {/* Dismiss X */}
              <button
                onClick={e => { e.stopPropagation(); setCleared(p => new Set([...p, n.id])); }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                aria-label="Dismiss"
              >
                <PastelIcon name="X" colorType="danger" circleSize="w-6 h-6" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
