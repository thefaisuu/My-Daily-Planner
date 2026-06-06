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
    lightBg: '#fdf2f8',
    lightBorder: '#fbcfe8',
    tag: 'Streaks & Goals',
  },
  {
    icon: Calendar,
    title: 'Smart Schedule',
    desc: 'Plan every hour with categorized time slots, auto-completion tracking, and a gorgeous agenda view that keeps you on track.',
    gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
    lightBg: '#eef2ff',
    lightBorder: '#c7d2fe',
    tag: 'Time Blocking',
  },
  {
    icon: Droplet,
    title: 'Water Tracker',
    desc: 'Stay hydrated with visual glass-by-glass logging, daily goals, and streak reminders to keep you at peak performance.',
    gradient: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    lightBg: '#f0f9ff',
    lightBorder: '#bae6fd',
    tag: 'Daily Wellness',
  },
  {
    icon: Smile,
    title: 'Mood Journal',
    desc: 'Track your emotional wellbeing daily. Log moods from Rough to Amazing with notes and a beautiful monthly calendar view.',
    gradient: 'linear-gradient(135deg, #fb923c, #f97316)',
    lightBg: '#fff7ed',
    lightBorder: '#fed7aa',
    tag: 'Mental Health',
  },
  {
    icon: FileText,
    title: 'Smart Notes',
    desc: 'Capture ideas in beautiful color-coded notes with pin support, rich text editor, and instant auto-save as you type.',
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    lightBg: '#ecfdf5',
    lightBorder: '#a7f3d0',
    tag: 'Rich Text',
  },
  {
    icon: Timer,
    title: 'Focus Timer',
    desc: 'Deep work sessions using the Pomodoro technique with customizable intervals, break reminders, and session history.',
    gradient: 'linear-gradient(135deg, #c084fc, #a855f7)',
    lightBg: '#faf5ff',
    lightBorder: '#e9d5ff',
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

function useInView(threshold = 0.1) {
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
  const [ref, visible] = useInView(0.05);
  const Icon = feature.icon;
  return (
    <div
      ref={ref}
      className="feature-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.5s ease ${index * 70}ms, transform 0.5s ease ${index * 70}ms`,
      }}
    >
      <div className="feature-card-inner">
        <div className="feature-icon-wrap" style={{ background: feature.gradient }}>
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
  const [ref, visible] = useInView(0.3);
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
        <Icon size={20} strokeWidth={1.8} color="#4F7CFF" />
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

export default function LandingPage({ onLogin, onSignup, activeTabOverride = 'landing', onTabChange }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(activeTabOverride);

  // Sync when parent changes the tab (e.g. via popstate)
  useEffect(() => {
    setActiveTab(activeTabOverride);
    if (activeTabOverride !== 'landing') window.scrollTo(0, 0);
  }, [activeTabOverride]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const goTab = (tab) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
    onTabChange?.(tab);
  };

  if (activeTab === 'privacy') {
    return <PrivacyPage onBack={() => goTab('landing')} />;
  }
  if (activeTab === 'terms') {
    return <TermsPage onBack={() => goTab('landing')} />;
  }
  if (activeTab === 'contact') {
    return <ContactPage onBack={() => goTab('landing')} />;
  }

  return (
    <div className="lp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── Root ── */
        .lp-root {
          min-height: 100vh;
          background: #ffffff;
          color: #1e293b;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          transition: all 0.3s ease;
        }
        .lp-nav.scrolled {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 20px rgba(0,0,0,0.06);
        }
        .lp-nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 18px 24px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-logo {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .lp-logo-name {
          font-weight: 800; font-size: 15px; color: #1e293b; letter-spacing: -0.3px;
        }
        .lp-nav-links {
          display: flex; align-items: center; gap: 28px;
        }
        @media (max-width: 767px) { .lp-nav-links { display: none; } }
        .lp-nav-link {
          background: none; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; color: #64748b;
          transition: color 0.2s; padding: 0;
        }
        .lp-nav-link:hover { color: #1e293b; }
        .lp-nav-ctas {
          display: flex; align-items: center; gap: 10px;
        }
        @media (max-width: 767px) { .lp-nav-ctas { display: none; } }
        .btn-contact-nav {
          background: none; border: 1px solid #e2e8f0;
          color: #475569; font-size: 13px; font-weight: 600;
          padding: 7px 14px; border-radius: 10px; cursor: pointer;
          transition: all 0.2s; display: flex; align-items: center; gap: 5px;
        }
        .btn-contact-nav:hover { background: #f0f9ff; color: #0ea5e9; border-color: #bae6fd; }
        .btn-ghost {
          background: none; border: 1px solid #e2e8f0;
          color: #475569; font-size: 13px; font-weight: 600;
          padding: 8px 18px; border-radius: 12px; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
        .btn-primary {
          background: linear-gradient(135deg, #4f7cff, #3b66e8);
          border: none; color: #fff; font-size: 13px; font-weight: 700;
          padding: 9px 20px; border-radius: 12px; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 4px 16px rgba(79,124,255,0.3);
          display: flex; align-items: center; gap: 6px;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(79,124,255,0.45); }
        .btn-hamburger {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 8px; cursor: pointer; color: #475569;
          display: none;
        }
        @media (max-width: 767px) { .btn-hamburger { display: flex; align-items: center; justify-content: center; } }
        .mobile-menu {
          background: rgba(255,255,255,0.98); backdrop-filter: blur(20px);
          border-top: 1px solid #e2e8f0;
          padding: 16px 24px 20px; display: flex; flex-direction: column; gap: 4px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }
        .mobile-menu .lp-nav-link {
          display: block; text-align: left; padding: 10px 0;
          font-size: 15px; border-bottom: 1px solid #f1f5f9; color: #475569;
        }
        .mobile-menu .btn-primary, .mobile-menu .btn-ghost, .mobile-menu .btn-contact-nav { width: 100%; justify-content: center; margin-top: 8px; padding: 12px; }



        /* ── Hero ── */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 120px 24px 80px;
          position: relative; overflow: hidden;
          background: radial-gradient(ellipse at top left, #F7F9FF 0%, #F0F4FF 40%, #F7F9FF 70%, #ffffff 100%);
        }
        .hero-bg { position: absolute; inset: 0; pointer-events: none; }
        .hero-orb {
          position: absolute; border-radius: 50%; filter: blur(80px);
        }
        .hero-orb-1 { width: 700px; height: 700px; background: radial-gradient(circle, rgba(79, 124, 255, 0.12), transparent 65%); top: -180px; right: -150px; animation: floatOrb 9s ease-in-out infinite; }
        .hero-orb-2 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(125, 211, 252, 0.10), transparent 65%); bottom: -120px; left: -120px; animation: floatOrb 11s ease-in-out infinite reverse; }
        .hero-orb-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(79, 124, 255, 0.08), transparent 65%); top: 40%; left: 50%; transform: translate(-50%,-50%); animation: floatOrb 7s ease-in-out infinite 2s; }
        @keyframes floatOrb { 0%,100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.06) translateY(-18px); } }

        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(79, 124, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79, 124, 255, 0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 75% 75% at 50% 40%, black, transparent);
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: #F0F4FF; border: 1px solid rgba(79, 124, 255, 0.25);
          color: #4F7CFF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; padding: 6px 16px; border-radius: 100px;
          margin-bottom: 32px;
          position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease both;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .hero-h1 {
          font-size: clamp(40px, 6vw, 80px);
          font-weight: 900; line-height: 1.05; letter-spacing: -2.5px;
          color: #0f172a; margin: 0 0 24px; position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease 0.1s both;
        }
        .hero-h1 .grad {
          background: linear-gradient(135deg, #4F7CFF 0%, #7DD3FC 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: clamp(15px, 2vw, 18px); color: #64748b;
          max-width: 560px; margin: 0 auto 40px; line-height: 1.75; font-weight: 450;
          position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease 0.2s both;
        }

        .hero-ctas {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          margin-bottom: 60px; position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease 0.3s both;
        }
        .btn-hero-primary {
          display: flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #4F7CFF, #3B66E8);
          border: none; color: #fff; font-size: 15px; font-weight: 700;
          padding: 14px 30px; border-radius: 16px; cursor: pointer;
          transition: all 0.25s; box-shadow: 0 8px 24px rgba(79, 124, 255, 0.3);
          font-family: inherit;
        }
        .btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(79, 124, 255, 0.45); }
        .btn-hero-secondary {
          display: flex; align-items: center; gap: 8px;
          background: #ffffff; border: 1.5px solid #e2e8f0;
          color: #475569; font-size: 15px; font-weight: 600;
          padding: 14px 28px; border-radius: 16px; cursor: pointer;
          transition: all 0.25s; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          font-family: inherit;
        }
        .btn-hero-secondary:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }

        /* Hero mini cards */
        .hero-preview {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 12px;
          max-width: 640px; margin: 0 auto; position: relative; z-index: 1;
          animation: fadeInUp 0.6s ease 0.4s both;
        }
        @media (max-width: 600px) { .hero-preview { grid-template-columns: repeat(2,1fr); } }
        .hero-mini-card {
          background: #ffffff; border: 1.5px solid #f1f5f9;
          border-radius: 16px; padding: 14px; text-align: left;
          box-shadow: 0 2px 16px rgba(0,0,0,0.05); transition: all 0.25s;
        }
        .hero-mini-card:hover { border-color: #e0e7ff; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(79,124,255,0.12); }
        .hero-mini-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
        .hero-mini-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; }
        .hero-mini-value { font-size: 13px; font-weight: 800; margin-top: 2px; color: #1e293b; }

        /* ── Stats ── */
        .stats-section {
          padding: 80px 24px;
          background: radial-gradient(ellipse at center, #F0F4FF 0%, #F7F9FF 100%);
          border-top: 1.5px solid rgba(79, 124, 255, 0.1);
          border-bottom: 1.5px solid rgba(79, 124, 255, 0.1);
        }
        .stats-inner { max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
        @media (max-width: 640px) { .stats-inner { grid-template-columns: repeat(2,1fr); } }
        .stat-item { text-align: center; }
        .stat-icon-ring {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(255, 255, 255, 0.75);
          border: 1.5px solid rgba(79, 124, 255, 0.2);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
          box-shadow: 0 4px 12px rgba(79, 124, 255, 0.1);
        }
        .stat-value { font-size: 36px; font-weight: 900; color: #1e293b; line-height: 1; margin-bottom: 4px; letter-spacing: -1px; }
        .stat-label { font-size: 12px; font-weight: 600; color: rgba(30, 41, 59, 0.70); text-transform: uppercase; letter-spacing: 0.8px; }

        /* ── Features ── */
        .features-section { padding: 100px 24px; background: #f8fafc; }
        .section-inner { max-width: 1140px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 64px; }
        .section-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: #F0F4FF; border: 1px solid rgba(79, 124, 255, 0.25);
          color: #4F7CFF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; padding: 5px 14px; border-radius: 100px; margin-bottom: 20px;
        }
        .section-h2 {
          font-size: clamp(30px, 4vw, 50px); font-weight: 900; color: #0f172a;
          line-height: 1.1; letter-spacing: -1.5px; margin: 0 0 16px;
        }
        .section-h2 .grad {
          background: linear-gradient(135deg, #4F7CFF, #7DD3FC);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .section-sub { font-size: 16px; color: #64748b; max-width: 500px; margin: 0 auto; line-height: 1.7; }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr; } }

        .feature-card { cursor: default; }
        .feature-card-inner {
          background: #ffffff; border: 1.5px solid #f1f5f9;
          border-radius: 20px; padding: 28px; height: 100%;
          transition: all 0.3s ease; position: relative; overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .feature-card:hover .feature-card-inner {
          border-color: #e0e7ff;
          transform: translateY(-5px);
          box-shadow: 0 20px 48px rgba(79,124,255,0.1);
        }
        .feature-icon-wrap {
          width: 50px; height: 50px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px; position: relative; overflow: hidden;
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        }
        .feature-tag {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
          color: #94a3b8; margin-bottom: 8px;
        }
        .feature-title { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 10px; }
        .feature-desc { font-size: 13.5px; color: #64748b; line-height: 1.7; margin: 0 0 16px; }
        .feature-arrow {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 8px;
          background: #f1f5f9; border: 1px solid #e2e8f0;
          color: #94a3b8; transition: all 0.2s;
        }
        .feature-card:hover .feature-arrow {
          background: #F0F4FF; border-color: rgba(79, 124, 255, 0.25); color: #4F7CFF;
        }

        /* ── How It Works ── */
        .how-section {
          padding: 100px 24px;
          background: #ffffff;
        }
        .steps-list { display: flex; flex-direction: column; gap: 16px; max-width: 680px; margin: 0 auto; }
        .step-card {
          display: flex; gap: 20px; align-items: flex-start;
          background: #f8fafc; border: 1.5px solid #f1f5f9;
          border-radius: 20px; padding: 24px; transition: all 0.25s;
          box-shadow: 0 1px 8px rgba(0,0,0,0.03);
        }
        .step-card:hover { background: #ffffff; border-color: #c7d2fe; transform: translateX(4px); box-shadow: 0 8px 24px rgba(79,124,255,0.1); }
        .step-num-wrap {
          flex-shrink: 0; width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
        }
        .step-num { font-size: 16px; font-weight: 900; }
        .step-meta { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px; }
        .step-title { font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 6px; }
        .step-desc { font-size: 13.5px; color: #64748b; line-height: 1.65; margin: 0; }

        /* ── Testimonials ── */
        .testimonials-section { padding: 100px 24px; background: #f8fafc; }
        .testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; max-width: 960px; margin: 0 auto; }
        @media (max-width: 768px) { .testimonials-grid { grid-template-columns: 1fr; } }
        .testimonial-card {
          background: #ffffff; border: 1.5px solid #f1f5f9;
          border-radius: 20px; padding: 28px; transition: all 0.3s;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .testimonial-card:hover { border-color: #e0e7ff; transform: translateY(-4px); box-shadow: 0 16px 40px rgba(79,124,255,0.1); }
        .testimonial-stars { display: flex; gap: 3px; margin-bottom: 16px; }
        .testimonial-star { color: #f59e0b; font-size: 15px; }
        .testimonial-text { font-size: 14px; color: #475569; line-height: 1.75; font-style: italic; margin: 0 0 20px; }
        .testimonial-author { display: flex; align-items: center; gap: 12px; }
        .testimonial-avatar {
          width: 40px; height: 40px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 900; color: #fff; flex-shrink: 0;
        }
        .testimonial-name { font-size: 14px; font-weight: 800; color: #0f172a; }
        .testimonial-role { font-size: 11px; color: #94a3b8; margin-top: 2px; }

        /* ── CTA Section ── */
        .cta-section {
          padding: 100px 24px; text-align: center; position: relative; overflow: hidden;
          background: linear-gradient(135deg, #F0F4FF 0%, #F7F9FF 50%, #E0F2FE 100%);
          border-top: 1.5px solid rgba(79, 124, 255, 0.1);
        }
        .cta-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
          width: 600px; height: 400px; background: radial-gradient(ellipse, rgba(79, 124, 255, 0.15), transparent 70%);
          pointer-events: none;
        }
        .cta-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
        .cta-icon {
          width: 72px; height: 72px; border-radius: 22px;
          background: linear-gradient(135deg, #4F7CFF, #7DD3FC);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px; box-shadow: 0 16px 32px rgba(79,124,255,0.2);
          font-size: 32px; color: #ffffff;
        }
        .cta-h2 { font-size: clamp(32px, 4vw, 52px); font-weight: 900; color: #1e293b; line-height: 1.1; letter-spacing: -1.5px; margin: 0 0 16px; }
        .cta-h2 .gold { color: #4F7CFF; }
        .cta-sub { font-size: 16px; color: rgba(30, 41, 59, 0.75); margin: 0 0 40px; line-height: 1.7; }
        .cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-cta-primary {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #4F7CFF, #3B66E8); border: none; color: #fff; font-size: 15px; font-weight: 800;
          padding: 14px 30px; border-radius: 16px; cursor: pointer;
          transition: all 0.25s; box-shadow: 0 8px 24px rgba(79, 124, 255, 0.35);
          font-family: inherit;
        }
        .btn-cta-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(79, 124, 255, 0.5); }
        .btn-cta-outline {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255, 255, 255, 0.7); border: 1.5px solid rgba(79, 124, 255, 0.25);
          color: #4F7CFF; font-size: 14px; font-weight: 600;
          padding: 14px 26px; border-radius: 16px; cursor: pointer;
          transition: all 0.25s; font-family: inherit;
        }
        .btn-cta-outline:hover { background: #F0F4FF; border-color: #7DD3FC; color: #3B66E8; }
        .cta-note { font-size: 12px; color: rgba(30, 41, 59, 0.5); margin-top: 20px; }

        /* ── Footer ── */
        .lp-footer {
          padding: 32px 24px; background: #F0F4FF;
          border-top: 1px solid rgba(79, 124, 255, 0.1);
        }
        .lp-footer-inner {
          max-width: 1140px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }
        .lp-footer-logo { display: flex; align-items: center; gap: 8px; }
        .lp-footer-name { font-size: 13px; font-weight: 700; color: #475569; }
        .lp-footer-copy { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(71, 85, 105, 0.8); }
        .lp-footer-links { display: flex; gap: 20px; }
        .lp-footer-link {
          background: none; border: none; cursor: pointer;
          font-size: 12px; font-weight: 600; color: #475569;
          transition: color 0.2s; padding: 0;
        }
        .lp-footer-link:hover { color: #4F7CFF; }
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
            <button className="btn-contact-nav" onClick={() => goTab('contact')}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              Contact
            </button>
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
            <button className="btn-contact-nav" onClick={() => { goTab('contact'); setMobileMenuOpen(false); }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              Contact Us
            </button>
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
            { icon: CheckSquare, label: 'Habits', value: '5/7 done', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
            { icon: Droplet, label: 'Water', value: '6/8 glasses', color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
            { icon: Smile, label: 'Mood', value: 'Feeling Great', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { icon: Timer, label: 'Focus', value: '3 sessions', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
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
              { step: '01', title: 'Create your free account', desc: 'Sign up with email or Google in seconds. No credit card, no commitments, forever free.', color: '#4F7CFF', bg: '#F0F4FF' },
              { step: '02', title: 'Set up your habits & schedule', desc: 'Add your daily habits, pick theme colors, and block out your day in the smart scheduler.', color: '#3B66E8', bg: '#E0F2FE' },
              { step: '03', title: 'Track your progress & grow', desc: 'View completion charts, keep streaks alive, review mood logs and see how you improve over time.', color: '#0EA5E9', bg: '#F0F9FF' },
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
              <Star size={11} strokeWidth={2} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
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
            <button className="btn-cta-primary" onClick={onSignup}>
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
            {[['Privacy', 'privacy'], ['Terms', 'terms'], ['Contact', 'contact']].map(([label, tab]) => (
              <button key={tab} className="lp-footer-link" onClick={() => goTab(tab)}>
                {label}
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
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#1e293b', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{title}</span>
          <div style={{ width: 60 }} />
        </div>
      </nav>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: -1 }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Para({ children }) {
  return <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75, margin: '0 0 18px' }}>{children}</p>;
}
function H3({ children }) {
  return <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '32px 0 8px', letterSpacing: -0.5 }}>{children}</h3>;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
      console.warn("Web3Forms access key not found. Please add VITE_WEB3FORMS_ACCESS_KEY to your env configuration.");
      // Fallback behavior for local testing/missing key
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
          name: form.name,
          email: form.email,
          message: form.message,
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
      <Para>Have a question, feedback, or feature request? We'd love to hear from you.</Para>
      {submitted ? (
        <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: 16, padding: '24px', textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <p style={{ color: '#059669', fontWeight: 700, fontSize: 16 }}>Message sent! We'll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, backgroundColor: '#fff1f2', border: '1.5px solid #fecdd3', color: '#be123c', fontSize: 13, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'your@email.com' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 8 }}>{f.label}</label>
              <input type={f.type} required disabled={loading} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 8 }}>Message</label>
            <textarea required disabled={loading} rows={5} placeholder="Tell us what's on your mind..." value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#1e293b', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ background: 'linear-gradient(135deg, #4F7CFF, #3B66E8)', border: 'none', color: '#fff', fontWeight: 800, fontSize: 14, padding: '14px 28px', borderRadius: 14, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, fontFamily: 'inherit', opacity: loading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? 'Sending Message...' : 'Send Message →'}
          </button>
        </form>
      )}
    </LegalPageLayout>
  );
}
