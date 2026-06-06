import { useState, useEffect, useRef } from 'react';
import { Heart, Lock, Hammer, Palette, Gift, CheckSquare, Droplet, Smile, Timer, Zap, TrendingUp, Calendar, FileText, Star, ArrowRight, Play, Shield, Users, Sparkles } from 'lucide-react';
import PlannerLogo from '../components/PlannerLogo';

/* ── Feature cards data ── */
const FEATURES = [
  {
    icon: CheckSquare,
    title: 'Habit Tracker',
    desc: 'Build powerful daily routines with streak tracking, custom theme tags, and progress rings. Turn small habits into life-changing wins.',
    gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
    glow: '#f472b633',
    tag: 'Streaks & Goals',
  },
  {
    icon: Calendar,
    title: 'Smart Schedule',
    desc: 'Plan every hour with categorized time slots, auto-completion tracking, and a gorgeous agenda view that keeps you on track.',
    gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
    glow: '#818cf833',
    tag: 'Time Blocking',
  },
  {
    icon: Droplet,
    title: 'Water Tracker',
    desc: 'Stay hydrated with visual glass-by-glass logging, daily goals, and streak reminders to keep you at peak performance.',
    gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    glow: '#38bdf833',
    tag: 'Daily Wellness',
  },
  {
    icon: Smile,
    title: 'Mood Journal',
    desc: 'Track your emotional wellbeing daily. Log moods from Rough to Amazing with notes and a beautiful monthly calendar view.',
    gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
    glow: '#fb923c33',
    tag: 'Mental Health',
  },
  {
    icon: FileText,
    title: 'Smart Notes',
    desc: 'Capture ideas in beautiful color-coded notes with pin support, rich text editor, and instant auto-save as you type.',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    glow: '#34d39933',
    tag: 'Rich Text',
  },
  {
    icon: Timer,
    title: 'Focus Timer',
    desc: 'Deep work sessions using the Pomodoro technique with customizable intervals, break reminders, and session history.',
    gradient: 'linear-gradient(135deg, #c084fc, #a855f7)',
    glow: '#c084fc33',
    tag: 'Pomodoro',
  },
];

const STATS = [
  { value: '6+', label: 'Productivity Tools', icon: Hammer },
  { value: '100%', label: 'Privacy First', icon: Shield },
  { value: 'Free', label: 'Forever Free', icon: Gift },
  { value: '∞', label: 'Daily Progress', icon: TrendingUp },
];

const TESTIMONIALS = [
  {
    name: 'Sarah K.',
    role: 'Freelance Designer',
    initials: 'SK',
    gradient: 'linear-gradient(135deg, #f472b6, #ec4899)',
    text: 'My Daily Planner completely transformed my mornings. The habit tracker and smart schedule are exactly what I needed to stay on top of everything.',
    stars: 5,
  },
  {
    name: 'Ahmed R.',
    role: 'Software Engineer',
    initials: 'AR',
    gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
    text: 'Finally an app that has everything in one place. The customizable widgets and rich notes help me stay extremely organized throughout the day.',
    stars: 5,
  },
  {
    name: 'Priya M.',
    role: 'Student & Blogger',
    initials: 'PM',
    gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
    text: 'The mood journal and focus timer have helped me stay on top of my mental health and study sessions. I love this app so much!',
    stars: 5,
  },
];

