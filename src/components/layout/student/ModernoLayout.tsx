import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Settings, LogOut, TrendingUp, Target, Wallet, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { AssetTicker } from '@/components/AssetTicker';
import { useExpertTheme } from '@/contexts/ExpertThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentProfile } from '@/hooks/useStudentData';

const navItems = [
  { name: 'Dashboard',     href: '/student',           icon: LayoutDashboard },
  { name: 'Calendário',    href: '/student/calendar',  icon: Calendar },
  { name: 'Campanhas',     href: '/student/campaigns', icon: Target },
  { name: 'Financeiro',    href: '/student/finance',   icon: Wallet },
  { name: 'Configurações', href: '/student/settings',  icon: Settings },
];

export function ModernoLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useExpertTheme();
  const p = theme.primaryColor;
  const { profile, signOut } = useAuth();
  const { student } = useStudentProfile();
  const displayName = profile?.name ?? 'Aluno';
  const initials = displayName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const studentCode = student?.student_code ?? '---';

  return (
    <div className="h-screen flex flex-col font-sans relative overflow-hidden" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      {/* Blurred background blobs */}
      <div className="absolute top-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none" style={{ background: `${p}12` }} />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none" style={{ background: `${p}08` }} />

      <AssetTicker />

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Floating sidebar with glass */}
        <aside
          className="w-[72px] flex flex-col items-center py-4 gap-3 shrink-0 border-r"
          style={{
            background: `${theme.sidebarColor}cc`,
            backdropFilter: 'blur(20px)',
            borderColor: `${p}15`,
          }}
        >
          {/* Logo icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shadow-lg" style={{ background: `${p}25`, border: `1px solid ${p}40` }}>
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt="logo" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <TrendingUp size={18} style={{ color: p }} strokeWidth={2.5} />
            )}
          </div>

          {/* Nav icons */}
          {navItems.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                title={item.name}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 relative group"
                style={isActive
                  ? { background: `${p}25`, border: `1px solid ${p}40`, boxShadow: `0 0 12px ${p}30` }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }
                }
              >
                <item.icon size={16} style={isActive ? { color: p } : { color: '#888' }} />
                {/* Tooltip */}
                <span className="absolute left-14 bg-[#0d0d0d] text-white text-[10px] font-semibold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-white/10">
                  {item.name}
                </span>
              </Link>
            );
          })}

          <div className="flex-1" />

          {/* User avatar */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-all" style={{ background: `${p}20`, color: p, border: `1px solid ${p}30` }}>
            {initials}
          </div>
          <button
            onClick={async () => { await signOut(); navigate('/login'); }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/15 transition-all"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header
            className="h-14 flex items-center justify-between px-6 border-b shrink-0"
            style={{
              background: `${theme.sidebarColor}99`,
              backdropFilter: 'blur(12px)',
              borderColor: `${p}12`,
            }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: theme.textColor }}>
                {navItems.find(i => i.href === location.pathname)?.name ?? 'Dashboard'}
              </p>
              {theme.customMessage && (
                <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[320px]">
                  {theme.customMessage}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-xl flex items-center justify-center relative" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Bell size={14} className="text-gray-500" />
                <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full" style={{ background: p }} />
              </button>
              <ModeToggle />
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
