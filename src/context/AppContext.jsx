import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav,   setActiveNav]   = useState('Dashboard');
  const [user,        setUser]        = useState(() => {
    // Ignore mock session if Supabase is active
    if (supabase) return null;
    try {
      const mock = localStorage.getItem('planner_mock_session');
      return mock ? JSON.parse(mock) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const checkedProfilesRef = useRef(new Set());

  // Dark mode permanently removed — always light
  const darkMode       = false;
  const toggleDarkMode = () => {};

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar  = () => setSidebarOpen(false);

  // Listen to Supabase auth events
  useEffect(() => {
    let subscription = null;

    const ensureUserProfile = async (authUser) => {
      if (!supabase || !authUser) return;
      if (checkedProfilesRef.current.has(authUser.id)) return;
      checkedProfilesRef.current.add(authUser.id);

      try {
        // Query to check if profile row exists
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authUser.id)
          .maybeSingle();

        if (error) {
          console.warn('Error checking profile presence:', error);
          checkedProfilesRef.current.delete(authUser.id); // allow retry
          return;
        }

        // Auto-heal by inserting profile row if absent
        if (!data) {
          const metadata = authUser.user_metadata || {};
          const fullName = metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'User';
          const avatarUrl = metadata.avatar_url || '';

          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              full_name: fullName,
              avatar_url: avatarUrl
            });

          if (insertError) {
            console.error('Failed to auto-create user profile row:', insertError);
            checkedProfilesRef.current.delete(authUser.id); // allow retry
          } else {
            console.log('User profile healed successfully in AppContext.');
          }
        }
      } catch (err) {
        console.error('Unexpected error checking user profile:', err);
        checkedProfilesRef.current.delete(authUser.id); // allow retry
      }
    };

    const initAuth = async () => {
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            await ensureUserProfile(session.user);
          } else {
            // Force logout / clean any mock session residues
            localStorage.removeItem('planner_mock_session');
            setUser(null);
          }
        } catch (e) {
          console.warn('Failed to retrieve Supabase session:', e);
        }
      }
      setAuthLoading(false);
    };

    initAuth();

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        setAuthLoading(false);
        if (currentUser) {
          await ensureUserProfile(currentUser);
        } else {
          localStorage.removeItem('planner_mock_session');
        }
      });
      subscription = data.subscription;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Logout utility
  const logout = async () => {
    try {
      localStorage.removeItem('planner_mock_session');
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Sign out failed:', e);
    }
    setUser(null);
    setActiveNav('Dashboard');
  };

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', action = null) => {
    setToast({ message, type, action });
  };

  // Remove any stale dark class from previous sessions
  document.documentElement.classList.remove('dark');

  return (
    <AppContext.Provider value={{
      sidebarOpen, toggleSidebar, closeSidebar,
      darkMode, toggleDarkMode,
      activeNav, setActiveNav,
      user, setUser, logout, authLoading,
      toast, setToast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