/* ── Animated number counter ── */
function useInView(threshold = 0.3) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FeatureCard({ feature, index }) {
  const [ref, visible] = useInView(0.1);
  const Icon = feature.icon;
  return (
    <div
      ref={ref}
      className="feature-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${index * 80}ms, transform 0.6s ease ${index * 80}ms`,
      }}
    >
      <div className="feature-card-inner">
        <div className="feature-icon-wrap" style={{ background: feature.gradient }}>
          <div className="feature-glow" style={{ background: feature.glow }} />
          <Icon size={22} strokeWidth={1.8} color="#fff" />
        </div>
        <div className="feature-tag">{feature.tag}</div>
        <h3 className="feature-title">{feature.title}</h3>
        <p className="feature-desc">{feature.desc}</p>
        <div className="feature-arrow">
          <ArrowRight size={14} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, icon: Icon, delay }) {
  const [ref, visible] = useInView(0.4);
  return (
    <div
      ref={ref}
      className="stat-item"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
        transition: `all 0.5s ease ${delay}ms`,
      }}
    >
      <div className="stat-icon-ring">
        <Icon size={20} strokeWidth={1.8} color="#fff" />
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
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
    <div className="lp-root">
      <style>{`
        /* ── Landing Page Styles ── */
        .lp-root {
          min-height: 100vh;
          background: #06060e;
          color: #e2e8f0;
          font-family: 'Inter', 'Outfit', system-ui, -apple-system, sans-serif;
          overflow-x: hidden;
        }

        /* Nav */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: all 0.3s ease;
          padding: 0;
        }
        .lp-nav.scrolled {
          background: rgba(6, 6, 14, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .lp-nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 20px 24px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .lp-logo-name {
          font-weight: 800; font-size: 15px; color: #fff; letter-spacing: -0.3px;
        }
        .lp-nav-links {
          display: flex; align-items: center; gap: 32px;
        }
        @media (max-width: 767px) { .lp-nav-links { display: none; } }
        .lp-nav-link {
          background: none; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6);
          transition: color 0.2s; padding: 0;
        }
        .lp-nav-link:hover { color: #fff; }
        .lp-nav-ctas {
          display: flex; align-items: center; gap: 10px;
        }
        @media (max-width: 767px) { .lp-nav-ctas { display: none; } }
        .btn-ghost {
          background: none; border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 600;
          padding: 8px 18px; border-radius: 12px; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.07); color: #fff; border-color: rgba(255,255,255,0.25); }
        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none; color: #fff; font-size: 13px; font-weight: 700;
          padding: 9px 20px; border-radius: 12px; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 4px 20px rgba(99,102,241,0.35);
          display: flex; align-items: center; gap: 6px;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(99,102,241,0.5); }
        .btn-hamburger {
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 8px; cursor: pointer; color: #fff;
          display: none;
        }
        @media (max-width: 767px) { .btn-hamburger { display: flex; align-items: center; justify-content: center; } }
        .mobile-menu {
          background: rgba(8, 8, 20, 0.97); backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 16px 24px 20px; display: flex; flex-direction: column; gap: 4px;
        }
        .mobile-menu .lp-nav-link {
          display: block; text-align: left; padding: 10px 0;
          font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .mobile-menu .btn-primary, .mobile-menu .btn-ghost { width: 100%; justify-content: center; margin-top: 8px; padding: 12px; }

        /* ── Hero ── */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 100px 24px 80px;
          position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; pointer-events: none;
        }
        .hero-orb {
          position: absolute; border-radius: 50%; filter: blur(120px);
        }
        .hero-orb-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%); top: -100px; right: -100px; animation: floatOrb 8s ease-in-out infinite; }
        .hero-orb-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(168,85,247,0.12), transparent 70%); bottom: -80px; left: -80px; animation: floatOrb 10s ease-in-out infinite reverse; }
        .hero-orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(236,72,153,0.1), transparent 70%); top: 50%; left: 50%; transform: translate(-50%,-50%); animation: floatOrb 7s ease-in-out infinite 2s; }
        @keyframes floatOrb { 0%,100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.08) translateY(-20px); } }

        .hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc; font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; padding: 6px 16px; border-radius: 100px;
          margin-bottom: 32px; backdrop-filter: blur(8px);
          position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease both;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #4ade80;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .hero-h1 {
          font-size: clamp(42px, 6vw, 82px);
          font-weight: 900; line-height: 1.05; letter-spacing: -2px;
          color: #fff; margin: 0 0 24px; position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease 0.1s both;
        }
        .hero-h1 .grad {
          background: linear-gradient(135deg, #818cf8, #c084fc, #f472b6);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: clamp(15px, 2vw, 18px); color: rgba(255,255,255,0.55);
          max-width: 580px; margin: 0 auto 40px; line-height: 1.7; font-weight: 500;
          position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease 0.2s both;
        }

        .hero-ctas {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          margin-bottom: 64px; position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease 0.3s both;
        }
        .btn-hero-primary {
          display: flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border: none; color: #fff; font-size: 15px; font-weight: 700;
          padding: 14px 30px; border-radius: 16px; cursor: pointer;
          transition: all 0.25s; box-shadow: 0 8px 30px rgba(99,102,241,0.4);
        }
        .btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(99,102,241,0.55); }
        .btn-hero-secondary {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.8); font-size: 15px; font-weight: 600;
          padding: 14px 28px; border-radius: 16px; cursor: pointer;
          transition: all 0.25s; backdrop-filter: blur(10px);
        }
        .btn-hero-secondary:hover { background: rgba(255,255,255,0.09); color: #fff; border-color: rgba(255,255,255,0.25); transform: translateY(-1px); }

        /* Hero mini cards */
        .hero-preview {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 12px;
          max-width: 640px; margin: 0 auto; position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease 0.4s both;
        }
        @media (max-width: 600px) { .hero-preview { grid-template-columns: repeat(2,1fr); } }
        .hero-mini-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 14px; text-align: left;
          backdrop-filter: blur(10px); transition: all 0.25s;
        }
        .hero-mini-card:hover { background: rgba(255,255,255,0.07); transform: translateY(-3px); }
        .hero-mini-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
        .hero-mini-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(255,255,255,0.4); }
        .hero-mini-value { font-size: 13px; font-weight: 800; margin-top: 2px; }

        /* ── Stats ── */
        .stats-section {
          padding: 80px 24px;
          background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08));
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .stats-inner { max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
        @media (max-width: 640px) { .stats-inner { grid-template-columns: repeat(2,1fr); } }
        .stat-item { text-align: center; }
        .stat-icon-ring {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3));
          border: 1px solid rgba(99,102,241,0.3);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
        }
        .stat-value { font-size: 36px; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 4px; letter-spacing: -1px; }
        .stat-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.8px; }

        /* ── Features ── */
        .features-section { padding: 100px 24px; background: #06060e; }
        .section-inner { max-width: 1140px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25);
          color: #a5b4fc; font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; padding: 5px 14px; border-radius: 100px; margin-bottom: 20px;
        }
        .section-h2 {
          font-size: clamp(30px, 4vw, 50px); font-weight: 900; color: #fff;
          line-height: 1.1; letter-spacing: -1.5px; margin: 0 0 16px;
        }
        .section-h2 .grad {
          background: linear-gradient(135deg, #818cf8, #c084fc);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .section-sub { font-size: 16px; color: rgba(255,255,255,0.45); max-width: 500px; margin: 0 auto; line-height: 1.7; }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr; } }

        .feature-card { cursor: default; }
        .feature-card-inner {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 28px; height: 100%;
          transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .feature-card-inner::before {
          content: ''; position: absolute; inset: 0; border-radius: 20px;
          background: linear-gradient(135deg, rgba(255,255,255,0.04), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .feature-card:hover .feature-card-inner {
          border-color: rgba(99,102,241,0.25);
          background: rgba(99,102,241,0.06);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        .feature-card:hover .feature-card-inner::before { opacity: 1; }
        .feature-icon-wrap {
          width: 50px; height: 50px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px; position: relative; overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .feature-glow {
          position: absolute; inset: -4px; border-radius: 18px; filter: blur(12px); z-index: -1;
        }
        .feature-tag {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
          color: rgba(255,255,255,0.35); margin-bottom: 8px;
        }
        .feature-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0 0 10px; }
        .feature-desc { font-size: 13.5px; color: rgba(255,255,255,0.45); line-height: 1.7; margin: 0 0 16px; }
        .feature-arrow {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4); transition: all 0.2s;
        }
        .feature-card:hover .feature-arrow {
          background: rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.4); color: #a5b4fc;
        }

        /* ── How It Works ── */
        .how-section {
          padding: 100px 24px;
          background: radial-gradient(ellipse 100% 60% at 50% 100%, rgba(99,102,241,0.07), transparent),
            linear-gradient(180deg, #06060e 0%, #0a0a1a 50%, #06060e 100%);
        }
        .steps-list { display: flex; flex-direction: column; gap: 16px; max-width: 680px; margin: 0 auto; }
        .step-card {
          display: flex; gap: 20px; align-items: flex-start;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 24px; transition: all 0.25s;
        }
        .step-card:hover { background: rgba(99,102,241,0.05); border-color: rgba(99,102,241,0.2); transform: translateX(4px); }
        .step-num-wrap {
          flex-shrink: 0; width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        .step-num { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
        .step-meta { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px; }
        .step-title { font-size: 17px; font-weight: 800; color: #fff; margin: 0 0 6px; }
        .step-desc { font-size: 13.5px; color: rgba(255,255,255,0.45); line-height: 1.65; margin: 0; }

        /* ── Testimonials ── */
        .testimonials-section { padding: 100px 24px; background: #06060e; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; max-width: 960px; margin: 0 auto; }
        @media (max-width: 768px) { .testimonials-grid { grid-template-columns: 1fr; } }
        .testimonial-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 28px; transition: all 0.3s;
        }
        .testimonial-card:hover { background: rgba(255,255,255,0.05); transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
        .testimonial-stars { display: flex; gap: 3px; margin-bottom: 16px; }
        .testimonial-star { color: #fbbf24; font-size: 14px; }
        .testimonial-text { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.7; font-style: italic; margin: 0 0 20px; }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 900; color: #fff; flex-shrink: 0;
        }
        .testimonial-name { font-size: 14px; font-weight: 800; color: #fff; }
        .testimonial-role { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 2px; }

        /* ── CTA Section ── */
        .cta-section {
          padding: 100px 24px; text-align: center; position: relative; overflow: hidden;
          background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.1) 50%, rgba(236,72,153,0.1) 100%);
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .cta-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(99,102,241,0.15), transparent 70%);
          pointer-events: none;
        }
        .cta-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
        .cta-icon {
          width: 72px; height: 72px; border-radius: 22px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px; box-shadow: 0 16px 48px rgba(99,102,241,0.4);
          font-size: 32px;
        }
        .cta-h2 { font-size: clamp(32px, 4vw, 52px); font-weight: 900; color: #fff; line-height: 1.1; letter-spacing: -1.5px; margin: 0 0 16px; }
        .cta-h2 .gold { color: #fbbf24; }
        .cta-sub { font-size: 16px; color: rgba(255,255,255,0.5); margin: 0 0 40px; line-height: 1.7; }
        .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-cta-white {
          display: flex; align-items: center; gap: 8px;
          background: #fff; border: none; color: #1e1b4b; font-size: 15px; font-weight: 800;
          padding: 14px 30px; border-radius: 16px; cursor: pointer;
          transition: all 0.25s; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(0,0,0,0.4); }
        .btn-cta-outline {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 600;
          padding: 14px 26px; border-radius: 16px; cursor: pointer;
          transition: all 0.25s;
        }
        .btn-cta-outline:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .cta-note { font-size: 12px; color: rgba(255,255,255,0.25); margin-top: 20px; }

        /* ── Footer ── */
        .lp-footer {
          padding: 32px 24px; background: #030308;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .lp-footer-inner {
          max-width: 1140px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }
        .lp-footer-logo { display: flex; align-items: center; gap: 8px; }
        .lp-footer-name { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.7); }
        .lp-footer-copy { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.25); }
        .lp-footer-links { display: flex; gap: 20px; }
        .lp-footer-link {
          background: none; border: none; cursor: pointer;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.3);
          transition: color 0.2s; padding: 0;
        }
        .lp-footer-link:hover { color: rgba(255,255,255,0.7); }
      `}</style>

      {/* ── Navigation ── */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-logo">
            <PlannerLogo size={30} />
            <span className="lp-logo-name">My Daily Planner</span>
          </div>
          <div className="lp-nav-links">
            {[['features', 'Features'], ['how-it-works', 'How It Works'], ['testimonials', 'Reviews']].map(([id, label]) => (
              <button key={id} className="lp-nav-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </div>
          <div className="lp-nav-ctas">
            <button className="btn-ghost" onClick={onLogin}>Log In</button>
            <button className="btn-primary" onClick={onSignup}>
              Get Started <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>
          <button className="btn-hamburger" onClick={() => setMobileMenuOpen(p => !p)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="mobile-menu">
            {[['features', 'Features'], ['how-it-works', 'How It Works'], ['testimonials', 'Reviews']].map(([id, label]) => (
              <button key={id} className="lp-nav-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
            <button className="btn-ghost" onClick={onLogin}>Log In</button>
            <button className="btn-primary" onClick={onSignup}>Get Started Free →</button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
          <div className="hero-grid" />
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Personal Productivity Suite
        </div>

        <h1 className="hero-h1">
          Your entire life,{' '}
          <span className="grad">beautifully<br />organized</span>
        </h1>

        <p className="hero-sub">
          Habits, schedule, notes, mood, water &amp; focus timer — all in one gorgeous
          personal planner that helps you grow every single day.
        </p>

        <div className="hero-ctas">
          <button className="btn-hero-primary" onClick={onSignup}>
            <Sparkles size={18} strokeWidth={2} />
            Start for Free
          </button>
          <button className="btn-hero-secondary" onClick={onLogin}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </button>
        </div>

        <div className="hero-preview">
          {[
            { icon: CheckSquare, label: 'Habits', value: '5/7 done', color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
            { icon: Droplet, label: 'Water', value: '6/8 glasses', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
            { icon: Smile, label: 'Mood', value: 'Feeling Great', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
            { icon: Timer, label: 'Focus', value: '3 sessions', color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
          ].map((card, i) => {
            const CardIcon = card.icon;
            return (
              <div key={i} className="hero-mini-card">
                <div className="hero-mini-icon" style={{ background: card.bg }}>
                  <CardIcon size={16} color={card.color} strokeWidth={2} />
                </div>
                <div className="hero-mini-label">{card.label}</div>
                <div className="hero-mini-value" style={{ color: card.color }}>{card.value}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section">
        <div className="stats-inner">
          {STATS.map((s, i) => (
            <StatCard key={i} {...s} delay={i * 100} />
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="features-section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">
              <Sparkles size={12} strokeWidth={2} />
              Everything You Need
            </div>
            <h2 className="section-h2">
              6 powerful tools,{' '}
              <span className="grad">one beautiful app</span>
            </h2>
            <p className="section-sub">
              Everything you need to build better habits, stay focused, and live intentionally — all in one place.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="how-section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">Simple Setup</div>
            <h2 className="section-h2">
              Up and running in{' '}
              <span className="grad">60 seconds</span>
            </h2>
          </div>
          <div className="steps-list">
            {[
              { step: '01', title: 'Create your free account', desc: 'Sign up with email or Google in seconds. No credit card, no commitments, forever free.', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
              { step: '02', title: 'Set up your habits & schedule', desc: 'Add your daily habits, pick theme colors, and block out your day in the smart scheduler.', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
              { step: '03', title: 'Track your progress & grow', desc: 'View completion charts, keep streaks alive, review mood logs and see how you improve over time.', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
            ].map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num-wrap" style={{ background: s.bg }}>
                  <span className="step-num" style={{ color: s.color }}>0{i + 1}</span>
                </div>
                <div>
                  <div className="step-meta" style={{ color: s.color }}>Step {s.step}</div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-badge">
              <Star size={11} strokeWidth={2} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
              Loved by Users
            </div>
            <h2 className="section-h2">
              People who{' '}
              <span className="grad">love their days</span>
            </h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-stars">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <span key={s} className="testimonial-star">★</span>
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: t.gradient }}>{t.initials}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="cta-inner">
          <div className="cta-icon">✦</div>
          <h2 className="cta-h2">
            Start living your{' '}
            <span className="gold">best days</span>{' '}
            today
          </h2>
          <p className="cta-sub">
            Join thousands building better habits, staying focused, and feeling great — one day at a time.
          </p>
          <div className="cta-btns">
            <button className="btn-cta-white" onClick={onSignup}>
              Create Free Account <ArrowRight size={16} strokeWidth={2.5} />
            </button>
            <button className="btn-cta-outline" onClick={onLogin}>
              Already have an account? Log in →
            </button>
          </div>
          <p className="cta-note">No credit card required · Free forever · Your data stays private</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <PlannerLogo size={24} />
            <span className="lp-footer-name">My Daily Planner</span>
          </div>
          <div className="lp-footer-copy">
            <span>© {new Date().getFullYear()} Made with</span>
            <Heart size={11} style={{ color: '#f87171', fill: '#f87171' }} />
            <span>by Haider &amp; Faisal</span>
          </div>
          <div className="lp-footer-links">
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <button key={link} className="lp-footer-link"
                onClick={() => { setActiveTab(link.toLowerCase()); window.scrollTo(0, 0); }}>
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
    <div style={{ minHeight: '100vh', background: '#06060e', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(6,6,14,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>{title}</span>
          <div style={{ width: 60 }} />
        </div>
      </nav>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: -1 }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Para({ children }) {
  return <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: '0 0 18px' }}>{children}</p>;
}
function H3({ children }) {
  return <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '32px 0 8px', letterSpacing: -0.5 }}>{children}</h3>;
}

function PrivacyPage({ onBack }) {
  return (
    <LegalPageLayout title="Privacy Policy" onBack={onBack}>
      <Para>Last updated: June 2025</Para>
      <Para>My Daily Planner ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.</Para>
      <H3>Information We Collect</H3>
      <Para>We collect information you provide directly to us, including your name, email address, and any content you create within the app (habits, schedules, notes, mood entries, etc.).</Para>
      <H3>How We Use Your Information</H3>
      <Para>We use your information solely to provide, maintain, and improve the My Daily Planner service. We do not sell, trade, or share your personal data with third parties for marketing purposes.</Para>
      <H3>Data Storage & Security</H3>
      <Para>Your data is stored securely using industry-standard encryption. We use Supabase for authentication and data storage, which follows strict security protocols.</Para>
      <H3>Your Rights</H3>
      <Para>You have the right to access, update, or delete your personal information at any time. Contact us at support@mydailyplanner.app for any data-related requests.</Para>
      <H3>Contact Us</H3>
      <Para>If you have questions about this Privacy Policy, please contact us at support@mydailyplanner.app.</Para>
    </LegalPageLayout>
  );
}

function TermsPage({ onBack }) {
  return (
    <LegalPageLayout title="Terms of Service" onBack={onBack}>
      <Para>Last updated: June 2025</Para>
      <Para>By using My Daily Planner, you agree to these Terms of Service. Please read them carefully before using our application.</Para>
      <H3>Use of Service</H3>
      <Para>My Daily Planner is provided for personal, non-commercial use. You agree not to misuse the service or attempt to access it using unauthorized methods.</Para>
      <H3>User Content</H3>
      <Para>You retain ownership of all content you create within the app. By using our service, you grant us a limited license to store and process your content solely to provide the service.</Para>
      <H3>Disclaimer</H3>
      <Para>My Daily Planner is provided "as is" without warranties of any kind. We are not responsible for any loss of data or interruption of service.</Para>
      <H3>Changes to Terms</H3>
      <Para>We may update these terms from time to time. We will notify you of significant changes via email or through the app.</Para>
      <H3>Contact</H3>
      <Para>For questions about these terms, contact us at support@mydailyplanner.app.</Para>
    </LegalPageLayout>
  );
}

function ContactPage({ onBack }) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };
  return (
    <LegalPageLayout title="Contact Us" onBack={onBack}>
      <Para>Have a question, feedback, or feature request? We'd love to hear from you.</Para>
      {submitted ? (
        <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 16, padding: '24px', textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <p style={{ color: '#34d399', fontWeight: 700, fontSize: 16 }}>Message sent! We'll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{f.label}</label>
              <input type={f.type} required placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Message</label>
            <textarea required rows={5} placeholder="Tell us what's on your mind..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <button type="submit"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, padding: '14px 28px', borderRadius: 14, cursor: 'pointer', marginTop: 8 }}>
            Send Message →
          </button>
        </form>
      )}
    </LegalPageLayout>
  );
}
