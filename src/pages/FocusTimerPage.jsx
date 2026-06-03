import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const MODES = {
  focus:      { label: 'Focus',       emoji: '🍅', defaultMin: 25, color: '#f472b6', track: '#fce7f3', darkTrack: '#2d1a24' },
  short_break:{ label: 'Short Break', emoji: '☕', defaultMin: 5,  color: '#34d399', track: '#d1fae5', darkTrack: '#0d2318' },
  long_break: { label: 'Long Break',  emoji: '🌙', defaultMin: 15, color: '#818cf8', track: '#e0e7ff', darkTrack: '#1a1a3e' },
};

const PRESETS = [
  { label: 'Classic',    focus: 25, short: 5,  long: 15 },
  { label: 'Extended',   focus: 50, short: 10, long: 20 },
  { label: 'Short',      focus: 15, short: 3,  long: 10 },
  { label: 'Deep Work',  focus: 90, short: 15, long: 30 },
];

/* ── Soft bell using Web Audio API ──────────────────── */
function playBell(darkMode) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, duration, gain = 0.3) => {
      const osc  = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + start + duration);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + start);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    play(880, 0,    1.2);
    play(660, 0.4,  1.0);
    play(880, 0.9,  1.5, 0.2);
  } catch (_) { /* Browsers may block autoplay */ }
}

