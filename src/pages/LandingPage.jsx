import { useState, useEffect, useRef } from 'react';
import { Heart, Mail, Users, CheckCircle, AlertTriangle, Hammer, Lock, Palette, Gift, CheckSquare, Droplet, Smile, Timer, Zap, Shield, TrendingUp, Calendar, FileText, Star } from 'lucide-react';

/* ── Feature cards data ── */
const FEATURES = [
  {
    iconName: 'CheckSquare',
    title: 'Habit Tracker',
    desc: 'Build powerful daily routines with streak tracking, custom theme tags, and progress rings. Turn small habits into life-changing wins.',
    gradient: 'from-pink-400 to-rose-500',
    bg: 'bg-pink-50',
    border: 'border-blue-100',
  },
  {
    iconName: 'Calendar',
    title: 'Smart Schedule',
    desc: 'Plan every hour of your day with categorized time slots, completion tracking, and a printable agenda view.',
    gradient: 'from-indigo-400 to-violet-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  {
    iconName: 'Droplet',
    title: 'Water Tracker',
    desc: 'Stay hydrated with visual glass-by-glass logging, daily goals, and streak reminders to keep you at peak performance.',
    gradient: 'from-sky-400 to-blue-500',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
  },
  {
    iconName: 'Smile',
    title: 'Mood Journal',
    desc: 'Track your emotional wellbeing daily. Log moods from Rough to Amazing with optional notes and a beautiful monthly calendar.',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    iconName: 'FileText',
    title: 'Smart Notes',
    desc: 'Capture ideas in beautiful color-coded notes with pin support, rich text, and instant auto-save as you type.',
    gradient: 'from-emerald-400 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: '⏱️',
    title: 'Focus Timer',
    desc: 'Deep work sessions using the Pomodoro technique with customizable intervals, ambient sounds, and session tracking.',
    gradient: 'from-purple-400 to-violet-500',
    bg: 'bg-purple-50',
    border: 'border-sky-100',
  },
];

const STATS = [
  { value: '6+', label: 'Productivity Tools', icon: <Hammer size={24} className="text-white" strokeWidth={1.5} /> },
  { value: '100%', label: 'Privacy First', icon: <Lock size={24} className="text-white" strokeWidth={1.5} /> },
  { value: 'Modern', label: 'Dashboard UI', icon: <Palette size={24} className="text-white" strokeWidth={1.5} /> },
  { value: 'Free', label: 'Always Free', icon: <Gift size={24} className="text-white" strokeWidth={1.5} /> },
];

const TESTIMONIALS = [
  {
    name: 'Sarah K.',
    role: 'Freelance Designer',
    initials: 'SK',
    bg: 'from-pink-400 to-rose-400',
    text: 'My Daily Planner completely transformed my mornings. The habit tracker and printable daily schedule are exactly what I needed!',
    stars: 5,
  },
  {
    name: 'Ahmed R.',
    role: 'Software Engineer',
    initials: 'AR',
    bg: 'from-indigo-400 to-purple-400',
    text: 'Finally an app that has everything in one place. The customizable widgets and notes help me stay extremely organized throughout the day.',
    stars: 5,
  },
  {
    name: 'Priya M.',
    role: 'Student & Blogger',
    initials: 'PM',
    bg: 'from-amber-400 to-orange-400',
    text: 'The mood journal and focus timer have helped me stay on top of my mental health and study sessions. Love it!',
    stars: 5,
  },
];

