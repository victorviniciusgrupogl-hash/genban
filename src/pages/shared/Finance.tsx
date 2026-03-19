import { useState } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownRight, Plus, X, CheckCircle2, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { useStudentProfile, useTransactions } from '@/hooks/useStudentData';

type TransactionType = 'deposit' | 'withdrawal';

export default function Finance() {
  const { student, loading: studentLoading } = useStudentProfile();
  const { transactions, loading: txLoading, addTransaction } = useTransactions(student?.id);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [formData, setFormData] = useState({
    type: 'deposit' as TransactionType,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const loading = studentLoading || txLoading;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  // Filter to deposit/withdrawal transactions only
  const financeTransactions = transactions.filter(
    t => t.type === 'deposit' || t.type === 'withdrawal'
  );

  const totalDeposits    = financeTransactions.filter(t => t.type === 'deposit').reduce((a, c) => a + (c.entry_value ?? 0), 0);
  const totalWithdrawals = financeTransactions.filter(t => t.type === 'withdrawal').reduce((a, c) => a + (c.entry_value ?? 0), 0);
  const netBalance       = totalDeposits - totalWithdrawals;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSaving(true);
    try {
      await addTransaction({
        student_id: student.id,
        type: formData.type,
        asset: null,
        entry_value: parseFloat(formData.amount),
        result_value: 0,
        description: formData.description || (formData.type === 'deposit' ? 'Depósito' : 'Saque'),
        operated_at: new Date(formData.date + 'T12:00:00').toISOString().split('T')[0],
      });
      setShowModal(false);
      setFormData({ type: 'deposit', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">Financeiro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gerencie seus depósitos e saques na corretora.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm shadow-[#10B981]/30 whitespace-nowrap"
          >
            <Plus size={15} strokeWidth={2.5} />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Saldo Líquido',
            value: `R$ ${netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: Wallet,
            color: 'text-[#10B981]',
            bg: 'bg-[#10B981]/10',
            sub: 'Depósitos menos saques',
          },
          {
            label: 'Total Depositado',
            value: `R$ ${totalDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: ArrowDownRight,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            sub: `${financeTransactions.filter(t => t.type === 'deposit').length} transações`,
          },
          {
            label: 'Total Sacado',
            value: `R$ ${totalWithdrawals.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: ArrowUpRight,
            color: 'text-red-500',
            bg: 'bg-red-50 dark:bg-red-500/10',
            sub: `${financeTransactions.filter(t => t.type === 'withdrawal').length} transações`,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 hover:border-gray-200 dark:hover:border-white/[0.12] transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.bg)}>
                <card.icon size={18} className={card.color} />
              </div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
            </div>
            <p className="text-xl font-bold text-black dark:text-white font-mono tabular-nums">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <h3 className="text-sm font-bold text-black dark:text-white">Histórico de Transações</h3>
          <p className="text-xs text-gray-400 mt-0.5">{financeTransactions.length} registros encontrados</p>
        </div>

        {financeTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <Wallet size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhuma transação registrada</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Nova Transação" para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/[0.04]">
            {financeTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  t.type === 'deposit' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'
                )}>
                  {t.type === 'deposit'
                    ? <ArrowDownRight size={18} className="text-emerald-500" />
                    : <ArrowUpRight size={18} className="text-red-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black dark:text-white truncate">
                    {t.description ?? (t.type === 'deposit' ? 'Depósito' : 'Saque')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {new Date(t.operated_at ?? t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={10} />
                    Concluído
                  </span>

                  <p className={cn(
                    'text-sm font-bold font-mono tabular-nums whitespace-nowrap',
                    t.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {t.type === 'deposit' ? '+' : '-'} R$ {(t.entry_value ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Nova Transação</h3>
                <p className="text-xs text-gray-400 mt-0.5">Registre um depósito ou saque</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Tipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'deposit' })}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 transition-all',
                      formData.type === 'deposit'
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    )}
                  >
                    <ArrowDownRight size={15} /> Depósito
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'withdrawal' })}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm border-2 transition-all',
                      formData.type === 'withdrawal'
                        ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                        : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
                    )}
                  >
                    <ArrowUpRight size={15} /> Saque
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Valor
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">R$</span>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0,00"
                    className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white pl-9 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none font-mono text-sm transition-all"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none text-sm transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Descrição <span className="text-gray-300 dark:text-gray-600 normal-case font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={formData.type === 'deposit' ? 'Ex: Depósito via PIX' : 'Ex: Saque de lucros da semana'}
                  className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none text-sm transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-black rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-[#10B981]/20 disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar Transação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