/* ── Format seconds → mm:ss ─────────────────────────── */
function fmt(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/* ═══════════════════════════════════════════════════════
   TIMER RING SVG
═══════════════════════════════════════════════════════ */
function TimerRing({ pct, mode, running, secs, darkMode }) {
  const size    = 300;
  const stroke  = 18;
  const r       = (size - stroke) / 2;
  const circ    = 2 * Math.PI * r;
  const dash    = circ * pct;
  const cfg     = MODES[mode];

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Outer glow pulse when running */}
      {running && (
        <div className="absolute inset-0 rounded-full animate-ping opacity-10"
          style={{ background: cfg.color, animationDuration: '2s' }} />
      )}

      {/* Subtle gradient bg disc */}
      <div className="absolute inset-3 rounded-full"
        style={{
          background: darkMode
            ? `radial-gradient(circle at 40% 30%, ${cfg.color}18, transparent 70%)`
            : `radial-gradient(circle at 40% 30%, ${cfg.color}22, white 70%)`,
          boxShadow: darkMode
            ? `0 0 60px ${cfg.color}20`
            : `0 8px 40px ${cfg.color}30, inset 0 0 0 1px ${cfg.color}15`,
        }}
      />

      {/* SVG ring */}
      <svg width={size} height={size} className="absolute" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={darkMode ? cfg.darkTrack : cfg.track} strokeWidth={stroke} />
        {/* Progress */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={cfg.color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: running ? 'stroke-dasharray 1s linear' : 'stroke-dasharray 0.6s ease' }}
        />
        {/* Dot at tip */}
        {pct > 0.02 && (
          <circle
            cx={size/2 + r * Math.cos(2 * Math.PI * pct - Math.PI/2)}
            cy={size/2 + r * Math.sin(2 * Math.PI * pct - Math.PI/2)}
            r={stroke / 2 - 1} fill={cfg.color}
            style={{ filter: `drop-shadow(0 0 6px ${cfg.color})` }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-1">
        <span className="text-4xl leading-none mb-1">{cfg.emoji}</span>
        <span className={`text-6xl font-black tracking-tight tabular-nums ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          {fmt(secs)}
        </span>
        <span className="text-sm font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SESSION DOTS
═══════════════════════════════════════════════════════ */
function SessionDots({ count, current, mode }) {
  const cfg = MODES[mode];
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}
          className="transition-all duration-300"
          style={{
            width:  i === current % 4 ? 20 : 10,
            height: 10,
            borderRadius: 999,
            background: i < count % 4 || (count >= 4 && i <= (count-1) % 4)
              ? cfg.color
              : i === current % 4
              ? cfg.color + 'aa'
              : 'transparent',
            border: `2px solid ${i < count % 4 ? cfg.color : cfg.color + '60'}`,
          }}
        />
      ))}
      {count >= 4 && (
        <span className="text-xs font-black ml-1" style={{ color: cfg.color }}>×{Math.floor(count/4)+1}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SETTINGS PANEL (shared by desktop sidebar + mobile drawer)
═══════════════════════════════════════════════════════ */
function SettingsPanel({ settings, setSettings, onPreset, darkMode }) {
  const input = (label, key, min, max) => (
    <div>
      <label className={`block text-[11px] font-black uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range" min={min} max={max}
          value={settings[key]}
          onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))}
          className="flex-1 accent-pink-400 h-2 cursor-pointer"
        />
        <span className={`text-sm font-black w-10 text-right tabular-nums ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          {settings[key]}m
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <p className={`text-[11px] font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Quick Presets
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map(p => (
            <button key={p.label}
              onClick={() => onPreset(p)}
              className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition-all hover:scale-105
                ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-pink-100 text-slate-600 hover:text-pink-700'}`}
            >
              <span className="block font-black">{p.label}</span>
              <span className="opacity-70">{p.focus}m / {p.short}m</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {input('🍅 Focus Duration',      'focusMin',  5, 120)}
        {input('☕ Short Break',          'shortMin',  1, 30)}
        {input('🌙 Long Break',           'longMin',   5, 60)}
        {input('📍 Sessions before long', 'sessions',  2, 8)}
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {[
          { key: 'sound',     label: '🔔 Bell on finish'      },
          { key: 'autoStart', label: '▶️ Auto-start next'     },
          { key: 'tabTitle',  label: '🗂 Update tab title'     },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
            <button
              onClick={() => setSettings(s => ({ ...s, [key]: !s[key] }))}
              className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0
                ${settings[key] ? 'bg-gradient-to-r from-pink-400 to-purple-400' : darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300
                ${settings[key] ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MOBILE BOTTOM DRAWER
═══════════════════════════════════════════════════════ */
function BottomDrawer({ open, onClose, children, darkMode }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={onClose}
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      )}
      <div className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-3xl transition-transform duration-400 ease-out
        ${open ? 'translate-y-0' : 'translate-y-full'}
        ${darkMode ? 'bg-slate-900 border-t border-slate-700' : 'bg-white border-t border-pink-100'}
        shadow-2xl`}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
        </div>
        <div className="px-6 pb-8 pt-3">
          <div className="flex items-center justify-between mb-5">
            <h3 className={`text-base font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>⚙️ Timer Settings</h3>
            <button onClick={onClose}
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN FOCUS TIMER PAGE
═══════════════════════════════════════════════════════ */
export default function FocusTimerPage() {
  const { darkMode } = useApp();

  /* ── Settings ── */
  const [settings, setSettings] = useState({
    focusMin:  25,
    shortMin:  5,
    longMin:   15,
    sessions:  4,
    sound:     true,
    autoStart: false,
    tabTitle:  true,
  });

  /* ── Timer state ── */
  const [mode,        setMode]        = useState('focus');        // 'focus' | 'short_break' | 'long_break'
  const [totalSecs,   setTotalSecs]   = useState(25 * 60);
  const [secsLeft,    setSecsLeft]    = useState(25 * 60);
  const [running,     setRunning]     = useState(false);
  const [sessionsComp,setSessionsComp]= useState(0);             // focus sessions completed
  const [completed,   setCompleted]   = useState(false);          // just finished?
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [label,       setLabel]       = useState('');              // optional task label

  const intervalRef = useRef(null);
  const cfg         = MODES[mode];
  const pct         = secsLeft / totalSecs;

  /* ── Derive total from settings+mode ── */
  const getDuration = useCallback((m) => {
    if (m === 'focus')       return settings.focusMin * 60;
    if (m === 'short_break') return settings.shortMin * 60;
    return settings.longMin * 60;
  }, [settings]);

  /* ── Tab title ── */
  useEffect(() => {
    if (!settings.tabTitle) { document.title = 'My Daily Planner 🌸'; return; }
    if (!running && secsLeft === totalSecs) {
      document.title = `My Daily Planner 🌸`;
    } else {
      document.title = `${fmt(secsLeft)} — ${cfg.label} ${cfg.emoji}`;
    }
  }, [secsLeft, running, mode, settings.tabTitle, cfg, totalSecs]);

  /* ── Cleanup title on unmount ── */
  useEffect(() => () => { document.title = 'My Daily Planner 🌸'; }, []);

  /* ── Tick ── */
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setCompleted(true);
            if (settings.sound) playBell();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, settings.sound]);

  /* ── Auto-start next session ── */
  useEffect(() => {
    if (!completed) return;
    if (mode === 'focus') {
      const next = (sessionsComp + 1) % settings.sessions === 0 ? 'long_break' : 'short_break';
      setSessionsComp(s => s + 1);
      if (settings.autoStart) { switchMode(next, true); }
    } else {
      if (settings.autoStart) { switchMode('focus', true); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed]);

  /* ── Switch mode ── */
  const switchMode = (m, autoRun = false) => {
    clearInterval(intervalRef.current);
    const dur = getDuration(m);
    setMode(m);
    setTotalSecs(dur);
    setSecsLeft(dur);
    setRunning(autoRun);
    setCompleted(false);
  };

  /* ── Update duration when settings change (only if not running) ── */
  useEffect(() => {
    if (running) return;
    const dur = getDuration(mode);
    setTotalSecs(dur);
    setSecsLeft(dur);
  }, [settings.focusMin, settings.shortMin, settings.longMin, mode, getDuration, running]);

  /* ── Controls ── */
  const handleStart  = () => { setCompleted(false); setRunning(true); };
  const handlePause  = () => setRunning(false);
  const handleReset  = () => {
    clearInterval(intervalRef.current);
    const dur = getDuration(mode);
    setSecsLeft(dur);
    setTotalSecs(dur);
    setRunning(false);
    setCompleted(false);
  };
  const handlePreset = (p) => {
    setSettings(s => ({ ...s, focusMin: p.focus, shortMin: p.short, longMin: p.long }));
    if (!running) switchMode(mode);
  };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space')   { e.preventDefault(); running ? handlePause() : handleStart(); }
      if (e.key  === 'r' || e.key === 'R') handleReset();
      if (e.key  === 's' || e.key === 'S') {
        const next = mode === 'focus'
          ? (sessionsComp + 1) % settings.sessions === 0 ? 'long_break' : 'short_break'
          : 'focus';
        if (mode === 'focus') setSessionsComp(s => s + 1);
        switchMode(next);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [running, mode, sessionsComp, settings.sessions]);

  /* Reset focus sessions when data is cleared */
  useEffect(() => {
    const handler = () => {
      setSessionsComp(0);
    };
    window.addEventListener('planner-data-changed', handler);
    return () => window.removeEventListener('planner-data-changed', handler);
  }, []);

  /* ── Completion flash class ── */
  const completedRing = completed ? 'animate-bounce-in' : '';

  return (
    <>
      {/* Mobile settings drawer */}
      <BottomDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} darkMode={darkMode}>
        <SettingsPanel settings={settings} setSettings={setSettings} onPreset={handlePreset} darkMode={darkMode} />
      </BottomDrawer>

      <div className="min-h-screen animate-fade-in flex flex-col">

        {/* ── Page header ── */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              ⏱️ Focus Timer
            </h1>
            <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {sessionsComp} session{sessionsComp !== 1 ? 's' : ''} completed today
            </p>
          </div>

          {/* Settings button — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all
              ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-pink-50 border border-slate-100'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>

        {/* ── Main two-column layout ── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 sm:px-6 lg:px-8 pb-8 lg:items-start">

          {/* ════ CENTER PANEL ════ */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">

            {/* Mode tabs */}
            <div className={`flex p-1.5 gap-1 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {Object.entries(MODES).map(([key, m]) => (
                <button key={key}
                  onClick={() => switchMode(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-200
                    ${mode === key
                      ? 'text-white shadow-md scale-105'
                      : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  style={mode === key ? { background: `linear-gradient(135deg, ${m.color}dd, ${m.color})` } : {}}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>

            {/* Task label input */}
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="What are you working on? (optional)"
              className={`w-full max-w-sm text-center text-sm font-semibold px-5 py-2.5 rounded-2xl outline-none border transition-all
                ${darkMode
                  ? 'bg-slate-800/60 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-pink-400'
                  : 'bg-white/80 border-slate-200 text-slate-600 placeholder-slate-400 focus:border-pink-300'
                }`}
            />

            {/* ── Timer Ring ── */}
            <div className={`${completedRing}`}>
              <TimerRing
                pct={pct}
                mode={mode}
                running={running}
                secs={secsLeft}
                darkMode={darkMode}
              />
            </div>

            {/* Completion banner */}
            {completed && (
              <div className="animate-bounce-in text-center px-6 py-3 rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`, border: `1px solid ${cfg.color}40` }}>
                <p className="text-base font-black" style={{ color: cfg.color }}>
                  {mode === 'focus' ? '🎉 Focus session complete!' : '✨ Break time over!'}
                </p>
                <p className={`text-xs font-semibold mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {mode === 'focus' ? `Great work! Session #${sessionsComp} done.` : 'Ready to focus again?'}
                </p>
              </div>
            )}

            {/* ── Controls ── */}
            <div className="flex items-center gap-4">
              {/* Reset */}
              <button onClick={handleReset}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95
                  ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                aria-label="Reset"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Play / Pause — large */}
              <button
                onClick={running ? handlePause : handleStart}
                className="w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
                  boxShadow: `0 8px 32px ${cfg.color}50`,
                }}
                aria-label={running ? 'Pause' : 'Start'}
              >
                {running ? (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Skip to next */}
              <button
                onClick={() => {
                  const next = mode === 'focus'
                    ? (sessionsComp + 1) % settings.sessions === 0 ? 'long_break' : 'short_break'
                    : 'focus';
                  if (mode === 'focus') setSessionsComp(s => s + 1);
                  switchMode(next);
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95
                  ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                aria-label="Skip to next"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/>
                </svg>
              </button>
            </div>

            {/* ── Session dots ── */}
            <div className="flex flex-col items-center gap-2">
              <SessionDots count={sessionsComp} current={sessionsComp} mode={mode} />
              <p className={`text-[11px] font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {settings.sessions - (sessionsComp % settings.sessions)} session{settings.sessions - (sessionsComp % settings.sessions) !== 1 ? 's' : ''} until long break
              </p>
            </div>

            {/* ── Today's summary strip ── */}
            <div className={`w-full max-w-sm grid grid-cols-3 gap-3 mt-2`}>
              {[
                { icon: '🍅', label: 'Focus sessions', val: sessionsComp },
                { icon: '⏱️', label: 'Total focused',  val: `${Math.floor(sessionsComp * settings.focusMin / 60)}h ${(sessionsComp * settings.focusMin) % 60}m` },
                { icon: '☕', label: 'Breaks taken',   val: Math.max(0, sessionsComp - (sessionsComp > 0 ? 0 : 0)) },
              ].map((s, i) => (
                <div key={i} className={`text-center py-3 px-2 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white/80 border border-slate-100'} shadow-sm`}>
                  <p className="text-xl">{s.icon}</p>
                  <p className={`text-lg font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{s.val}</p>
                  <p className={`text-[10px] font-bold leading-tight mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ════ DESKTOP SETTINGS SIDEBAR ════ */}
          <div className={`hidden lg:block w-80 xl:w-96 flex-shrink-0 rounded-3xl p-6 sticky top-20 border
            ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-pink-100/80'} shadow-sm backdrop-blur-sm`}>
            <h3 className={`text-base font-black mb-5 ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              ⚙️ Timer Settings
            </h3>
            <SettingsPanel
              settings={settings}
              setSettings={setSettings}
              onPreset={handlePreset}
              darkMode={darkMode}
            />

            {/* Tip box */}
            <div className={`mt-6 p-4 rounded-2xl ${darkMode ? 'bg-slate-700/50' : 'bg-pink-50'}`}>
              <p className={`text-xs font-bold leading-relaxed ${darkMode ? 'text-slate-300' : 'text-pink-700'}`}>
                💡 <strong>Pomodoro Technique:</strong> Work for 25 minutes, then take a 5-minute break.
                After 4 sessions, take a longer 15–30 minute break.
              </p>
            </div>

            {/* Keyboard shortcuts */}
            <div className={`mt-4 space-y-2`}>
              <p className={`text-[11px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Shortcuts</p>
              {[
                { key: 'Space', action: 'Play / Pause' },
                { key: 'R',     action: 'Reset timer'  },
                { key: 'S',     action: 'Skip session' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{action}</span>
                  <kbd className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
