import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import PastelIcon from './PastelIcon';
import { ChevronDown } from 'lucide-react';

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
  1: { iconName: 'Frown', label: 'Rough' },
  2: { iconName: 'Meh',   label: 'Neutral' },
  3: { iconName: 'Smile', label: 'Okay' },
  4: { iconName: 'Smile', label: 'Good' },
  5: { iconName: 'Laugh', label: 'Amazing' },
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

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
            text: 'Focus session completed!',
            sub: `Session #${fc.sessionNumber} (${fc.duration}m) completed successfully.`,
            page: 'Focus Timer',
            time: fc.timestamp,
            color: '#7DD3FC',
            bg: 'bg-purple-50/20',
            badge: 'bg-[#7DD3FC]/20 text-[#1E293B]'
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
        sub: habitsDone === habitsTotal ? 'All habits completed! Perfect streak!' : 'Keep the streak going',
        page: 'Habits',
        time: timeHabit || new Date().toISOString(),
        color: '#7DD3FC',
        bg: 'bg-[#F0F4FF]/50',
        badge: 'bg-[#7DD3FC]/20 text-[#1E293B]'
      });
    }

    if (waterGlasses > 0) {
      const goalReached = waterGlasses >= waterGoal;
      list.push({
        id: idx++,
        iconName: 'Droplet',
        colorType: 'water',
        text: goalReached ? 'Water goal reached!' : 'Hydration logged',
        sub: goalReached ? `${waterGlasses}/${waterGoal} glasses — amazing hydration!` : `You are at ${waterGlasses}/${waterGoal} glasses`,
        page: 'Water',
        time: timeWater || new Date().toISOString(),
        color: '#4F7CFF',
        bg: 'bg-pink-50/30',
        badge: 'bg-blue-100 text-pink-700'
      });
    }

    if (tasksDone > 0) {
      const allDone = tasksDone === tasksTotal;
      list.push({
        id: idx++,
        iconName: 'Calendar',
        colorType: 'schedule',
        text: allDone ? 'All events completed!' : `${tasksDone}/${tasksTotal} tasks completed`,
        sub: allDone ? 'Outstanding job staying on schedule!' : 'Keep ticking off your day plan.',
        page: 'Schedule',
        time: timeSchedule || new Date().toISOString(),
        color: '#FDE68A',
        bg: 'bg-yellow-50/30',
        badge: 'bg-yellow-100 text-yellow-800'
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
        color: '#34D399',
        bg: 'bg-emerald-50/30',
        badge: 'bg-emerald-100 text-emerald-800'
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
        color: '#4F7CFF',
        bg: 'bg-pink-50/30',
        badge: 'bg-blue-100 text-pink-700'
      });
    }

    // Sort list by time descending
    list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

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
        className="relative cursor-pointer transition-all duration-200 hover:scale-105"
        aria-label="Notifications"
      >
        <PastelIcon name="Bell" colorType="default" circleSize="w-10 h-10" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full border border-white animate-pulse"
            style={{ background: '#4F7CFF' }} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-3xl shadow-2xl shadow-[#7DD3FC]/10 z-50 overflow-hidden animate-bounce-in bg-white/95 backdrop-blur-md border border-sky-100">
          {/* Header */}
          <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
            <p className="font-black text-sm text-[#1E293B]">Notifications</p>
            <span className="badge bg-[#7DD3FC]/20 text-[#1E293B]">{notifications.length} new</span>
          </div>

          {/* List — max 3 in dropdown */}
          <div className="divide-y divide-purple-50/50">
            {notifications.length === 0 ? (
              <div className="px-5 py-6 text-center text-[#9B8AAE] flex flex-col items-center justify-center">
                <PastelIcon name="BellOff" colorType="default" circleSize="w-12 h-12" size={22} className="mb-2" />
                <p className="text-xs font-semibold">All caught up! No alerts.</p>
              </div>
            ) : (
              notifications.slice(0, 3).map(n => (
                <button key={n.id}
                  onClick={() => handleNotifClick(n.page)}
                  className="w-full text-left px-5 py-3.5 hover:bg-[#F0F4FF]/60 transition-colors flex items-center gap-3 cursor-pointer">
                  <PastelIcon name={n.iconName} colorType={n.colorType} circleSize="w-9 h-9" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1E293B] truncate">{n.text}</p>
                    <p className="text-xs text-[#9B8AAE] mt-0.5">{n.sub}</p>
                  </div>
                  <span className="text-[10px] text-[#9B8AAE] font-semibold flex-shrink-0 mt-1">{timeAgo(n.time)}</span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 text-center border-t border-purple-50">
            <button
              onClick={() => { setActiveNav('Notifications'); setOpen(false); }}
              className="text-xs font-black text-[#4F7CFF] hover:text-[#7DD3FC] transition-colors cursor-pointer">
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
    { iconName: 'Settings', colorType: 'settings', label: 'Settings', action: () => setActiveNav('Settings') },
    { iconName: 'Bell', colorType: 'default', label: 'Notifications', action: () => setActiveNav('Notifications') },
    {
      iconName: 'LogOut',
      colorType: 'danger',
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
        <div className="w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center text-black font-black text-xs shadow-md hover:scale-105 transition-all duration-200 bg-gradient-to-tr from-[#4F7CFF] via-[#F0F4FF] to-[#7DD3FC]">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <span className="text-sm font-bold text-[#1E293B]">{firstName}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''} text-[#9B8AAE]`} strokeWidth={1.5} />
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-3xl shadow-2xl shadow-[#7DD3FC]/10 z-50 overflow-hidden animate-bounce-in bg-white/95 backdrop-blur-md border border-sky-100">
          <div className="px-5 py-4 border-b border-purple-50">
            <p className="font-bold text-sm text-[#1E293B] truncate">{displayName}</p>
            <p className="text-xs text-[#9B8AAE] truncate">{email}</p>
          </div>
          <div className="py-2">
            {menuItems.map(item => (
              <button key={item.label} id={`menu-${item.label}`}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold transition-colors hover:bg-[#F0F4FF]/65 text-[#1E293B] cursor-pointer"
                onClick={() => { item.action(); setOpen(false); }}>
                <PastelIcon name={item.iconName} colorType={item.colorType} circleSize="w-7 h-7" size={13} />
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
    <header className="sticky top-0 z-20 flex items-center px-4 sm:px-6 h-16 gap-3 border-b transition-colors duration-300 bg-white/60 backdrop-blur-xl border-sky-100/40">
      {/* Hamburger – mobile only */}
      <button
        id="hamburger-btn"
        onClick={toggleSidebar}
        className="lg:hidden cursor-pointer"
        aria-label="Open navigation menu"
      >
        <PastelIcon name="Menu" colorType="default" circleSize="w-9 h-9" size={18} />
      </button>

      {/* Date pill – centered */}
      <div className="flex-1 flex justify-center">
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold bg-[#F0F4FF]/80 text-[#1E293B]">
          <PastelIcon name="Calendar" colorType="schedule" circleSize="w-6 h-6" size={12} />
          <span className="hidden sm:inline">{dateStr}</span>
          <span className="inline sm:hidden">{`${now.getDate()} ${MONTHS[now.getMonth()].slice(0,3)}`}</span>
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
