import { useState } from 'react';
import {
  Search, Plus, ShieldAlert, CheckCircle2, XCircle,
  Edit, Eye, Filter, X, Users, TrendingUp, DollarSign, Calendar,
  ChevronDown, Trash2, KeyRound, Phone, Hash, AlertCircle, Loader2, MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StudentCalendar from '../student/Calendar';
import { useExpertStudents } from '@/hooks/useExpertData';

function StatusBadge({ status }: { status: string }) {
  if (status === 'active')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 size={10} /> Ativo
      </span>
    );
  if (status === 'suspended')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
        <XCircle size={10} /> Bloqueado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-amber-700 dark:text-emerald-400">
      <ShieldAlert size={10} /> Inativo
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className="w-8 h-8 rounded-xl bg-[#10B981]/15 flex items-center justify-center shrink-0">
      <span className="text-[11px] font-bold text-[#10B981]">{initials}</span>
    </div>
  );
}

const inputCls = 'w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none text-sm transition-all';
const labelCls = 'block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2';

type StudentForm = { name: string; email: string; phone: string; traderId: string; initialBalance: string; password: string; confirmPassword: string; };
const emptyStudentForm = (): StudentForm => ({ name: '', email: '', phone: '', traderId: '', initialBalance: '', password: '', confirmPassword: '' });

