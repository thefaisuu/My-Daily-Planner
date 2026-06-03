import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

/* OpenRouter API Key – loaded from environment variable */
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
/* ═══════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════ */
const SUGGESTIONS = [
  { icon: '📋', text: 'Plan my day' },
  { icon: '💪', text: 'Motivate me' },
  { icon: '🧘', text: 'I need a break' },
  { icon: '💧', text: 'Remind me to drink water' },
  { icon: '😴', text: 'Help me wind down' },
];

// No default demo chats

/* ═══════════════════════════════════════════════════════
   PLANNER CONTEXT BUILDER
   Reads all localStorage keys and builds a rich text
   summary for the Gemini system prompt.
═══════════════════════════════════════════════════════ */
function buildPlannerContext() {
  const lines = [];

  // ── Habits ──
  try {
    const raw = localStorage.getItem('planner_habits');
    if (raw) {
      const { habits = [], lastDate } = JSON.parse(raw);
      const today = (() => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; })();
      const isToday = lastDate === today;
      const done  = isToday ? habits.filter(h => h.doneToday).length : 0;
      const total = habits.length;
      const best  = habits.reduce((m, h) => Math.max(m, h.streak || 0), 0);
      const names = habits.map(h => `${h.icon || ''} ${h.name}${isToday && h.doneToday ? ' ✓' : ''}`).join(', ');
      lines.push(`HABITS: ${done}/${total} completed today. Best streak: ${best} days. Habits: ${names || 'none'}.`);
    }
  } catch (_) {}

  // ── Water ──
  try {
    const raw = localStorage.getItem('planner_water');
    if (raw) {
      const { glasses = 0, goal = 8 } = JSON.parse(raw);
      const pct = goal ? Math.round((glasses / goal) * 100) : 0;
      lines.push(`WATER: ${glasses}/${goal} glasses today (${pct}%).`);
    }
  } catch (_) {}

  // ── Mood ──
  try {
    const raw = localStorage.getItem('planner_moods');
    if (raw) {
      const history = JSON.parse(raw);
      const today   = new Date().toISOString().split('T')[0];
      const mood    = history[today];
      if (mood) {
        lines.push(`MOOD TODAY: ${mood.emoji || ''} ${mood.label || mood.moodId}${mood.note ? ` — "${mood.note}"` : ''}.`);
      } else {
        lines.push('MOOD TODAY: Not logged yet.');
      }
    }
  } catch (_) {}

  // ── Schedule ──
  try {
    const raw = localStorage.getItem('planner_schedule');
    if (raw) {
      const slots  = JSON.parse(raw);
      const filled = Object.entries(slots)
        .filter(([, v]) => v.task?.trim())
        .map(([h, v]) => {
          const hour = Number(h);
          const ampm = hour < 12 ? 'AM' : 'PM';
          const h12  = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${h12}:00 ${ampm}: ${v.task}${v.done ? ' ✓' : ''}`;
        });
      const done  = Object.values(slots).filter(v => v.task?.trim() && v.done).length;
      const total = filled.length;
      lines.push(`SCHEDULE: ${done}/${total} tasks done. Events: ${filled.slice(0, 5).join(' | ') || 'none'}.`);
    }
  } catch (_) {}

  // ── Focus ──
  try {
    const raw = localStorage.getItem('planner_focus');
    if (raw) {
      const { sessions = 0 } = JSON.parse(raw);
      lines.push(`FOCUS SESSIONS: ${sessions} completed today.`);
    }
  } catch (_) {}

  // ── Notes count ──
  try {
    const raw = localStorage.getItem('planner_notes');
    if (raw) {
      const notes = JSON.parse(raw);
      lines.push(`NOTES: ${notes.length} saved notes.`);
    }
  } catch (_) {}

  return lines.length > 0
    ? lines.join('\n')
    : 'No planner data available yet — user is just getting started.';
}

/* ═══════════════════════════════════════════════════════
   OPENROUTER API CALL
═══════════════════════════════════════════════════════ */
async function callOpenRouter(conversationHistory, userMessage) {
  const plannerData = buildPlannerContext();

  const systemPrompt = `You are Planner AI, a warm, friendly, and highly motivating daily planner assistant built into the user's personal productivity app. Help the user stay productive, healthy, and motivated. Be concise, conversational, and use emojis naturally. Give actionable, specific advice. Keep responses focused and avoid being too long.

Here is the user's live planner data for today:
${plannerData}

Use this data to personalize your responses. Reference their actual habits, water intake, mood, and schedule when relevant. If they ask about their progress, use the real numbers above.`;

  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  for (const msg of conversationHistory) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }

  messages.push({ role: 'user', content: userMessage });

  const res = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Planner AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.8,
        max_tokens: 600,
        stream: false
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Planner AI');
  return text;
}

/* ═══════════════════════════════════════════════════════
   LOCAL FALLBACK (when no API key)
═══════════════════════════════════════════════════════ */
const FALLBACKS = {
  'Plan my day': `Here's a balanced plan for today! 🌟\n\n**Morning**\n• 🧘 10 min meditation\n• 🏃 30 min walk or exercise\n• 🥣 Healthy breakfast\n\n**Deep Work (9 AM–12 PM)**\n• Pick your #1 task and tackle it first\n• Pomodoro: 25 min focus + 5 min break\n\n**Afternoon**\n• Batch emails and messages\n• Review your habit progress\n• 💧 Drink water every hour\n\n**Evening**\n• 📝 Journal 3 wins from today\n• Prep tomorrow's top 3 tasks\n• Wind down by 9 PM\n\nYou've got this! 🚀`,
  'Motivate me': `You're doing amazing — here's why you should keep going! 💫\n\n*"The secret of getting ahead is getting started."* — Mark Twain\n\nEvery habit you've built, every glass of water, every focused session — they all compound. You're not just having a good day, you're building a better version of yourself.\n\n• 🔥 1% better every day = 37x better in a year\n• 💡 Your future self will thank present you\n• 🌱 Hard days are where growth lives\n\nWhat's one small action you can take RIGHT NOW? Go! 🚀`,
  'I need a break': `Taking breaks is a superpower! 🌿\n\n**Quick (2–5 min)**\n• 🫁 Box breathing: 4s in → 4s hold → 4s out\n• 👁️ 20-20-20: look 20ft away for 20 seconds\n• 🤸 Stretch neck, shoulders and wrists\n\n**Longer (10–15 min)**\n• 🚶 Step outside for fresh air\n• 🎵 Favourite playlist, do nothing else\n• ☕ Make a drink mindfully\n\nYou're allowed to rest. The work will be better for it. 💙`,
  'Remind me to drink water': `Hydration check! 💧\n\nEven mild dehydration (1–2%) reduces focus and worsens mood. Your brain is 75% water!\n\n• 🌅 A glass when you wake up\n• ⏰ One glass every hour\n• 🍋 Add lemon if plain water feels boring\n• 🥒 Water-rich foods count too\n\n**Go grab a glass right now — I'll wait.** 😄\n\nYour Water Tracker is ready to log it! 💪`,
  'Help me wind down': `Let's ease into rest mode 🌙\n\n**1 hour before bed:**\n• 📵 Phone on Do Not Disturb\n• 💡 Dim the lights\n• 📝 Brain dump: write what's on your mind\n• List 3 things you're grateful for today\n\n**30 min before:**\n• 📚 Read a physical book\n• 🎵 Ambient/lo-fi music low\n• 🍵 Chamomile tea\n\n**Sleep:**\n• Cool room (18–20°C)\n• No screens in bed\n• 4-7-8 breathing to fall asleep fast\n\nSweet dreams! 💤`,
};

function getFallback(msg) {
  if (FALLBACKS[msg]) return FALLBACKS[msg];
  const l = msg.toLowerCase();
  if (l.includes('habit'))   return `Great question about habits! 💪 Start small — attach a new habit to something you already do. Example: "After I pour my morning coffee, I'll do 5 push-ups." Check your Habits page to track streaks!`;
  if (l.includes('focus'))   return `The Pomodoro Technique is gold! ⏱️\n\n• 25 min deep work\n• 5 min break\n• After 4 rounds: 20 min long break\n\nYour Focus Timer page has this built in. Key: eliminate distractions BEFORE you start.`;
  if (l.includes('water'))   return `Staying hydrated is so important! 💧 If you feel thirsty, you're already dehydrated. Try: glass when you wake, one before each meal, one before bed. Your Water Tracker can help!`;
  if (l.includes('sleep'))   return `Sleep is the foundation of everything! 😴\n\n• Same bedtime every night (consistency beats duration)\n• No caffeine after 2 PM\n• Cool, dark, quiet room\n• No screens 1hr before bed\n\nWant me to suggest a bedtime ritual?`;
  if (l.includes('stress') || l.includes('anxious')) return `I hear you — that sounds tough. 💙\n\n**Right now:**\n• 🫁 3 deep breaths, slow exhale\n• 🌡️ Splash cold water on your face\n• 🚶 A 5-minute walk changes everything\n\nStress is your body's signal that something needs attention. Try writing it down — naming it reduces its power. You're not alone. 💙`;
  if (l.includes('hi') || l.includes('hello')) return `Hey there! 👋 I'm Planner AI — your personal daily assistant.\n\nI can help you:\n• 📋 Plan your day\n• 💪 Stay motivated\n• 🧘 Take mindful breaks\n• 💧 Stay hydrated\n• 😴 Wind down for sleep\n\nWhat would you like help with today?`;
  if (l.includes('thank'))   return `You're so welcome! 😊 Small consistent actions beat big sporadic efforts every time. You're building something great — keep going! 🌟`;
  return `That's a great question! 🌟\n\nThe most important step is always the next one. Whether it's a habit to build, a task to tackle, or just taking care of yourself — small actions compound into remarkable results.\n\nWhat's the one thing that would make today a success? I'm here to help! 💙`;
}

/* ═══════════════════════════════════════════════════════
   UI COMPONENTS
═══════════════════════════════════════════════════════ */
function fmtTime() {
  const n = new Date();
  return `${n.getHours() % 12 || 12}:${String(n.getMinutes()).padStart(2,'0')} ${n.getHours() < 12 ? 'AM' : 'PM'}`;
}

/* ── Markdown renderer ── */
function RenderMD({ text }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        // Bold inline
        const parts = line.split(/\*\*(.*?)\*\*/g);
        const rendered = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);

        if (line.startsWith('• ') || line.startsWith('- ')) {
          return <div key={i} className="flex gap-2 my-0.5 pl-1"><span className="flex-shrink-0 mt-0.5 text-indigo-400">•</span><span>{rendered}</span></div>;
        }
        if (line.startsWith('**') && line.endsWith('**') && parts.length === 3 && !parts[0] && !parts[2]) {
          return <p key={i} className="font-black mt-2 mb-0.5">{parts[1]}</p>;
        }
        if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
          return <p key={i} className="italic opacity-80">{line.slice(1, -1)}</p>;
        }
        if (line === '') return <div key={i} className="h-1.5" />;
        return <p key={i} className="leading-relaxed">{rendered}</p>;
      })}
    </div>
  );
}

