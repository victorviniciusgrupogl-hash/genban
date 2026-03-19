import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import {
  Users, TrendingUp, TrendingDown, Activity, ChevronRight,
  ArrowUpRight, ArrowDownRight, Star,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Link } from 'react-router-dom';
import { DateRangePicker } from '@/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useExpertStats } from '@/hooks/useExpertData';

function WinRateTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl shadow-black/10">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-base font-bold text-black dark:text-white font-mono">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
}

function BarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl shadow-black/10">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-xs font-bold font-mono" style={{ color: p.fill }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function ExpertDashboard() {
  const { theme } = useTheme();
  const { stats, topStudents, loading } = useExpertStats();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#ffffff08' : '#00000008';
  const tickColor = isDark ? '#71717a' : '#9ca3af';

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  const statCards = [
    {
      label: 'Alunos Ativos',
      value: stats.activeStudents.toLocaleString('pt-BR'),
      change: `${stats.totalStudents} total`,
      positive: true,
      sub: 'este mês',
      icon: Users,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Win Rate Médio',
      value: `${stats.avgWinRate}%`,
      change: '+0%',
      positive: true,
      sub: 'esta semana',
      icon: Activity,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Volume Total',
      value: `R$ ${stats.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: '0%',
      positive: true,
      sub: 'saldo acumulado',
      icon: TrendingUp,
      color: 'text-[#10B981]',
      bg: 'bg-[#10B981]/10',
    },
    {
      label: 'Total Alunos',
      value: stats.totalStudents.toLocaleString('pt-BR'),
      change: '0',
      positive: true,
      sub: 'cadastrados',
      icon: TrendingDown,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
  ];

  // Build simple performance chart data from topStudents win rates
  const performanceData = topStudents.length > 0
    ? topStudents.map((s, i) => ({ date: `Aluno ${i + 1}`, winRate: s.winRate }))
    : [{ date: 'Sem dados', winRate: 0 }];

  // Build assets data from topStudents
  const assetsData = topStudents.slice(0, 4).map(s => ({
    name: ((s as any).displayName as string).split(' ')[0],
    wins: Math.round((s.winRate / 100) * 10),
    losses: Math.round(((100 - s.winRate) / 100) * 10),
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">
            Dashboard de Alunos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Visão geral do desempenho da sua base de alunos.
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
                'text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono',
                s.positive
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
              )}>
                {s.change}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-bold text-black dark:text-white font-mono tabular-nums">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Win Rate Chart */}
        <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-6">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-black dark:text-white">Evolução do Win Rate</h3>
            <p className="text-xs text-gray-400 mt-0.5">Média geral de todos os alunos</p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="winRateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<WinRateTooltip />} />
                <Area type="monotone" dataKey="winRate" stroke="#10B981" strokeWidth={2} fill="url(#winRateGrad)" dot={false} activeDot={{ r: 4, fill: '#10B981', stroke: isDark ? '#0d0d0d' : '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assets Performance */}
        <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-6">
          <div className="mb-5">
            <h3 className="text-sm font-bold text-black dark:text-white">Desempenho por Aluno</h3>
            <p className="text-xs text-gray-400 mt-0.5">Wins vs Losses dos top alunos</p>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={assetsData.length > 0 ? assetsData : [{ name: 'Sem dados', wins: 0, losses: 0 }]} margin={{ top: 5, right: 5, left: -15, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip content={<BarTooltip />} cursor={{ fill: isDark ? '#ffffff04' : '#00000004' }} />
                <Bar dataKey="wins" name="Wins" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="losses" name="Losses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Students */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={15} className="text-[#10B981]" />
            <div>
              <h3 className="text-sm font-bold text-black dark:text-white">Top Alunos</h3>
              <p className="text-xs text-gray-400">Melhor desempenho no período</p>
            </div>
          </div>
          <Link
            to="/expert/students"
            className="flex items-center gap-1 text-xs font-semibold text-[#10B981] hover:text-[#047857] transition-colors"
          >
            Ver todos <ChevronRight size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/[0.05]">
                {['Aluno', 'ID', 'Win Rate', 'Banca Atual', 'Variação', ''].map((h) => (
                  <th key={h} className={cn(
                    'px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider',
                    h === '' ? 'text-right' : 'text-left'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topStudents.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white',
                        i === 0 ? 'bg-[#10B981]' : i === 1 ? 'bg-gray-400 dark:bg-gray-600' : 'bg-gray-200 dark:bg-white/10 !text-gray-500 dark:!text-gray-400'
                      )}>
                        {i < 2 ? (i + 1) : ((s as any).displayName as string).charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-black dark:text-white">{(s as any).displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg">{(s.id as string).slice(0,8)}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#10B981] h-1.5 rounded-full" style={{ width: `${s.winRate}%` }} />
                      </div>
                      <span className="text-xs font-bold font-mono text-black dark:text-white">{s.winRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-bold font-mono text-black dark:text-white tabular-nums">
                    R$ {(s.current_balance as number ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-lg',
                      (s.pct as number) >= 0
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                    )}>
                      {(s.pct as number) >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {(s.pct as number) >= 0 ? '+' : ''}{(s.pct as number).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      to="/expert/students"
                      className="text-xs font-semibold text-gray-400 hover:text-[#10B981] transition-colors"
                    >
                      Gerenciar →
                    </Link>
                  </td>
                </tr>
              ))}
              {topStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                    Nenhum aluno cadastrado ainda.
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
