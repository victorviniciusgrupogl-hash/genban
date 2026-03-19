import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Settings, LogOut, Calendar,
  TrendingUp, Target, Wallet, Bell, ChevronRight, Zap, Shield, ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const navItems = [
  { name: 'Dashboard',     href: '/expert',            icon: LayoutDashboard, group: 'principal' },
  { name: 'Alunos',        href: '/expert/students',   icon: Users,           group: 'principal' },
  { name: 'Operações',     href: '/expert/operations', icon: TrendingUp,      group: 'principal' },
  { name: 'Calendário',    href: '/expert/calendar',   icon: Calendar,        group: 'ferramentas' },
  { name: 'Campanhas',     href: '/expert/campaigns',  icon: Target,          group: 'ferramentas' },
  { name: 'Financeiro',    href: '/expert/finance',    icon: Wallet,          group: 'ferramentas' },
  { name: 'Configurações', href: '/expert/settings',   icon: Settings,        group: 'sistema' },
];

const groupLabels: Record<string, string> = {
  principal:    'Principal',
  ferramentas:  'Ferramentas',
  sistema:      'Sistema',
};

export function ExpertLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const currentPage = navItems.find(i => i.href === location.pathname)?.name ?? 'Dashboard';

  const [adminBackup, setAdminBackup] = useState<{ expert_name: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('admin_backup_session');
    if (raw) {
      try { setAdminBackup(JSON.parse(raw)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleReturnToAdmin = async () => {
    const raw = localStorage.getItem('admin_backup_session');
    if (!raw) return;
    try {
      const backup = JSON.parse(raw);
      await supabase.auth.setSession({ access_token: backup.access_token, refresh_token: backup.refresh_token });
      localStorage.removeItem('admin_backup_session');
      navigate('/admin');
    } catch { /* ignore */ }
  };

  const initials = profile?.name
    ? profile.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'EX';
  const displayName = profile?.name ?? 'Expert';

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#050505] flex flex-col font-sans overflow-hidden">

      {/* Return to Admin banner */}
      {adminBackup && (
        <div className="h-9 bg-violet-600 dark:bg-violet-900/80 border-b border-violet-500/40 flex items-center justify-between px-4 shrink-0 z-50">
          <p className="text-xs font-semibold text-white">
            👤 Acessando conta de Expert: <span className="font-bold">{adminBackup.expert_name}</span>
          </p>
          <button
            onClick={handleReturnToAdmin}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition-all"
          >
            <ArrowLeft size={11} /> Voltar ao Admin
          </button>
        </div>
      )}

      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Grid pattern — only visible in dark */}
        <div className="absolute inset-0 pointer-events-none dark:block hidden"
          style={{
            backgroundImage: 'linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px), linear-gradient(to right, rgba(16,185,129,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        {/* Sidebar */}
        <aside className="w-[240px] bg-white dark:bg-[#090909] border-r border-gray-200 dark:border-[#10B981]/[0.12] flex flex-col z-20 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#10B981]/[0.05] to-transparent pointer-events-none" />

          {/* Logo */}
          <div className="h-16 flex items-center px-5 border-b border-gray-100 dark:border-[#10B981]/[0.10] relative">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-[#10B981]/20 rounded-xl blur-lg" />
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center shadow-lg shadow-[#10B981]/20">
                  <TrendingUp size={16} className="text-white" strokeWidth={2.5} />
                </div>
              </div>
              <div className="min-w-0">
                <span className="text-sm font-black text-black dark:text-white block tracking-tight truncate">TradePro</span>
                <span className="text-[9px] text-[#10B981] uppercase tracking-[0.25em] font-bold block mt-0.5">Área do Expert</span>
              </div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
            {['principal', 'ferramentas', 'sistema'].map(group => {
              const items = navItems.filter(i => i.group === group);
              return (
                <div key={group}>
                  <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-1.5 px-2">{groupLabels[group]}</p>
                  <div className="space-y-0.5">
                    {items.map(item => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 relative group',
                            isActive
                              ? 'text-[#10B981] bg-[#10B981]/[0.08] border border-[#10B981]/20'
                              : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.04] border border-transparent'
                          )}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#10B981] rounded-r-full" />
                          )}
                          <item.icon size={15} className={cn('shrink-0 transition-colors', isActive ? 'text-[#10B981]' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200')} />
                          <span className="flex-1 truncate">{item.name}</span>
                          {isActive && <ChevronRight size={11} className="text-[#10B981]/40 shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-3 border-t border-gray-100 dark:border-[#10B981]/[0.08]">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#10B981]/[0.05] border border-gray-200 dark:border-[#10B981]/[0.10] mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-black text-[#10B981]">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black dark:text-white truncate">{displayName}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono truncate">{profile?.email ?? ''}</p>
              </div>
              <Shield size={12} className="text-[#10B981]/40 shrink-0" />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/[0.08] hover:text-red-600 transition-all"
            >
              <LogOut size={13} /> Sair da conta
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          <header className="h-14 bg-white/90 dark:bg-[#080808]/90 border-b border-gray-200 dark:border-[#10B981]/[0.10] flex items-center px-6 justify-between shrink-0 backdrop-blur-sm">
            <div>
              <h1 className="text-sm font-bold text-black dark:text-white tracking-tight">{currentPage}</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all relative">
                <Bell size={14} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              </button>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981]/[0.08] border border-[#10B981]/20 rounded-xl">
                <Zap size={11} className="text-[#10B981]" />
                <span className="text-[10px] font-bold text-[#10B981] tracking-wider uppercase">Online</span>
              </div>
              <ModeToggle />
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
