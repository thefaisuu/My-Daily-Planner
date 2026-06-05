import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import PastelIcon from '../components/PastelIcon';
import { Settings, X, RotateCcw, Play, Pause, SkipForward, Timer, Brain, Coffee, Moon, Pin, Bell, Layers, Clock, Lightbulb } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const MODES = {
  focus:       { label: 'Focus',       iconName: 'Brain',       defaultMin: 25, color: '#7DD3FC', track: '#F0F4FF', darkTrack: '#2d1a24' },
  short_break: { label: 'Short Break', iconName: 'Coffee',      defaultMin: 5,  color: '#34D399', track: '#E8FDF0', darkTrack: '#0d2318' },
  long_break:  { label: 'Long Break',  iconName: 'Moon',        defaultMin: 15, color: '#4F7CFF', track: '#FFF0F5', darkTrack: '#1a1a3e' },
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

      <div className="relative flex flex-col items-center gap-1.5">
        {(() => {
          const ModeIcon = cfg.iconName === 'Brain' ? Brain
                         : cfg.iconName === 'Coffee' ? Coffee
                         : Moon;
          return <ModeIcon size={32} className="mb-0.5" style={{ color: cfg.color }} strokeWidth={1.5} />;
        })()}
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
                ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-pink-700'}`}
            >
              <span className="block font-black">{p.label}</span>
              <span className="opacity-70">{p.focus}m / {p.short}m</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {input(
          <span className="flex items-center gap-1.5">
            <Brain size={12} strokeWidth={1.5} className="text-[#7DD3FC]" />
            <span>Focus Duration</span>
          </span>,
          'focusMin', 5, 120
        )}
        {input(
          <span className="flex items-center gap-1.5">
            <Coffee size={12} strokeWidth={1.5} className="text-[#34D399]" />
            <span>Short Break</span>
          </span>,
          'shortMin', 1, 30
        )}
        {input(
          <span className="flex items-center gap-1.5">
            <Moon size={12} strokeWidth={1.5} className="text-[#4F7CFF]" />
            <span>Long Break</span>
          </span>,
          'longMin', 5, 60
        )}
        {input(
          <span className="flex items-center gap-1.5">
            <Pin size={12} strokeWidth={1.5} className="text-slate-400" />
            <span>Sessions before long</span>
          </span>,
          'sessions', 2, 8
        )}
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {[
          { key: 'sound',     label: 'Bell on finish',   icon: <Bell size={13} strokeWidth={1.5} className="text-slate-400" /> },
          { key: 'autoStart', label: 'Auto-start next',  icon: <Play size={13} strokeWidth={1.5} className="text-slate-400" /> },
          { key: 'tabTitle',  label: 'Update tab title', icon: <Layers size={13} strokeWidth={1.5} className="text-slate-400" /> },
        ].map(({ key, label, icon }) => (
          <div key={key} className="flex items-center justify-between">
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {icon}
              <span>{label}</span>
            </span>
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
        ${darkMode ? 'bg-slate-900 border-t border-slate-700' : 'bg-white border-t border-blue-100'}
        shadow-2xl`}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} />
        </div>
        <div className="px-6 pb-8 pt-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <PastelIcon name="Settings" colorType="settings" circleSize="w-8 h-8" size={16} />
              <h3 className={`text-base font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>Timer Settings</h3>
            </div>
            <button onClick={onClose}
              className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              <X size={16} strokeWidth={1.5} />
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
  const { darkMode, showToast } = useApp();

  /* ── Settings ── */
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('planner_timer_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            focusMin:  typeof parsed.focusMin === 'number' ? parsed.focusMin : 25,
            shortMin:  typeof parsed.shortMin === 'number' ? parsed.shortMin : 5,
            longMin:   typeof parsed.longMin === 'number' ? parsed.longMin : 15,
            sessions:  typeof parsed.sessions === 'number' ? parsed.sessions : 4,
            sound:     typeof parsed.sound === 'boolean' ? parsed.sound : true,
            autoStart: typeof parsed.autoStart === 'boolean' ? parsed.autoStart : false,
            tabTitle:  typeof parsed.tabTitle === 'boolean' ? parsed.tabTitle : true,
          };
        }
      }
    } catch (_) {}
    return {
      focusMin:  25,
      shortMin:  5,
      longMin:   15,
      sessions:  4,
      sound:     true,
      autoStart: false,
      tabTitle:  true,
    };
  });

  useEffect(() => {
    if (settings) {
      localStorage.setItem('planner_timer_settings', JSON.stringify(settings));
    }
  }, [settings]);

  /* ── Timer state ── */
  const [mode,        setMode]        = useState('focus');        // 'focus' | 'short_break' | 'long_break'
  const [totalSecs,   setTotalSecs]   = useState(() => ((settings?.focusMin || 25) * 60));
  const [secsLeft,    setSecsLeft]    = useState(() => ((settings?.focusMin || 25) * 60));
  const [running,     setRunning]     = useState(false);
  const [sessionsComp,setSessionsComp]= useState(0);             // focus sessions completed
  const [completed,   setCompleted]   = useState(false);          // just finished?
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [label,       setLabel]       = useState('');              // optional task label

  const intervalRef = useRef(null);
  const runningRef  = useRef(running);
  const sessionsCompRef = useRef(sessionsComp);
  const modeRef = useRef(mode);
  const settingsRef = useRef(settings);

  const cfg         = MODES[mode];
  const pct         = secsLeft / totalSecs;

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => { sessionsCompRef.current = sessionsComp; }, [sessionsComp]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const triggerNotification = useCallback((title, body) => {
    // 1. Show react toast with playSound = true
    showToast(`${title}: ${body}`, 'success', null, true);

    // 2. Show HTML5 browser notification if permitted
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, {
              body: body,
              icon: '/favicon.ico',
            });
          }
        });
      }
    }
  }, [showToast]);

  /* ── Derive total from settings+mode ── */
  const getDuration = useCallback((m) => {
    if (m === 'focus')       return settings.focusMin * 60;
    if (m === 'short_break') return settings.shortMin * 60;
    return settings.longMin * 60;
  }, [settings]);

  /* ── Switch mode ── */
  const switchMode = useCallback((m, autoRun = false) => {
    clearInterval(intervalRef.current);
    const dur = getDuration(m);
    setMode(m);
    setTotalSecs(dur);
    setSecsLeft(dur);
    setRunning(autoRun);
    setCompleted(false);
  }, [getDuration]);


  /* ── Tab title ── */
  useEffect(() => {
    if (!settings.tabTitle) { document.title = 'My Daily Planner'; return; }
    const cfg = MODES[mode];
    if (secsLeft === 0) {
      document.title = `My Daily Planner`;
    } else {
      document.title = `${fmt(secsLeft)} — ${cfg.label}`;
    }
  }, [secsLeft, mode, settings.tabTitle]);

  /* ── Cleanup title on unmount ── */
  useEffect(() => () => { document.title = 'My Daily Planner'; }, []);

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
    const currentMode = modeRef.current;
    const currentSessionsComp = sessionsCompRef.current;
    const currentSettings = settingsRef.current;

      if (currentMode === 'focus') {
        const next = (currentSessionsComp + 1) % currentSettings.sessions === 0 ? 'long_break' : 'short_break';
        const newCount = currentSessionsComp + 1;
        setSessionsComp(newCount);
        triggerNotification('Focus Session Complete!', `Great job! Session #${newCount} completed.`);
        
        try {
          const raw = localStorage.getItem('planner_focus_completions');
          const list = raw ? JSON.parse(raw) : [];
          list.push({
            id: Date.now(),
            sessionNumber: newCount,
            timestamp: new Date().toISOString(),
            duration: currentSettings.focusMin,
          });
          localStorage.setItem('planner_focus_completions', JSON.stringify(list));
          window.dispatchEvent(new Event('planner-data-changed'));
        } catch (e) {
          console.warn('Failed to save focus completion:', e);
        }

        if (currentSettings.autoStart) { switchMode(next, true); }
      } else {
        triggerNotification('Break Over!', 'Ready to focus again? Let\'s get back to work!');
        if (currentSettings.autoStart) { switchMode('focus', true); }
      }
  }, [completed, triggerNotification, switchMode]);



  /* ── Update duration when settings change (only if not running) ── */
  useEffect(() => {
    if (runningRef.current) return;
    const dur = getDuration(mode);
    setTotalSecs(dur);
    setSecsLeft(dur);
  }, [settings.focusMin, settings.shortMin, settings.longMin, mode, getDuration]);

  /* ── Controls ── */
  const handleStart  = () => {
    setCompleted(false);
    setRunning(true);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };
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
      {drawerOpen && (
        <BottomDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} darkMode={darkMode}>
          <SettingsPanel settings={settings} setSettings={setSettings} onPreset={handlePreset} darkMode={darkMode} />
        </BottomDrawer>
      )}

      <div className="min-h-screen animate-fade-in flex flex-col">

        {/* ── Page header ── */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PastelIcon name="Timer" colorType="timer" circleSize="w-12 h-12" size={22} />
            <div>
              <h1 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'} leading-none`}>
                Focus Timer
              </h1>
              <p className={`text-sm font-semibold mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {sessionsComp} session{sessionsComp !== 1 ? 's' : ''} completed today
              </p>
            </div>
          </div>

          {/* Settings button — mobile only */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all cursor-pointer
              ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-blue-50 border border-slate-100'}`}
          >
            <Settings className="w-4 h-4" strokeWidth={1.5} />
            Settings
          </button>
        </div>

        {/* ── Main two-column layout ── */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 sm:px-6 lg:px-8 pb-8 lg:items-start">

          {/* ════ CENTER PANEL ════ */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">

            {/* Mode tabs */}
            <div className={`flex p-1.5 gap-1 rounded-2xl flex-wrap justify-center ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {Object.entries(MODES).map(([key, m]) => (
                <button key={key}
                  onClick={() => switchMode(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-200 flex items-center gap-1.5
                    ${mode === key
                      ? 'text-white shadow-md scale-105'
                      : darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  style={mode === key ? { background: `linear-gradient(135deg, ${m.color}dd, ${m.color})` } : {}}
                >
                  {(() => {
                    const BtnIcon = m.iconName === 'Brain' ? Brain
                                  : m.iconName === 'Coffee' ? Coffee
                                  : Moon;
                    return <BtnIcon size={13} strokeWidth={1.5} />;
                  })()}
                  <span>{m.label}</span>
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
                  {mode === 'focus' ? 'Focus session complete!' : 'Break time over!'}
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
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer
                  ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                aria-label="Reset"
              >
                <RotateCcw className="w-5 h-5" strokeWidth={1.5} />
              </button>

              {/* Play / Pause — large */}
              <button
                onClick={running ? handlePause : handleStart}
                className="w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
                  boxShadow: `0 8px 32px ${cfg.color}50`,
                }}
                aria-label={running ? 'Pause' : 'Start'}
              >
                {running ? (
                  <Pause className="w-8 h-8 text-white" strokeWidth={1.5} fill="white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" strokeWidth={1.5} fill="white" />
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
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer
                  ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                aria-label="Skip to next"
              >
                <SkipForward className="w-5 h-5" strokeWidth={1.5} />
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
                { iconName: 'Brain',   colorType: 'timer',     label: 'Focus sessions', val: sessionsComp },
                { iconName: 'Clock',   colorType: 'dashboard', label: 'Total focused',  val: `${Math.floor(sessionsComp * settings.focusMin / 60)}h ${(sessionsComp * settings.focusMin) % 60}m` },
                { iconName: 'Coffee',  colorType: 'habits',    label: 'Breaks taken',   val: Math.max(0, sessionsComp) },
              ].map((s, i) => (
                <div key={i} className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white/80 border border-slate-100'} shadow-sm`}>
                  <PastelIcon name={s.iconName} colorType={s.colorType} circleSize="w-8 h-8" size={14} />
                  <p className={`text-lg font-black mt-2 leading-none ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{s.val}</p>
                  <p className={`text-[10px] font-bold leading-tight text-center mt-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ════ DESKTOP SETTINGS SIDEBAR ════ */}
          <div className={`hidden lg:block w-80 xl:w-96 flex-shrink-0 rounded-3xl p-6 sticky top-20 border
            ${darkMode ? 'bg-slate-800/70 border-slate-700/50' : 'bg-white/80 border-blue-100/80'} shadow-sm backdrop-blur-sm`}>
            <div className="flex items-center gap-2 mb-5">
              <Settings size={16} className="text-[#7DD3FC]" strokeWidth={1.5} />
              <h3 className={`text-base font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                Timer Settings
              </h3>
            </div>
            <SettingsPanel
              settings={settings}
              setSettings={setSettings}
              onPreset={handlePreset}
              darkMode={darkMode}
            />

            {/* Tip box */}
            <div className={`mt-6 p-4 rounded-2xl ${darkMode ? 'bg-slate-700/50' : 'bg-pink-50'}`}>
              <div className="flex items-start gap-2">
                <Lightbulb size={16} className="text-amber-500 fill-amber-500/10 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className={`text-xs font-semibold leading-relaxed ${darkMode ? 'text-slate-300' : 'text-pink-700'}`}>
                  <strong>Pomodoro Technique:</strong> Work for 25 minutes, then take a 5-minute break.
                  After 4 sessions, take a longer 15–30 minute break.
                </p>
              </div>
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
