import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const COLORS = [
  { id: 'pink',   bg: '#fdf2f8', border: '#f9a8d4', text: '#831843', accent: '#f472b6', dark: { bg: '#2d1121', border: '#9d174d' } },
  { id: 'purple', bg: '#f5f3ff', border: '#c4b5fd', text: '#4c1d95', accent: '#a78bfa', dark: { bg: '#1e1b3a', border: '#6d28d9' } },
  { id: 'blue',   bg: '#eff6ff', border: '#93c5fd', text: '#1e3a8a', accent: '#60a5fa', dark: { bg: '#0f1e3d', border: '#1d4ed8' } },
  { id: 'mint',   bg: '#ecfdf5', border: '#6ee7b7', text: '#064e3b', accent: '#34d399', dark: { bg: '#0a2e20', border: '#065f46' } },
  { id: 'peach',  bg: '#fff7ed', border: '#fdba74', text: '#7c2d12', accent: '#fb923c', dark: { bg: '#2d150a', border: '#9a3412' } },
  { id: 'lemon',  bg: '#fefce8', border: '#fde68a', text: '#713f12', accent: '#facc15', dark: { bg: '#1c1500', border: '#854d0e' } },
  { id: 'rose',   bg: '#fff1f2', border: '#fda4af', text: '#881337', accent: '#fb7185', dark: { bg: '#200a10', border: '#9f1239' } },
  { id: 'slate',  bg: '#f8fafc', border: '#cbd5e1', text: '#1e293b', accent: '#94a3b8', dark: { bg: '#1e293b', border: '#475569' } },
];
const COLOR_MAP = Object.fromEntries(COLORS.map(c => [c.id, c]));

const DEMO_NOTES = [
  {
    id: 1, title: 'App redesign ideas 💡',
    body: 'Thinking about switching the nav to a bottom tab bar on mobile. Also want to add a pomodoro widget to the dashboard and a better onboarding flow for new users.\n\n• Glassmorphism header\n• Floating action button\n• Swipe gestures',
    color: 'pink', pinned: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 2, title: 'Meeting notes – Q2 kickoff',
    body: 'Key priorities: ship v2 by end of June, focus on mobile performance. Sarah owns the design sprint, Arjun owns backend.\n\nAction items:\n→ Design mockups by Friday\n→ API docs by next Monday\n→ Schedule user testing sessions',
    color: 'blue', pinned: false,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 3, title: 'Book list 📚',
    body: '1. Atomic Habits – James Clear\n2. Deep Work – Cal Newport\n3. The Creative Act – Rick Rubin\n4. Four Thousand Weeks – Oliver Burkeman\n5. Essentialism – Greg McKeown\n6. Thinking, Fast and Slow',
    color: 'purple', pinned: false,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 4, title: 'Grocery list 🛒',
    body: 'Oat milk, Greek yogurt, avocados ×3, sourdough bread, dark chocolate (85%), green tea, almonds, bananas, spinach, cherry tomatoes',
    color: 'mint', pinned: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: 5, title: 'Travel ideas ✈️',
    body: 'Places to visit:\n🇯🇵 Japan – cherry blossom season (March/April)\n🇮🇸 Iceland – northern lights (Nov–Feb)\n🇵🇹 Portugal – Lisbon & Porto\n🇲🇦 Morocco – Marrakech medina\n\nBudget target: $3000/trip',
    color: 'peach', pinned: true,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 6, title: 'Daily affirmations 🌸',
    body: 'I am capable of achieving my goals.\nI choose joy and gratitude today.\nMy potential is limitless.\nI create my own opportunities.\nI am enough, exactly as I am.',
    color: 'rose', pinned: false,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 7, title: 'Workout routine 💪',
    body: 'Mon: Upper body (chest + triceps)\nTue: Lower body (squats + deadlifts)\nWed: Rest / yoga\nThu: Back + biceps\nFri: HIIT cardio 20 min\nSat: Full body\nSun: Walk + stretching',
    color: 'lemon', pinned: false,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000,
  },
];

function loadNotes() {
  try {
    const raw = localStorage.getItem('planner_notes');
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}
function saveNotes(notes) {
  localStorage.setItem('planner_notes', JSON.stringify(notes));
}

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
  return `${Math.floor(secs/86400)}d ago`;
}

/* ═══════════════════════════════════════════════════════
   MASONRY LAYOUT HOOK
═══════════════════════════════════════════════════════ */
function useMasonry(notes, columns) {
  return useMemo(() => {
    if (columns <= 1) return [notes];
    const cols = Array.from({ length: columns }, () => []);
    // Distribute notes in order across columns (Pinterest-style)
    notes.forEach((note, i) => cols[i % columns].push(note));
    return cols;
  }, [notes, columns]);
}

