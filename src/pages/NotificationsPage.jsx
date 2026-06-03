import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NOTIFICATIONS } from '../components/Navbar';

const ALL_NOTIFICATIONS = [
  ...NOTIFICATIONS,
  { id: 6,  icon: '📝', text: 'New note saved',                    sub: 'App redesign ideas auto-saved',       page: 'Notes',       time: '3h ago',  color: '#f472b6', bg: 'bg-pink-50',    badge: 'bg-pink-100 text-pink-700'      },
  { id: 7,  icon: '✅', text: 'Daily habit reset',                  sub: 'New day — 0/6 habits completed',      page: 'Habits',      time: '8h ago',  color: '#A78BFA', bg: 'bg-violet-50',  badge: 'bg-violet-100 text-violet-700'  },
  { id: 8,  icon: '⏱️', text: 'Focus session completed',            sub: 'Great work! 25 minutes focused',      page: 'Focus Timer', time: '5h ago',  color: '#5B6CFF', bg: 'bg-indigo-50',  badge: 'bg-indigo-100 text-indigo-700'  },
  { id: 9,  icon: '😊', text: 'Mood logged: Happy 😊',              sub: 'Feeling great today',                 page: 'Mood',        time: 'Yesterday', color: '#22C55E', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700'},
  { id: 10, icon: '💧', text: 'Water goal reached! 🎉',             sub: '8/8 glasses — amazing hydration!',   page: 'Water',       time: 'Yesterday', color: '#8DB4FF', bg: 'bg-sky-50',     badge: 'bg-sky-100 text-sky-700'        },
];

const FILTERS = ['All', 'Habits', 'Schedule', 'Water', 'Mood', 'Notes', 'Focus Timer'];

export default function NotificationsPage() {
  const { setActiveNav } = useApp();
  const [filter,  setFilter]  = useState('All');
  const [cleared, setCleared] = useState(new Set());

  const visible = ALL_NOTIFICATIONS.filter(n =>
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
        {cleared.size < ALL_NOTIFICATIONS.length && (
          <button
            onClick={() => setCleared(new Set(ALL_NOTIFICATIONS.map(n => n.id)))}
            className="text-xs font-black text-slate-400 hover:text-rose-500 transition-colors px-3 py-1.5 rounded-xl hover:bg-rose-50 border border-slate-200 hover:border-rose-200"
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
