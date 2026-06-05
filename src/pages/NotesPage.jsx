import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import PastelIcon from '../components/PastelIcon';
import { Pin, Palette, Trash2, X, Search, Plus, Sparkles, Edit2, FileText, Bold, Italic, Underline, Highlighter, List, ListOrdered, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Undo, Redo } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const COLORS = [
  { id: 'pink',   bg: '#fdf2f8', border: '#4F7CFF', text: '#831843', accent: '#3B66E8', dark: { bg: '#2d1121', border: '#9d174d' } },
  { id: 'purple', bg: '#f5f3ff', border: '#7DD3FC', text: '#4c1d95', accent: '#a78bfa', dark: { bg: '#1e1b3a', border: '#6d28d9' } },
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
    id: 1, title: 'App redesign ideas',
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
    id: 3, title: 'Book list',
    body: '1. Atomic Habits – James Clear\n2. Deep Work – Cal Newport\n3. The Creative Act – Rick Rubin\n4. Four Thousand Weeks – Oliver Burkeman\n5. Essentialism – Greg McKeown\n6. Thinking, Fast and Slow',
    color: 'purple', pinned: false,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 4, title: 'Grocery list',
    body: 'Oat milk, Greek yogurt, avocados ×3, sourdough bread, dark chocolate (85%), green tea, almonds, bananas, spinach, cherry tomatoes',
    color: 'mint', pinned: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 7200000,
  },
  {
    id: 5, title: 'Travel ideas',
    body: 'Places to visit:\nJapan – cherry blossom season (March/April)\nIceland – northern lights (Nov–Feb)\nPortugal – Lisbon & Porto\nMorocco – Marrakech medina\n\nBudget target: $3000/trip',
    color: 'peach', pinned: true,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 6, title: 'Daily affirmations',
    body: 'I am capable of achieving my goals.\nI choose joy and gratitude today.\nMy potential is limitless.\nI create my own opportunities.\nI am enough, exactly as I am.',
    color: 'rose', pinned: false,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 7, title: 'Workout routine',
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

function stripHtml(html) {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch (_) {
    return html.replace(/<[^>]*>/g, '');
  }
}

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60)    return 'just now';
  if (secs < 3600)  return `${Math.floor(secs/65)}m ago`;
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
      onClick={() => onEdit({ ...note, viewOnly: true })}
    >
      {/* Pin badge */}
      {note.pinned && (
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md z-10"
          style={{ background: c.accent }}>
          <Pin className="w-3.5 h-3.5 text-white" strokeWidth={2.5} fill="white" style={{ transform: 'rotate(45deg)' }} />
        </div>
      )}

      {/* Action bar — visible on hover */}
      <div
        className={`absolute top-3 right-3 flex items-center gap-1.5 transition-all duration-200 z-10
          ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Edit */}
        <button
          onClick={() => onEdit({ ...note, viewOnly: false })}
          title="Edit note"
          className="w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110 bg-white/70 dark:bg-slate-700/70 cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
        </button>

        {/* Pin */}
        <button
          onClick={() => onPin(note.id)}
          title={note.pinned ? 'Unpin' : 'Pin to top'}
          className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110 cursor-pointer
            ${note.pinned ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-white/70 dark:bg-slate-700/70'}`}
        >
          <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'text-amber-600 fill-amber-600' : 'text-slate-500'}`} strokeWidth={1.5} style={{ transform: note.pinned ? 'none' : 'rotate(45deg)' }} />
        </button>

        {/* Delete */}
        {confirmDel ? (
          <>
            <button onClick={() => onDelete(note.id)}
              className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-500 text-white hover:bg-rose-600 transition-colors">
              Delete
            </button>
            <button onClick={() => setConfirmDel(false)}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold bg-white/70 dark:bg-slate-700/70 text-slate-500 hover:bg-slate-100 cursor-pointer">
              <X size={12} strokeWidth={1.5} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDel(true)}
            title="Delete note"
            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-all hover:scale-110 bg-white/70 dark:bg-slate-700/70 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.5} />
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
      <div 
        className="text-sm leading-relaxed font-medium line-clamp-6 overflow-hidden mb-3 whitespace-pre-line"
        style={{ color: darkMode ? '#94a3b8' : c.text + 'cc' }}
      >
        {stripHtml(note.body)}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t"
        style={{ borderColor: darkMode ? c.dark.border : c.border }}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit({ ...note, viewOnly: true }); }}
          className="text-xs font-black hover:underline cursor-pointer"
          style={{ color: c.accent }}
        >
          Read More →
        </button>
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
function NoteModal({ note, viewOnly, darkMode, onSave, onClose }) {
  const [title,  setTitle]  = useState(note?.title  || '');
  const [body,   setBody]   = useState(note?.body   || '');
  const [color,  setColor]  = useState(note?.color  || 'slate');
  const [saved,  setSaved]  = useState(false);
  const autoSaveRef = useRef(null);
  const titleRef    = useRef(null);
  const editorRef   = useRef(null);
  const backdropRef = useRef(null);
  const isNew = !note?.id;
  const c = COLOR_MAP[color] || COLORS[0];

  const noteIdRef = useRef(note?.id);
  useEffect(() => {
    noteIdRef.current = note?.id;
  }, [note?.id]);

  useEffect(() => {
    if (!viewOnly) titleRef.current?.focus();
  }, [viewOnly]);

  // Set initial content on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = note?.body || '';
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
  };

  const runCommand = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    handleInput();
    editorRef.current?.focus();
  };

  const handleHighlight = () => {
    runCommand('hiliteColor', false, '#fef08a');
  };

  const handleHeading = (tag) => {
    runCommand('formatBlock', false, `<${tag}>`);
  };

  const handleLink = () => {
    const url = prompt('Enter the link URL:');
    if (url) {
      runCommand('createLink', false, url);
    }
  };

  /* Auto-save debounce */
  useEffect(() => {
    if (viewOnly) return;
    if (!title.trim() && !body.trim()) return;
    clearTimeout(autoSaveRef.current);
    setSaved(false);
    autoSaveRef.current = setTimeout(() => {
      onSave({ id: noteIdRef.current, title, body, color }, false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
    return () => clearTimeout(autoSaveRef.current);
  }, [title, body, color, viewOnly]);

  const handleClose = () => {
    clearTimeout(autoSaveRef.current);
    if (!viewOnly && (title.trim() || body.trim())) {
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
        className="w-full max-w-5xl h-[85vh] sm:h-[90vh] rounded-3xl border-2 shadow-2xl overflow-hidden animate-bounce-in flex flex-col transition-all duration-300"
        style={{
          background: darkMode ? c.dark.bg : c.bg,
          borderColor: darkMode ? c.dark.border : c.border,
          borderTop: `8px solid ${c.accent}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 flex-shrink-0 bg-transparent">
          <div className="flex items-center gap-2">
            {isNew ? (
              <Sparkles size={16} style={{ color: c.accent }} />
            ) : viewOnly ? (
              <FileText size={16} style={{ color: c.accent }} />
            ) : (
              <Edit2 size={16} style={{ color: c.accent }} />
            )}
            <p className="text-xs font-black uppercase tracking-wider" style={{ color: c.accent }}>
              {isNew ? 'New Note' : viewOnly ? 'View Note' : 'Edit Note'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            {!viewOnly && (
              <span className={`text-[11px] font-bold transition-all duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`}
                style={{ color: c.accent }}>
                ✓ Saved
              </span>
            )}
            <button onClick={handleClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all hover:scale-110 cursor-pointer"
              style={{ background: `${c.accent}22`, color: c.accent }}>
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Title */}
        <input
          ref={titleRef}
          value={title}
          onChange={e => !viewOnly && setTitle(e.target.value)}
          placeholder={viewOnly ? "" : "Note title…"}
          readOnly={viewOnly}
          className="w-full px-6 py-3.5 text-xl font-black bg-transparent outline-none border-0 placeholder-slate-400/70 flex-shrink-0"
          style={{ color: darkMode ? '#f1f5f9' : c.text }}
        />

        {/* Divider */}
        <div className="mx-6 h-px flex-shrink-0" style={{ backgroundColor: darkMode ? `${c.accent}30` : c.border }} />

        {/* Toolbar (only if editing) */}
        {!viewOnly && (
          <div className="flex flex-wrap items-center gap-1.5 px-6 py-2 border-b text-slate-500 overflow-x-auto flex-shrink-0"
               style={{ borderColor: darkMode ? `${c.accent}30` : c.border }}>
            
            {/* Bold / Italic / Underline */}
            <button
              type="button"
              onClick={() => runCommand('bold')}
              title="Bold"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <Bold size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => runCommand('italic')}
              title="Italic"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <Italic size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => runCommand('underline')}
              title="Underline"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <Underline size={15} strokeWidth={2} />
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

            {/* Highlight */}
            <button
              type="button"
              onClick={handleHighlight}
              title="Highlight Text"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-[#eab308]"
            >
              <Highlighter size={15} strokeWidth={2} />
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => runCommand('insertUnorderedList')}
              title="Bullet List"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <List size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => runCommand('insertOrderedList')}
              title="Numbered List"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <ListOrdered size={15} strokeWidth={2} />
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

            {/* Headings */}
            <button
              type="button"
              onClick={() => handleHeading('h1')}
              title="Heading 1"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <Heading1 size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => handleHeading('h2')}
              title="Heading 2"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <Heading2 size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => handleHeading('p')}
              title="Paragraph"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 font-black text-xs transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              P
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

            {/* Text Alignment */}
            <button
              type="button"
              onClick={() => runCommand('justifyLeft')}
              title="Align Left"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <AlignLeft size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => runCommand('justifyCenter')}
              title="Align Center"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <AlignCenter size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => runCommand('justifyRight')}
              title="Align Right"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <AlignRight size={15} strokeWidth={2} />
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

            {/* Link */}
            <button
              type="button"
              onClick={handleLink}
              title="Insert Link"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <LinkIcon size={15} strokeWidth={2} />
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

            {/* Undo / Redo */}
            <button
              type="button"
              onClick={() => runCommand('undo')}
              title="Undo"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <Undo size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => runCommand('redo')}
              title="Redo"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <Redo size={15} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Body */}
        <div
          ref={editorRef}
          contentEditable={!viewOnly}
          onInput={handleInput}
          placeholder={viewOnly ? "" : "Write your note here… (auto-saves as you type)"}
          className="flex-1 w-full px-6 py-4 text-sm font-medium bg-transparent outline-none overflow-y-auto leading-relaxed rich-note-content"
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
            {viewOnly ? 'Close' : 'Done ✓'}
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
  }, [notes, search]);

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
    showToast(nextPinned ? 'Note pinned' : 'Note unpinned');

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
          viewOnly={modal?.viewOnly}
          darkMode={darkMode}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <div className="min-h-screen animate-fade-in p-4 sm:p-6 lg:p-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <PastelIcon name="FileText" colorType="notes" circleSize="w-12 h-12" size={22} />
            <div>
              <h1 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'} leading-none`}>
                Notes
              </h1>
              <p className={`text-sm font-semibold mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {notes.length} notes · {pinnedCount} pinned
              </p>
            </div>
          </div>
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white shadow-md hover:shadow-blue-100 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #4F7CFF, #3B66E8)' }}
          >
            <Plus size={16} strokeWidth={2} />
            <span>New Note</span>
          </button>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.5} />
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

        {/* ── Content Area ── */}
        {loading ? (
          <NotesSkeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center
              ${darkMode ? 'bg-slate-800' : 'bg-pink-50'}`}>
              {search ? (
                <Search size={36} className="text-[#7DD3FC]" strokeWidth={1.5} />
              ) : (
                <FileText size={36} className="text-[#4F7CFF]" strokeWidth={1.5} />
              )}
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
          <div className={`mt-8 text-center text-xs font-semibold flex items-center justify-center gap-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <FileText size={13} strokeWidth={1.5} />
            <span>{notes.length} notes · Auto-saves as you type · Hover a card to edit, pin, or delete</span>
          </div>
        )}
      </div>


    </>
  );
}