export default function ExpertStudents() {
  const { students, loading, createStudent, updateStudent, removeStudent } = useExpertStudents();

  const [searchTerm, setSearchTerm]           = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<typeof students[0] | null>(null);
  const [studentToEdit, setStudentToEdit]     = useState<typeof students[0] | null>(null);
  const [studentCalendar, setStudentCalendar] = useState<typeof students[0] | null>(null);
  const [studentOptions, setStudentOptions]   = useState<typeof students[0] | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editStatus, setEditStatus]           = useState('');

  const [form, setForm]               = useState<StudentForm>(emptyStudentForm());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError]     = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  const filteredStudents = students.filter(s => {
    const name = s.profiles?.name ?? '';
    const email = s.profiles?.email ?? '';
    const code = s.student_code ?? '';
    const q = searchTerm.toLowerCase();
    return (
      (name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || code.toLowerCase().includes(q)) &&
      (statusFilter === 'all' || s.status === statusFilter)
    );
  });

  const totalBankroll = students.reduce((a, s) => a + (s.current_balance ?? 0), 0);
  const activeCount   = students.filter(s => s.status === 'active').length;

  const handleSaveEdit = async () => {
    if (!studentToEdit) return;
    if (editStatus) await updateStudent(studentToEdit.id, { status: editStatus as any });
    setStudentToEdit(null);
    setEditStatus('');
  };

  const handleRemove = async (id: string) => {
    await removeStudent(id);
    setStudentOptions(null);
  };

  const handleCreateStudent = async () => {
    setFormError('');
    setFormSuccess('');
    if (!form.name.trim() || !form.email.trim()) return setFormError('Nome e e-mail são obrigatórios.');
    if (form.password.length < 6) return setFormError('Senha deve ter ao menos 6 caracteres.');
    if (form.password !== form.confirmPassword) return setFormError('As senhas não coincidem.');

    setFormLoading(true);
    const { error } = await createStudent({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      traderId: form.traderId.trim() || undefined,
      initialBalance: form.initialBalance ? parseFloat(form.initialBalance) : 0,
    });
    setFormLoading(false);

    if (error) {
      const msg = (error as any)?.message ?? 'Erro ao criar conta.';
      setFormError(msg.includes('already') ? 'E-mail já cadastrado.' : msg);
      return;
    }
    setFormSuccess('Aluno criado com sucesso!');
    setForm(emptyStudentForm());
  };

  const closeAddModal = () => {
    setIsAddingStudent(false);
    setForm(emptyStudentForm());
    setFormError('');
    setFormSuccess('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">Meus Alunos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gerencie as contas e acessos dos seus alunos.
          </p>
        </div>
        <button
          onClick={() => setIsAddingStudent(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm shadow-[#10B981]/30 whitespace-nowrap"
        >
          <Plus size={15} strokeWidth={2.5} />
          Adicionar Aluno
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total de Alunos',  value: students.length.toString(),                                       icon: Users,      color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', sub: `${activeCount} ativos` },
          { label: 'Alunos Ativos',    value: activeCount.toString(),                                           icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', sub: 'Com status ativo' },
          { label: 'Banca Total',      value: `R$ ${totalBankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', sub: 'Soma das bancas' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 hover:border-gray-200 dark:hover:border-white/[0.12] transition-all">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#0d0d0d] border border-gray-100 dark:border-white/[0.07] rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none text-sm text-black dark:text-white transition-all"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#0d0d0d] border border-gray-100 dark:border-white/[0.07] rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none text-sm text-black dark:text-white appearance-none cursor-pointer transition-all"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="suspended">Bloqueados</option>
            <option value="inactive">Inativos</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <h3 className="text-sm font-bold text-black dark:text-white">Alunos</h3>
          <p className="text-xs text-gray-400 mt-0.5">{filteredStudents.length} resultado{filteredStudents.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02]">
                {['Aluno', 'ID Trader', 'Status', 'Banca Atual', 'Cadastro', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
              {filteredStudents.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.profiles?.name ?? 'Aluno'} />
                      <div>
                        <p className="text-sm font-semibold text-black dark:text-white">{s.profiles?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.profiles?.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-1 rounded-lg">{s.student_code ?? s.id.slice(0,8)}</span>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-4 text-sm font-bold text-black dark:text-white font-mono tabular-nums">
                    R$ {(s.current_balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400 font-mono">
                    {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {[
                        { icon: Calendar,     title: 'Calendário', action: () => setStudentCalendar(s) },
                        { icon: Eye,          title: 'Detalhes',   action: () => setSelectedStudent(s) },
                        { icon: Edit,         title: 'Editar',     action: () => { setStudentToEdit(s); setEditStatus(s.status); } },
                        { icon: MoreVertical, title: 'Opções',     action: () => setStudentOptions(s) },
                      ].map(({ icon: Icon, title, action }) => (
                        <button
                          key={title}
                          onClick={action}
                          title={title}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                        >
                          <Icon size={14} />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                      <Users size={18} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhum aluno encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Student Modal ── */}
      {isAddingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-lg border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Novo Aluno</h3>
                <p className="text-xs text-gray-400 mt-0.5">Crie uma conta para o aluno</p>
              </div>
              <button onClick={closeAddModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nome completo</label>
                  <input type="text" placeholder="João Silva" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Telefone</label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" placeholder="(11) 99999-9999" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={cn(inputCls, 'pl-8')} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>E-mail</label>
                <input type="email" placeholder="aluno@exemplo.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>ID de Trader</label>
                  <div className="relative">
                    <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Ex: TRD001 (opcional)" value={form.traderId}
                      onChange={e => setForm(f => ({ ...f, traderId: e.target.value }))} className={cn(inputCls, 'pl-8')} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Banca Inicial (R$)</label>
                  <input type="number" min="0" step="0.01" placeholder="0,00" value={form.initialBalance}
                    onChange={e => setForm(f => ({ ...f, initialBalance: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Senha</label>
                  <input type="password" placeholder="Mín. 6 caracteres" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Confirmar Senha</label>
                  <input type="password" placeholder="Repita a senha" value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} className={inputCls} />
                </div>
              </div>
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}
              {formSuccess && (
                <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formSuccess}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-2 shrink-0">
              <button onClick={closeAddModal} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                {formSuccess ? 'Fechar' : 'Cancelar'}
              </button>
              {!formSuccess && (
                <button onClick={handleCreateStudent} disabled={formLoading}
                  className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-black rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2">
                  {formLoading ? <><Loader2 size={14} className="animate-spin" /> Criando...</> : <><Plus size={14} /> Criar Aluno</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Student Modal ── */}
      {studentToEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Editar Aluno</h3>
                <p className="text-xs text-gray-400 mt-0.5">{studentToEdit.profiles?.name ?? '—'}</p>
              </div>
              <button onClick={() => setStudentToEdit(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className={labelCls}>Nome</label><input type="text" defaultValue={studentToEdit.profiles?.name ?? ''} disabled className="w-full bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] text-gray-400 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed" /></div>
              <div><label className={labelCls}>Email</label><input type="email" defaultValue={studentToEdit.profiles?.email ?? ''} disabled className="w-full bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] text-gray-400 px-4 py-2.5 rounded-xl text-sm cursor-not-allowed" /></div>
              <div>
                <label className={labelCls}>Status</label>
                <div className="relative">
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className={cn(inputCls, 'appearance-none pr-9 cursor-pointer')}>
                    <option value="active">Ativo</option>
                    <option value="suspended">Bloqueado</option>
                    <option value="inactive">Inativo</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-2">
              <button onClick={() => setStudentToEdit(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-black rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-[#10B981]/20">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Details Modal ── */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-lg border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#10B981]/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#10B981]">
                    {(selectedStudent.profiles?.name ?? 'AL').split(' ').slice(0,2).map(w=>w[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-black dark:text-white">{selectedStudent.profiles?.name ?? '—'}</h3>
                    <span className="text-[10px] font-mono font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg">{selectedStudent.student_code ?? selectedStudent.id.slice(0,8)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedStudent.profiles?.email ?? '—'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Banca Atual',  value: `R$ ${(selectedStudent.current_balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-[#10B981]' },
                  { label: 'Banca Inicial', value: `R$ ${(selectedStudent.initial_balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'text-emerald-500' },
                ].map(card => (
                  <div key={card.label} className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-4 border border-gray-100 dark:border-white/[0.07]">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{card.label}</p>
                    <p className={cn('text-2xl font-bold font-mono tabular-nums', card.color)}>{card.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/[0.07] divide-y divide-gray-100 dark:divide-white/[0.07]">
                {[
                  { label: 'Status',         value: selectedStudent.status === 'active' ? 'Ativo' : selectedStudent.status === 'suspended' ? 'Bloqueado' : 'Inativo' },
                  { label: 'Data de Cadastro', value: new Date(selectedStudent.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  { label: 'ID',             value: selectedStudent.id.slice(0, 8) },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs font-semibold text-gray-400">{row.label}</span>
                    <span className="text-xs font-semibold text-black dark:text-white font-mono">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-2">
              <button onClick={() => setSelectedStudent(null)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">Fechar</button>
              <button onClick={() => { setStudentToEdit(selectedStudent); setEditStatus(selectedStudent.status); setSelectedStudent(null); }} className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-black rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-[#10B981]/20">Editar Aluno</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Options Modal ── */}
      {studentOptions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-sm border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Opções da Conta</h3>
                <p className="text-xs text-gray-400 mt-0.5">{studentOptions.profiles?.name ?? '—'}</p>
              </div>
              <button onClick={() => setStudentOptions(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button onClick={() => setStudentOptions(null)} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/[0.07] rounded-xl text-sm font-semibold text-black dark:text-white transition-all">
                <KeyRound size={15} className="text-gray-400" /> Resetar Senha
              </button>
              <button onClick={() => handleRemove(studentOptions.id)} className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 transition-all">
                <Trash2 size={15} /> Excluir Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar Modal ── */}
      {studentCalendar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-6xl h-[90vh] border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Calendário de Operações</h3>
                <p className="text-xs text-gray-400 mt-0.5">Visualizando: <span className="font-semibold text-black dark:text-white">{studentCalendar.profiles?.name ?? '—'}</span></p>
              </div>
              <button onClick={() => setStudentCalendar(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <StudentCalendar />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
