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

export function ProfissionalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useExpertTheme();
  const p = theme.primaryColor;
  const currentPage = navItems.find(i => i.href === location.pathname)?.name ?? 'Dashboard';
  const { profile, signOut } = useAuth();
  const { student } = useStudentProfile();
  const displayName = profile?.name ?? 'Aluno';
  const initials = displayName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const studentCode = student?.student_code ?? '---';

  return (
    <div className="h-screen flex flex-col font-sans bg-white dark:bg-[#f8f9fa] dark:bg-opacity-0" style={{ background: theme.backgroundColor, color: theme.textColor }}>
      <AssetTicker />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — wide, corporate */}
        <aside className="w-[260px] flex flex-col shrink-0 border-r border-gray-200/20" style={{ background: theme.sidebarColor }}>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200/10">
            <div className="flex items-center gap-3">
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt="logo" className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `${p}20`, border: `1px solid ${p}30` }}>
                  <TrendingUp size={18} style={{ color: p }} strokeWidth={2} />
                </div>
              )}
              <div>
                <span className="text-sm font-bold block" style={{ color: theme.textColor }}>{theme.brandName}</span>
                <span className="text-[10px] text-gray-500 block">Área do Aluno</span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu Principal</p>
            {navItems.map(item => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive ? 'font-semibold' : 'text-gray-500 hover:bg-white/5'
                  )}
                  style={isActive ? { background: `${p}15`, color: p } : {}}
                >
                  <item.icon size={17} style={isActive ? { color: p } : { color: '#888' }} />
                  {item.name}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: p }} />}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-gray-200/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: `${p}20`, color: p }}>{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: theme.textColor }}>{displayName}</p>
                <p className="text-[11px] text-gray-500 font-mono">{studentCode}</p>
              </div>
            </div>
            <button
              onClick={async () => { await signOut(); navigate('/login'); }}
              className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={13} /> Sair da conta
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-8 border-b border-gray-200/10 shrink-0" style={{ background: theme.sidebarColor }}>
            <div>
              <h1 className="text-base font-bold" style={{ color: theme.textColor }}>{currentPage}</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {theme.customMessage && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: `${p}10`, color: p }}>
                  <Bell size={12} />
                  <span className="truncate max-w-[220px]">{theme.customMessage}</span>
                </div>
              )}
              <ModeToggle />
            </div>
          </header>
          <div className="flex-1 overflow-auto p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
