import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

function useDate() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

export function NotificationBell() {
  const { setActiveNav, user } = useApp();
  const [open, setOpen]  = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
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
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    window.addEventListener('planner-data-changed', loadNotifications);
    return () => window.removeEventListener('planner-data-changed', loadNotifications);
  }, [loadNotifications]);

  const handleNotifClick = (page) => {
    setActiveNav(page);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        id="notification-bell"
        onClick={() => setOpen(p => !p)}
        className="relative p-2.5 rounded-2xl transition-all duration-200 hover:scale-105 hover:bg-indigo-50 text-slate-500 cursor-pointer"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-white animate-pulse"
            style={{ background: '#5B6CFF' }} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-3xl shadow-2xl shadow-indigo-100/50 z-50 overflow-hidden animate-bounce-in bg-white/95 backdrop-blur-md border border-indigo-100">
          {/* Header */}
          <div className="px-5 py-4 border-b border-indigo-50 flex items-center justify-between">
            <p className="font-black text-sm text-slate-700">Notifications</p>
            <span className="badge bg-indigo-100 text-indigo-600">{notifications.length} new</span>
          </div>

          {/* List — max 3 in dropdown */}
          <div className="divide-y divide-indigo-50/50">
            {notifications.length === 0 ? (
              <div className="px-5 py-6 text-center text-slate-400">
                <span className="text-xl block mb-1">🔔</span>
                <p className="text-xs font-semibold">All caught up! No alerts.</p>
              </div>
            ) : (
              notifications.slice(0, 3).map(n => (
                <button key={n.id}
                  onClick={() => handleNotifClick(n.page)}
                  className="w-full text-left px-5 py-3.5 hover:bg-indigo-50/60 transition-colors flex items-start gap-3 cursor-pointer">
                  <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{n.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{n.sub}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0 mt-1">{n.time}</span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 text-center border-t border-indigo-50">
            <button
              onClick={() => { setActiveNav('Notifications'); setOpen(false); }}
              className="text-xs font-black text-indigo-500 hover:text-indigo-700 transition-colors cursor-pointer">
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarDropdown() {
  const { setActiveNav, user, logout, showConfirm } = useApp();
  const [open, setOpen]  = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Ata UmeR';
  const firstName = displayName.split(' ')[0] || 'Ata';
  const email = user?.email || 'ata@planner.app';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(x => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const menuItems = [
    { icon: '⚙️', label: 'Settings', action: () => setActiveNav('Settings') },
    { icon: '🔔', label: 'Notifications', action: () => setActiveNav('Notifications') },
    {
      icon: '🚪',
      label: 'Logout',
      action: () => {
        showConfirm({
          title: 'Confirm Logout',
          message: 'Are you sure you want to log out of My Daily Planner?',
          confirmText: 'Log Out',
          isDanger: true,
          onConfirm: logout
        });
      }
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        id="avatar-dropdown-btn"
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 group cursor-pointer"
        aria-label="User menu"
      >
        <div className="w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-xs shadow-md hover:scale-105 transition-all duration-200 bg-gradient-to-tr from-[#5B6CFF] via-[#8DB4FF] to-[#A78BFA]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-sm font-bold text-slate-700">{firstName}</span>
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''} text-slate-400`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-3xl shadow-2xl shadow-indigo-100/50 z-50 overflow-hidden animate-bounce-in bg-white/95 backdrop-blur-md border border-indigo-100">
          <div className="px-5 py-4 border-b border-indigo-50">
            <p className="font-bold text-sm text-slate-700 truncate">{displayName}</p>
            <p className="text-xs text-slate-400 truncate">{email}</p>
          </div>
          <div className="py-2">
            {menuItems.map(item => (
              <button key={item.label} id={`menu-${item.label}`}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors hover:bg-indigo-50 text-slate-600 cursor-pointer"
                onClick={() => { item.action(); setOpen(false); }}>
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { toggleSidebar } = useApp();
  const now       = useDate();
  const dayName   = DAYS[now.getDay()];
  const monthName = MONTHS[now.getMonth()];
  const dateStr   = `${dayName}, ${monthName} ${now.getDate()}`;

  return (
    <header className="sticky top-0 z-20 flex items-center px-4 sm:px-6 h-16 gap-3 border-b transition-colors duration-300 bg-white/70 backdrop-blur-xl border-indigo-100/60">
      {/* Hamburger – mobile only */}
      <button
        id="hamburger-btn"
        onClick={toggleSidebar}
        className="lg:hidden p-2.5 rounded-2xl transition-all duration-200 hover:scale-105 hover:bg-indigo-50 text-slate-500"
        aria-label="Open navigation menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Date pill – centered */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold bg-indigo-50/80 text-slate-600">
          <span className="text-base">📅</span>
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        <NotificationBell />
        <AvatarDropdown />
      </div>
    </header>
  );
}
