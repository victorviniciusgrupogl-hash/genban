import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Activity, Search,
  ChevronDown, CheckCircle2, XCircle, Minus, Plus, X,
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useExpertProfile, useExpertStudents } from '@/hooks/useExpertData';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface TxRow {
  id: string;
  type: string;
  asset: string | null;
  entry_value: number | null;
  result_value: number;
  description: string | null;
  operated_at: string | null;
  created_at: string;
  student_name: string;
}

export default function ExpertOperations() {
  const { expert, loading: expertLoading } = useExpertProfile();
  const { students } = useExpertStudents();

  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState<string>('all');

  // Calendar state
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [view, setView]                 = useState<'list' | 'calendar'>('list');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({
    student_id:   '',
    type:         'win' as 'win' | 'loss',
    asset:        '',
    entry_value:  '',
    result_value: '',
    date:         new Date().toISOString().split('T')[0],
    description:  '',
  });

  const fetchTransactions = useCallback(async () => {
    if (!expert) return;
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select(`
        id, type, asset, entry_value, result_value, description, operated_at, created_at,
        students!inner(id, expert_id, profiles(name))
      `)
      .eq('students.expert_id', expert.id)
      .order('operated_at', { ascending: false })
      .order('created_at', { ascending: false });

    const rows: TxRow[] = (data ?? []).map((t: any) => ({
      id:           t.id,
      type:         t.type,
      asset:        t.asset,
      entry_value:  t.entry_value,
      result_value: t.result_value,
      description:  t.description,
      operated_at:  t.operated_at,
      created_at:   t.created_at,
      student_name: (t.students as any)?.profiles?.name ?? 'Aluno',
    }));
    setTransactions(rows);
    setLoading(false);
  }, [expert]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleSubmitOp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) return;
    setSaving(true);

    const entryVal  = parseFloat(form.entry_value)  || 0;
    const resultVal = parseFloat(form.result_value) || 0;

    const { error } = await supabase.from('transactions').insert({
      student_id:   form.student_id,
      type:         form.type,
      asset:        form.asset || null,
      entry_value:  entryVal,
      result_value: resultVal,
      description:  form.description || null,
      operated_at:  form.date,
    });

    if (!error) {
      // Update student balance
      const stu = students.find(s => s.id === form.student_id);
      if (stu) {
        const delta = form.type === 'win' ? resultVal : -entryVal;
        await supabase.from('students')
          .update({ current_balance: (stu.current_balance ?? 0) + delta })
          .eq('id', stu.id);
      }
      setShowModal(false);
      setForm({ student_id: '', type: 'win', asset: '', entry_value: '', result_value: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchTransactions();
    }
    setSaving(false);
  };

  const filtered = transactions.filter(t => {
    const matchType   = filterType === 'all' || t.type === filterType;
    const matchSearch = !search ||
      (t.asset ?? '').toLowerCase().includes(search.toLowerCase()) ||
      t.student_name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Stats
  const wins    = transactions.filter(t => t.type === 'win');
  const losses  = transactions.filter(t => t.type === 'loss');
  const totalPnL = wins.reduce((a, t) => a + t.result_value, 0)
                 - losses.reduce((a, t) => a + (t.entry_value ?? 0), 0);
  const winRate = wins.length + losses.length > 0
    ? Math.round((wins.length / (wins.length + losses.length)) * 100)
    : 0;

  // Calendar helpers
  const operations = transactions
    .filter(t => t.type === 'win' || t.type === 'loss')
    .map(t => ({
      id:     t.id,
      date:   new Date(t.operated_at ?? t.created_at),
      asset:  t.asset ?? '—',
      result: t.type === 'win' ? 'WIN' : 'LOSS',
      profit: t.type === 'win' ? t.result_value : -(t.entry_value ?? 0),
      student: t.student_name,
    }));

  const getDayStats = (date: Date) => {
    const ops = operations.filter(op => isSameDay(op.date, date));
    if (!ops.length) return null;
    const profit = ops.reduce((a, o) => a + o.profit, 0);
    const wins_  = ops.filter(o => o.result === 'WIN').length;
    const losses_ = ops.filter(o => o.result === 'LOSS').length;
    return { profit, wins: wins_, losses: losses_, ops };
  };

  const monthStart  = startOfMonth(currentDate);
  const monthEnd    = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad    = monthStart.getDay();
  const paddingDays = Array.from({ length: startPad }).map((_, i) => {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - (startPad - i));
    return d;
  });
  const allDays = [...paddingDays, ...daysInMonth];
  const selectedDayOps = selectedDay ? (getDayStats(selectedDay)?.ops ?? []) : [];

  if (expertLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-black dark:text-white">Operações dos Alunos</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Acompanhe todas as operações realizadas pelos seus alunos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#10B981]/20 hover:from-[#059669] hover:to-[#047857] transition-all active:scale-95"
          >
            <Plus size={13} /> Nova Operação
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              view === 'list'
                ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20'
                : 'bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]'
            )}
          >
            Lista
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all',
              view === 'calendar'
                ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/20'
                : 'bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]'
            )}
          >
            Calendário
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Ops',   value: String(transactions.length),         icon: Activity,      color: 'text-blue-500' },
          { label: 'Win Rate',    value: `${winRate}%`,                        icon: TrendingUp,    color: 'text-[#10B981]' },
          { label: 'Vitórias',    value: String(wins.length),                  icon: CheckCircle2,  color: 'text-[#10B981]' },
          { label: 'Resultado',   value: `R$ ${totalPnL.toFixed(2)}`,          icon: totalPnL >= 0 ? TrendingUp : TrendingDown, color: totalPnL >= 0 ? 'text-[#10B981]' : 'text-red-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{s.label}</p>
              <s.icon size={14} className={s.color} />
            </div>
            <p className={cn('text-xl font-black font-mono', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {view === 'list' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ativo ou aluno..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-black dark:text-white focus:outline-none focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20"
              >
                <option value="all">Todos os tipos</option>
                <option value="win">Vitória</option>
                <option value="loss">Derrota</option>
                <option value="deposit">Depósito</option>
                <option value="withdrawal">Saque</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Nenhuma operação encontrada</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
                  {transactions.length === 0 ? 'Os alunos ainda não registraram operações.' : 'Tente ajustar os filtros.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                      {['Aluno', 'Ativo', 'Tipo', 'Entrada', 'Resultado', 'Data'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t, i) => {
                      const isWin   = t.type === 'win';
                      const isLoss  = t.type === 'loss';
                      const pnl     = isWin ? t.result_value : isLoss ? -(t.entry_value ?? 0) : null;
                      return (
                        <tr
                          key={t.id}
                          className={cn(
                            'border-b border-gray-50 dark:border-white/[0.03] transition-colors',
                            i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-white/[0.01]',
                            'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                          )}
                        >
                          <td className="px-5 py-3 font-medium text-black dark:text-white">{t.student_name}</td>
                          <td className="px-5 py-3 font-mono text-gray-700 dark:text-gray-300">{t.asset ?? '—'}</td>
                          <td className="px-5 py-3">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                              isWin   ? 'bg-[#10B981]/10 text-[#10B981]' :
                              isLoss  ? 'bg-red-500/10 text-red-500' :
                                        'bg-blue-500/10 text-blue-500'
                            )}>
                              {isWin ? <CheckCircle2 size={10} /> : isLoss ? <XCircle size={10} /> : <Minus size={10} />}
                              {t.type === 'win' ? 'Win' : t.type === 'loss' ? 'Loss' : t.type === 'deposit' ? 'Depósito' : 'Saque'}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-gray-500 dark:text-gray-400">
                            {t.entry_value != null ? `R$ ${t.entry_value.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-5 py-3 font-mono font-bold">
                            {pnl !== null ? (
                              <span className={pnl >= 0 ? 'text-[#10B981]' : 'text-red-500'}>
                                {pnl >= 0 ? '+' : ''}R$ {pnl.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs">
                            {t.operated_at
                              ? format(new Date(t.operated_at), 'dd/MM/yyyy')
                              : format(new Date(t.created_at), 'dd/MM/yyyy HH:mm')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Calendar View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] flex items-center justify-center text-gray-600 dark:text-gray-300 transition-all"
              >
                <ChevronDown size={14} className="rotate-90" />
              </button>
              <span className="text-sm font-black text-black dark:text-white capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </span>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] flex items-center justify-center text-gray-600 dark:text-gray-300 transition-all"
              >
                <ChevronDown size={14} className="-rotate-90" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-wider py-1">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {allDays.map((day, idx) => {
                const inMonth = isSameMonth(day, currentDate);
                const stats   = getDayStats(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const isCurrentDay = isToday(day);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      'relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-xs font-bold',
                      !inMonth && 'opacity-20',
                      isSelected && 'ring-2 ring-[#10B981]',
                      isCurrentDay && !isSelected && 'ring-1 ring-[#10B981]/40',
                      stats
                        ? stats.profit >= 0
                          ? 'bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
                          : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                    )}
                  >
                    <span>{format(day, 'd')}</span>
                    {stats && (
                      <span className={cn('text-[8px] font-black', stats.profit >= 0 ? 'text-[#10B981]' : 'text-red-500')}>
                        {stats.profit >= 0 ? '+' : ''}R${Math.abs(stats.profit).toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day Detail */}
          <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5">
            {selectedDay ? (
              <>
                <h3 className="text-sm font-black text-black dark:text-white mb-1 capitalize">
                  {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h3>
                {selectedDayOps.length === 0 ? (
                  <p className="text-xs text-gray-400 mt-4 text-center">Nenhuma operação neste dia.</p>
                ) : (
                  <div className="space-y-3 mt-3">
                    {selectedDayOps.map(op => (
                      <div
                        key={op.id}
                        className={cn(
                          'rounded-xl p-3 border',
                          op.result === 'WIN'
                            ? 'bg-[#10B981]/5 border-[#10B981]/20'
                            : 'bg-red-500/5 border-red-500/20'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-black dark:text-white font-mono">{op.asset}</span>
                          <span className={cn('text-[10px] font-black px-1.5 py-0.5 rounded-full', op.result === 'WIN' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-red-500/15 text-red-500')}>{op.result}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{op.student}</p>
                        <p className={cn('text-sm font-black font-mono mt-1', op.profit >= 0 ? 'text-[#10B981]' : 'text-red-500')}>
                          {op.profit >= 0 ? '+' : ''}R$ {op.profit.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Activity size={28} className="text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Selecione um dia</p>
                <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                  Clique em um dia com operações para ver os detalhes
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nova Operação Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/[0.09] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <div>
                <h2 className="text-sm font-bold text-white">Nova Operação</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Registre win ou loss para um aluno</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmitOp} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Aluno</label>
                <select
                  required
                  value={form.student_id}
                  onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                  className="w-full bg-[#111] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/60 outline-none text-sm"
                >
                  <option value="">Selecione o aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {(s as any).profiles?.name ?? s.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Resultado</label>
                  <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
                    {(['win', 'loss'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={cn(
                          'flex-1 py-2.5 text-xs font-bold transition-all',
                          form.type === t
                            ? t === 'win' ? 'bg-[#10B981] text-white' : 'bg-red-500 text-white'
                            : 'bg-[#111] text-gray-500 hover:text-white'
                        )}
                      >
                        {t === 'win' ? 'WIN' : 'LOSS'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Ativo</label>
                  <input
                    type="text"
                    placeholder="Ex: EURUSD, WIN..."
                    value={form.asset}
                    onChange={e => setForm(f => ({ ...f, asset: e.target.value }))}
                    className="w-full bg-[#111] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/60 outline-none text-sm placeholder:text-gray-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Valor Entrada (R$)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.entry_value}
                    onChange={e => setForm(f => ({ ...f, entry_value: e.target.value }))}
                    className="w-full bg-[#111] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/60 outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    {form.type === 'win' ? 'Lucro (R$)' : 'Prejuízo (R$)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.result_value}
                    onChange={e => setForm(f => ({ ...f, result_value: e.target.value }))}
                    className={cn(
                      'w-full bg-[#111] border px-4 py-2.5 rounded-xl focus:ring-2 outline-none text-sm font-mono',
                      form.type === 'win'
                        ? 'border-[#10B981]/30 text-[#10B981] focus:ring-[#10B981]/30 focus:border-[#10B981]/60'
                        : 'border-red-500/30 text-red-400 focus:ring-red-500/20 focus:border-red-400'
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Data</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-[#111] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/60 outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-gray-300 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg disabled:opacity-60 transition-all',
                    form.type === 'win'
                      ? 'bg-gradient-to-r from-[#10B981] to-[#059669] shadow-[#10B981]/20'
                      : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/20'
                  )}
                >
                  {saving ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <><CheckCircle2 size={14} /> Registrar</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