/* ── Animated counter ── */
function AnimatedStat({ value, label, icon, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`flex flex-col items-center gap-2.5 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-md">
        {icon}
      </div>
      <p className="text-4xl font-black text-white">{value}</p>
      <p className="text-sm font-semibold text-white/70">{label}</p>
    </div>
  );
}

/* ── Feature card ── */
function FeatureCard({ feature, index }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const CardIcon = feature.iconName === 'CheckSquare' ? CheckSquare
                 : feature.iconName === 'Calendar' ? Calendar
                 : feature.iconName === 'Droplet' ? Droplet
                 : feature.iconName === 'Smile' ? Smile
                 : feature.iconName === 'Timer' ? Timer
                 : FileText;

  return (
    <div ref={ref}
      className={`p-6 rounded-3xl border bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-start text-left group
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        ${feature.border}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-200`}>
        <CardIcon size={20} strokeWidth={1.5} className="text-white" />
      </div>
      <h3 className="font-black text-slate-800 text-base mb-2">{feature.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
    </div>
  );
}

/* ── Floating orbs background decoration ── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 animate-pulse"
        style={{ background: 'radial-gradient(circle, #A78BFA, transparent)', animationDuration: '4s' }} />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15 animate-pulse"
        style={{ background: 'radial-gradient(circle, #60a5fa, transparent)', animationDuration: '6s', animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-10 animate-pulse"
        style={{ background: 'radial-gradient(circle, #3B66E8, transparent)', animationDuration: '5s', animationDelay: '1s' }} />
    </div>
  );
}

export default function LandingPage({ onLogin, onSignup }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('landing');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  if (activeTab === 'privacy') {
    return <PrivacyPage onBack={() => { setActiveTab('landing'); window.scrollTo(0, 0); }} />;
  }
  if (activeTab === 'terms') {
    return <TermsPage onBack={() => { setActiveTab('landing'); window.scrollTo(0, 0); }} />;
  }
  if (activeTab === 'contact') {
    return <ContactPage onBack={() => { setActiveTab('landing'); window.scrollTo(0, 0); }} />;
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md shadow-purple-100/20' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}>
              <span className="text-white text-base font-black">✦</span>
            </div>
            <span className="font-black text-slate-800 text-base tracking-tight">My Daily Planner</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {[['features', 'Features'], ['how-it-works', 'How It Works'], ['testimonials', 'Reviews']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm font-semibold text-slate-600 hover:text-[#7DD3FC] transition-colors">
                {label}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onLogin}
              className="px-5 py-2 rounded-2xl text-sm font-bold text-[#1E293B] hover:bg-[#F0F4FF]/80 transition-colors">
              Log In
            </button>
            <button onClick={onSignup}
              className="px-5 py-2 rounded-2xl text-sm font-bold text-white shadow-lg hover:shadow-blue-100 hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}>
              Get Started Free →
            </button>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(p => !p)}
            className="p-2 rounded-2xl md:hidden hover:bg-slate-50 transition-colors text-slate-600">
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white py-4 px-6 space-y-4 shadow-xl">
            {[['features', 'Features'], ['how-it-works', 'How It Works'], ['testimonials', 'Reviews']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="block w-full text-left py-2 font-bold text-slate-700 hover:text-[#7DD3FC]">
                {label}
              </button>
            ))}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button onClick={onLogin} className="w-full py-2.5 rounded-2xl font-bold text-slate-700 bg-slate-50">
                Log In
              </button>
              <button onClick={onSignup} className="w-full py-2.5 rounded-2xl font-bold text-white text-center shadow-md"
                style={{ background: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}>
                Get Started Free →
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 pb-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #eef2ff 30%, #fdf2f8 60%, #f0fdf4 100%)' }} />
        <FloatingOrbs />

        {/* Dotted grid pattern */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, #c7d2fe 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-200 bg-white/80 backdrop-blur-sm shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-[#7DD3FC] uppercase tracking-widest">Personal Productivity Suite</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#1E293B] leading-[1.08] tracking-tight mb-6">
            Your entire life,{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #4F7CFF, #7DD3FC, #F7F9FF)' }}>
                beautifully organized
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            Habits, schedule, notes, mood, water, and focus timer — all in one gorgeous personal planner that actually helps you grow.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
            <button onClick={onSignup}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-2xl hover:shadow-blue-100 hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}>
              <span>Start for Free</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button onClick={onLogin}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-[#1E293B] font-bold text-base border-2 border-slate-200 bg-white/80 hover:border-blue-300 hover:bg-[#F0F4FF]/80 transition-all duration-200">
              <svg className="w-5 h-5 text-[#7DD3FC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In to Dashboard
            </button>
          </div>

          {/* Hero Preview Cards */}
          <div className="relative max-w-3xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { iconName: 'CheckSquare', label: 'Habits', value: '5/7 done', color: '#3B66E8', bg: '#fdf2f8' },
                { iconName: 'Droplet', label: 'Water', value: '6/8 glasses', color: '#60a5fa', bg: '#eff6ff' },
                { iconName: 'Smile', label: 'Mood', value: 'Feeling Good', color: '#34d399', bg: '#ecfdf5' },
                { iconName: 'Timer', label: 'Focus', value: '3 sessions', color: '#a78bfa', bg: '#f5f3ff' },
              ].map((card, i) => {
                const CardIcon = card.iconName === 'CheckSquare' ? CheckSquare
                               : card.iconName === 'Droplet' ? Droplet
                               : card.iconName === 'Smile' ? Smile
                               : Timer;
                return (
                  <div key={i}
                    className="p-4 rounded-2xl border shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left flex flex-col gap-2"
                    style={{ background: card.bg, borderColor: card.color + '33' }}>
                    <div className="w-9 h-9 rounded-xl bg-white/80 shadow-sm flex items-center justify-center">
                      <CardIcon size={16} style={{ color: card.color }} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: card.color + 'aa' }}>{card.label}</p>
                      <p className="text-sm font-black mt-0.5" style={{ color: card.color }}>{card.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #4F7CFF, #F0F4FF, #7DD3FC)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <AnimatedStat key={i} {...stat} delay={i * 100} />
          ))}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-sky-100 mb-4">
              <span className="text-xs font-bold text-[#7DD3FC] uppercase tracking-widest">Everything You Need</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#1E293B] mb-4">6 powerful tools,{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}>
                one beautiful app
              </span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Everything you need to build better habits, stay focused, and live intentionally — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={i} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4"
        style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #eef2ff 50%, #fdf2f8 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-sky-100 shadow-sm mb-4">
              <span className="text-xs font-bold text-[#7DD3FC] uppercase tracking-widest">Simple Setup</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-[#1E293B] mb-4">Up and running in{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}>
                60 seconds
              </span>
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                step: '01',
                title: 'Create your free account',
                desc: 'Sign up with email or Google in seconds. No credit card, no commitments, forever free.',
                icon: <Lock size={20} className="text-[#5B6CFF]" strokeWidth={1.5} />,
                color: '#5B6CFF',
              },
              {
                step: '02',
                title: 'Set up your habits & schedule',
                desc: 'Add your daily habits, pick your theme colors, and block out your day in the smart scheduler.',
                icon: <Zap size={20} className="text-[#A78BFA]" strokeWidth={1.5} />,
                color: '#A78BFA',
              },
              {
                step: '03',
                title: 'Track your progress',
                desc: 'View your completion charts, keep streaks alive, and review mood logs to see how you grow.',
                icon: <TrendingUp size={20} className="text-[#3B66E8]" strokeWidth={1.5} />,
                color: '#3B66E8',
              },
            ].map((step, i) => (
              <div key={i} className="flex gap-5 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${step.color}22, ${step.color}44)` }}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: step.color }}>Step {step.step}</span>
                  </div>
                  <h3 className="font-black text-slate-800 text-lg mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 mb-4">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" strokeWidth={2} />
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Loved by users</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800">People who{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #3B66E8, #a78bfa)' }}>
                love their days
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="p-6 rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span key={s} className="text-amber-400 text-base">★</span>
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${t.bg} flex items-center justify-center text-white text-xs font-black shadow-md`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA Section ── */}
      <section className="py-24 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4F7CFF 0%, #F0F4FF 40%, #7DD3FC 100%)' }}>
        <FloatingOrbs />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl mx-auto mb-8 shadow-xl">
            ✦
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
            Start living your{' '}
            <span className="text-yellow-300">best days</span>{' '}
            today
          </h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed font-medium">
            Join thousands building better habits, staying focused, and feeling great — one day at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onSignup}
              className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-[#1E293B] font-bold text-lg shadow-2xl hover:shadow-white/20 hover:-translate-y-1 active:translate-y-0 transition-all duration-200">
              <span>Create Free Account</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button onClick={onLogin}
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base border-2 border-white/30 hover:bg-white/10 hover:border-white/60 transition-all duration-200">
              Already have an account? Log in →
            </button>
          </div>
          <p className="text-white/50 text-xs mt-6 font-medium">No credit card required · Free forever · Your data stays private</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-4 bg-slate-900">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}>
              <span className="text-white text-sm font-black">✦</span>
            </div>
            <span className="font-black text-white text-sm">My Daily Planner</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <span>© {new Date().getFullYear()} Made with</span>
            <Heart size={12} className="text-rose-400 fill-rose-400" />
            <span>by Haider & Faisal</span>
          </div>
          <div className="flex gap-4">
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <button
                key={link}
                onClick={() => {
                  setActiveTab(link.toLowerCase());
                  window.scrollTo(0, 0);
                }}
                className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Legal pages shared layout wrapper ── */
function LegalPageLayout({ title, children, onBack }) {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden relative flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 animate-pulse"
          style={{ background: 'radial-gradient(circle, #A78BFA, transparent)', animationDuration: '4s' }} />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 rounded-full opacity-15 animate-pulse"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)', animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm shadow-indigo-100/30 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}>
              <span className="text-white text-base font-black">✦</span>
            </div>
            <span className="font-black text-slate-800 text-base tracking-tight">My Daily Planner</span>
          </div>
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all border border-slate-200"
          >
            ← Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 relative z-10">
        <div className="bg-white/75 backdrop-blur-md border border-slate-100 shadow-xl rounded-[2.5rem] p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-8 tracking-tight">
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}>
              {title}
            </span>
          </h1>
          <div className="prose prose-slate max-w-none text-slate-600 text-sm sm:text-base leading-relaxed space-y-6">
            {children}
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="py-6 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-1.5 text-slate-500 text-xs font-medium">
        <span>© {new Date().getFullYear()} Made with</span>
        <Heart size={12} className="text-rose-400 fill-rose-400" />
        <span>by Haider & Faisal</span>
      </footer>
    </div>
  );
}

/* ── Privacy Policy Page ── */
function PrivacyPage({ onBack }) {
  return (
    <LegalPageLayout title="Privacy Policy" onBack={onBack}>
      <p className="text-lg font-medium text-slate-700">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
      <p>
        At My Daily Planner, we take your privacy very seriously. We believe in transparency and keeping your information secure. This Privacy Policy details how we handle the information you provide when using our application.
      </p>
      
      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Information We Collect</h2>
      <p>
        When you register for an account, we collect basic details such as your email address and password. If you choose to authenticate with external providers (such as Google), we receive information according to your provider's settings (e.g., your email and profile name).
      </p>
      <p>
        We also store the planner content you explicitly create, which includes your daily schedule, habits tracker entries, mood logs, water consumption counts, and custom notes.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. How We Use Your Information</h2>
      <p>
        Your data is used solely to provide and improve the services offered by My Daily Planner. Specifically:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>To synchronize your schedule and habits across all your logged-in devices.</li>
        <li>To generate personal briefings and insights dynamically (if opted in).</li>
        <li>To facilitate optional integrations such as Google Calendar syncing.</li>
      </ul>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Data Security & Storage</h2>
      <p>
        We implement industry-standard encryption protocols to protect your personal information during transit and storage. All planner data is stored in secure database servers with strict access controls. We do not sell or share your personal data with third-party advertisers.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Google Calendar Integration</h2>
      <p>
        If you connect your Google Calendar, our app only requests permissions necessary to view and sync your calendar events. This data is processed locally or stored securely on our backend solely to coordinate your daily schedule, and is never shared.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Your Rights & Control</h2>
      <p>
        You retain full ownership and control of your data. You may update, download, or permanently delete your account and associated planner data directly from the settings panel in the app at any time.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">6. Contact Us</h2>
      <p>
        If you have any questions or feedback regarding our privacy practices, please contact us at{' '}
        <a href="mailto:faisugraphics@gmail.com" className="text-indigo-600 hover:text-indigo-800 font-bold underline">
          faisugraphics@gmail.com
        </a>.
      </p>
    </LegalPageLayout>
  );
}

/* ── Terms of Service Page ── */
function TermsPage({ onBack }) {
  return (
    <LegalPageLayout title="Terms of Service" onBack={onBack}>
      <p className="text-lg font-medium text-slate-700">
        Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
      <p>
        By accessing or using My Daily Planner, you agree to comply with and be bound by the following terms of service. Please review them carefully.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">1. Acceptance of Terms</h2>
      <p>
        By creating an account or using My Daily Planner, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree, you must discontinue using our services immediately.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">2. Account Responsibility</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials (email and password). You agree to notify us immediately of any unauthorized use of your account. We are not responsible for any losses arising from unauthorized access to your planner data.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">3. Prohibited Content & Use</h2>
      <p>
        You agree to use our application only for lawful purposes. You must not attempt to disrupt the performance of our servers, inject malicious scripts, or reverse engineer any parts of the platform.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">4. Limitation of Liability</h2>
      <p>
        My Daily Planner is provided "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted access or that the service will be entirely free of errors or downtime. In no event shall My Daily Planner, Haider, Faisal, or our partners be liable for any direct or indirect damages.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">5. Service Modifications</h2>
      <p>
        We reserve the right to modify or discontinue features of the planner at any time. We will make reasonable efforts to notify active users of major updates or deprecations that could impact account data.
      </p>

      <h2 className="text-xl font-bold text-slate-800 mt-8 mb-4">6. Inquiries</h2>
      <p>
        For any questions regarding these terms, please contact us directly at{' '}
        <a href="mailto:faisugraphics@gmail.com" className="text-indigo-600 hover:text-indigo-800 font-bold underline">
          faisugraphics@gmail.com
        </a>.
      </p>
    </LegalPageLayout>
  );
}

/* ── Contact Us Page ── */
function ContactPage({ onBack }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
      console.warn("Web3Forms access key not found. Please add VITE_WEB3FORMS_ACCESS_KEY to your .env file to enable email forwarding.");
      // Fallback: simulate success for testing
      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
      }, 800);
      return;
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          access_key: accessKey,
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          from_name: "My Daily Planner Contact Form"
        })
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || "Failed to send message. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to the mail server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LegalPageLayout title="Contact Us" onBack={onBack}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Contact details */}
        <div className="md:col-span-5 space-y-6">
          <p className="text-base text-slate-600 leading-relaxed">
            Have questions, feature suggestions, or business inquiries? We'd love to hear from you. Get in touch with us using the form or reach out directly via email.
          </p>

          <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 space-y-4">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Direct Contact Info</h3>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Mail size={14} className="text-[#7DD3FC]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Email Address</p>
                <a 
                  href="mailto:faisugraphics@gmail.com" 
                  className="text-indigo-600 hover:text-indigo-800 font-black text-sm break-all"
                >
                  faisugraphics@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users size={14} className="text-[#4F7CFF]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Co-Founders</p>
                <p className="text-slate-500 text-xs mt-0.5">Haider & Faisal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7">
          {submitted ? (
            <div className="p-8 rounded-3xl border border-emerald-100 bg-emerald-50 text-center flex flex-col items-center justify-center gap-3">
              <CheckCircle size={36} className="text-emerald-500 animate-bounce" strokeWidth={1.5} />
              <h3 className="font-black text-emerald-800 text-lg">Thank you!</h3>
              <p className="text-sm text-emerald-600">
                Your message has been sent successfully. We will get back to you shortly.
              </p>
              <button 
                onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); setError(''); }}
                className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-sm font-semibold text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle size={15} strokeWidth={1.5} className="text-rose-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="contact-name" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  disabled={loading}
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  disabled={loading}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  disabled={loading}
                  placeholder="How can we help?"
                  value={formData.subject}
                  onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Message</label>
                <textarea
                  id="contact-message"
                  required
                  disabled={loading}
                  rows={4}
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-blue-100 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
                style={{ background: 'linear-gradient(135deg, #4F7CFF, #7DD3FC)' }}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending Message...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </LegalPageLayout>
  );
}
