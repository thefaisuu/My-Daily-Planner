import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import PastelIcon from '../components/PastelIcon';
import { Camera, Settings, Download, Trash2, Heart, Loader2 } from 'lucide-react';

/* ── Toast ── */
function Toast({ message, type = 'success', onDone }) {
  useState(() => { const id = setTimeout(onDone, 3000); return () => clearTimeout(id); });
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-black animate-bounce-in
      ${type === 'success' ? 'bg-emerald-500 text-white' : type === 'error' ? 'bg-rose-500 text-white' : 'bg-indigo-500 text-white'}`}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      {message}
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ title, icon, children }) {
  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        {icon}
        <h2 className="font-black text-slate-700 text-base">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ── Toggle row ── */
function ToggleRow({ label, sub, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-slate-700">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all duration-200 flex-shrink-0 relative ${value ? 'bg-indigo-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${value ? 'left-6' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
   ════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const { setActiveNav, user, setUser, logout, showConfirm } = useApp();
  const [toast, setToast]   = useState(null);
  
  // Profile settings states
  const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Account settings states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('planner_prefs') || '{}'); } catch { return {}; }
  });

  const setPref = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem('planner_prefs', JSON.stringify(next));

    if (val && ['habitReminders', 'waterReminders', 'focusAlerts', 'moodCheckins'].includes(key)) {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const [clearing, setClearing] = useState(false);

  const clearAllData = async () => {
    setClearing(true);
    setToast({ message: 'Clearing your data...', type: 'info' });

    // 1. Clear Local Storage
    ['planner_habits','planner_notes','planner_water','planner_moods','planner_schedule','planner_tasks','planner_focus','planner_ai_chats','planner_ai_timestamps','planner_supabase_mock_cache']
      .forEach(k => localStorage.removeItem(k));

    // 2. Clear Supabase database if logged in
    if (supabase && user) {
      try {
        const userId = user.id;
        
        // Delete all database records for this user
        await Promise.all([
          supabase.from('schedule_tasks').delete().eq('user_id', userId),
          supabase.from('habit_logs').delete().eq('user_id', userId),
          supabase.from('habits').delete().eq('user_id', userId),
          supabase.from('mood_logs').delete().eq('user_id', userId),
          supabase.from('notes').delete().eq('user_id', userId),
          supabase.from('water_logs').delete().eq('user_id', userId),
          supabase.from('chat_history').delete().eq('user_id', userId),
          supabase.from('ai_briefings').delete().eq('user_id', userId)
        ]);

        // Clean user's storage avatars
        try {
          const { data: files } = await supabase.storage.from('avatars').list(userId);
          if (files && files.length > 0) {
            const filePaths = files.map(f => `${userId}/${f.name}`);
            await supabase.storage.from('avatars').remove(filePaths);
          }
          await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
        } catch (storageErr) {
          console.warn('Storage cleanup warning:', storageErr);
        }

        console.log('Successfully cleared all user data from Supabase server.');
      } catch (err) {
        console.error('Failed to clear user data from Supabase:', err);
        setToast({ message: 'Failed to clear some cloud data', type: 'error' });
      }
    }

    // 3. Dispatch event to notify other pages
    window.dispatchEvent(new Event('planner-data-changed'));
    setClearing(false);
    setToast({ message: 'All planner data cleared ✓', type: 'success' });
  };

  const validateAvatar = (file) => {
    return new Promise((resolve) => {
      if (file.size > 10 * 1024) {
        resolve(false);
        return;
      }
      const img = new Image();
      img.onload = () => {
        if (img.width <= 100 && img.height <= 100) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  // ── Profile Upload Avatar (stored in Supabase storage) ──
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUpdatingProfile(true);
    setToast(null);

    const isValid = await validateAvatar(file);
    if (!isValid) {
      setToast({ message: 'Avatar must be max 100x100 px and under 10Kb', type: 'error' });
      setUpdatingProfile(false);
      return;
    }

    try {
      if (supabase) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        // Upload to bucket
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Retrieve public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update auth metadata
        const { data, error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: publicUrl }
        });
        if (updateError) throw updateError;

        // Update public profiles table
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        setAvatarUrl(publicUrl);
        if (data?.user) setUser(data.user);
        setToast({ message: 'Avatar updated ✓', type: 'success' });
      } else {
        // Mock fallback upload
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockUrl = URL.createObjectURL(file);
        const updatedUser = {
          ...user,
          user_metadata: { ...user.user_metadata, avatar_url: mockUrl }
        };
        localStorage.setItem('planner_mock_session', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setAvatarUrl(mockUrl);
        setToast({ message: 'Mock Avatar updated ✓', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to upload avatar', type: 'error' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ── Save profile name ──
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setToast({ message: 'Name cannot be empty', type: 'error' });
      return;
    }

    setUpdatingProfile(true);
    setToast(null);

    try {
      if (supabase) {
        // Update user metadata
        const { data, error: updateError } = await supabase.auth.updateUser({
          data: { full_name: profileName }
        });
        if (updateError) throw updateError;

        // Update public profiles table
        await supabase
          .from('profiles')
          .update({ full_name: profileName })
          .eq('id', user.id);

        if (data?.user) setUser(data.user);
        setToast({ message: 'Profile details saved ✓', type: 'success' });
      } else {
        // Mock fallback
        await new Promise((resolve) => setTimeout(resolve, 800));
        const updatedUser = {
          ...user,
          user_metadata: { ...user.user_metadata, full_name: profileName }
        };
        localStorage.setItem('planner_mock_session', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setToast({ message: 'Mock details saved ✓', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to update details', type: 'error' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ── Change Password ──
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setUpdatingPassword(true);
    setToast(null);

    try {
      if (supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setToast({ message: 'Password updated successfully ✓', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        // Mock fallback
        await new Promise((resolve) => setTimeout(resolve, 800));
        setToast({ message: 'Mock password updated successfully ✓', type: 'success' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      setToast({ message: err.message || 'Failed to update password', type: 'error' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // ── Delete Account ──
  const handleDeleteAccount = () => {
    showConfirm({
      title: 'Delete Your Account?',
      message: 'Are you sure you want to delete your account? This action is permanent and cannot be undone.',
      confirmText: 'Delete Account',
      isDanger: true,
      onConfirm: () => {
        showConfirm({
          title: 'Are you absolutely certain?',
          message: 'All your data, habits, schedule, and briefings will be permanently erased. There is no going back.',
          confirmText: 'Yes, Erase Everything',
          isDanger: true,
          onConfirm: async () => {
            setToast({ message: 'Deleting account...', type: 'info' });

            try {
              if (supabase) {
                // Delete profile row (will cascade to data tables in schema)
                const { error: deleteProfileError } = await supabase
                  .from('profiles')
                  .delete()
                  .eq('id', user.id);

                if (deleteProfileError) throw deleteProfileError;

                await clearAllData();
                await logout();
                setToast({ message: 'Account deleted', type: 'info' });
              } else {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await clearAllData();
                await logout();
                setToast({ message: 'Mock account deleted', type: 'info' });
              }
            } catch (err) {
              console.error(err);
              setToast({ message: err.message || 'Failed to delete account', type: 'error' });
            }
          }
        });
      }
    });
  };

  const dynamicInitials = profileName
    .split(' ')
    .filter(Boolean)
    .map(x => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 animate-fade-in bg-slate-50">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <PastelIcon name="Settings" colorType="settings" circleSize="w-12 h-12" size={22} />
          <h1 className="text-2xl font-black text-[#3B1F5E]">Settings</h1>
        </div>
        <p className="text-sm font-semibold text-slate-500 mt-0.5">Customize your Planner AI experience</p>
      </div>

      <div className="max-w-2xl space-y-5">
        {/* ── PROFILE SECTION ── */}
        <Section title="Profile" icon={<PastelIcon name="User" colorType="settings" circleSize="w-9 h-9" size={16} />}>
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
            
            {/* Avatar block with upload button */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="relative group">
                <div className="w-20 h-20 rounded-3xl overflow-hidden flex items-center justify-center text-white text-2xl font-black shadow-lg bg-gradient-to-tr from-[#5B6CFF] via-[#8DB4FF] to-[#A78BFA]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    dynamicInitials
                  )}
                </div>
                
                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-pink-500 hover:bg-pink-600 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-all transform hover:scale-110" title="Upload avatar">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={updatingProfile} />
                  <Camera className="w-3.5 h-3.5" strokeWidth={1.5} />
                </label>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Max 100x100 px & 10Kb</span>
            </div>

            {/* Profile editing form */}
            <form onSubmit={handleSaveProfile} className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-55 transition-all"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-semibold text-slate-400">
                  Email: <span className="font-bold text-slate-500">{user?.email || 'ata@planner.app'}</span>
                </span>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn-primary text-xs py-2 px-4 shadow-pink-100 hover:shadow-pink-200"
                >
                  {updatingProfile ? 'Saving...' : 'Save Name ✓'}
                </button>
              </div>
            </form>
          </div>
        </Section>

        {/* ── ACCOUNT SECTION ── */}
        <Section title="Account Security" icon={<PastelIcon name="Lock" colorType="danger" circleSize="w-9 h-9" size={16} />}>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-55 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-55 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-1 flex-wrap gap-3">
              {/* Delete account triggers */}
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="text-xs font-black text-rose-500 border-2 border-rose-100 hover:bg-rose-50 px-4 py-2 rounded-2xl transition-colors cursor-pointer"
              >
                Delete Account
              </button>

              <button
                type="submit"
                disabled={updatingPassword}
                className="btn-primary text-xs py-2 px-4 shadow-pink-100 hover:shadow-pink-200"
              >
                {updatingPassword ? 'Updating...' : 'Change Password ✓'}
              </button>
            </div>
          </form>
        </Section>

        {/* ── NOTIFICATIONS SECTION ── */}
        <Section title="Notifications" icon={<PastelIcon name="Bell" colorType="schedule" circleSize="w-9 h-9" size={16} />}>
          <ToggleRow label="Habit reminders" sub="Daily reminder to complete your habits"
            value={prefs.habitReminders ?? true} onChange={v => setPref('habitReminders', v)} />
          <ToggleRow label="Water reminders" sub="Hourly nudge to drink water"
            value={prefs.waterReminders ?? true} onChange={v => setPref('waterReminders', v)} />
          <ToggleRow label="Focus session alerts" sub="Timer start and end notifications"
            value={prefs.focusAlerts ?? true} onChange={v => setPref('focusAlerts', v)} />
          <ToggleRow label="Mood check-ins" sub="Evening reminder to log your mood"
            value={prefs.moodCheckins ?? false} onChange={v => setPref('moodCheckins', v)} />
        </Section>

        {/* ── APP PREFERENCES SECTION ── */}
        <Section title="App Preferences" icon={<PastelIcon name="Palette" colorType="habits" circleSize="w-9 h-9" size={16} />}>
          <ToggleRow label="Show motivational quotes" sub="Daily quote on the dashboard"
            value={prefs.showQuotes ?? true} onChange={v => setPref('showQuotes', v)} />
          <ToggleRow label="Focus timer bell sound" sub="Play a soft bell when session ends"
            value={prefs.timerSound ?? true} onChange={v => setPref('timerSound', v)} />
          <ToggleRow label="Confetti on habit completion" sub="Celebrate completing all habits"
            value={prefs.confetti ?? true} onChange={v => setPref('confetti', v)} />
        </Section>

        {/* ── DATA & PRIVACY SECTION ── */}
        <Section title="Data & Privacy" icon={<PastelIcon name="Shield" colorType="water" circleSize="w-9 h-9" size={16} />}>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              All your planner data is securely stored and backed up on our servers.
            </p>
            <div className="flex gap-3 flex-wrap pt-1">
              <button
                onClick={() => {
                  const data = {};
                  ['planner_habits','planner_notes','planner_water','planner_moods','planner_schedule'].forEach(k => {
                    try { data[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) {}
                  });
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement('a');
                  a.href = url; a.download = 'planner-backup.json'; a.click();
                  URL.revokeObjectURL(url);
                  setToast({ message: 'Backup downloaded ✓', type: 'success' });
                }}
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5">
                <Download size={13} strokeWidth={1.5} />
                <span>Export Data</span>
              </button>
              <button
                disabled={clearing}
                onClick={() => {
                  showConfirm({
                    title: 'Clear All Planner Data?',
                    message: 'This will permanently delete all your daily schedule, habits tracker entries, mood logs, water logs, and notes. This action cannot be undone.',
                    confirmText: 'Yes, Clear Data',
                    isDanger: true,
                    onConfirm: async () => {
                      await clearAllData();
                    }
                  });
                }}
                className={`text-xs font-black border-2 px-4 py-2 rounded-2xl transition-colors flex items-center gap-1.5
                  ${clearing
                    ? 'text-slate-400 border-slate-200 bg-slate-50 cursor-not-allowed'
                    : 'text-rose-500 border-rose-200 hover:bg-rose-50'
                  }`}
              >
                {clearing ? (
                  <>
                    <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} strokeWidth={1.5} />
                    <span>Clear All Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Section>

        {/* ── FOOTER ── */}
        <div className="text-center pt-8 pb-4 text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
          <span>Made with</span>
          <Heart size={12} className="text-rose-400 fill-rose-400" />
          <span>by Haider & Faisal</span>
        </div>

      </div>
    </div>
  );
}
