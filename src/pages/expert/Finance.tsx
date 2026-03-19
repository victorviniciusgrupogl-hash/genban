import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Plus, X,
  CheckCircle2, Search, ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useExpertProfile, useExpertStudents } from '@/hooks/useExpertData';

interface FinanceTx {
  id: string;
  type: 'deposit' | 'withdrawal';
  entry_value: number;
  description: string | null;
  operated_at: string | null;
  created_at: string;
  student_name: string;
  student_id: string;
}

export default function ExpertFinance() {
  const { expert, loading: expertLoading } = useExpertProfile();
  const { students, loading: studentsLoading } = useExpertStudents();

  const [transactions, setTransactions] = useState<FinanceTx[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [showModal, setShowModal]       = useState(false);
  const [saving, setSaving]             = useState(false);

  const [form, setForm] = useState({
    student_id:  '',
    type:        'deposit' as 'deposit' | 'withdrawal',
    amount:      '',
    date:        new Date().toISOString().split('T')[0],
    description: '',
  });

  const fetchTransactions = useCallback(async () => {
    if (!expert) return;
    setLoading(true);

    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) { setLoading(false); return; }

    const { data } = await supabase
      .from('transactions')
      .select(`
        id, type, entry_value, description, operated_at, created_at,
        students!inner(id, expert_id, profiles(name))
      `)
      .in('type', ['deposit', 'withdrawal'])
      .eq('students.expert_id', expert.id)
      .order('operated_at', { ascending: false })
      .order('created_at', { ascending: false });

    const rows: FinanceTx[] = (data ?? []).map((t: any) => ({
      id:           t.id,
      type:         t.type,
      entry_value:  t.entry_value ?? 0,
      description:  t.description,
      operated_at:  t.operated_at,
      created_at:   t.created_at,
      student_name: (t.students as any)?.profiles?.name ?? 'Aluno',
      student_id:   (t.students as any)?.id ?? '',
    }));

    setTransactions(rows);
    setLoading(false);
  }, [expert, students]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.amount) return;
    setSaving(true);

    const stu = students.find(s => s.id === form.student_id);
    const amount = parseFloat(form.amount);

    // Insert transaction
    const { error: txErr } = await supabase.from('transactions').insert({
      student_id:   form.student_id,
      type:         form.type,
      entry_value:  amount,
      result_value: 0,
      description:  form.description || (form.type === 'deposit' ? 'Depósito' : 'Saque'),
      operated_at:  form.date,
    });

    if (!txErr && stu) {
      // Update student balance
      const delta = form.type === 'deposit' ? amount : -amount;
      const newBalance = (stu.current_balance ?? 0) + delta;
      await supabase.from('students').update({ current_balance: newBalance }).eq('id', stu.id);
    }

    setSaving(false);
    setShowModal(false);
    setForm({ student_id: '', type: 'deposit', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    fetchTransactions();
  };

  const filtered = transactions.filter(t => {
    const matchType = filterType === 'all' || t.type === filterType;
    const matchSearch = !search ||
      t.student_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalDeposits    = transactions.filter(t => t.type === 'deposit').reduce((a, t) => a + t.entry_value, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((a, t) => a + t.entry_value, 0);
  const netBalance       = totalDeposits - totalWithdrawals;

  if (expertLoading || studentsLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">Financeiro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Depósitos e saques de todos os seus alunos.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#10B981]/20 hover:from-[#059669] hover:to-[#047857] transition-all active:scale-95"
        >
          <Plus size={15} /> Nova Movimentação
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Depositado', value: totalDeposits,    icon: ArrowDownRight, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
          { label: 'Total Sacado',     value: totalWithdrawals, icon: ArrowUpRight,   color: 'text-red-500',   bg: 'bg-red-500/10' },
          { label: 'Saldo Líquido',    value: netBalance,       icon: Wallet,         color: netBalance >= 0 ? 'text-[#10B981]' : 'text-red-500', bg: 'bg-blue-500/10' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', s.bg)}>
                <s.icon size={15} className={s.color} />
              </div>
            </div>
            <p className={cn('text-2xl font-black font-mono', s.color)}>R$ {s.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por aluno ou descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#10B981]/40"
          />
        </div>
        <div className="relative">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-black dark:text-white focus:outline-none"
          >
            <option value="all">Todos</option>
            <option value="deposit">Depósitos</option>
            <option value="withdrawal">Saques</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.06] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Nenhuma movimentação</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Registre depósitos e saques dos alunos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                  {['Aluno', 'Tipo', 'Valor', 'Descrição', 'Data'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t.id}
                    className={cn(
                      'border-b border-gray-50 dark:border-white/[0.03] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors',
                      i % 2 !== 0 && 'bg-gray-50/50 dark:bg-white/[0.01]'
                    )}
                  >
                    <td className="px-5 py-3 font-medium text-black dark:text-white">{t.student_name}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                        t.type === 'deposit' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-red-500/10 text-red-500'
                      )}>
                        {t.type === 'deposit'
                          ? <><ArrowDownRight size={10} /> Depósito</>
                          : <><ArrowUpRight size={10} /> Saque</>}
                      </span>
                    </td>
                    <td className={cn('px-5 py-3 font-mono font-bold', t.type === 'deposit' ? 'text-[#10B981]' : 'text-red-500')}>
                      {t.type === 'deposit' ? '+' : '-'}R$ {t.entry_value.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{t.description ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs">
                      {t.operated_at
                        ? format(new Date(t.operated_at), 'dd/MM/yyyy')
                        : format(new Date(t.created_at), 'dd/MM/yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d0d0d] border border-white/[0.09] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
              <div>
                <h2 className="text-sm font-bold text-white">Nova Movimentação</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Registre depósito ou saque de um aluno</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tipo</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                    className="w-full bg-[#111] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/60 outline-none text-sm"
                  >
                    <option value="deposit">Depósito</option>
                    <option value="withdrawal">Saque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Valor (R$)</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full bg-[#111] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/60 outline-none text-sm font-mono"
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

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Descrição (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Aporte inicial, Saque parcial..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-[#111] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/60 outline-none text-sm placeholder:text-gray-700"
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#10B981]/20 disabled:opacity-60 transition-all"
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
