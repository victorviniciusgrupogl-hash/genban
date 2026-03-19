import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, LogOut, TrendingUp,
  Bell, ChevronRight, Shield, Database, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStats } from '@/hooks/useAdminData';

const navItems = [
  { name: 'Visão Geral', href: '/admin',          icon: LayoutDashboard },
  { name: 'Experts',     href: '/admin/experts',   icon: UserCog },
  { name: 'Alunos',      href: '/admin/students',  icon: Users },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { stats } = useAdminStats();
  const currentPage = navItems.find(i => i.href === location.pathname)?.name ?? 'Dashboard';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.name ?? 'Administrador';

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#030303] flex font-sans overflow-hidden relative">
      {/* Subtle hex/grid pattern — dark only */}
      <div className="absolute inset-0 pointer-events-none dark:block hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

      {/* Left accent */}
      <div className="absolute left-[240px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#10B981]/20 to-transparent pointer-events-none z-30" />

      {/* Sidebar */}
      <aside className="w-[240px] flex flex-col z-20 shrink-0 relative overflow-hidden bg-white dark:bg-[#060606] border-r border-gray-200 dark:border-[#10B981]/[0.12]">
        {/* Top glow */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#10B981]/[0.06] to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="h-16 flex items-center px-5 relative border-b border-gray-100 dark:border-[#10B981]/[0.10]">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-[#10B981]/25 rounded-xl blur-xl" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981] to-[#047857] flex items-center justify-center shadow-lg shadow-[#10B981]/25">
                <TrendingUp size={16} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-sm font-black text-black dark:text-white block tracking-tight">TradePro</span>
              <span className="text-[9px] text-[#10B981] uppercase tracking-[0.3em] font-bold block mt-0.5">Admin</span>
            </div>
          </div>
          {/* Admin badge */}
          <div className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <Shield size={9} className="text-[#10B981]" />
            <span className="text-[8px] font-black text-[#10B981] tracking-widest uppercase">Root</span>
          </div>
        </div>

        {/* System stats strip */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#10B981]/[0.06] bg-gray-50/60 dark:bg-[#10B981]/[0.02]">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Experts', value: String(stats.experts), icon: UserCog },
              { label: 'Alunos',  value: String(stats.students), icon: Users },
              { label: 'Ativos',  value: String(stats.activeStudents), icon: Activity },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xs font-black text-black dark:text-white">{s.value}</p>
                <p className="text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3 px-2">Gerenciamento</p>
          {navItems.map(item => {
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
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight size={11} className="text-[#10B981]/40 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 dark:border-[#10B981]/[0.08]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-2 bg-gray-50 dark:bg-[#10B981]/[0.05] border border-gray-200 dark:border-[#10B981]/[0.10]">
            <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-black text-[#10B981]">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-black dark:text-white truncate">{displayName}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-mono truncate">{profile?.email ?? ''}</p>
            </div>
            <Database size={11} className="text-[#10B981]/40 shrink-0" />
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
        <header className="h-14 flex items-center px-6 justify-between shrink-0 backdrop-blur-sm bg-white/90 dark:bg-[#060606]/90 border-b border-gray-200 dark:border-[#10B981]/[0.10]">
          <div>
            <h1 className="text-sm font-bold text-black dark:text-white tracking-tight">{currentPage}</h1>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all relative">
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            </button>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981]/[0.08] border border-[#10B981]/20">
              <Shield size={11} className="text-[#10B981]" />
              <span className="text-[10px] font-bold text-[#10B981] tracking-wider uppercase">Super Admin</span>
            </div>
            <ModeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