/* ═══════════════════════════════════════════════════════
   NOTE CARD
═══════════════════════════════════════════════════════ */
function NoteCard({ note, onEdit, onPin, onDelete, onColorChange, darkMode }) {
  const c = COLOR_MAP[note.color] || COLORS[0];
  const [hovered, setHovered] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const cardStyle = {
    background: darkMode ? c.dark.bg : c.bg,
    borderColor: darkMode ? c.dark.border : c.border,
  };

  return (
    <div
      className="relative rounded-3xl border-2 p-5 cursor-pointer transition-all duration-200 group break-inside-avoid mb-4"
      style={{
        ...cardStyle,
        boxShadow: hovered ? `0 12px 40px ${c.accent}30` : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDel(false); }}
      onClick={() => onEdit(note)}
    >
      {/* Pin badge */}
      {note.pinned && (
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-md z-10"
          style={{ background: c.accent }}>
          📌
        </div>
      )}

      {/* Action bar — visible on hover */}
      <div
        className={`absolute top-3 right-3 flex items-center gap-1.5 transition-all duration-200 z-10
          ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Pin */}
        <button
          onClick={() => onPin(note.id)}
          title={note.pinned ? 'Unpin' : 'Pin to top'}
          className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110
            ${note.pinned ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-white/70 dark:bg-slate-700/70'}`}
        >
          {note.pinned ? '📌' : '📍'}
        </button>

        {/* Color picker */}
        <div className="relative group/color">
          <button
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110 bg-white/70 dark:bg-slate-700/70"
            title="Change color"
          >
            🎨
          </button>
          {/* Color palette popup */}
          <div className="absolute right-0 top-9 hidden group-hover/color:flex flex-wrap gap-1.5 p-2.5 rounded-2xl shadow-xl border z-20 w-32
            bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700">
            {COLORS.map(col => (
              <button key={col.id}
                onClick={() => onColorChange(note.id, col.id)}
                className={`w-7 h-7 rounded-xl transition-all hover:scale-110 border-2
                  ${note.color === col.id ? 'border-slate-500 scale-110' : 'border-transparent'}`}
                style={{ background: col.bg, borderColor: note.color === col.id ? col.accent : 'transparent' }}
                title={col.id}
              />
            ))}
          </div>
        </div>

        {/* Delete */}
        {confirmDel ? (
          <>
            <button onClick={() => onDelete(note.id)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-500 text-white hover:bg-rose-600 transition-colors">
              Delete
            </button>
            <button onClick={() => setConfirmDel(false)}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold bg-white/70 dark:bg-slate-700/70 text-slate-500 hover:bg-slate-100">
              ✕
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            title="Delete note"
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110 bg-white/70 dark:bg-slate-700/70 hover:bg-rose-100 dark:hover:bg-rose-900/40"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Title */}
      {note.title && (
        <h3 className="font-black text-base leading-snug mb-2 pr-20"
          style={{ color: darkMode ? '#f1f5f9' : c.text }}>
          {note.title}
        </h3>
      )}

      {/* Body preview */}
      <p className="text-sm leading-relaxed font-medium whitespace-pre-line"
        style={{ color: darkMode ? '#94a3b8' : c.text + 'cc' }}>
        {note.body}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t"
        style={{ borderColor: darkMode ? c.dark.border : c.border }}>
        <span className="text-[10px] font-black uppercase tracking-wider opacity-50"
          style={{ color: c.accent }}>
          {note.color}
        </span>
        <span className="text-[10px] font-semibold opacity-50"
          style={{ color: darkMode ? '#94a3b8' : c.text }}>
          {timeAgo(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTE EDITOR MODAL
═══════════════════════════════════════════════════════ */
function NoteModal({ note, darkMode, onSave, onClose }) {
  const [title,  setTitle]  = useState(note?.title  || '');
  const [body,   setBody]   = useState(note?.body   || '');
  const [color,  setColor]  = useState(note?.color  || 'pink');
  const [saved,  setSaved]  = useState(false);
  const autoSaveRef = useRef(null);
  const titleRef    = useRef(null);
  const backdropRef = useRef(null);
  const isNew = !note?.id;
  const c = COLOR_MAP[color] || COLORS[0];

  const noteIdRef = useRef(note?.id);
  useEffect(() => {
    noteIdRef.current = note?.id;
  }, [note?.id]);

  useEffect(() => { titleRef.current?.focus(); }, []);

  /* Auto-save debounce */
  useEffect(() => {
    if (!title.trim() && !body.trim()) return;
    clearTimeout(autoSaveRef.current);
    setSaved(false);
    autoSaveRef.current = setTimeout(() => {
      onSave({ id: noteIdRef.current, title, body, color }, false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
    return () => clearTimeout(autoSaveRef.current);
  }, [title, body, color]);

  const handleClose = () => {
    clearTimeout(autoSaveRef.current);
    if (title.trim() || body.trim()) {
      onSave({ id: noteIdRef.current, title, body, color }, true);
    }
    onClose();
  };

  const handleBackdrop = e => { if (e.target === backdropRef.current) handleClose(); };

  const cardStyle = {
    background: darkMode ? c.dark.bg : c.bg,
    borderColor: darkMode ? c.dark.border : c.border,
  };

  return (
    <div ref={backdropRef} onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border-2 shadow-2xl overflow-hidden animate-bounce-in flex flex-col transition-all duration-300"
        style={{
          background: darkMode ? c.dark.bg : c.bg,
          borderColor: darkMode ? c.dark.border : c.border,
          borderTop: `8px solid ${c.accent}`,
          maxHeight: '90vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 flex-shrink-0 bg-transparent">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isNew ? '✨' : '✏️'}</span>
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: c.accent }}>
              {isNew ? 'New Note' : 'Edit Note'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            <span className={`text-[11px] font-bold transition-all duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`}
              style={{ color: c.accent }}>
              ✓ Saved
            </span>
            <button onClick={handleClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110 cursor-pointer"
              style={{ background: `${c.accent}22`, color: c.accent }}>
              ✕
            </button>
          </div>
        </div>

        {/* Color picker strip */}
        <div className="flex items-center gap-2 px-6 pb-3 flex-shrink-0 bg-transparent">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500" style={{ color: darkMode ? undefined : `${c.text}88` }}>Color:</span>
          <div className="flex gap-1.5">
            {COLORS.map(col => (
              <button key={col.id}
                onClick={() => setColor(col.id)}
                className={`w-6 h-6 rounded-lg transition-all duration-150 hover:scale-110 border-2`}
                style={{
                  background: col.bg,
                  borderColor: color === col.id ? col.accent : 'transparent',
                  transform: color === col.id ? 'scale(1.2)' : undefined,
                  boxShadow: color === col.id ? `0 2px 8px ${col.accent}60` : 'none',
                }}
                title={col.id}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Note title…"
          className="w-full px-6 py-3.5 text-xl font-black bg-transparent outline-none border-0 placeholder-slate-400/70"
          style={{ color: darkMode ? '#f1f5f9' : c.text }}
        />

        {/* Divider */}
        <div className="mx-6 h-px" style={{ backgroundColor: darkMode ? `${c.accent}30` : c.border }} />

        {/* Body */}
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your note here… (auto-saves as you type)"
          className="flex-1 w-full px-6 py-4 text-sm font-medium bg-transparent outline-none resize-none leading-relaxed placeholder-slate-400/70 min-h-48"
          style={{ color: darkMode ? '#e2e8f0' : c.text }}
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
             style={{ 
               borderTopColor: darkMode ? `${c.accent}30` : c.border,
               backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.25)' 
             }}>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400" style={{ color: darkMode ? '#94a3b8' : `${c.text}aa` }}>
            <span>{body.length} chars</span>
            <span>·</span>
            <span>{body.split(/\s+/).filter(Boolean).length} words</span>
          </div>
          <button onClick={handleClose}
            className="px-5 py-2 rounded-2xl text-sm font-black text-white transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer animate-fade-in"
            style={{ background: c.accent, color: darkMode ? '#0f172a' : '#ffffff' }}>
            Done ✓
          </button>
        </div>
      </div>
    </div>
  );
}

function NotesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-10" />
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTES PAGE
═══════════════════════════════════════════════════════ */
export default function NotesPage() {
  const { darkMode, user, showToast } = useApp();
  const [notes,       setNotes]       = useState([]);
  const [modal,       setModal]       = useState(null);  // null | note object (empty = new)
  const [search,      setSearch]      = useState('');
  const [colorFilter, setColorFilter] = useState('all');
  const [columns,     setColumns]     = useState(3);
  const [loading,     setLoading]     = useState(false);

  // Load from DB or fallback
  const loadNotesData = useCallback(async () => {
    if (!supabase || !user) {
      setNotes(loadNotes());
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, body, color, pinned, created_at')
        .eq('user_id', user.id);

      if (error) throw error;

      const dbNotes = (data || []).map(row => ({
        id: row.id,
        title: row.title || '',
        body: row.body || '',
        color: row.color || 'pink',
        pinned: row.pinned,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.created_at).getTime(),
      }));

      setNotes(dbNotes);
    } catch (err) {
      console.error('Failed to load notes:', err);
      setNotes(loadNotes());
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load notes on mount
  useEffect(() => {
    loadNotesData();
  }, [loadNotesData]);

  /* Persist local storage only as cached backup */
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  /* Listen to custom event to reload notes */
  useEffect(() => {
    const handler = () => {
      loadNotesData();
    };
    window.addEventListener('planner-data-changed', handler);
    return () => window.removeEventListener('planner-data-changed', handler);
  }, [loadNotesData]);

  /* Responsive columns */
  useEffect(() => {
    const update = () => setColumns(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* Filtered + sorted notes */
  const filtered = useMemo(() => {
    let list = [...notes];
    if (colorFilter !== 'all') list = list.filter(n => n.color === colorFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));
    }
    // Pinned first, then newest
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
    return list;
  }, [notes, colorFilter, search]);

  const masonry = useMasonry(filtered, columns);

  /* Handlers */
  const handleSave = useCallback(async ({ id, title, body, color }, isClose) => {
    localStorage.setItem('last_action_notes', new Date().toISOString());
    if (!title.trim() && !body.trim()) return;

    const now = Date.now();
    const prevNotes = [...notes];

    if (id && !String(id).startsWith('temp-')) {
      // UPDATE
      setNotes(prev => prev.map(n => n.id === id ? { ...n, title, body, color, updatedAt: now } : n));
      
      if (!supabase || !user) {
        window.dispatchEvent(new Event('planner-data-changed'));
        if (isClose) showToast('Note saved ✓');
        return;
      }

      try {
        const { error } = await supabase
          .from('notes')
          .update({ title, body, color })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        window.dispatchEvent(new Event('planner-data-changed'));
        if (isClose) showToast('Note saved ✓');
      } catch (err) {
        console.error('Failed to update note:', err);
        setNotes(prevNotes);
        showToast('Failed to update note', 'error', {
          label: 'Retry',
          callback: () => handleSave({ id, title, body, color }, isClose)
        });
      }
    } else {
      // INSERT (or update a temp note that hasn't finished inserting yet)
      const tempId = id || 'temp-' + now;
      const newNote = {
        id: tempId,
        title, body, color,
        pinned: false,
        createdAt: now,
        updatedAt: now,
      };

      if (!id) {
        // Optimistically add locally
        setNotes(prev => [newNote, ...prev]);
        setModal(newNote);
      } else {
        // Update temp note locally
        setNotes(prev => prev.map(n => n.id === tempId ? newNote : n));
      }

      if (!supabase || !user) {
        window.dispatchEvent(new Event('planner-data-changed'));
        if (isClose) showToast('Note saved ✓');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            title,
            body,
            color,
            pinned: false
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const savedNote = {
            id: data.id,
            title: data.title || '',
            body: data.body || '',
            color: data.color || 'pink',
            pinned: data.pinned,
            createdAt: new Date(data.created_at).getTime(),
            updatedAt: new Date(data.created_at).getTime(),
          };
          setNotes(prev => prev.map(n => n.id === tempId ? savedNote : n));
          setModal(prev => prev && prev.id === tempId ? savedNote : prev);
          window.dispatchEvent(new Event('planner-data-changed'));
          if (isClose) showToast('Note saved ✓');
        }
      } catch (err) {
        console.error('Failed to create note:', err);
        setNotes(prevNotes);
        setModal(null);
        showToast('Failed to create note', 'error', {
          label: 'Retry',
          callback: () => handleSave({ id, title, body, color }, isClose)
        });
      }
    }
  }, [notes, user, showToast]);

  const handlePin = useCallback(async (id) => {
    const prevNotes = [...notes];
    const noteToPin = notes.find(n => n.id === id);
    if (!noteToPin) return;

    const nextPinned = !noteToPin.pinned;
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: nextPinned } : n));
    showToast(nextPinned ? 'Note pinned 📌' : 'Note unpinned 📍');

    if (!supabase || !user) {
      window.dispatchEvent(new Event('planner-data-changed'));
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ pinned: nextPinned })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      window.dispatchEvent(new Event('planner-data-changed'));
    } catch (err) {
      console.error('Failed to update pin:', err);
      setNotes(prevNotes);
      showToast('Failed to update note pin', 'error', {
        label: 'Retry',
        callback: () => handlePin(id)
      });
    }
  }, [notes, user, showToast]);

  const handleDelete = useCallback(async (id) => {
    const prevNotes = [...notes];
    setNotes(prev => prev.filter(n => n.id !== id));
    showToast('Note deleted ✓');

    if (!supabase || !user) {
      window.dispatchEvent(new Event('planner-data-changed'));
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      window.dispatchEvent(new Event('planner-data-changed'));
    } catch (err) {
      console.error('Failed to delete note:', err);
      setNotes(prevNotes);
      showToast('Failed to delete note', 'error', {
        label: 'Retry',
        callback: () => handleDelete(id)
      });
    }
  }, [notes, user, showToast]);

  const handleColorChange = useCallback(async (id, color) => {
    const prevNotes = [...notes];
    const now = Date.now();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, color, updatedAt: now } : n));
    showToast('Note color updated ✓');

    if (!supabase || !user) {
      window.dispatchEvent(new Event('planner-data-changed'));
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({ color })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      window.dispatchEvent(new Event('planner-data-changed'));
    } catch (err) {
      console.error('Failed to change color:', err);
      setNotes(prevNotes);
      showToast('Failed to change color', 'error', {
        label: 'Retry',
        callback: () => handleColorChange(id, color)
      });
    }
  }, [notes, user, showToast]);

  const pinnedCount = notes.filter(n => n.pinned).length;

  return (
    <>
      {modal !== null && (
        <NoteModal
          note={modal}
          darkMode={darkMode}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <div className="min-h-screen animate-fade-in p-4 sm:p-6 lg:p-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              📝 Notes
            </h1>
            <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {notes.length} notes · {pinnedCount} pinned
            </p>
          </div>

        </div>

        {/* ── Search ── */}
        <div className="relative mb-4">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes by title or content…"
            className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-semibold outline-none border transition-all
              ${darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-pink-400'
                : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-pink-300'
              }`}
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-black hover:scale-110 transition-all">
              ✕
            </button>
          )}
        </div>

        {/* ── Color filters ── */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {/* All */}
          <button
            onClick={() => setColorFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 hover:scale-105
              ${colorFilter === 'all'
                ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}>
            All
          </button>
          {COLORS.map(col => (
            <button key={col.id}
              onClick={() => setColorFilter(colorFilter === col.id ? 'all' : col.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 hover:scale-105
                ${colorFilter === col.id ? 'shadow-md scale-105' : 'opacity-70 hover:opacity-100'}`}
              style={{
                background: colorFilter === col.id
                  ? `linear-gradient(135deg, ${col.bg}, ${col.bg})`
                  : darkMode ? '#1e293b' : '#f8fafc',
                border: `2px solid ${colorFilter === col.id ? col.accent : 'transparent'}`,
                color: col.text,
              }}>
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: col.accent }} />
              <span className="capitalize">{col.id}</span>
            </button>
          ))}
        </div>

        {/* ── Content Area ── */}
        {loading ? (
          <NotesSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl
              ${darkMode ? 'bg-slate-800' : 'bg-pink-50'}`}>
              {search ? '🔍' : '📝'}
            </div>
            <p className={`text-lg font-black ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {search ? 'No notes found' : 'No notes yet'}
            </p>
            <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {search ? `Nothing matched "${search}"` : 'Click "New Note" to start writing!'}
            </p>
            {!search && (
              <button onClick={() => setModal({})} className="btn-primary mt-2">
                + Create first note
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Search results info */}
            {search && (
              <p className={`text-xs font-bold mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
              </p>
            )}

            {/* Desktop: true masonry columns */}
            <div className={`hidden sm:flex gap-4 items-start`}>
              {masonry.map((col, ci) => (
                <div key={ci} className="flex-1 min-w-0">
                  {col.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={setModal}
                      onPin={handlePin}
                      onDelete={handleDelete}
                      onColorChange={handleColorChange}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Mobile: single column */}
            <div className="sm:hidden space-y-4">
              {filtered.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={setModal}
                  onPin={handlePin}
                  onDelete={handleDelete}
                  onColorChange={handleColorChange}
                  darkMode={darkMode}
                />
              ))}
            </div>
          </>
        )}

        {/* Bottom note count */}
        {notes.length > 0 && (
          <p className={`mt-8 text-center text-xs font-semibold ${darkMode ? 'text-slate-700' : 'text-slate-300'}`}>
            📝 {notes.length} notes · Auto-saves as you type · Hover a card to edit, pin, or delete
          </p>
        )}
      </div>

      {/* Floating Action Button (FAB) to Add Note */}
      <button
        onClick={() => setModal({})}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 group"
        aria-label="Add new note"
        title="Add new note"
      >
        <svg
          className="w-7 h-7 transition-transform group-hover:rotate-90 duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </>
  );
}
