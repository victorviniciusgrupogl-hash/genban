import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, UserCog, Activity, TrendingUp, ArrowUpRight, ChevronRight,
  DollarSign, Crown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/theme-provider';
import { DateRangePicker } from '@/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAdminStats, useAdminExperts } from '@/hooks/useAdminData';

const systemData = [
  { date: '01/02', users: 1200, volume: 45000 },
  { date: '02/02', users: 1250, volume: 52000 },
  { date: '03/02', users: 1300, volume: 48000 },
  { date: '04/02', users: 1350, volume: 61000 },
  { date: '05/02', users: 1420, volume: 59000 },
  { date: '06/02', users: 1480, volume: 72000 },
  { date: '07/02', users: 1550, volume: 85000 },
];

function ChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl shadow-black/10">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-bold text-black dark:text-white font-mono">{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
}

export default function AdminDashboard() {
  const { theme } = useTheme();
  const { stats, loading: statsLoading } = useAdminStats();
  const { experts, loading: expertsLoading } = useAdminExperts();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [activeMetric, setActiveMetric] = useState<'users' | 'volume'>('users');

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#ffffff08' : '#00000008';
  const tickColor = isDark ? '#71717a' : '#9ca3af';

  const loading = statsLoading || expertsLoading;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  const statCards = [
    {
      label: 'Total de Experts',
      value: stats.experts.toString(),
      change: '+0',
      sub: 'cadastrados',
      icon: UserCog,
      color: 'text-[#10B981]',
      bg: 'bg-[#10B981]/10',
      positive: true,
    },
    {
      label: 'Total de Alunos',
      value: stats.students.toLocaleString('pt-BR'),
      change: '+0',
      sub: 'cadastrados',
      icon: Users,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      positive: true,
    },
    {
      label: 'Alunos Ativos',
      value: stats.activeStudents.toLocaleString('pt-BR'),
      change: '+0',
      sub: 'este mês',
      icon: Activity,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      positive: true,
    },
    {
      label: 'Volume Movimentado',
      value: `R$ ${stats.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: '+0%',
      sub: 'saldo total',
      icon: DollarSign,
      color: 'text-[#10B981]',
      bg: 'bg-[#10B981]/10',
      positive: true,
    },
  ];

  // Sort experts by student_count for top experts table
  const topExperts = [...experts]
    .sort((a, b) => (b.student_count ?? 0) - (a.student_count ?? 0))
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">
            Visão Geral do Sistema
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Métricas globais de todos os experts e alunos.
          </p>
        </div>
        <DateRangePicker date={dateRange} setDate={setDateRange} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 hover:border-gray-200 dark:hover:border-white/[0.12] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.bg)}>
                <s.icon size={18} className={s.color} />
              </div>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono flex items-center gap-0.5',
                'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              )}>
                <ArrowUpRight size={10} /> {s.change}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-bold text-black dark:text-white font-mono tabular-nums">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Growth Chart */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">Crescimento da Base de Usuários</h3>
            <p className="text-xs text-gray-400 mt-0.5">Evolução de usuários e volume no período</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] p-1 rounded-xl">
            <button
              onClick={() => setActiveMetric('users')}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                activeMetric === 'users'
                  ? 'bg-[#10B981] text-black shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              )}
            >
              Usuários
            </button>
            <button
              onClick={() => setActiveMetric('volume')}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                activeMetric === 'volume'
                  ? 'bg-[#10B981] text-black shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
              )}
            >
              Volume
            </button>
          </div>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={systemData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }} width={55} tickFormatter={(v) => activeMetric === 'volume' ? `R$${(v / 1000).toFixed(0)}K` : String(v)} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey={activeMetric} stroke="#10B981" strokeWidth={2} fill="url(#metricGrad)" dot={false} activeDot={{ r: 4, fill: '#10B981', stroke: isDark ? '#0d0d0d' : '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Experts */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={15} className="text-[#10B981]" />
            <div>
              <h3 className="text-sm font-bold text-black dark:text-white">Top Experts</h3>
              <p className="text-xs text-gray-400">Melhor performance da plataforma</p>
            </div>
          </div>
          <Link
            to="/admin/experts"
            className="flex items-center gap-1 text-xs font-semibold text-[#10B981] hover:text-[#047857] transition-colors"
          >
            Ver todos <ChevronRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/[0.05]">
                {['Expert', 'ID', 'Alunos', 'Status', 'Marca', ''].map((h) => (
                  <th key={h} className={cn(
                    'px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider',
                    h === '' ? 'text-right' : 'text-left'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topExperts.map((e, i) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black',
                        i === 0 ? 'bg-[#10B981] text-black' : i === 1 ? 'bg-gray-300 dark:bg-gray-600 text-black dark:text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      )}>
                        {i + 1}
                      </div>
                      <span className="text-sm font-semibold text-black dark:text-white">{e.profiles?.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg">{e.id.slice(0,8)}</span>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-black dark:text-white">{(e.student_count ?? 0).toLocaleString()}</td>
                  <td className="px-6 py-3.5">
                    <span className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-lg',
                      e.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500'
                    )}>
                      {e.status === 'active' ? 'Ativo' : e.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-black dark:text-white">
                    {e.brand_name || '—'}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      to="/admin/experts"
                      className="text-xs font-semibold text-gray-400 hover:text-[#10B981] transition-colors"
                    >
                      Gerenciar →
                    </Link>
                  </td>
                </tr>
              ))}
              {topExperts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                    Nenhum expert cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
