import { useApp } from '../context/AppContext';
import NAV_ITEMS from '../constants/navItems';

function NavLink({ item }) {
  const { activeNav, setActiveNav, closeSidebar } = useApp();
  const isActive = activeNav === item.id;

  const handleClick = () => {
    setActiveNav(item.id);
    closeSidebar();
  };

  return (
    <button
      onClick={handleClick}
      className={`sidebar-link w-full text-left group ${isActive ? 'active' : ''}`}
    >
      <span className="text-lg leading-none group-hover:scale-110 transition-transform duration-200 inline-block">
        {item.icon}
      </span>
      <span>{item.label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: '#5B6CFF' }} />
      )}
    </button>
  );
}

export default function Sidebar() {
  const { sidebarOpen, closeSidebar, darkMode, user, logout, setActiveNav, showConfirm } = useApp();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Ata UmeR';
  const email = user?.email || 'ata@planner.app';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          w-[260px] transition-transform duration-300 ease-in-out
          backdrop-blur-xl border-r shadow-2xl
          ${darkMode
            ? 'bg-slate-900/95 border-slate-700/60 shadow-indigo-950/40'
            : 'bg-white/90 border-indigo-100/60 shadow-indigo-100/40'
          }
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:shadow-none
        `}
        aria-label="Sidebar navigation"
      >
        {/* Logo & App Name */}
        <div className={`flex items-center gap-3 px-6 py-6 border-b ${darkMode ? 'border-slate-700/60' : 'border-indigo-100/60'}`}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #5B6CFF, #A78BFA)' }}>
            <span className="text-xl leading-none text-white">✦</span>
          </div>
          <div>
            <h1 className="font-black text-base leading-tight text-gradient-primary">
              My Daily
            </h1>
            <h1 className="font-black text-base leading-tight text-gradient-primary">
              Planner
            </h1>
          </div>

          {/* Close button – mobile only */}
          <button
            onClick={closeSidebar}
            className={`ml-auto p-1.5 rounded-xl transition-colors lg:hidden
              ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-indigo-400' : 'hover:bg-indigo-50 text-slate-400 hover:text-indigo-600'}`}
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className={`px-4 mb-3 text-xs font-bold uppercase tracking-widest
            ${darkMode ? 'text-slate-500' : 'text-indigo-300'}`}>
            Menu
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>

        {/* User profile at bottom */}
        <div className={`px-4 py-4 border-t ${darkMode ? 'border-slate-700/60' : 'border-indigo-100/60'}`}>
          <div 
            onClick={() => setActiveNav('Settings')}
            className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors cursor-pointer group
              ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-indigo-50'}`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-sm shadow-md bg-gradient-to-tr from-[#5B6CFF] via-[#8DB4FF] to-[#A78BFA]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm truncate ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                {displayName}
              </p>
              <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                {email}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                showConfirm({
                  title: 'Confirm Logout',
                  message: 'Are you sure you want to log out of My Daily Planner?',
                  confirmText: 'Log Out',
                  isDanger: true,
                  onConfirm: logout
                });
              }}
              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-700/50 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
