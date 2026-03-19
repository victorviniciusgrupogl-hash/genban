import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Settings, LogOut, TrendingUp, Target, Wallet, Bell, ChevronRight, Activity } from 'lucide-react';
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

export function TecnologicoLayout() {
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
      <AssetTicker />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="w-[220px] flex flex-col shrink-0 border-r relative overflow-hidden"
          style={{ background: theme.sidebarColor, borderColor: `${p}18` }}
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)', backgroundSize: '100% 3px' }} />

          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: `${p}20` }}>
            <div className="flex items-center gap-2.5">
              {theme.logoUrl ? (
                <img src={theme.logoUrl} alt="logo" className="w-7 h-7 rounded-lg object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${p}20`, border: `1px solid ${p}40` }}>
                  <TrendingUp size={14} style={{ color: p }} strokeWidth={2.5} />
                </div>
              )}
              <div>
                <span className="text-xs font-black tracking-wider" style={{ color: p }}>{theme.brandName}</span>
                <span className="block text-[8px] text-gray-600 uppercase tracking-[0.2em] font-bold mt-0.5">Área do Aluno</span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-700 mb-3 px-2">Navegação</p>
            {navItems.map(item => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group relative"
                  style={isActive
                    ? { background: `${p}15`, color: p, border: `1px solid ${p}30` }
                    : { color: '#666', border: '1px solid transparent' }
                  }
                >
                  <div className="flex items-center gap-2.5">
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: p }} />}
                    <item.icon size={14} style={isActive ? { color: p } : { color: '#555' }} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight size={11} style={{ color: p }} />}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-3 border-t" style={{ borderColor: `${p}15` }}>
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1" style={{ background: `${p}08` }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black" style={{ background: `${p}25`, color: p }}>{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-gray-200 truncate">{displayName}</p>
                <p className="text-[9px] text-gray-600 font-mono truncate">{studentCode}</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <button
              onClick={async () => { await signOut(); navigate('/login'); }}
              className="flex items-center gap-2 px-2 py-1.5 w-full rounded-lg text-[11px] font-semibold text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={12} /> Sair
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-14 flex items-center justify-between px-6 border-b shrink-0" style={{ background: theme.sidebarColor, borderColor: `${p}15` }}>
            <div className="flex items-center gap-3">
              <Activity size={14} style={{ color: p }} />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: p }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: p }}>
                  Mercado Ativo
                </p>
              </div>
              {theme.customMessage && (
                <span className="text-xs text-gray-500 border-l border-white/10 pl-3">
                  {theme.customMessage}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors relative">
                <Bell size={15} className="text-gray-500" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: p }} />
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
