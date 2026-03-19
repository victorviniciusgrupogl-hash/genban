import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Plus, TrendingUp, TrendingDown, Target, AlertTriangle, X,
  CheckCircle2, XCircle, Activity, Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { DateRangePicker } from '@/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { subDays, format, isSameDay } from 'date-fns';
import { useStudentProfile } from '@/hooks/useStudentData';
import { useTransactions } from '@/hooks/useStudentData';
import { useStudentCampaigns } from '@/hooks/useStudentData';

const PERIODS = ['7D', '30D', '3M', 'Tudo'] as const;
type Period = typeof PERIODS[number];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-xl shadow-black/10">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-base font-bold text-black dark:text-white font-mono">
          R$ {Number(payload[0].value).toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
}

export default function StudentDashboard() {
  const { student, loading: studentLoading } = useStudentProfile();
  const { transactions, loading: txLoading, addTransaction } = useTransactions(student?.id);
  const { campaigns } = useStudentCampaigns(student?.expert_id ?? undefined);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showFeaturedPopup, setShowFeaturedPopup] = useState(false);
  const [activePeriod, setActivePeriod] = useState<Period>('7D');
  const [opResult, setOpResult] = useState<'win' | 'loss' | null>(null);
  const [opAsset, setOpAsset] = useState('');
  const [opEntry, setOpEntry] = useState('');
  const [opValue, setOpValue] = useState('');
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();

  const shownPopup = useRef(false);

  useEffect(() => {
    if (!shownPopup.current) {
      shownPopup.current = true;
      setShowFeaturedPopup(true);
    }
  }, []);

  const closePopup = () => setShowFeaturedPopup(false);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#ffffff08' : '#00000008';
  const tickColor = isDark ? '#71717a' : '#9ca3af';

  const loading = studentLoading || txLoading;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  const currentBalance  = student?.current_balance ?? 0;
  const initialBalance  = student?.initial_balance ?? 0;
  const totalProfit     = currentBalance - initialBalance;
  const profitPct       = initialBalance > 0 ? ((totalProfit / initialBalance) * 100).toFixed(1) : '0.0';
  const dailyGoal       = student?.daily_goal ?? 0;
  const dailyLossLimit  = student?.daily_loss_limit ?? 0;

  // Compute wins/losses from transactions
  const tradeOps  = transactions.filter(t => t.type === 'win' || t.type === 'loss');
  const wins      = tradeOps.filter(t => t.type === 'win').length;
  const losses    = tradeOps.filter(t => t.type === 'loss').length;
  const totalOps  = wins + losses;
  const winRate   = totalOps > 0 ? ((wins / totalOps) * 100).toFixed(1) : '0.0';

  // Today's profit/loss
  const today        = new Date();
  const todayTxs     = tradeOps.filter(t => {
    const d = t.operated_at ? new Date(t.operated_at) : new Date(t.created_at);
    return isSameDay(d, today);
  });
  const todayProfit  = todayTxs.filter(t => t.type === 'win').reduce((a, t) => a + t.result_value, 0);
  const todayLoss    = todayTxs.filter(t => t.type === 'loss').reduce((a, t) => a + t.result_value, 0);
  const goalPct      = dailyGoal > 0 ? Math.min((todayProfit / dailyGoal) * 100, 100) : 0;
  const lossPct      = dailyLossLimit > 0 ? Math.min((todayLoss / dailyLossLimit) * 100, 100) : 0;

  // Build chart data from transactions grouped by date
  const buildChartData = () => {
    if (transactions.length === 0) return [];
    const sorted = [...transactions].sort((a, b) => {
      const da = a.operated_at ? new Date(a.operated_at) : new Date(a.created_at);
      const db = b.operated_at ? new Date(b.operated_at) : new Date(b.created_at);
      return da.getTime() - db.getTime();
    });

    let balance = initialBalance;
    const dayMap: Record<string, number> = {};

    sorted.forEach(t => {
      const d = t.operated_at ? new Date(t.operated_at) : new Date(t.created_at);
      const key = format(d, 'dd/MM');
      if (t.type === 'win' || t.type === 'deposit') balance += t.result_value;
      else if (t.type === 'loss' || t.type === 'withdrawal') balance -= t.result_value;
      dayMap[key] = balance;
    });

    return Object.entries(dayMap).slice(-30).map(([date, balance]) => ({ date, balance }));
  };

  const chartData = buildChartData();

  // Recent operations (last 5 trades)
  const recentOps = tradeOps.slice(0, 5);

  const handleSaveOp = async () => {
    if (!student || !opResult || !opValue) return;
    setSaving(true);
    const val = parseFloat(opValue);
    await addTransaction({
      student_id: student.id,
      type: opResult,
      asset: opAsset || null,
      entry_value: opEntry ? parseFloat(opEntry) : null,
      result_value: val,
      description: null,
      operated_at: new Date().toISOString(),
    });
    setSaving(false);
    setShowLaunchModal(false);
    setOpResult(null); setOpAsset(''); setOpEntry(''); setOpValue('');
  };

  const featuredCampaign = campaigns.find(c => c.is_featured && !c.is_participant && c.status === 'active');

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">
            Visão Geral
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Acompanhe seu desempenho e metas diárias.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <button
            onClick={() => setShowLaunchModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm shadow-[#10B981]/30 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Lançar Operação
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Banca Atual */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 relative overflow-hidden group hover:border-[#10B981]/30 transition-all duration-300">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#10B981]/5 rounded-full" />
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-[#10B981]" size={18} />
            </div>
            <span className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-lg font-mono',
              totalProfit >= 0
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
            )}>
              {totalProfit >= 0 ? '+' : ''}{profitPct}%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Banca Atual</p>
          <p className="text-2xl font-bold text-black dark:text-white font-mono tabular-nums">
            R$ {currentBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 font-mono">
            {totalProfit >= 0 ? '+' : ''}R$ {totalProfit.toFixed(2)} desde o início
          </p>
        </div>

        {/* Win Rate */}
        <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 relative overflow-hidden hover:border-[#10B981]/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Activity size={18} className="text-emerald-500" />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg">
              {totalOps} ops
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-black dark:text-white font-mono tabular-nums">{winRate}%</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-bold text-emerald-500 font-mono">{wins}W</span>
            <span className="text-gray-300 dark:text-white/20">·</span>
            <span className="text-xs font-bold text-red-500 font-mono">{losses}L</span>
          </div>
        </div>

        {/* Meta Diária */}
        <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 hover:border-[#10B981]/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
              <Target size={18} className="text-[#10B981]" />
            </div>
            <span className="text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-lg font-mono">
              {goalPct.toFixed(0)}%
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Meta Diária</p>
          <p className="text-2xl font-bold text-black dark:text-white font-mono tabular-nums">
            R$ {todayProfit.toFixed(2)}
          </p>
          <div className="mt-2">
            <div className="w-full bg-gray-100 dark:bg-white/[0.06] h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#10B981] h-1 rounded-full transition-all duration-700"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">meta: R$ {dailyGoal.toFixed(2)}</p>
          </div>
        </div>

        {/* Limite de Loss */}
        <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 hover:border-red-200 dark:hover:border-red-500/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono',
              lossPct >= 80
                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                : 'text-gray-400 bg-gray-100 dark:bg-white/[0.06]'
            )}>
              {lossPct >= 80 ? 'Atenção' : 'Seguro'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Limite Loss</p>
          <p className="text-2xl font-bold text-black dark:text-white font-mono tabular-nums">
            R$ {todayLoss.toFixed(2)}
          </p>
          <div className="mt-2">
            <div className="w-full bg-gray-100 dark:bg-white/[0.06] h-1 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-1 rounded-full transition-all duration-700"
                style={{ width: `${lossPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">limite: R$ {dailyLossLimit.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">Evolução da Banca</h3>
            <p className="text-xs text-gray-400 mt-0.5">Saldo acumulado no período</p>
          </div>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] p-1 rounded-xl">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                  activePeriod === p
                    ? 'bg-[#10B981] text-black shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[260px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 10, fontFamily: 'monospace' }}
                  domain={['dataMin - 50', 'dataMax + 50']}
                  tickFormatter={(v) => `R$${v}`}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#balanceGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#10B981', stroke: isDark ? '#0d0d0d' : '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-400">Nenhuma operação registrada ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Operations */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">Operações Recentes</h3>
            <p className="text-xs text-gray-400 mt-0.5">Últimas operações registradas</p>
          </div>
          <Link
            to="/student/calendar"
            className="text-xs font-semibold text-[#10B981] hover:text-[#047857] transition-colors"
          >
            Ver histórico →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ativo</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entrada</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resultado</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">P&L</th>
                <th className="text-right px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody>
              {recentOps.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                    Nenhuma operação registrada ainda.
                  </td>
                </tr>
              )}
              {recentOps.map((op) => (
                <tr
                  key={op.id}
                  className="border-b border-gray-50 dark:border-white/[0.03] last:border-0 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center">
                        <Zap size={13} className="text-gray-500 dark:text-gray-400" />
                      </div>
                      <span className="text-sm font-bold text-black dark:text-white font-mono">{op.asset ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-gray-600 dark:text-gray-300">
                    {op.entry_value != null ? `R$ ${op.entry_value.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    {op.type === 'win' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                        <CheckCircle2 size={11} /> WIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-lg border border-red-100 dark:border-red-500/20">
                        <XCircle size={11} /> LOSS
                      </span>
                    )}
                  </td>
                  <td className={cn(
                    'px-6 py-3.5 text-right text-sm font-bold font-mono tabular-nums',
                    op.type === 'win' ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {op.type === 'win' ? '+' : '-'}R$ {op.result_value.toFixed(2)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-xs font-mono text-gray-400">
                    {new Date(op.operated_at ?? op.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Launch Operation Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Lançar Operação</h3>
                <p className="text-xs text-gray-400 mt-0.5">Registre o resultado da sua entrada</p>
              </div>
              <button
                onClick={() => setShowLaunchModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Ativo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Ativo
                </label>
                <input
                  type="text"
                  placeholder="Ex: EUR/USD OTC"
                  value={opAsset}
                  onChange={e => setOpAsset(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans placeholder:not-italic transition-all"
                />
              </div>

              {/* Resultado - Toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Resultado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOpResult('win')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all',
                      opResult === 'win'
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400'
                    )}
                  >
                    <CheckCircle2 size={16} /> WIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpResult('loss')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all',
                      opResult === 'loss'
                        ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                        : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:border-red-400'
                    )}
                  >
                    <XCircle size={16} /> LOSS
                  </button>
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Valor de Entrada
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">R$</span>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={opEntry}
                      onChange={e => setOpEntry(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white pl-9 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none font-mono text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Lucro / Prejuízo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">R$</span>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={opValue}
                      onChange={e => setOpValue(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white pl-9 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none font-mono text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/[0.03] px-3 py-2 rounded-lg">
                Insira o valor exato do lucro (WIN) ou prejuízo (LOSS). O saldo será atualizado automaticamente.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-2 bg-gray-50/50 dark:bg-white/[0.02]">
              <button
                onClick={() => setShowLaunchModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOp}
                disabled={saving || !opResult || !opValue}
                className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-black rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-[#10B981]/20"
              >
                {saving ? 'Salvando...' : 'Salvar Operação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured Campaign Popup */}
      {showFeaturedPopup && featuredCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl overflow-hidden max-w-md w-full shadow-2xl shadow-black/30 border border-gray-200 dark:border-white/10 relative">
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={14} />
            </button>
            <div className="relative h-44 overflow-hidden">
              {featuredCampaign.banner_url ? (
                <img src={featuredCampaign.banner_url} alt={featuredCampaign.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#10B981]/30 to-emerald-900/60" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="bg-[#10B981] text-black text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest mb-2 inline-block">
                  Campanha em Destaque
                </span>
                <h2 className="text-xl font-black text-white leading-tight">{featuredCampaign.title}</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed line-clamp-2">
                {featuredCampaign.description ?? ''}
              </p>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 text-center bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Prêmio</p>
                  <p className="text-sm font-black text-[#10B981]">{featuredCampaign.prize ?? '—'}</p>
                </div>
                <div className="flex-1 text-center bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Participantes</p>
                  <p className="text-sm font-black text-black dark:text-white">{featuredCampaign.participant_count ?? 0}</p>
                </div>
                <div className="flex-1 text-center bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Encerra</p>
                  <p className="text-sm font-black text-black dark:text-white">
                    {featuredCampaign.end_date ? new Date(featuredCampaign.end_date).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
              </div>
              <Link
                to="/student/campaigns"
                onClick={closePopup}
                className="w-full block text-center bg-[#10B981] hover:bg-[#059669] text-black font-black py-3 rounded-xl transition-all active:scale-95 shadow-sm shadow-[#10B981]/20 text-sm"
              >
                Participar Agora
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
