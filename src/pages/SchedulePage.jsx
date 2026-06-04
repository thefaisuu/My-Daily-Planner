import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getStoredToken,
  syncAllToGoogleCalendar,
} from '../lib/googleCalendar';

/* ─── helpers ─────────────────────────────────────────── */
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function generateSlots(startH = 6, endH = 23) {
  const slots = [];
  for (let h = startH; h <= endH; h++) {
    const ampm  = h < 12 ? 'AM' : 'PM';
    const h12   = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push({ hour: h, label: `${h12}:00 ${ampm}` });
  }
  return slots;
}

const SLOTS = generateSlots(6, 23);

const CATEGORIES = [
  { id: 'work',     label: 'Work',     color: '#F9A8D4', bg: 'bg-pink-100/55',    text: 'text-pink-800'    },
  { id: 'personal', label: 'Personal', color: '#C4B5FD', bg: 'bg-purple-100/55',  text: 'text-[#3B1F5E]'  },
  { id: 'health',   label: 'Health',   color: '#86EFAC', bg: 'bg-emerald-100/55', text: 'text-emerald-800' },
  { id: 'focus',    label: 'Focus',    color: '#C4B5FD', bg: 'bg-purple-100/55',  text: 'text-[#3B1F5E]'  },
  { id: 'break',    label: 'Break',    color: '#FDE68A', bg: 'bg-yellow-100/55',  text: 'text-yellow-800'   },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));



/* ═══════════════════════════════════════════════════════
   HELPERS — time utils
═══════════════════════════════════════════════════════ */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function hourToTime(h) {
  return `${String(h).padStart(2,'0')}:00`;
}

