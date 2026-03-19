import { useState, ChangeEvent } from 'react';
import { Save, User, Target, AlertTriangle, Wallet, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputCls = 'w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none text-sm transition-all';
const labelCls = 'block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2';

export default function StudentSettings() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    username:       'João Silva',
    initialBankroll: 1000,
    dailyGoal:       50,
    dailyLossLimit:  30,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">Configurações</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gerencie seu perfil e metas operacionais.
          </p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm whitespace-nowrap',
            saved
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-[#10B981] hover:bg-[#059669] text-black shadow-[#10B981]/30'
          )}
        >
          {saved ? <Check size={15} strokeWidth={2.5} /> : <Save size={15} strokeWidth={2.5} />}
          {saved ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Profile Section */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <User size={14} className="text-blue-500" />
          </div>
          <h2 className="text-sm font-bold text-black dark:text-white">Perfil</h2>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-[#10B981]/15 flex items-center justify-center">
                <span className="text-2xl font-bold text-[#10B981]">
                  {formData.username.split(' ').slice(0,2).map(w => w[0]).join('')}
                </span>
              </div>
              <p className="text-xs text-gray-400">Avatar</p>
            </div>
            {/* Fields */}
            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className={labelCls}>Nome de Usuário</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value="joao.silva@email.com"
                  disabled
                  className="w-full bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] text-gray-400 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1.5">O email não pode ser alterado.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Goals */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
            <Target size={14} className="text-[#10B981]" />
          </div>
          <h2 className="text-sm font-bold text-black dark:text-white">Metas Operacionais</h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Banca Inicial */}
          <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/[0.07] p-5">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-gray-400" />
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Banca Inicial</label>
            </div>
            <p className="text-xs text-gray-400 mb-3">Valor inicial da sua banca para cálculo de lucros.</p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">R$</span>
              <input
                type="number"
                name="initialBankroll"
                value={formData.initialBankroll}
                onChange={handleChange}
                className="w-full bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none font-mono text-sm transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Meta Diária */}
            <div className="bg-[#10B981]/5 dark:bg-[#10B981]/[0.04] rounded-xl border border-[#10B981]/20 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Target size={14} className="text-[#10B981]" />
                <label className="text-xs font-bold text-[#10B981] uppercase tracking-wider">Meta Diária de Win</label>
              </div>
              <p className="text-xs text-gray-400 mb-3">Objetivo de lucro por dia.</p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#10B981]/60 text-sm font-mono">R$</span>
                <input
                  type="number"
                  name="dailyGoal"
                  value={formData.dailyGoal}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#0d0d0d] border border-[#10B981]/30 text-[#10B981] pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] outline-none font-mono font-semibold text-sm transition-all"
                />
              </div>
            </div>

            {/* Limite de Loss */}
            <div className="bg-red-50 dark:bg-red-500/[0.04] rounded-xl border border-red-200 dark:border-red-500/20 p-5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className="text-red-500" />
                <label className="text-xs font-bold text-red-500 uppercase tracking-wider">Limite Loss Diário</label>
              </div>
              <p className="text-xs text-gray-400 mb-3">Perda máxima permitida por dia.</p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400/60 text-sm font-mono">R$</span>
                <input
                  type="number"
                  name="dailyLossLimit"
                  value={formData.dailyLossLimit}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#0d0d0d] border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none font-mono font-semibold text-sm transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
