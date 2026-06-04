import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════════════════
   CONSTANTS & STORAGE
   ═══════════════════════════════════════════════════════ */
const DEFAULT_GOAL  = 8;
const ML_PER_GLASS  = 250;
const DAYS_SHORT    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function seedWeekHistory(goal) {
  const history = {};
  for (let i = 7; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    history[key] = Math.floor(Math.random() * (goal + 2));
  }
  return history;
}

function loadState() {
  try {
    const raw = localStorage.getItem('planner_water');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.lastDate !== todayKey()) {
        parsed.history[parsed.lastDate] = parsed.glasses;
        parsed.glasses  = 0;
        parsed.lastDate = todayKey();
      }
      return parsed;
    }
  } catch (_) {}
  const goal = DEFAULT_GOAL;
  const history = {};
  return { glasses: 0, goal, lastDate: todayKey(), history };
}

function persist(state) {
  localStorage.setItem('planner_water', JSON.stringify(state));
}

/* ═══════════════════════════════════════════════════════
   GLASS SVG COMPONENT
   ═══════════════════════════════════════════════════════ */
function GlassIcon({ filled, partial, onClick, index, animating, darkMode }) {
  const fillPct = filled ? 85 : partial ? 40 : 0;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group transition-all duration-200 hover:scale-110 active:scale-95"
      aria-label={filled ? `Glass ${index + 1} – full` : `Fill glass ${index + 1}`}
    >
      <div className="relative" style={{ width: 52, height: 68 }}>
        <svg viewBox="0 0 52 68" width="52" height="68" className="drop-shadow-sm">
          {/* Glass outline */}
          <path
            d="M8 4 L6 64 Q6 66 8 66 L44 66 Q46 66 46 64 L44 4 Z"
            fill={filled
              ? '#eff6ff'
              : darkMode ? '#1e293b' : '#f8fafc'}
            stroke={filled
              ? '#60a5fa'
              : darkMode ? '#334155' : '#cbd5e1'}
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Water fill */}
          {fillPct > 0 && (
            <clipPath id={`clip-${index}`}>
              <path d="M8 4 L6 64 Q6 66 8 66 L44 66 Q46 66 46 64 L44 4 Z" />
            </clipPath>
          )}
          {fillPct > 0 && (
            <g clipPath={`url(#clip-${index})`}>
              {/* Water background */}
              <rect
                x="0" y={68 - (68 * fillPct / 100)}
                width="52" height={68 * fillPct / 100}
                fill={filled ? '#bfdbfe' : '#dbeafe'}
                className={animating === index ? 'animate-pulse' : ''}
              />
              {/* Wave top */}
              <path
                d={`M0 ${68 - (68 * fillPct / 100) + 2}
                  Q13 ${68 - (68 * fillPct / 100) - 3}
                  26 ${68 - (68 * fillPct / 100) + 2}
                  Q39 ${68 - (68 * fillPct / 100) + 7}
                  52 ${68 - (68 * fillPct / 100) + 2} Z`}
                fill={filled ? '#93c5fd' : '#bfdbfe'}
              />
              {/* Bubbles */}
              {filled && (
                <>
                  <circle cx="18" cy={68 - (68 * fillPct / 100) + 14} r="2.5" fill="#60a5fa60" />
                  <circle cx="30" cy={68 - (68 * fillPct / 100) + 22} r="1.8" fill="#60a5fa50" />
                  <circle cx="24" cy={68 - (68 * fillPct / 100) + 34} r="3" fill="#60a5fa40" />
                </>
              )}
            </g>
          )}

          {/* Glass shine */}
          <path
            d="M13 10 L11 54"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"
          />
          <path
            d="M18 10 L17 28"
            stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"
          />

          {/* Checkmark when full */}
          {filled && (
            <g transform="translate(30, 18)">
              <circle cx="8" cy="8" r="9" fill="#3b82f6" />
              <path d="M4 8 L7 11 L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          )}
        </svg>

        {/* Ripple animation on fill */}
        {animating === index && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: '#60a5fa', borderRadius: '30%' }} />
        )}
      </div>

      {/* Glass number */}
      <span className={`text-[11px] font-black transition-colors
        ${filled ? 'text-blue-500' : darkMode ? 'text-slate-600' : 'text-slate-300'}`}>
        {index + 1}
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   BIG WATER BOTTLE SVG
   ═══════════════════════════════════════════════════════ */
