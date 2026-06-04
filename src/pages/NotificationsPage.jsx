import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const MOOD_MAP = {
  1: { emoji: '😔', label: 'Rough' },
  2: { emoji: '😐', label: 'Meh' },
  3: { emoji: '🙂', label: 'Okay' },
  4: { emoji: '😊', label: 'Good' },
  5: { emoji: '🤩', label: 'Amazing' },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const FILTERS = ['All', 'Habits', 'Schedule', 'Water', 'Mood', 'Notes', 'Focus Timer'];

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

    const list = [];
    let idx = 1;

    if (habitsDone > 0) {
      list.push({
        id: idx++,
        icon: '✅',
        text: `${habitsDone} habit${habitsDone !== 1 ? 's' : ''} completed today!`,
        sub: habitsDone === habitsTotal ? 'All habits completed! Perfect streak! 🔥' : 'Keep the streak going 🔥',
        page: 'Habits',
        time: 'Just now',
        color: '#A78BFA',
        bg: 'bg-violet-50',
        badge: 'bg-violet-100 text-violet-700'
      });
    }

    if (waterGlasses > 0) {
      const goalReached = waterGlasses >= waterGoal;
      list.push({
        id: idx++,
        icon: '💧',
        text: goalReached ? 'Water goal reached! 🎉' : 'Hydration logged',
        sub: goalReached ? `${waterGlasses}/${waterGoal} glasses — amazing hydration!` : `You are at ${waterGlasses}/${waterGoal} glasses`,
        page: 'Water',
        time: 'Just now',
        color: '#8DB4FF',
        bg: 'bg-sky-50',
        badge: 'bg-sky-100 text-sky-700'
      });
    }

    if (tasksDone > 0) {
      const allDone = tasksDone === tasksTotal;
      list.push({
        id: idx++,
        icon: '📅',
        text: allDone ? 'All events completed! 🏆' : `${tasksDone}/${tasksTotal} tasks completed`,
        sub: allDone ? 'Outstanding job staying on schedule!' : 'Keep ticking off your day plan.',
        page: 'Schedule',
        time: 'Just now',
        color: '#F59E0B',
        bg: 'bg-amber-50',
        badge: 'bg-amber-100 text-amber-700'
      });
    }

    if (moodLabel) {
      list.push({
        id: idx++,
        icon: '😊',
        text: 'Mood logged today',
        sub: `You are feeling "${moodLabel}" today.`,
        page: 'Mood',
        time: 'Just now',
        color: '#22C55E',
        bg: 'bg-emerald-50',
        badge: 'bg-emerald-100 text-emerald-700'
      });
    }

    if (notesCount > 0) {
      list.push({
        id: idx++,
        icon: '📝',
        text: 'Notes captured',
        sub: `You have saved ${notesCount} active note${notesCount !== 1 ? 's' : ''}`,
        page: 'Notes',
        time: 'Just now',
        color: '#f472b6',
        bg: 'bg-pink-50',
        badge: 'bg-pink-100 text-pink-700'
      });
    }

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

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-700">🔔 Notifications</h1>
          <p className="text-sm font-semibold text-slate-500 mt-0.5">
            {visible.length} notification{visible.length !== 1 ? 's' : ''}
          </p>
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

      {/* Notifications list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center text-4xl">🔔</div>
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
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-white shadow-sm">
                {n.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-slate-700 text-sm">{n.text}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.sub}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0 mt-0.5">{n.time}</span>
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
                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white/70 text-slate-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs font-black"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
