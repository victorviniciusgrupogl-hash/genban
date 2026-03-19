import { useState } from 'react';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Activity,
  DollarSign, Target, X, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useStudentProfile, useTransactions } from '@/hooks/useStudentData';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function StudentCalendar() {
  const { student, loading: studentLoading } = useStudentProfile();
  const { transactions, loading: txLoading } = useTransactions(student?.id);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const loading = studentLoading || txLoading;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  // Map transactions to calendar-compatible ops (win/loss only)
  const operations = transactions
    .filter(t => t.type === 'win' || t.type === 'loss')
    .map(t => ({
      id: t.id,
      date: new Date(t.operated_at ?? t.created_at),
      asset: t.asset ?? '—',
      amount: t.entry_value ?? 0,
      result: t.type === 'win' ? 'WIN' : 'LOSS',
      profit: t.type === 'win' ? (t.result_value ?? 0) : -(t.entry_value ?? 0),
    }));

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart   = startOfMonth(currentDate);
  const monthEnd     = endOfMonth(currentDate);
  const daysInMonth  = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad     = monthStart.getDay();
  const paddingDays  = Array.from({ length: startPad }).map((_, i) => {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - (startPad - i));
    return d;
  });
  const allDays = [...paddingDays, ...daysInMonth];

  const getDayStats = (date: Date) => {
    const ops = operations.filter(op => isSameDay(op.date, date));
    if (!ops.length) return null;
    const profit   = ops.reduce((a, o) => a + o.profit, 0);
    const wins     = ops.filter(o => o.result === 'WIN').length;
    const losses   = ops.length - wins;
    const winRate  = Math.round((wins / ops.length) * 100);
    return { profit, wins, losses, total: ops.length, winRate, ops };
  };

  const monthlyOps    = operations.filter(op => isSameMonth(op.date, currentDate));
  const monthlyProfit = monthlyOps.reduce((a, o) => a + o.profit, 0);
  const monthlyWins   = monthlyOps.filter(o => o.result === 'WIN').length;
  const monthlyWinRate = monthlyOps.length > 0 ? Math.round((monthlyWins / monthlyOps.length) * 100) : 0;

  const selectedStats = selectedDay ? getDayStats(selectedDay) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Histórico de operações por dia</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 h-9 text-xs font-bold rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 dark:text-gray-400 transition-all"
          >
            Hoje
          </button>
          <button
            onClick={nextMonth}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Resultado do Mês',
            value: `${monthlyProfit >= 0 ? '+' : ''}R$ ${monthlyProfit.toFixed(2)}`,
            icon: DollarSign,
            color: monthlyProfit >= 0 ? 'text-emerald-500' : 'text-red-500',
            bg: monthlyProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10',
            valueColor: monthlyProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Win Rate Mensal',
            value: `${monthlyWinRate}%`,
            icon: Target,
            color: 'text-[#10B981]',
            bg: 'bg-[#10B981]/10',
            valueColor: 'text-black dark:text-white',
          },
          {
            label: 'Total de Operações',
            value: String(monthlyOps.length),
            icon: Activity,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            valueColor: 'text-black dark:text-white',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 flex items-center gap-4"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', card.bg)}>
              <card.icon size={18} className={card.color} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
              <p className={cn('text-xl font-bold font-mono tabular-nums mt-0.5', card.valueColor)}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/[0.07]">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 auto-rows-[110px]">
          {allDays.map((date, i) => {
            const inMonth  = isSameMonth(date, currentDate);
            const todayDay = isToday(date);
            const stats    = getDayStats(date);
            const isSelected = selectedDay && isSameDay(date, selectedDay);

            return (
              <div
                key={i}
                onClick={() => stats && inMonth && setSelectedDay(date)}
                className={cn(
                  'border-b border-r border-gray-50 dark:border-white/[0.04] p-2.5 flex flex-col transition-all',
                  !inMonth && 'opacity-30',
                  stats && inMonth ? 'cursor-pointer hover:bg-gray-50/70 dark:hover:bg-white/[0.03]' : '',
                  todayDay && 'bg-[#10B981]/[0.06]',
                  isSelected && 'bg-[#10B981]/10',
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold font-mono',
                    todayDay
                      ? 'bg-[#10B981] text-black'
                      : inMonth
                        ? 'text-black dark:text-white'
                        : 'text-gray-400'
                  )}>
                    {format(date, 'd')}
                  </span>
                  {stats && (
                    <span className="text-[9px] font-bold text-gray-400 font-mono">{stats.total}op</span>
                  )}
                </div>

                {/* Stats */}
                {stats && inMonth && (
                  <div className="flex-1 flex flex-col justify-end gap-1">
                    <span className={cn(
                      'text-xs font-bold font-mono flex items-center gap-0.5',
                      stats.profit >= 0 ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {stats.profit >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {stats.profit >= 0 ? '+' : ''}R${Math.abs(stats.profit).toFixed(0)}
                    </span>
                    <div className="w-full h-1 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${stats.winRate}%` }} />
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${100 - stats.winRate}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold font-mono">
                      <span className="text-emerald-500">{stats.wins}W</span>
                      <span className="text-red-500">{stats.losses}L</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && selectedStats && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-lg border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">
                  {format(selectedDay, 'EEEE', { locale: ptBR })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Daily Summary */}
            <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-gray-100 dark:border-white/[0.07]">
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resultado</p>
                <p className={cn(
                  'text-lg font-bold font-mono mt-1',
                  selectedStats.profit >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}>
                  {selectedStats.profit >= 0 ? '+' : ''}R$ {selectedStats.profit.toFixed(2)}
                </p>
              </div>
              <div className="text-center border-x border-gray-100 dark:border-white/[0.07]">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Win Rate</p>
                <p className="text-lg font-bold font-mono text-black dark:text-white mt-1">
                  {selectedStats.winRate}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operações</p>
                <p className="text-lg font-bold font-mono text-black dark:text-white mt-1">
                  {selectedStats.total}
                </p>
              </div>
            </div>

            {/* Operations list */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Histórico de Entradas
                </p>
                <div className="space-y-2">
                  {selectedStats.ops.map((op) => (
                    <div
                      key={op.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3.5 border border-gray-100 dark:border-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-xl flex items-center justify-center',
                          op.result === 'WIN'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10'
                            : 'bg-red-50 dark:bg-red-500/10'
                        )}>
                          {op.result === 'WIN'
                            ? <CheckCircle2 size={15} className="text-emerald-500" />
                            : <XCircle size={15} className="text-red-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-black dark:text-white font-mono">{op.asset}</p>
                          <p className="text-xs text-gray-400 font-mono">Entrada: R$ {op.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className={cn(
                        'text-sm font-bold font-mono tabular-nums',
                        op.profit >= 0 ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {op.profit >= 0 ? '+' : ''}R$ {op.profit.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