function timeLabel(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

/* ═══════════════════════════════════════════════════════
   ADD / EDIT EVENT MODAL
═══════════════════════════════════════════════════════ */
function EventModal({ hour, slotLabel, existing, allSlots, darkMode, onSave, onClose }) {
  const [task,      setTask]      = useState(existing?.task      || '');
  const [cat,       setCat]       = useState(existing?.cat       || 'work');
  const [date,      setDate]      = useState(existing?.date      || todayISO());
  const [startTime, setStartTime] = useState(existing?.startTime || hourToTime(hour));
  const [endTime,   setEndTime]   = useState(existing?.endTime   || hourToTime(Math.min(hour + 1, 23)));
  const [note,      setNote]      = useState(existing?.note      || '');
  const [bookingError, setBookingError] = useState(false);

  const inputRef    = useRef(null);
  const backdropRef = useRef(null);
  const isEdit      = !!existing?.task?.trim();
  const selCat      = CAT_MAP[cat] || CATEGORIES[0];

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Check if chosen time range overlaps any existing event (excluding this slot)
  const hasTimeConflict = (newStart, newEnd) => {
    if (!allSlots) return false;
    return Object.entries(allSlots).some(([h, slot]) => {
      if (parseInt(h) === hour) return false;   // skip the current slot (editing)
      if (!slot?.task?.trim())  return false;   // skip empty slots
      const s = slot.startTime || hourToTime(parseInt(h));
      const e = slot.endTime   || hourToTime(Math.min(parseInt(h) + 1, 23));
      return newStart < e && newEnd > s;         // overlap condition
    });
  };

  const handleSave = () => {
    if (!task.trim()) return;
    if (hasTimeConflict(startTime, endTime)) {
      setBookingError(true);
      return;
    }
    setBookingError(false);
    onSave(hour, task.trim(), cat, date, startTime, endTime, note.trim());
    onClose();
  };

  const handleBackdrop = e => { if (e.target === backdropRef.current) onClose(); };

  /* Input shared style */
  const inputCls = `w-full px-4 py-2.5 rounded-2xl text-sm font-semibold outline-none border-2 transition-all
    ${darkMode
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-pink-400'
      : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400 focus:border-pink-300 focus:bg-white'
    }`;

  const labelCls = `block text-[11px] font-black uppercase tracking-wider mb-1.5
    ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;

  return (
    <div ref={backdropRef} onClick={handleBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-bounce-in
          ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0"
          style={{ background: darkMode ? '#0f172a' : `linear-gradient(135deg, ${selCat.color}15, white 70%)` }}>
          <div>
            <p className={`text-[11px] font-black uppercase tracking-widest mb-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {isEdit ? 'Edit Event' : 'New Event'}
            </p>
            <h2 className={`text-xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
              📅 {isEdit ? existing.task.slice(0, 28) : slotLabel}
            </h2>
          </div>
          <button onClick={onClose}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0
              ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Already booked error ── */}
        {bookingError && (
          <div className="mx-6 mb-2 px-4 py-3 rounded-2xl flex items-center gap-3"
            style={{ background: '#fef2f2', border: '1.5px solid #fca5a5' }}>
            <span className="text-lg">🚫</span>
            <div>
              <p className="text-sm font-black text-red-600">This time slot is already booked!</p>
              <p className="text-xs text-red-400 mt-0.5">Please edit the existing event or pick a different hour.</p>
            </div>
          </div>
        )}

        <div className="px-6 pb-6 pt-5 space-y-5">

          {/* ── Event name ── */}
          <div>
            <label className={labelCls}>Event Name *</label>
            <input
              ref={inputRef}
              value={task}
              onChange={e => setTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && task.trim() && handleSave()}
              placeholder="e.g. 🧘 Morning yoga, 📞 Client call…"
              className={inputCls}
            />
          </div>

          {/* ── Date ── */}
          <div>
            <label className={labelCls}>📆 Date</label>
            <div className="relative">
              <input
                type="date"
                value={date}
                min={todayISO()}
                onChange={e => setDate(e.target.value)}
                className={`${inputCls} pr-4`}
                style={{ colorScheme: darkMode ? 'dark' : 'light' }}
              />
            </div>
            {/* Quick date chips */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {[
                { label: 'Today',     offset: 0 },
                { label: 'Tomorrow',  offset: 1 },
                { label: 'In 2 days', offset: 2 },
                { label: 'Next week', offset: 7 },
              ].map(({ label, offset }) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                const active = date === val;
                return (
                  <button key={label} onClick={() => setDate(val)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all hover:scale-105
                      ${active
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-sm'
                        : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-pink-50 hover:text-pink-600'
                      }`}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Start & End Time ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>⏰ Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value);
                  // Auto-bump end time by 1h if end <= start
                  const [sh, sm] = e.target.value.split(':').map(Number);
                  const newEnd = `${String(Math.min(sh + 1, 23)).padStart(2,'0')}:${String(sm).padStart(2,'0')}`;
                  if (endTime <= e.target.value) setEndTime(newEnd);
                }}
                className={inputCls}
                style={{ colorScheme: darkMode ? 'dark' : 'light' }}
              />
            </div>
            <div>
              <label className={labelCls}>🏁 End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                min={startTime}
                className={inputCls}
                style={{ colorScheme: darkMode ? 'dark' : 'light' }}
              />
            </div>
          </div>

          {/* Duration pill */}
          {startTime && endTime && endTime > startTime && (() => {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            const mins = (eh * 60 + em) - (sh * 60 + sm);
            const hrs  = Math.floor(mins / 60);
            const rem  = mins % 60;
            const dur  = hrs > 0 ? `${hrs}h${rem > 0 ? ` ${rem}m` : ''}` : `${rem}m`;
            return (
              <div className={`-mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit
                ${darkMode ? 'bg-slate-800' : 'bg-pink-50'}`}>
                <span className="text-sm">⏱️</span>
                <span className={`text-xs font-black ${darkMode ? 'text-slate-300' : 'text-pink-600'}`}>
                  {timeLabel(startTime)} → {timeLabel(endTime)} · {dur}
                </span>
              </div>
            );
          })()}

          {/* ── Quick time presets ── */}
          <div>
            <label className={labelCls}>Quick Duration</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: '15 min', mins: 15 },
                { label: '30 min', mins: 30 },
                { label: '1 hour', mins: 60 },
                { label: '1.5 h',  mins: 90 },
                { label: '2 hrs',  mins: 120 },
              ].map(({ label, mins }) => (
                <button key={label}
                  onClick={() => {
                    const [h, m] = startTime.split(':').map(Number);
                    const total  = h * 60 + m + mins;
                    const eh     = Math.min(Math.floor(total / 60), 23);
                    const em     = total % 60;
                    setEndTime(`${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all hover:scale-105
                    ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-purple-300' : 'bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Category ── */}
          <div>
            <label className={labelCls}>Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all hover:scale-105
                    ${cat === c.id
                      ? `${c.bg} ${c.text} scale-105 shadow-sm`
                      : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Note ── */}
          <div>
            <label className={labelCls}>📝 Note (optional)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add details, links, or reminders…"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* ── Summary preview ── */}
          {task.trim() && (
            <div className={`rounded-2xl p-3.5 flex items-start gap-3 border transition-all
              ${darkMode ? 'bg-slate-800/60 border-slate-700' : 'border-slate-100 bg-slate-50/80'}`}
              style={{ borderLeftColor: selCat.color, borderLeftWidth: 3 }}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${selCat.bg}`}>
                📅
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-black truncate ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{task}</p>
                <p className={`text-xs font-semibold mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {date !== todayISO()
                    ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' }) + ' · '
                    : 'Today · '}
                  {timeLabel(startTime)}{endTime ? ` – ${timeLabel(endTime)}` : ''}
                </p>
                {note && <p className={`text-xs mt-0.5 truncate ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{note}</p>}
              </div>
              <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 ${selCat.bg} ${selCat.text}`}>
                {selCat.label}
              </span>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold
                ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={!task.trim()}
              className={`flex-1 py-3 rounded-2xl text-sm font-black text-white transition-all
                ${task.trim() ? 'hover:shadow-lg hover:-translate-y-0.5 active:scale-95' : 'opacity-40 cursor-not-allowed'}`}
              style={{ background: task.trim() ? 'linear-gradient(135deg, #F9A8D4, #C4B5FD)' : '#9B8AAE' }}>
              {isEdit ? '✓ Save Changes' : '✨ Add Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DELETE CONFIRM TOAST
═══════════════════════════════════════════════════════ */
function DeleteConfirm({ slot, onConfirm, onCancel, darkMode }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl shadow-2xl border
        ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-rose-100'}`}>
        <span className="text-base">🗑️</span>
        <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          Delete event at <span className="text-pink-500">{slot.label}</span>?
        </p>
        <button onClick={onCancel}
          className={`px-3 py-1 rounded-xl text-xs font-bold ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
          Cancel
        </button>
        <button onClick={onConfirm}
          className="px-3 py-1 rounded-xl text-xs font-black bg-rose-500 text-white hover:bg-rose-600 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TIME SLOT CARD
═══════════════════════════════════════════════════════ */
function TimeSlotCard({ slot, data, isCurrent, isPast, onEdit, onClear, onToggle, onCatChange }) {
  const { darkMode } = useApp();
  const [hovered, setHovered] = useState(false);
  const cat = CAT_MAP[data.cat] || CATEGORIES[0];
  const isCompleted = data.done && data.task.trim();
  const isEmpty     = !data.task.trim();

  /* card styles */
  let cardBg, borderCls;
  if (isCompleted) {
    cardBg   = darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50';
    borderCls = darkMode ? 'border-emerald-700/50' : 'border-emerald-200';
  } else if (isCurrent) {
    cardBg   = darkMode ? 'bg-pink-900/30' : 'bg-pink-50';
    borderCls = darkMode ? 'border-pink-600/60' : 'border-pink-300';
  } else if (isEmpty) {
    cardBg   = darkMode ? 'bg-slate-800/30' : 'bg-slate-50/60';
    borderCls = darkMode ? 'border-slate-700/30 border-dashed' : 'border-slate-200/80 border-dashed';
  } else {
    cardBg   = darkMode ? 'bg-slate-800/50' : 'bg-white/90';
    borderCls = darkMode ? 'border-slate-700/40' : 'border-slate-100';
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex rounded-2xl border overflow-hidden transition-all duration-200 group
        ${cardBg} ${borderCls}
        ${isCurrent ? 'shadow-lg shadow-pink-100/80 dark:shadow-pink-900/30 scale-[1.01]' : 'hover:shadow-md hover:scale-[1.005]'}`}
    >
      {/* Left colour bar */}
      <div className={`w-1.5 flex-shrink-0 ${
        isCompleted ? 'bg-gradient-to-b from-[#86EFAC] to-[#6ee7b7]' :
        isCurrent   ? 'bg-gradient-to-b from-[#F9A8D4] to-[#C4B5FD]'   :
        isEmpty     ? darkMode ? 'bg-slate-700' : 'bg-slate-200'     :
        isPast      ? 'bg-slate-300 dark:bg-slate-600'               :
        'bg-gradient-to-b from-[#F5EEFF] to-[#FFF0F5]'
      }`} />

      <div className="flex-1 px-4 py-3 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1.5">
          {/* Time badge */}
          <span className={`text-xs font-black flex-shrink-0 px-2.5 py-1 rounded-xl
            ${isCurrent   ? 'bg-[#F9A8D4] text-[#3B1F5E] shadow-sm'
            : isCompleted ? 'bg-[#86EFAC] text-emerald-800'
            : darkMode    ? 'bg-slate-700 text-slate-300'
            :               'bg-slate-100 text-slate-500'}`}>
            {data?.startTime ? timeLabel(data.startTime) : slot.label}
          </span>

          {isCurrent && (
            <span className="flex items-center gap-1 text-[10px] font-black text-pink-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />Now
            </span>
          )}
          {isCompleted && (
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Done
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons — visible on hover (or always on mobile) */}
          <div className={`flex items-center gap-1 transition-all duration-200
            ${hovered || isEmpty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>

            {/* Category pill */}
            {!isEmpty && (
              <select
                value={data.cat}
                onChange={e => onCatChange(slot.hour, e.target.value)}
                className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-lg border-0 outline-none cursor-pointer
                  ${cat.bg} ${cat.text}`}
                style={{ WebkitAppearance: 'none', appearance: 'none' }}
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            )}

            {/* Add / Edit button */}
            <button
              onClick={() => onEdit(slot)}
              title={isEmpty ? 'Add event' : 'Edit event'}
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110
                ${isEmpty
                  ? 'bg-gradient-to-br from-[#F9A8D4] to-[#C4B5FD] text-white shadow-sm'
                  : darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-pink-300' : 'bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-[#3B1F5E]'
                }`}
            >
              {isEmpty ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            </button>

            {/* Delete/clear button — only if task exists */}
            {!isEmpty && (
              <button
                onClick={() => onClear(slot)}
                title="Delete event"
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:scale-110
                  ${darkMode ? 'bg-slate-700 text-slate-400 hover:bg-rose-900/50 hover:text-rose-400' : 'bg-slate-100 text-slate-400 hover:bg-[#FCA5A5]/20 hover:text-[#9f1239]'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}

            {/* Done toggle */}
            {!isEmpty && (
              <button
                onClick={() => onToggle(slot.hour)}
                title={isCompleted ? 'Mark incomplete' : 'Mark done'}
                className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-200 hover:scale-110
                  ${isCompleted
                    ? 'bg-gradient-to-br from-[#86EFAC] to-[#6ee7b7] border-transparent shadow-sm'
                    : darkMode ? 'border-slate-600 hover:border-[#86EFAC]' : 'border-slate-200 hover:border-[#86EFAC]'
                  }`}
              >
                {isCompleted && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Task content or empty CTA */}
        {isEmpty ? (
          <button
            onClick={() => onEdit(slot)}
            className={`w-full text-left text-sm py-1 font-semibold transition-colors
              ${darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-400'}`}
          >
            + Add event for {slot.label}…
          </button>
        ) : (
          <div onClick={() => onEdit(slot)} className="cursor-pointer hover:opacity-80 transition-opacity">
            <p className={`text-sm font-semibold leading-snug
              ${isCompleted
                ? 'line-through text-slate-400'
                : isCurrent
                ? 'text-pink-700 dark:text-pink-300 font-bold'
                : darkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
              {data.task}
            </p>
            {/* Date + time range */}
            {(data.startTime || data.date) && (
              <p className={`text-[11px] font-bold mt-0.5 flex items-center gap-1.5
                ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {data.date && data.date !== todayISO() && (
                  <span className="flex items-center gap-1">
                    📆 {new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                  </span>
                )}
                {data.startTime && (
                  <span className="flex items-center gap-1">
                    ⏰ {timeLabel(data.startTime)}
                    {data.endTime && data.endTime > data.startTime && ` – ${timeLabel(data.endTime)}`}
                  </span>
                )}
              </p>
            )}
            {data.note && (
              <p className={`text-[11px] mt-0.5 truncate italic ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {data.note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TODAY'S FOCUS CARD (STICKY)
═══════════════════════════════════════════════════════ */
function TodaysFocusCard({ slots, currentHour, darkMode, onAddSlot, streak, now }) {
  const filled = Object.values(slots).filter(s => s?.task?.trim()).length;
  const done   = Object.values(slots).filter(s => s?.done && s?.task?.trim()).length;
  const pct    = filled ? Math.round((done / filled) * 100) : 0;

  // For current and next events
  const [currentEvent, nextEvent] = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const filledEvents = Object.values(slots).filter(s => s?.task?.trim());
    
    let active = null;
    let upcoming = [];
    
    filledEvents.forEach(s => {
      const [sh, sm] = (s.startTime || '').split(':').map(Number);
      const [eh, em] = (s.endTime || '').split(':').map(Number);
      if (isNaN(sh) || isNaN(eh)) return;
      
      const startMin = sh * 60 + (sm || 0);
      const endMin = eh * 60 + (em || 0);
      
      if (nowMin >= startMin && nowMin < endMin) {
        active = s;
      } else if (startMin > nowMin) {
        upcoming.push(s);
      }
    });
    
    // Sort upcoming by start time ascending
    upcoming.sort((a, b) => {
      const [ah, am] = a.startTime.split(':').map(Number);
      const [bh, bm] = b.startTime.split(':').map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    });
    
    return [active, upcoming[0] || null];
  }, [slots, now]);

  function formatTimeRange(start, end) {
    if (!start || !end) return '';
    const parse = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return timeStr;
      const ampm = h < 12 ? 'AM' : 'PM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    };
    return `${parse(start)} - ${parse(end)}`;
  }

  return (
    <div className={`sticky top-16 z-10 rounded-3xl border shadow-lg backdrop-blur-xl
      ${darkMode ? 'bg-slate-900/90 border-slate-700/60' : 'bg-white/90 border-pink-100/80'}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F9A8D4] to-[#C4B5FD] flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-lg">🎯</span>
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>Today's Focus</p>
              <p className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
              </p>
            </div>
          </div>
          {/* Progress ring */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-[#F5EEFF]/80'}`}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 -rotate-90">
              <circle cx="12" cy="12" r="9" fill="none" stroke={darkMode ? '#334155' : '#F5EEFF'} strokeWidth="3" />
              <circle cx="12" cy="12" r="9" fill="none" stroke="#F9A8D4" strokeWidth="3"
                strokeDasharray={`${pct * 0.565} 56.5`} strokeLinecap="round" />
            </svg>
            <span className={`text-xs font-black ${darkMode ? 'text-slate-200' : 'text-[#3B1F5E]'}`}>{pct}%</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '✅', val: `${done}/${filled}`, label: 'Tasks'     },
            { icon: '⏰', val: filled - done,        label: 'Remaining' },
            { icon: '🔥', val: String(streak),       label: 'Streak'    },
          ].map((s, i) => (
            <div key={i} className={`text-center py-2.5 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-[#F5EEFF]/80'}`}>
              <p className="text-sm">{s.icon}</p>
              <p className={`text-sm font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>{s.val}</p>
              <p className={`text-[10px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Current Event */}
        {currentEvent && (
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-pink-500/10 border border-pink-400/20'}`}>
            <span className="text-base">⚡</span>
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-pink-400' : 'text-pink-600'}`}>Current Event</p>
              <p className={`text-xs font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{currentEvent.task}</p>
            </div>
            <span className={`text-[10px] font-black flex-shrink-0 ${darkMode ? 'text-slate-400' : 'text-pink-600'}`}>
              {formatTimeRange(currentEvent.startTime, currentEvent.endTime)}
            </span>
          </div>
        )}

        {/* Next Event */}
        {nextEvent && (
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-purple-50 border border-purple-100'}`}>
            <span className="text-base">⏭️</span>
            <div className="min-w-0 flex-1">
              <p className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Next Event</p>
              <p className={`text-xs font-bold truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{nextEvent.task}</p>
            </div>
            <span className={`text-[10px] font-black flex-shrink-0 ${darkMode ? 'text-slate-400' : 'text-purple-600'}`}>
              {formatTimeRange(nextEvent.startTime, nextEvent.endTime)}
            </span>
          </div>
        )}

        {/* Quick-add shortcut */}
        <button
          onClick={() => onAddSlot()}
          className="w-full py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
          style={{ background: 'linear-gradient(135deg, #f9a8d4, #c4b5fd)', color: 'white' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Event
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CURRENT TIME BAR
═══════════════════════════════════════════════════════ */
function CurrentTimeBar({ darkMode }) {
  const now  = new Date();
  const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2,'0')} ${now.getHours() < 12 ? 'AM' : 'PM'}`;
  return (
    <div className="relative flex items-center gap-2 my-1 z-10">
      <div className="w-2.5 h-2.5 rounded-full bg-pink-400 shadow-md shadow-pink-200 flex-shrink-0" />
      <span className="text-[10px] font-black text-pink-500 bg-pink-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-lg flex-shrink-0">
        {time}
      </span>
      <div className={`flex-1 h-px ${darkMode ? 'bg-pink-400/40' : 'bg-pink-300'}`} />
    </div>
  );
}

function loadSchedule() {
  const init = {};
  SLOTS.forEach(s => { init[s.hour] = { task: '', done: false, cat: 'work', date: todayISO() }; });
  return init;
}

function ScheduleSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 flex gap-3 h-24">
          <div className="w-1.5 bg-slate-200 dark:bg-slate-700 rounded-full h-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SCHEDULE PAGE
═══════════════════════════════════════════════════════ */
export default function SchedulePage() {
  const { darkMode, user, showToast } = useApp();
  const now = useNow();
  const currentHour = now.getHours();
  const today = todayISO();

  const [slotData, setSlotData] = useState({});
  const [loading, setLoading]   = useState(false);
  const [streak, setStreak]     = useState(0);

  const latestEndTime = useMemo(() => {
    const filled = Object.values(slotData).filter(s => s?.task?.trim());
    if (filled.length === 0) return '11:00 PM';
    const sorted = [...filled].sort((a, b) => {
      const [ah, am] = (a.endTime || '00:00').split(':').map(Number);
      const [bh, bm] = (b.endTime || '00:00').split(':').map(Number);
      return (bh * 60 + bm) - (ah * 60 + am);
    });
    const latest = sorted[0];
    const [h, m] = latest.endTime.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  }, [slotData]);

  // Load from DB or fallback
  const loadScheduleData = useCallback(async () => {
    if (!supabase || !user) {
      setSlotData(loadSchedule());
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedule_tasks')
        .select('date, time_slot, task, completed')
        .eq('user_id', user.id)
        .eq('date', today);

      if (error) throw error;

      const init = {};
      SLOTS.forEach(s => { init[s.hour] = { task: '', done: false, cat: 'work', date: today }; });

      if (data) {
        data.forEach(row => {
          const hour = parseInt(row.time_slot);
          if (!isNaN(hour) && init[hour]) {
            let parsedTask = row.task;
            let cat = 'work';
            let startTime = hourToTime(hour);
            let endTime = hourToTime(Math.min(hour + 1, 23));
            let note = '';

            try {
              if (row.task.startsWith('{')) {
                const json = JSON.parse(row.task);
                parsedTask = json.task || '';
                cat = json.cat || 'work';
                startTime = json.startTime || startTime;
                endTime = json.endTime || endTime;
                note = json.note || '';
              }
            } catch (_) {}

            init[hour] = {
              task: parsedTask,
              done: row.completed,
              cat,
              date: row.date,
              startTime,
              endTime,
              note
            };
          }
        });
      }
      setSlotData(init);
    } catch (err) {
      console.error('Failed to load schedule tasks:', err);
      setSlotData(loadSchedule());
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  const calculateStreak = useCallback(async () => {
    if (!supabase || !user) {
      setStreak(0);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('schedule_tasks')
        .select('date, completed')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        setStreak(0);
        return;
      }

      // Group tasks by date
      const tasksByDate = {};
      data.forEach(task => {
        const d = task.date;
        if (!tasksByDate[d]) {
          tasksByDate[d] = { total: 0, completed: 0 };
        }
        tasksByDate[d].total++;
        if (task.completed) {
          tasksByDate[d].completed++;
        }
      });

      // A date is completed if total > 0 and completed === total
      const completedDates = new Set();
      Object.entries(tasksByDate).forEach(([d, stats]) => {
        if (stats.total > 0 && stats.completed === stats.total) {
          completedDates.add(d);
        }
      });

      let currentStreak = 0;
      let checkDate = new Date(); // local time today
      
      const formatDate = (dateObj) => {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      let todayStr = formatDate(checkDate);
      
      if (completedDates.has(todayStr)) {
        currentStreak = 1;
        while (true) {
          checkDate.setDate(checkDate.getDate() - 1);
          const prevStr = formatDate(checkDate);
          if (completedDates.has(prevStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = formatDate(checkDate);
        
        if (completedDates.has(yesterdayStr)) {
          currentStreak = 1;
          while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            const prevStr = formatDate(checkDate);
            if (completedDates.has(prevStr)) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
      }

      setStreak(currentStreak);
    } catch (err) {
      console.error('Error calculating streak:', err);
      setStreak(0);
    }
  }, [user]);

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  useEffect(() => {
    calculateStreak();
  }, [slotData, calculateStreak]);

  /* Persist on every change to local storage backup */
  useEffect(() => {
    if (Object.keys(slotData).length > 0) {
      localStorage.setItem('planner_schedule', JSON.stringify(slotData));
    }
  }, [slotData]);

  /* Re-read when clear all data is called */
  useEffect(() => {
    const handler = () => {
      loadScheduleData();
    };
    window.addEventListener('planner-data-changed', handler);
    return () => window.removeEventListener('planner-data-changed', handler);
  }, [loadScheduleData]);


  /* Modal state */
  const [modal, setModal]       = useState(null); // { slot } or null
  const [deleteTarget, setDel]  = useState(null); // slot to delete
  const [activeFilter, setFilt] = useState('all');

  /* Google Calendar state */
  const [gCalToken,   setGCalToken]   = useState(() => getStoredToken());
  const [gCalSyncing, setGCalSyncing] = useState(false);

  const syncSlotToDB = async (hour, task, cat, date, startTime, endTime, note, done, prevSlotData) => {
    localStorage.setItem('last_action_schedule', new Date().toISOString());
    if (!supabase || !user) {
      const nextData = {
        ...prevSlotData,
        [hour]: { task, cat, date, startTime, endTime, note, done }
      };
      setSlotData(nextData);
      localStorage.setItem('planner_schedule', JSON.stringify(nextData));
      window.dispatchEvent(new Event('planner-data-changed'));
      return;
    }

    try {
      if (!task.trim()) {
        const { error } = await supabase
          .from('schedule_tasks')
          .delete()
          .eq('user_id', user.id)
          .eq('date', date)
          .eq('time_slot', String(hour));

        if (error) throw error;
      } else {
        const dbTask = JSON.stringify({ task, cat, startTime, endTime, note });
        const { error } = await supabase
          .from('schedule_tasks')
          .upsert({
            user_id: user.id,
            date,
            time_slot: String(hour),
            task: dbTask,
            completed: done
          }, { onConflict: 'user_id,date,time_slot' });

        if (error) throw error;
      }
      window.dispatchEvent(new Event('planner-data-changed'));
    } catch (err) {
      console.error('Failed to sync schedule task:', err);
      setSlotData(prevSlotData);
      showToast('Failed to save schedule event', 'error', {
        label: 'Retry',
        callback: () => syncSlotToDB(hour, task, cat, date, startTime, endTime, note, done, prevSlotData)
      });
    }
  };

  /* Handlers */
  const handleSave = useCallback((hour, task, cat, date, startTime, endTime, note) => {
    const prev = { ...slotData };
    const nextSlot = { task, cat, date, startTime, endTime, note, done: slotData[hour]?.done || false };
    setSlotData(prev => ({ ...prev, [hour]: nextSlot }));
    syncSlotToDB(hour, task, cat, date, startTime, endTime, note, nextSlot.done, prev);
    showToast('Event saved ✓');
  }, [slotData, user, showToast]);

  const handleClear = useCallback((slot) => setDel(slot), []);
  const confirmClear = useCallback(() => {
    if (!deleteTarget) return;
    const hour = deleteTarget.hour;
    const slot = slotData[hour];
    const prev = { ...slotData };
    const nextSlot = { ...slot, task: '', done: false };
    setSlotData(prev => ({ ...prev, [hour]: nextSlot }));
    setDel(null);
    syncSlotToDB(hour, '', slot.cat, slot.date, slot.startTime, slot.endTime, slot.note, false, prev);
    showToast('Event cleared');
  }, [deleteTarget, slotData, user, showToast]);

  const handleToggle = useCallback((hour) => {
    const slot = slotData[hour];
    const prev = { ...slotData };
    const nextSlot = { ...slot, done: !slot.done };
    setSlotData(prev => ({ ...prev, [hour]: nextSlot }));
    syncSlotToDB(hour, slot.task, slot.cat, slot.date, slot.startTime, slot.endTime, slot.note, nextSlot.done, prev);
    showToast(nextSlot.done ? 'Event completed ✓' : 'Event marked incomplete');
  }, [slotData, user, showToast]);

  const handleCatChange = useCallback((hour, cat) => {
    const slot = slotData[hour];
    const prev = { ...slotData };
    const nextSlot = { ...slot, cat };
    setSlotData(prev => ({ ...prev, [hour]: nextSlot }));
    syncSlotToDB(hour, slot.task, cat, slot.date, slot.startTime, slot.endTime, slot.note, slot.done, prev);
    showToast('Category updated');
  }, [slotData, user, showToast]);

  /* Open modal for next empty slot */
  const openNextEmpty = () => {
    const next = SLOTS.find(s => !slotData[s.hour]?.task?.trim());
    if (next) setModal(next);
  };

  /* ── Google Calendar handlers ── */
  const handleGCalConnect = async () => {
    try {
      const result = await connectGoogleCalendar();
      if (result?.token) {
        setGCalToken(result.token);
        showToast('Google Calendar connected! ✓', 'success');
      } else {
        showToast('Connection cancelled or failed.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to connect Google Calendar', 'error');
    }
  };

  const handleGCalDisconnect = () => {
    disconnectGoogleCalendar();
    setGCalToken(null);
    showToast('Google Calendar disconnected.');
  };

  const handleGCalSync = async () => {
    if (!gCalToken) return handleGCalConnect();
    if (filledSlots.length === 0) { showToast('No events to sync.', 'error'); return; }
    setGCalSyncing(true);
    try {
      const results = await syncAllToGoogleCalendar(gCalToken, slotData);
      if (results.failed === 0) {
        showToast(`✓ Synced ${results.success} event${results.success !== 1 ? 's' : ''} to Google Calendar!`);
      } else {
        showToast(`Synced ${results.success}, failed ${results.failed}. Check token.`, 'error');
      }
    } catch (err) {
      // Token may have expired — reconnect
      if (err.message?.includes('401') || err.message?.includes('invalid')) {
        disconnectGoogleCalendar();
        setGCalToken(null);
        showToast('Session expired. Please reconnect Google Calendar.', 'error');
      } else {
        showToast(err.message || 'Sync failed', 'error');
      }
    } finally {
      setGCalSyncing(false);
    }
  };

  /* Scroll to current hour */
  useEffect(() => {
    const el = document.getElementById(`slot-${currentHour}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
  }, [currentHour]);

  const eventsSlots = SLOTS.filter(s => {
    const data = slotData[s.hour];
    if (!data?.task?.trim()) return false;
    if (data.done) return false;
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentMin = currentH * 60 + currentM;
    const getMins = (timeStr, defaultHour) => {
      if (timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        if (!isNaN(h)) return h * 60 + (m || 0);
      }
      return defaultHour * 60;
    };
    const startMin = getMins(data.startTime, s.hour);
    const endMin   = getMins(data.endTime, s.hour + 1);
    const isCurrent = currentMin >= startMin && currentMin < endMin;
    const isFuture  = startMin > currentMin;
    return isCurrent || isFuture;
  });

  /* Filter — always only show filled slots */
  const visibleSlots = SLOTS.filter(s => {
    const data = slotData[s.hour];
    if (!data?.task?.trim()) return false; // never show empty slots
    if (activeFilter === 'completed') return data?.done;
    if (activeFilter === 'events') {
      if (data?.done) return false;
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentMin = currentH * 60 + currentM;
      const getMins = (timeStr, defaultHour) => {
        if (timeStr) {
          const [h, m] = timeStr.split(':').map(Number);
          if (!isNaN(h)) return h * 60 + (m || 0);
        }
        return defaultHour * 60;
      };
      const startMin = getMins(data.startTime, s.hour);
      const endMin   = getMins(data.endTime, s.hour + 1);
      const isCurrent = currentMin >= startMin && currentMin < endMin;
      const isFuture  = startMin > currentMin;
      return isCurrent || isFuture;
    }
    return true; // 'all' = all filled slots
  }).sort((a, b) => {
    const dataA = slotData[a.hour];
    const dataB = slotData[b.hour];
    const getStartMin = (slot, data) => {
      if (data?.startTime) {
        const [sh, sm] = data.startTime.split(':').map(Number);
        if (!isNaN(sh)) return h => sh * 60 + (sm || 0);
      }
      return slot.hour * 60;
    };
    // Fix getStartMin return value
    const valA = dataA?.startTime ? (() => { const [h, m] = dataA.startTime.split(':').map(Number); return h * 60 + (m || 0); })() : a.hour * 60;
    const valB = dataB?.startTime ? (() => { const [h, m] = dataB.startTime.split(':').map(Number); return h * 60 + (m || 0); })() : b.hour * 60;
    return valA - valB;
  });

  const filledSlots = SLOTS.filter(s => slotData[s.hour]?.task?.trim());
  const doneSlots   = filledSlots.filter(s => slotData[s.hour]?.done);

  return (
    <>
      {/* ── Add/Edit Modal ── */}
      {modal && (
        <EventModal
          hour={modal.hour}
          slotLabel={modal.label}
          existing={slotData[modal.hour]}
          allSlots={slotData}
          darkMode={darkMode}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Delete confirm toast ── */}
      {deleteTarget && (
        <DeleteConfirm
          slot={deleteTarget}
          onConfirm={confirmClear}
          onCancel={() => setDel(null)}
          darkMode={darkMode}
        />
      )}

      <div className="min-h-screen animate-fade-in">
        {/* Page header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-700'}`}>
                📅 Daily Schedule
              </h1>
              <p className={`text-sm font-semibold mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {DAYS[now.getDay()]}, {MONTHS[now.getMonth()]} {now.getDate()} · {filledSlots.length} events · {doneSlots.length} done
              </p>
            </div>

            {/* Header buttons */}
            <div className="flex items-center gap-2 flex-wrap">

              {/* Google Calendar sync button */}
              <button
                onClick={gCalToken ? handleGCalSync : handleGCalConnect}
                disabled={gCalSyncing}
                title={gCalToken ? 'Sync events to Google Calendar' : 'Connect Google Calendar'}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black transition-all duration-200 border ${
                  gCalToken
                    ? darkMode
                      ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400 hover:bg-emerald-900/70'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {gCalSyncing ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  /* Google Calendar icon */
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M3 9h18" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M8 4V2M16 4V2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 14h2v2H8z" fill="currentColor"/>
                    <path d="M11 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M11 17h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {gCalSyncing
                  ? 'Syncing…'
                  : gCalToken
                    ? 'Sync Google Calendar'
                    : 'Connect Google Calendar'}
                {/* Connected dot */}
                {gCalToken && !gCalSyncing && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                )}
              </button>

              {/* Disconnect button (when connected) */}
              {gCalToken && (
                <button
                  onClick={handleGCalDisconnect}
                  title="Disconnect Google Calendar"
                  className={`px-2.5 py-2 rounded-2xl text-xs font-black transition-all border ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-800'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'
                  }`}
                >
                  ✕
                </button>
              )}


            </div>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="px-4 sm:px-6 lg:px-8 pb-10">
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── LEFT: Sticky Focus Card ── */}
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <TodaysFocusCard
                slots={slotData}
                currentHour={currentHour}
                darkMode={darkMode}
                onAddSlot={openNextEmpty}
                streak={streak}
                now={now}
              />
            </div>

            {/* ── RIGHT: Time Slots ── */}
            <div className="flex-1 min-w-0">

              {/* Filter + category strip */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {[
                  { id: 'all',       label: `All (${filledSlots.length})`  },
                  { id: 'events',    label: `Events (${eventsSlots.length})` },
                  { id: 'completed', label: `Done (${doneSlots.length})`   },
                ].map(f => (
                  <button key={f.id} onClick={() => setFilt(f.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200
                      ${activeFilter === f.id
                        ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-md'
                        : darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-500 hover:bg-pink-50 border border-slate-100'
                      }`}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Time slot grid or empty state */}
              {loading ? (
                <ScheduleSkeleton />
              ) : filledSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/20">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl
                    ${darkMode ? 'bg-slate-800/80' : 'bg-pink-50'}`}>
                    📅
                  </div>
                  <p className={`text-lg font-black ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Your schedule is empty
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    Add events to plan your day and stay on track!
                  </p>
                  <button onClick={openNextEmpty} className="btn-primary mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add your first event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {visibleSlots.map((slot) => {
                    const data = slotData[slot.hour];
                    const getSlotStatus = () => {
                      const currentH = now.getHours();
                      const currentM = now.getMinutes();
                      const currentMin = currentH * 60 + currentM;
                      const getMins = (timeStr, defaultHour) => {
                        if (timeStr) {
                          const [h, m] = timeStr.split(':').map(Number);
                          if (!isNaN(h)) return h * 60 + (m || 0);
                        }
                        return defaultHour * 60;
                      };
                      const startMin = getMins(data?.startTime, slot.hour);
                      const endMin   = getMins(data?.endTime, slot.hour + 1);
                      const isCurrent = currentMin >= startMin && currentMin < endMin;
                      const isPast    = currentMin >= endMin;
                      return { isCurrent, isPast };
                    };
                    const { isCurrent, isPast } = getSlotStatus();
                    return (
                      <div key={slot.hour} id={`slot-${slot.hour}`}
                        className={`${isCurrent ? 'md:col-span-2' : ''} transition-all duration-300`}>
                        {isCurrent && <CurrentTimeBar darkMode={darkMode} />}
                        <TimeSlotCard
                          slot={slot}
                          data={slotData[slot.hour]}
                          isCurrent={isCurrent}
                          isPast={isPast}
                          onEdit={setModal}
                          onClear={handleClear}
                          onToggle={handleToggle}
                          onCatChange={handleCatChange}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <p className={`mt-6 text-center text-xs font-semibold ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {Object.values(slotData).filter(s => s?.task?.trim()).length > 0
                  ? `🌙 Schedule ends at ${latestEndTime} · Click any slot or the + button to add events`
                  : 'There is No Event Logged. Click any slot or the + button to add events'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
