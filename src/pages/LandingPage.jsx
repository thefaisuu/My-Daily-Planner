import { useState, useEffect, useRef } from 'react';

/* ── Feature cards data ── */
const FEATURES = [
  {
    icon: '✅',
    title: 'Habit Tracker',
    desc: 'Build powerful daily routines with streak tracking, emoji icons, and progress rings. Turn small habits into life-changing wins.',
    gradient: 'from-pink-400 to-rose-500',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
  },
  {
    icon: '📅',
    title: 'Smart Schedule',
    desc: 'Plan every hour of your day with categorized time slots, completion tracking, and a printable agenda view.',
    gradient: 'from-indigo-400 to-violet-500',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
  },
  {
    icon: '💧',
    title: 'Water Tracker',
    desc: 'Stay hydrated with visual glass-by-glass logging, daily goals, and streak reminders to keep you at peak performance.',
    gradient: 'from-sky-400 to-blue-500',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
  },
  {
    icon: '😊',
    title: 'Mood Journal',
    desc: 'Track your emotional wellbeing daily. Log moods from Rough to Amazing with optional notes and a beautiful monthly calendar.',
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
  {
    icon: '📝',
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
    border: 'border-purple-100',
  },
];

const STATS = [
  { value: '6+', label: 'Productivity Tools', icon: '🛠️' },
  { value: '100%', label: 'Privacy First', icon: '🔒' },
  { value: 'Modern', label: 'Dashboard UI', icon: '🎨' },
  { value: 'Free', label: 'Always Free', icon: '💝' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah K.',
    role: 'Freelance Designer',
    avatar: '👩‍🎨',
    text: 'My Daily Planner completely transformed my mornings. The habit tracker and printable daily schedule are exactly what I needed!',
    stars: 5,
  },
  {
    name: 'Ahmed R.',
    role: 'Software Engineer',
    avatar: '👨‍💻',
    text: 'Finally an app that has everything in one place. The customizable widgets and notes help me stay extremely organized throughout the day.',
    stars: 5,
  },
  {
    name: 'Priya M.',
    role: 'Student & Blogger',
    avatar: '👩‍🎓',
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
    <div ref={ref} className={`flex flex-col items-center gap-2 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <span className="text-4xl">{icon}</span>
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

  return (
    <div ref={ref}
      className={`group p-6 rounded-3xl border ${feature.bg} ${feature.border} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${(index % 4) * 80}ms`, transition: 'all 0.5s ease' }}>
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-4 shadow-md group-hover:scale-110 transition-transform duration-200`}>
        {feature.icon}
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
        style={{ background: 'radial-gradient(circle, #f472b6, transparent)', animationDuration: '5s', animationDelay: '1s' }} />
    </div>
  );
}

export default function LandingPage({ onLogin, onSignup }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md shadow-indigo-100/30' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #5B6CFF, #A78BFA)' }}>
              <span className="text-white text-base font-black">✦</span>
            </div>
            <span className="font-black text-slate-800 text-base tracking-tight">My Daily Planner</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {[['features', 'Features'], ['how-it-works', 'How It Works'], ['testimonials', 'Reviews']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                {label}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onLogin}
              className="px-5 py-2 rounded-2xl text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
              Log In
            </button>
            <button onClick={onSignup}
              className="px-5 py-2 rounded-2xl text-sm font-bold text-white shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg, #5B6CFF, #A78BFA)' }}>
              Get Started Free →
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(v => !v)}>
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/98 backdrop-blur-md border-t border-slate-100 px-4 py-4 space-y-2 shadow-lg">
            {[['features', 'Features'], ['how-it-works', 'How It Works'], ['testimonials', 'Reviews']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="block w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                {label}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={onLogin}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors">
                Log In
              </button>
              <button onClick={onSignup}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #5B6CFF, #A78BFA)' }}>
                Get Started
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-200 bg-white/80 backdrop-blur-sm shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Personal Productivity Suite</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-800 leading-[1.08] tracking-tight mb-6">
            Your entire life,{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #5B6CFF, #A78BFA, #f472b6)' }}>
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
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-2xl hover:shadow-indigo-300 hover:-translate-y-1 active:translate-y-0 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #5B6CFF, #A78BFA)' }}>
              <span>Start for Free</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button onClick={onLogin}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-slate-700 font-bold text-base border-2 border-slate-200 bg-white/80 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In to Dashboard
            </button>
          </div>

          {/* Hero Preview Cards */}
          <div className="relative max-w-3xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '✅', label: 'Habits', value: '5/7 done', color: '#f472b6', bg: '#fdf2f8' },
                { icon: '💧', label: 'Water', value: '6/8 glasses', color: '#60a5fa', bg: '#eff6ff' },
                { icon: '😊', label: 'Mood', value: 'Feeling Good', color: '#34d399', bg: '#ecfdf5' },
                { icon: '⏱️', label: 'Focus', value: '3 sessions', color: '#a78bfa', bg: '#f5f3ff' },
              ].map((card, i) => (
                <div key={i}
                  className="p-4 rounded-2xl border shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  style={{ background: card.bg, borderColor: card.color + '33' }}>
                  <span className="text-2xl">{card.icon}</span>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-2" style={{ color: card.color + 'aa' }}>{card.label}</p>
                  <p className="text-sm font-black mt-0.5" style={{ color: card.color }}>{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #5B6CFF, #8DB4FF, #A78BFA)' }}>
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-4">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Everything You Need</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-4">6 powerful tools,{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #5B6CFF, #A78BFA)' }}>
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-indigo-100 shadow-sm mb-4">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Simple Setup</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800 mb-4">Up and running in{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #5B6CFF, #f472b6)' }}>
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
                icon: '🔐',
                color: '#5B6CFF',
              },
              {
                step: '02',
                title: 'Set up your habits & schedule',
                desc: 'Add your daily habits, pick your emoji, and block out your day in the smart scheduler.',
                icon: '⚡',
                color: '#A78BFA',
              },
              {
                step: '03',
                title: 'Track your progress',
                desc: 'View your completion charts, keep streaks alive, and review mood logs to see how you grow.',
                icon: '📈',
                color: '#f472b6',
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
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">⭐ Loved by users</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800">People who{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #f472b6, #a78bfa)' }}>
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
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl">
                    {t.avatar}
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
        style={{ background: 'linear-gradient(135deg, #5B6CFF 0%, #8DB4FF 40%, #A78BFA 100%)' }}>
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
              className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-indigo-600 font-bold text-lg shadow-2xl hover:shadow-white/20 hover:-translate-y-1 active:translate-y-0 transition-all duration-200">
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
              style={{ background: 'linear-gradient(135deg, #5B6CFF, #A78BFA)' }}>
              <span className="text-white text-sm font-black">✦</span>
            </div>
            <span className="font-black text-white text-sm">My Daily Planner</span>
          </div>
          <p className="text-slate-500 text-xs font-medium">
            © {new Date().getFullYear()} Made with ♥️ by Haider & Faisal
          </p>
          <div className="flex gap-4">
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <button key={link} className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors">
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