function WaterBottle({ pct, darkMode }) {
  const fillY  = 230 - (180 * Math.min(pct, 1));

  return (
    <div className="relative flex justify-center items-center select-none">
      <svg viewBox="0 0 120 260" width="110" height="250" className="drop-shadow-lg">
        {/* Bottle cap */}
        <rect x="42" y="8" width="36" height="22" rx="6"
          fill={pct > 0 ? '#3b82f6' : darkMode ? '#334155' : '#e2e8f0'} />
        <rect x="46" y="2" width="28" height="12" rx="4"
          fill={pct > 0 ? '#2563eb' : darkMode ? '#475569' : '#cbd5e1'} />

        {/* Bottle neck */}
        <path d="M42 30 L36 55 L84 55 L78 30 Z"
          fill={darkMode ? '#1e293b' : '#f0f9ff'}
          stroke={pct > 0 ? '#93c5fd' : darkMode ? '#334155' : '#e2e8f0'} strokeWidth="2" />

        {/* Bottle body outline */}
        <rect x="18" y="55" width="84" height="185" rx="18"
          fill={darkMode ? '#1e293b' : '#f0f9ff'}
          stroke={pct > 0 ? '#93c5fd' : darkMode ? '#334155' : '#e2e8f0'}
          strokeWidth="2.5" />

        {/* Water fill */}
        <clipPath id="bottle-clip">
          <rect x="18" y="55" width="84" height="185" rx="18" />
        </clipPath>
        <g clipPath="url(#bottle-clip)">
          {pct > 0 && (
            <>
              {/* Water body */}
              <rect x="18" y={fillY} width="84" height={240 - fillY}
                fill="#bfdbfe" />
              {/* Wave */}
              <path d={`M18 ${fillY + 4} Q36 ${fillY - 6} 60 ${fillY + 4} Q84 ${fillY + 14} 102 ${fillY + 4} L102 ${fillY} Q84 ${fillY - 10} 60 ${fillY} Q36 ${fillY + 10} 18 ${fillY} Z`}
                fill="#93c5fd" />
              {/* Bubbles */}
              <circle cx="50" cy={fillY + 30} r="5" fill="#60a5fa40" />
              <circle cx="72" cy={fillY + 55} r="3.5" fill="#60a5fa35" />
              <circle cx="38" cy={fillY + 70} r="4" fill="#60a5fa30" />
              <circle cx="80" cy={fillY + 90} r="2.5" fill="#60a5fa25" />
            </>
          )}
        </g>

        {/* Measurement lines */}
        {[25, 50, 75].map(p => (
          <g key={p}>
            <line x1="22" y1={55 + 185 * (1 - p/100)} x2="34" y2={55 + 185 * (1 - p/100)}
              stroke={darkMode ? '#334155' : '#cbd5e1'} strokeWidth="1.5" />
            <text x="36" y={58 + 185 * (1 - p/100)}
              fontSize="9" fill={darkMode ? '#475569' : '#94a3b8'} fontWeight="700">{p}%</text>
          </g>
        ))}

        {/* Shine */}
        <path d="M28 65 L26 200" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
        <path d="M36 65 L35 110" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      </svg>

      {/* Pct label in center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center mt-16">
          <p className="text-2xl font-black text-blue-500 drop-shadow">{Math.round(pct * 100)}%</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   WEEKLY BAR CHART
   ═══════════════════════════════════════════════════════ */
function WeeklyChart({ history, today, goal, darkMode }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key    = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const isToday = i === 6;
    const glasses = isToday ? today : (history[key] ?? 0);
    return { d, key, glasses, isToday };
  });

  const maxVal = Math.max(goal, ...days.map(d => d.glasses), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2 h-32">
        {days.map(({ d, key, glasses, isToday }) => {
          const pct = glasses / maxVal;
          const met = glasses >= goal;

          return (
            <div key={key} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Value label */}
              <p className={`text-[10px] font-black transition-all
                ${glasses === 0 ? 'opacity-0' : ''}
                ${met ? 'text-blue-500' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {glasses}
              </p>
              {/* Bar */}
              <div className={`w-full rounded-t-xl relative overflow-hidden transition-all duration-700 ease-out min-h-2`}
                style={{
                  height: `${Math.max(pct * 100, 4)}%`,
                  background: met
                    ? 'linear-gradient(to top, #2563eb, #60a5fa)'
                    : isToday
                    ? 'linear-gradient(to top, #60a5fa, #93c5fd)'
                    : darkMode ? '#1e3a5f' : '#dbeafe',
                  boxShadow: met ? '0 4px 12px #60a5fa50' : isToday ? '0 4px 8px #93c5fd40' : 'none',
                }}
              >
                {/* Goal line overlay */}
                {glasses > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-full"
                    style={{ background: 'linear-gradient(to top, transparent 70%, rgba(255,255,255,0.15))' }} />
                )}
              </div>
              {/* Day label */}
              <p className={`text-[10px] font-black uppercase tracking-wider
                ${isToday ? 'text-blue-500' : darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {DAYS_SHORT[d.getDay()]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Goal line annotation */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px border-t border-dashed border-blue-300 dark:border-blue-800" />
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg
          ${darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-500'}`}>
          Goal: {goal} glasses
        </span>
        <div className="flex-1 h-px border-t border-dashed border-blue-300 dark:border-blue-800" />
      </div>

      {/* Week summary */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[
          { label: 'Avg / day',    val: `${(days.reduce((s,d)=>s+d.glasses,0)/7).toFixed(1)}` },
          { label: 'Goals met',    val: `${days.filter(d=>d.glasses>=goal).length}/7` },
          { label: 'Total glasses',val: days.reduce((s,d)=>s+d.glasses,0) },
        ].map((s, i) => (
          <div key={i} className={`text-center py-2 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-blue-50/80'}`}>
            <p className={`text-sm font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{s.val}</p>
            <p className={`text-[10px] font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SETTINGS PANEL
   ═══════════════════════════════════════════════════════ */
function SettingsPanel({ goal, mlPerGlass, onGoalChange, onMlChange, darkMode }) {
  const inputCls = `w-full px-4 py-2.5 rounded-2xl text-sm font-bold outline-none border-2 transition-all tabular-nums
    ${darkMode
      ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-400'
      : 'bg-white border-slate-200 text-slate-700 focus:border-blue-300'
    }`;

  return (
    <div className="space-y-5">
      {/* Daily glass goal */}
      <div>
        <label className={`block text-[11px] font-black uppercase tracking-wider mb-2
          ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          🎯 Daily Goal (glasses)
        </label>
        <div className="flex items-center gap-3">
          <button onClick={() => onGoalChange(Math.max(1, goal - 1))}
            className={`w-10 h-10 rounded-xl font-black text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95
              ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600'}`}>
            −
          </button>
          <div className="relative flex-1">
            <input type="number" min="1" max="20" value={goal}
              onChange={e => onGoalChange(Math.max(1, Math.min(20, Number(e.target.value))))}
              className={inputCls + ' text-center text-xl font-black'} />
          </div>
          <button onClick={() => onGoalChange(Math.min(20, goal + 1))}
            className={`w-10 h-10 rounded-xl font-black text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95
              ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600'}`}>
            +
          </button>
        </div>
        {/* Preset chips */}
        <div className="flex gap-2 mt-2 flex-wrap">
          {[6, 8, 10, 12].map(g => (
            <button key={g} onClick={() => onGoalChange(g)}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all hover:scale-105
                ${goal === g
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-200/50'
                  : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                }`}>
              {g} glasses
            </button>
          ))}
        </div>
      </div>

      {/* ml per glass */}
      <div>
        <label className={`block text-[11px] font-black uppercase tracking-wider mb-2
          ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          💧 ml per glass
        </label>
        <div className="flex gap-2 flex-wrap">
          {[150, 200, 250, 300, 350].map(ml => (
            <button key={ml} onClick={() => onMlChange(ml)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all hover:scale-105
                ${mlPerGlass === ml
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-200/50'
                  : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                }`}>
              {ml} ml
            </button>
          ))}
        </div>
      </div>

      {/* Total volume */}
      <div className={`rounded-2xl p-4 ${darkMode ? 'bg-slate-800' : 'bg-blue-50'}`}>
        <p className={`text-[11px] font-black uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Daily target volume
        </p>
        <p className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-blue-700'}`}>
          {(goal * mlPerGlass / 1000).toFixed(2)} L
        </p>
        <p className={`text-xs font-semibold mt-0.5 ${darkMode ? 'text-slate-500' : 'text-blue-400'}`}>
          = {goal} × {mlPerGlass} ml
        </p>
      </div>

      {/* Reset today tip */}
      <p className={`text-[11px] font-semibold leading-relaxed ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
        🌙 Your progress resets automatically at midnight each day.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GOAL CELEBRATION
   ═══════════════════════════════════════════════════════ */
function GoalCelebration({ visible }) {
  if (!visible) return null;
  return (
    <div className="text-center py-5 px-6 rounded-3xl animate-bounce-in"
      style={{ background: 'linear-gradient(135deg, #dbeafe, #eff6ff)' }}>
      <div className="text-5xl mb-3 animate-bounce">🎉</div>
      <h3 className="text-xl font-black text-blue-700 mb-1">Daily goal reached!</h3>
      <p className="text-sm font-semibold text-blue-500">
        Amazing! You've hit your water target for today 💧✨
      </p>
      <div className="flex justify-center gap-2 mt-3 text-2xl">
        {['💧','🌊','🫧','💙','✨'].map((e, i) => (
          <span key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>{e}</span>
        ))}
      </div>
    </div>
  );
}

function WaterSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse max-w-7xl mx-auto">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-96 rounded-3xl bg-slate-200 dark:bg-slate-700 hidden lg:block" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   WATER PAGE
═══════════════════════════════════════════════════════ */
export default function WaterPage() {
  const { darkMode, user, showToast } = useApp();
  const [state, setState]         = useState({ glasses: 0, goal: DEFAULT_GOAL, lastDate: todayKey(), history: {} });
  const [animating, setAnimating] = useState(null);   // index of glass being filled
  const [mlPerGlass, setMlPerGlass] = useState(ML_PER_GLASS);
  const [showSettings, setShowSettings] = useState(false); // mobile drawer
  const [loading, setLoading] = useState(false);
  const prevGoalMet = useRef(false);

  const { glasses, goal, history } = state;
  const pct       = Math.min(glasses / goal, 1);
  const goalMet   = glasses >= goal;
  const totalMl   = glasses * mlPerGlass;
  const remaining = Math.max(goal - glasses, 0);

  // Load from DB or fallback to localStorage
  const loadWaterData = useCallback(async () => {
    if (!supabase || !user) {
      setState(loadState());
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('water_logs')
        .select('logged_date, glasses, goal')
        .eq('user_id', user.id)
        .order('logged_date', { ascending: false });

      if (error) throw error;

      let todayGlasses = 0;
      let todayGoal = DEFAULT_GOAL;
      const dbHistory = {};

      if (data) {
        data.forEach(row => {
          const formattedDate = row.logged_date;
          if (formattedDate === todayKey()) {
            todayGlasses = row.glasses;
            todayGoal = row.goal;
          } else {
            dbHistory[formattedDate] = row.glasses;
          }
        });
      }

      setState({
        glasses: todayGlasses,
        goal: todayGoal,
        lastDate: todayKey(),
        history: dbHistory
      });
    } catch (err) {
      console.error('Failed to load water logs:', err);
      setState(loadState());
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load water data on mount
  useEffect(() => {
    loadWaterData();
  }, [loadWaterData]);

  // Sync to database or local storage fallback
  const syncWaterToDB = useCallback(async (nextGlasses, nextGoal, prevGlasses, prevGoal, currentHistory) => {
    localStorage.setItem('last_action_water', new Date().toISOString());
    if (!supabase || !user) {
      const nextState = { glasses: nextGlasses, goal: nextGoal, lastDate: todayKey(), history: currentHistory || {} };
      persist(nextState);
      window.dispatchEvent(new CustomEvent('planner-data-changed', { detail: { sender: 'water-page' } }));
      return;
    }

    try {
      const { error } = await supabase
        .from('water_logs')
        .upsert({
          user_id: user.id,
          logged_date: todayKey(),
          glasses: nextGlasses,
          goal: nextGoal
        }, { onConflict: 'user_id,logged_date' });

      if (error) throw error;
      window.dispatchEvent(new CustomEvent('planner-data-changed', { detail: { sender: 'water-page' } }));
    } catch (err) {
      console.error('Failed to sync water logs:', err);
      // Revert optimistic updates
      setState(prev => ({ ...prev, glasses: prevGlasses, goal: prevGoal }));
      showToast('Failed to save water intake', 'error', {
        label: 'Retry',
        callback: () => syncWaterToDB(nextGlasses, nextGoal, prevGlasses, prevGoal, currentHistory)
      });
    }
  }, [user, showToast]);

  /* Midnight reset check */
  useEffect(() => {
    const check = () => {
      const today = todayKey();
      setState(prev => {
        if (prev.lastDate !== today) {
          return {
            ...prev,
            history: { ...prev.history, [prev.lastDate]: prev.glasses },
            glasses: 0,
            lastDate: today,
          };
        }
        return prev;
      });
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  /* Fill a glass */
  const fillGlass = useCallback((idx) => {
    setAnimating(idx);
    setTimeout(() => setAnimating(null), 600);
    const newGlasses = idx < glasses ? idx : idx + 1;
    const finalGlasses = Math.max(0, Math.min(goal, newGlasses));
    setState(prev => ({ ...prev, glasses: finalGlasses }));
    syncWaterToDB(finalGlasses, goal, glasses, goal, history);
    showToast(finalGlasses > glasses ? 'Glass logged ✓' : 'Water log updated');
  }, [glasses, goal, history, syncWaterToDB, showToast]);

  const addGlass = useCallback(() => {
    const nextGlasses = Math.min(goal, glasses + 1);
    if (nextGlasses === glasses) return;
    setState(prev => ({ ...prev, glasses: nextGlasses }));
    syncWaterToDB(nextGlasses, goal, glasses, goal, history);
    showToast('Glass logged ✓');
  }, [glasses, goal, history, syncWaterToDB, showToast]);

  const removeGlass = useCallback(() => {
    const nextGlasses = Math.max(0, glasses - 1);
    if (nextGlasses === glasses) return;
    setState(prev => ({ ...prev, glasses: nextGlasses }));
    syncWaterToDB(nextGlasses, goal, glasses, goal, history);
    showToast('Glass removed');
  }, [glasses, goal, history, syncWaterToDB, showToast]);

  const resetToday = useCallback(() => {
    if (glasses === 0) return;
    setState(prev => ({ ...prev, glasses: 0 }));
    syncWaterToDB(0, goal, glasses, goal, history);
    showToast('Water tracker reset');
  }, [glasses, goal, history, syncWaterToDB, showToast]);

  const handleGoalChange = useCallback((g) => {
    if (g === goal) return;
    setState(prev => ({ ...prev, goal: g }));
    syncWaterToDB(glasses, g, glasses, goal, history);
    showToast('Goal updated ✓');
  }, [glasses, goal, history, syncWaterToDB, showToast]);

  /* Listen to settings clear data or changes on other pages */
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.sender === 'water-page') return;
      loadWaterData();
    };
    window.addEventListener('planner-data-changed', handler);
    return () => window.removeEventListener('planner-data-changed', handler);
  }, [loadWaterData]);

  /* Midnight reset check */
  useEffect(() => {
    const check = () => {
      const saved = localStorage.getItem('planner_water');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.lastDate !== todayKey()) {
        setState(prev => ({
          ...prev,
          history: { ...prev.history, [prev.lastDate ?? parsed.lastDate]: prev.glasses },
          glasses: 0,
          lastDate: todayKey(),
        }));
      }
    };
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);


  /* Motivational message */
  const getMessage = () => {
    if (pct >= 1)    return { msg: "Goal reached! You're glowing 💙", color: 'text-blue-500' };
    if (pct >= 0.75) return { msg: `Almost there! Just ${remaining} more glass${remaining !== 1 ? 'es' : ''} 💪`, color: 'text-blue-400' };
    if (pct >= 0.5)  return { msg: "Halfway there — keep going! 🌊", color: 'text-cyan-500' };
    if (pct >= 0.25) return { msg: "Good start! Stay hydrated 💧", color: 'text-sky-500' };
    if (glasses > 0) return { msg: "Great start! Keep sipping 😊", color: 'text-slate-500' };
    return { msg: "Tap a glass to log your first drink!", color: darkMode ? 'text-slate-400' : 'text-slate-500' };
  };
  const { msg, color } = getMessage();

  const gridGlasses = Array.from({ length: goal }, (_, i) => i);

  return (
    <>
      {/* Mobile settings drawer */}
      {showSettings && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setShowSettings(false)}
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className={`absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto
            ${darkMode ? 'bg-slate-900 border-t border-slate-700' : 'bg-white border-t border-blue-100'}`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`font-black text-base ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>⚙️ Settings</h3>
              <button onClick={() => setShowSettings(false)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>✕</button>
            </div>
            <SettingsPanel goal={goal} mlPerGlass={mlPerGlass} onGoalChange={handleGoalChange} onMlChange={setMlPerGlass} darkMode={darkMode} />
          </div>
        </div>
      )}

      <div className="min-h-screen animate-fade-in p-4 sm:p-6 lg:p-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              💧 Water Tracker
            </h1>
            <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {goalMet && ' · 🎉 Goal reached!'}
            </p>
          </div>
          <button onClick={() => setShowSettings(true)}
            className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all
              ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>

        {/* ── Two-column layout ── */}
        {loading ? (
          <WaterSkeleton />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ════ MAIN PANEL ════ */}
            <div className="flex-1 space-y-6">

              {/* Top stat pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: '💧', label: 'Drunk', val: `${glasses}/${goal}`, sub: 'glasses' },
                  { icon: '📊', label: 'Progress', val: `${Math.round(pct * 100)}%`, sub: 'of goal' },
                  { icon: '🫧', label: 'Volume', val: `${(totalMl / 1000).toFixed(2)}L`, sub: `${totalMl} ml` },
                  { icon: '⏳', label: 'Remaining', val: remaining, sub: `${remaining * mlPerGlass} ml left` },
                ].map((s, i) => (
                  <div key={i} className={`rounded-2xl p-4 border shadow-sm
                    ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-blue-50'}`}>
                    <p className="text-xl mb-1">{s.icon}</p>
                    <p className={`text-xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{s.val}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className={`rounded-3xl p-6 border shadow-sm
                ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-blue-50'}`}>

                {/* Bar + bottle row */}
                <div className="flex items-center gap-6 mb-6">
                  {/* Water bottle */}
                  <div className="flex-shrink-0">
                    <WaterBottle pct={pct} darkMode={darkMode} />
                  </div>

                  {/* Progress + glasses grid */}
                  <div className="flex-1 min-w-0 space-y-5">
                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-black ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {glasses} of {goal} glasses
                        </span>
                        <span className={`text-sm font-black ${goalMet ? 'text-blue-500' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {Math.round(pct * 100)}%
                        </span>
                      </div>
                      <div className={`h-4 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-blue-100'}`}>
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                          style={{
                            width: `${pct * 100}%`,
                            background: 'linear-gradient(to right, #60a5fa, #3b82f6, #2563eb)',
                            boxShadow: '0 2px 8px #60a5fa50',
                          }}
                        >
                          <div className="absolute inset-0"
                            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)' }} />
                        </div>
                      </div>
                    </div>

                    {/* Motivational message */}
                    <p className={`text-sm font-bold ${color}`}>{msg}</p>

                    {/* Quick +/- controls */}
                    <div className="flex items-center gap-3">
                      <button onClick={removeGlass}
                        disabled={glasses === 0}
                        className={`w-12 h-12 rounded-2xl font-black text-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                          ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-500'}`}>
                        −
                      </button>
                      <button onClick={addGlass}
                        disabled={glasses >= goal}
                        className="flex-1 py-3 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', boxShadow: '0 4px 16px #60a5fa40' }}>
                        💧 Drink a glass
                      </button>
                      <button onClick={addGlass}
                        disabled={glasses >= goal}
                        className={`w-12 h-12 rounded-2xl font-black text-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                          ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Glass grid */}
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tap to log each glass
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    {gridGlasses.map(i => (
                      <GlassIcon
                        key={i}
                        index={i}
                        filled={i < glasses}
                        partial={false}
                        onClick={() => fillGlass(i)}
                        animating={animating}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </div>

                {/* Goal celebration */}
                {goalMet && (
                  <div className="mt-6">
                    <GoalCelebration visible={goalMet} />
                  </div>
                )}

                {/* Reset button */}
                <button onClick={resetToday}
                  className={`mt-5 text-xs font-bold transition-colors
                    ${darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-red-400'}`}>
                  ↺ Reset today's count
                </button>
              </div>

              {/* Weekly chart */}
              <div className={`rounded-3xl p-6 border shadow-sm
                ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-blue-50'}`}>
                <h3 className={`font-black text-base mb-5 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                  📊 Weekly Intake
                </h3>
                <WeeklyChart history={history} today={glasses} goal={goal} darkMode={darkMode} />
              </div>
            </div>

            {/* ════ DESKTOP SETTINGS SIDEBAR ════ */}
            <div className={`hidden lg:block w-72 xl:w-80 flex-shrink-0 rounded-3xl p-6 sticky top-20 border shadow-sm
              ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-blue-50'}`}>
              <h3 className={`font-black text-base mb-5 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                ⚙️ Settings
              </h3>
              <SettingsPanel
                goal={goal}
                mlPerGlass={mlPerGlass}
                onGoalChange={handleGoalChange}
                onMlChange={setMlPerGlass}
                darkMode={darkMode}
              />

              {/* Hydration tips */}
              <div className={`mt-6 p-4 rounded-2xl space-y-2 ${darkMode ? 'bg-slate-700/50' : 'bg-blue-50'}`}>
                <p className={`text-[11px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-blue-400'}`}>
                  💡 Hydration Tips
                </p>
                {[
                  'Drink a glass when you wake up',
                  'Sip water before every meal',
                  'Keep a bottle at your desk',
                  'Drink more on hot or active days',
                ].map((tip, i) => (
                  <p key={i} className={`text-xs font-semibold leading-relaxed ${darkMode ? 'text-slate-300' : 'text-blue-700'}`}>
                    · {tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