/* ── Message bubble ── */
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const { user } = useApp();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className={`flex gap-3 mb-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs flex-shrink-0 mt-1 font-black shadow-sm overflow-hidden
        ${isUser ? 'text-white' : 'bg-gradient-to-br from-violet-100 to-indigo-100 text-indigo-600 border border-indigo-200'}`}
        style={isUser ? { background: 'linear-gradient(135deg, #5B6CFF, #A78BFA)' } : {}}>
        {isUser ? (
          avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initials
          )
        ) : '✦'}
      </div>
      <div className={`max-w-[78%] sm:max-w-[68%] rounded-3xl px-5 py-3.5 text-sm font-medium leading-relaxed shadow-sm
        ${isUser ? 'rounded-tr-lg text-white' : 'rounded-tl-lg bg-white border border-slate-100 text-slate-700'}`}
        style={isUser ? { background: 'linear-gradient(135deg, #5B6CFF, #A78BFA)' } : {}}>
        {isUser ? <p>{msg.content}</p> : <RenderMD text={msg.content} />}
        <p className={`text-[10px] mt-2 font-semibold ${isUser ? 'text-white/60 text-right' : 'text-slate-400'}`}>{msg.time}</p>
      </div>
    </div>
  );
}

/* ── Typing indicator ── */
function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-indigo-600 font-black border border-indigo-200 flex-shrink-0 mt-1">✦</div>
      <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-lg px-5 py-4 shadow-sm flex items-center gap-1.5">
        {[0,1,2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Error banner ── */
function ErrorBanner({ message }) {
  return (
    <div className="mx-4 sm:mx-8 lg:mx-12 mt-4 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 animate-fade-in">
      <span className="text-xl flex-shrink-0">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-rose-700 font-bold">Planner AI Error</p>
        <p className="text-xs text-rose-500 mt-0.5 font-semibold">{message}</p>
      </div>
    </div>
  );
}

/* ── Chat Sidebar ── */
function ChatSidebar({ chats, activeId, onSelect, onNew, onDelete }) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-white/90 border-r border-indigo-100/60 h-full">
      <div className="p-4 border-b border-indigo-50">
        <button onClick={onNew} className="w-full btn-primary flex items-center justify-center gap-2 py-2.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">Recent Chats</p>
        {chats.map(chat => (
          <div key={chat.id} className="relative group/sidebar-item mb-1">
            <button onClick={() => onSelect(chat.id)}
              className={`w-full text-left pl-3 pr-10 py-3 rounded-2xl transition-all duration-150
                ${activeId === chat.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}>
              <div className="flex items-start justify-between gap-1">
                <p className={`text-xs font-black truncate flex-1 ${activeId === chat.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {chat.title}
                </p>
                <span className="text-[9px] text-slate-400 flex-shrink-0 font-semibold">{chat.time}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{chat.preview}</p>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chat.id);
              }}
              title="Delete chat"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 group-hover/sidebar-item:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 hover:shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
export default function AIAssistantPage() {
  const { setActiveNav, user, showToast } = useApp();

  const [chats, setChats]               = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [showSidebar,  setShowSidebar]  = useState(false);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  // Rate limiting state
  const [msgTimestamps, setMsgTimestamps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('planner_ai_timestamps') || '[]');
    } catch {
      return [];
    }
  });
  const [cooldownSec, setCooldownSec] = useState(0);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [user]);

  // Load from DB or fallback
  const loadChatsData = useCallback(async () => {
    if (!supabase || !user) {
      try {
        const raw = localStorage.getItem('planner_ai_chats');
        setChats(raw ? JSON.parse(raw) : []);
      } catch (_) {
        setChats([]);
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, role, message, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const chatGroups = {};
      if (data) {
        data.forEach(row => {
          let content = row.message;
          let chatId = 'default-chat';
          let chatTitle = 'Chat Session';
          let msgTime = new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          try {
            if (row.message.startsWith('{')) {
              const parsed = JSON.parse(row.message);
              content = parsed.content || '';
              chatId = parsed.chatId || chatId;
              chatTitle = parsed.chatTitle || chatTitle;
              msgTime = parsed.time || msgTime;
            }
          } catch (_) {}

          if (!chatGroups[chatId]) {
            chatGroups[chatId] = {
              id: chatId,
              title: chatTitle,
              preview: content.length > 40 ? content.slice(0, 40) + '...' : content,
              time: msgTime,
              messages: []
            };
          }

          chatGroups[chatId].messages.push({
            id: row.id,
            role: row.role,
            content,
            time: msgTime
          });
          chatGroups[chatId].preview = content.length > 40 ? content.slice(0, 40) + '...' : content;
          chatGroups[chatId].time = msgTime;
        });
      }

      const parsedChats = Object.values(chatGroups);
      parsedChats.sort((a, b) => b.id.localeCompare(a.id));

      setChats(parsedChats);
      
      if (activeChatId) {
        if (!parsedChats.some(c => c.id === activeChatId)) {
          setActiveChatId(parsedChats.length > 0 ? parsedChats[0].id : null);
        }
      } else if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        if (parsedChats.length > 0) {
          setActiveChatId(parsedChats[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      try {
        const raw = localStorage.getItem('planner_ai_chats');
        setChats(raw ? JSON.parse(raw) : []);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  }, [user, activeChatId]);

  useEffect(() => {
    loadChatsData();
  }, [loadChatsData]);

  // Sync timestamps to localStorage
  useEffect(() => {
    localStorage.setItem('planner_ai_timestamps', JSON.stringify(msgTimestamps));
  }, [msgTimestamps]);

  // Sync chats to localStorage
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('planner_ai_chats', JSON.stringify(chats));
    }
  }, [chats]);

  // Sync active chat's messages to local state when switching chats
  useEffect(() => {
    if (activeChatId) {
      const activeChat = chats.find(c => c.id === activeChatId);
      if (activeChat) {
        setMessages(activeChat.messages || []);
      }
    } else {
      setMessages([]);
    }
  }, [activeChatId, chats]);

  // Listen to planner-data-changed event to handle Settings data clear
  useEffect(() => {
    const handler = () => {
      loadChatsData();
    };
    window.addEventListener('planner-data-changed', handler);
    return () => window.removeEventListener('planner-data-changed', handler);
  }, [loadChatsData]);

  const syncMessageToDB = async (role, chatId, chatTitle, content, time) => {
    if (!supabase || !user) return null;
    try {
      const dbMessage = JSON.stringify({ chatId, chatTitle, content, time });
      const { data, error } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          role,
          message: dbMessage
        })
        .select()
        .single();
        
      if (error) throw error;
      return data?.id;
    } catch (err) {
      console.error('Failed to save message to database:', err);
      return null;
    }
  };

  const handleDeleteChat = useCallback(async (id) => {
    if (window.confirm('Delete this chat?')) {
      const prevChats = [...chats];
      setChats(prev => prev.filter(c => c.id !== id));
      if (activeChatId === id) {
        handleNew();
      }

      if (!supabase || !user) {
        window.dispatchEvent(new Event('planner-data-changed'));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('chat_history')
          .select('id, message')
          .eq('user_id', user.id);

        if (error) throw error;

        const idsToDelete = [];
        if (data) {
          data.forEach(row => {
            try {
              if (row.message.startsWith('{')) {
                const parsed = JSON.parse(row.message);
                if (parsed.chatId === id) {
                  idsToDelete.push(row.id);
                }
              }
            } catch (_) {}
          });
        }

        if (idsToDelete.length > 0) {
          const { error: delError } = await supabase
            .from('chat_history')
            .delete()
            .in('id', idsToDelete);

          if (delError) throw delError;
        }
        window.dispatchEvent(new Event('planner-data-changed'));
      } catch (err) {
        console.error('Failed to delete chat from DB:', err);
        setChats(prevChats);
        showToast('Failed to delete chat history from cloud', 'error');
      }
    }
  }, [chats, activeChatId, user]);

  // Handle active rate limiting calculations and ticking cooldown
  useEffect(() => {
    if (msgTimestamps.length === 0) return;
    
    const updateCooldown = () => {
      const now = Date.now();
      const active = msgTimestamps.filter(t => now - t < 60000);
      if (active.length !== msgTimestamps.length) {
        setMsgTimestamps(active);
      }
      
      if (active.length >= 5) {
        const oldest = active[0];
        const remainingMs = 60000 - (now - oldest);
        setCooldownSec(Math.ceil(remainingMs / 1000));
      } else {
        setCooldownSec(0);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [msgTimestamps]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const isEmpty = messages.length === 0;

  /* ── Send ── */
  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const now = Date.now();
    const active = msgTimestamps.filter(t => now - t < 60000);
    if (active.length >= 5) {
      const oldest = active[0];
      const remainingMs = 60000 - (now - oldest);
      const sec = Math.ceil(remainingMs / 1000);
      setError(`Rate limit reached. Please wait ${sec} seconds.`);
      return;
    }

    // Add new timestamp to rate limit tracker
    setMsgTimestamps(prev => [...prev.filter(t => Date.now() - t < 60000), now]);

    const userMsg = { id: now, role: 'user', content, time: fmtTime() };
    const history = [...messages]; // snapshot before adding
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    // Resize textarea back
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const targetId = activeChatId || String(now);
    const existingChat = chats.find(c => c.id === targetId);
    const title = existingChat ? existingChat.title : (content.length > 25 ? content.slice(0, 25) + '...' : content);

    // Save user message to database
    syncMessageToDB('user', targetId, title, content, userMsg.time);

    try {
      const responseText = await callOpenRouter(history, content);
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: responseText, time: fmtTime() };
      
      syncMessageToDB('assistant', targetId, title, responseText, aiMsg.time);

      setChats(prev => {
        const existing = prev.find(c => c.id === targetId);
        const nextMessages = existing 
          ? [...existing.messages, userMsg, aiMsg] 
          : [userMsg, aiMsg];
        const preview = responseText.length > 40 ? responseText.slice(0, 40) + '...' : responseText;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (existing) {
          return prev.map(c => c.id === targetId ? { ...c, preview, time, messages: nextMessages } : c);
        } else {
          setActiveChatId(targetId);
          return [
            { id: targetId, title, preview, time, messages: nextMessages },
            ...prev
          ];
        }
      });
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Built-in responses are used.');
      const fallbackText = getFallback(content);
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: fallbackText, time: fmtTime() };
      
      syncMessageToDB('assistant', targetId, title, fallbackText, aiMsg.time);

      setChats(prev => {
        const existing = prev.find(c => c.id === targetId);
        const nextMessages = existing 
          ? [...existing.messages, userMsg, aiMsg] 
          : [userMsg, aiMsg];
        const preview = fallbackText.length > 40 ? fallbackText.slice(0, 40) + '...' : fallbackText;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (existing) {
          return prev.map(c => c.id === targetId ? { ...c, preview, time, messages: nextMessages } : c);
        } else {
          setActiveChatId(targetId);
          return [
            { id: targetId, title, preview, time, messages: nextMessages },
            ...prev
          ];
        }
      });
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, msgTimestamps, activeChatId, chats]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleNew = () => {
    setMessages([]); setActiveChatId(null); setInput(''); setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <ChatSidebar chats={chats} activeId={activeChatId} onSelect={setActiveChatId} onNew={handleNew} onDelete={handleDeleteChat} />
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setShowSidebar(false)} />
          <div className="fixed left-0 top-16 bottom-0 z-50 lg:hidden w-72 animate-fade-in">
            <ChatSidebar chats={chats} activeId={activeChatId}
              onSelect={id => { setActiveChatId(id); setShowSidebar(false); }}
              onNew={() => { handleNew(); setShowSidebar(false); }}
              onDelete={handleDeleteChat} />
          </div>
        </>
      )}

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-indigo-50/20 to-white">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-indigo-100/60 bg-white/70 backdrop-blur-sm flex-shrink-0">
          <button onClick={() => setShowSidebar(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-indigo-50 text-slate-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-black flex-shrink-0 shadow-md shadow-indigo-200/60"
            style={{ background: 'linear-gradient(135deg,#5B6CFF,#A78BFA)' }}>
            <span className="text-white text-base">✦</span>
          </div>
          <div>
            <p className="font-black text-sm text-slate-700">Planner AI</p>
            <p className="text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full inline-block bg-emerald-400 animate-pulse" />
              <span className="text-emerald-500">
                Online · Ready to help
              </span>
            </p>
          </div>
          <button onClick={handleNew}
            className="ml-auto lg:hidden flex items-center gap-1.5 text-xs font-black text-indigo-500 hover:text-indigo-700 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>

        {/* Error banner */}
        {error && <ErrorBanner message={error} />}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6">

          {/* Welcome screen */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200/60"
                style={{ background: 'linear-gradient(135deg,#5B6CFF,#A78BFA)' }}>
                <span className="text-white text-4xl">✦</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-700">Hi, I'm Planner AI 👋</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                  Your personal daily assistant. Ask me anything — I'm here to help you plan, focus, stay healthy, and feel great.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full mt-1">
                {[
                  { icon: '📋', label: 'Plan my day',       desc: 'Get a structured daily schedule' },
                  { icon: '💪', label: 'Motivate me',       desc: 'A boost when you need it most'   },
                  { icon: '🧘', label: 'I need a break',    desc: 'Mindful rest techniques'          },
                  { icon: '😴', label: 'Help me wind down', desc: 'Evening routine & sleep tips'     },
                ].map(s => (
                  <button key={s.label} onClick={() => sendMessage(s.label)}
                    className="text-left p-4 rounded-2xl border border-indigo-100 bg-white hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/50 transition-all duration-200 hover:-translate-y-0.5 group">
                    <p className="text-2xl mb-1.5">{s.icon}</p>
                    <p className="text-sm font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{s.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {!isEmpty && (
            <div className="max-w-3xl mx-auto">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-indigo-100/60 bg-white/90 backdrop-blur-md px-4 sm:px-8 lg:px-12 py-4">
          <div className="max-w-3xl mx-auto space-y-3">

            {/* Suggestion chips */}
            {isEmpty && (
              <div className="flex gap-2 flex-wrap">
                {SUGGESTIONS.map(s => (
                  <button key={s.text} onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border border-indigo-200 bg-indigo-50/60 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300 transition-all hover:scale-105">
                    <span>{s.icon}</span>{s.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className={`flex items-end gap-2 p-2 rounded-3xl border-2 bg-white shadow-lg shadow-indigo-100/40 transition-all duration-200
              ${cooldownSec > 0 ? 'border-rose-200 focus-within:border-rose-300' : 'border-indigo-200 focus-within:border-indigo-400'}`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={cooldownSec > 0 ? `Rate limit reached. Try again in ${cooldownSec}s...` : "Ask me anything… (Enter to send, Shift+Enter for new line)"}
                rows={1}
                disabled={cooldownSec > 0}
                className="flex-1 resize-none bg-transparent outline-none text-sm font-semibold text-slate-700 placeholder-slate-400 px-3 py-2.5 max-h-32 leading-relaxed disabled:opacity-50"
                style={{ minHeight: '44px' }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || cooldownSec > 0}
                className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed hover:scale-105 active:scale-95 mb-0.5"
                style={{ background: input.trim() && !loading && cooldownSec === 0 ? 'linear-gradient(135deg,#5B6CFF,#A78BFA)' : '#e2e8f0' }}>
                {loading
                  ? <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                }
              </button>
            </div>
            <div className="flex items-center justify-end text-[10px] text-slate-400 font-semibold px-2">
              <span className={`px-2 py-0.5 rounded-full font-black ${cooldownSec > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-indigo-50 text-indigo-500'}`}>
                {cooldownSec > 0 ? `Cooldown: ${cooldownSec}s` : `Messages: ${5 - msgTimestamps.filter(t => Date.now() - t < 60000).length}/5 left`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
