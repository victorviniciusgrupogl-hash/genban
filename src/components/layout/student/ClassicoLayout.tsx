import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Settings, LogOut, TrendingUp, Target, Wallet, Bell, ChevronRight } from 'lucide-react';
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

export function ClassicoLayout() {
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
    <div className="h-screen flex flex-col font-sans" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      {/* Top bar full width */}
      <header className="h-14 flex items-center justify-between px-6 border-b shrink-0 z-20" style={{ background: theme.sidebarColor, borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-4">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt="logo" className="h-8 rounded-lg object-contain" />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${p}20` }}>
                <TrendingUp size={15} style={{ color: p }} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-sm" style={{ color: theme.textColor }}>{theme.brandName}</span>
            </div>
          )}
          <div className="h-5 w-px bg-white/10" />
          {/* Horizontal nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    isActive ? 'font-semibold' : 'text-gray-500 hover:text-white hover:bg-white/5'
                  )}
                  style={isActive ? { background: `${p}20`, color: p } : {}}
                >
                  <item.icon size={13} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {theme.customMessage && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 max-w-[280px]">
              <Bell size={12} style={{ color: p }} />
              <span className="truncate">{theme.customMessage}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: `${p}20`, color: p }}>{initials}</div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold leading-none" style={{ color: theme.textColor }}>{displayName}</p>
              <p className="text-[9px] text-gray-600 font-mono mt-0.5">{studentCode}</p>
            </div>
          </div>
          <ModeToggle />
          <button onClick={async () => { await signOut(); navigate('/login'); }} className="text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-all">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <AssetTicker />

      {/* Content */}
      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
