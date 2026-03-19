import React, { useState } from 'react';
import { Search, Filter, Eye, Edit, MoreVertical, CheckCircle2, XCircle, ShieldAlert, ChevronDown, X, TrendingUp, DollarSign, LogIn, Plus, Phone, Hash, AlertCircle, Loader2 } from 'lucide-react';
import { useAdminStudents, useAdminExperts } from '@/hooks/useAdminData';
import { cn } from '@/lib/utils';

export default function AdminStudents() {
  const { students, loading, updateStudent, createStudent } = useAdminStudents();
  const { experts } = useAdminExperts();

  const [searchTerm, setSearchTerm]         = useState('');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [expertFilter, setExpertFilter]     = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<typeof students[0] | null>(null);
  const [studentToEdit, setStudentToEdit]     = useState<typeof students[0] | null>(null);
  const [studentOptions, setStudentOptions]   = useState<typeof students[0] | null>(null);
  const [editStatus, setEditStatus]           = useState('');

  /* ── Create student ── */
  const defaultForm = { name: '', email: '', phone: '', traderId: '', password: '', expertId: '' };
  const [showCreate, setShowCreate]   = useState(false);
  const [createForm, setCreateForm]   = useState(defaultForm);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  const uniqueExperts = Array.from(new Set(students.map(s => s.expert_name ?? '—').filter(n => n !== '—')));

  const filteredStudents = students.filter(student => {
    const name = student.profiles?.name ?? '';
    const email = student.profiles?.email ?? '';
    const code = student.student_code ?? '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesExpert = expertFilter === 'all' || student.expert_name === expertFilter;
    return matchesSearch && matchesStatus && matchesExpert;
  });

  const handleSaveEdit = async () => {
    if (!studentToEdit) return;
    if (editStatus) await updateStudent(studentToEdit.id, { status: editStatus as any });
    setStudentToEdit(null);
    setEditStatus('');
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError('Nome, email e senha são obrigatórios.');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('Senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setCreating(true);
    const { error } = await createStudent({
      name:     createForm.name.trim(),
      email:    createForm.email.trim().toLowerCase(),
      phone:    createForm.phone.trim(),
      traderId: createForm.traderId.trim(),
      password: createForm.password,
      expertId: createForm.expertId || undefined,
    });
    setCreating(false);
    if (error) { setCreateError((error as any).message ?? 'Erro ao criar aluno.'); return; }
    setShowCreate(false);
    setCreateForm(defaultForm);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white tracking-tight">Gerenciamento de Alunos Global</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Visão geral de todos os alunos cadastrados no sistema.</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(''); setCreateForm(defaultForm); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-black text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#10B981]/20 shrink-0"
        >
          <Plus size={16} /> Novo Aluno
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[#10B981]/50 outline-none text-sm text-black dark:text-white transition-colors"
          />
        </div>
        <div className="relative min-w-[200px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={expertFilter}
            onChange={(e) => setExpertFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-[#10B981]/50 outline-none text-sm text-black dark:text-white font-medium appearance-none cursor-pointer"
          >
            <option value="all">Todos os Experts</option>
            {uniqueExperts.map(expert => (
              <option key={expert} value={expert}>{expert}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        <div className="relative min-w-[200px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-10 py-2.5 focus:ring-2 focus:ring-[#10B981]/50 outline-none text-sm text-black dark:text-white font-medium appearance-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="suspended">Bloqueados</option>
            <option value="inactive">Inativos</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-white/5">
                <th className="p-4">Aluno</th>
                <th className="p-4">ID</th>
                <th className="p-4">Expert</th>
                <th className="p-4">Status</th>
                <th className="p-4">Banca Atual</th>
                <th className="p-4">Cadastro</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-black dark:text-white text-sm">{student.profiles?.name ?? '—'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{student.profiles?.email ?? '—'}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">
                      {student.student_code ?? student.id.slice(0,8)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">
                      {student.expert_name ?? '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    {student.status === 'active' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-200 dark:border-emerald-500/20 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                      </span>
                    )}
                    {(student.status === 'suspended') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-red-200 dark:border-red-500/20 rounded-md text-xs font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400">
                        <XCircle className="w-3.5 h-3.5" /> Bloqueado
                      </span>
                    )}
                    {student.status === 'inactive' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-emerald-200 dark:border-emerald-500/20 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-amber-700 dark:text-emerald-400">
                        <ShieldAlert className="w-3.5 h-3.5" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-semibold text-black dark:text-white font-mono text-sm">
                    R$ {(student.current_balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 font-mono text-gray-500 dark:text-gray-400 text-sm">
                    {new Date(student.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-3 relative">
                      <button
                        className="text-gray-400 hover:text-[#10B981] transition-colors"
                        title="Entrar como Aluno"
                      >
                        <LogIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setStudentToEdit(student); setEditStatus(student.status); }}
                        className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setStudentOptions(student)}
                          className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                          title="Mais Opções"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl rounded-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-black dark:text-white">{selectedStudent.profiles?.name ?? '—'}</h2>
                  <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">
                    {selectedStudent.student_code ?? selectedStudent.id.slice(0,8)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{selectedStudent.profiles?.email ?? '—'}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50/50 dark:bg-white/5 p-5 border border-gray-200 dark:border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Banca Atual</p>
                  </div>
                  <p className="text-2xl font-bold text-black dark:text-white font-mono">R$ {(selectedStudent.current_balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-white/5 p-5 border border-gray-200 dark:border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Banca Inicial</p>
                  </div>
                  <p className="text-2xl font-bold text-black dark:text-white font-mono">R$ {(selectedStudent.initial_balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-black dark:text-white">Informações Adicionais</h3>
                <div className="bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 space-y-3 rounded-xl">
                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/10 pb-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Expert Vinculado</span>
                    <span className="text-sm font-medium text-black dark:text-white">{selectedStudent.expert_name ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-white/10 pb-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Data de Cadastro</span>
                    <span className="text-sm font-mono text-black dark:text-white">{new Date(selectedStudent.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status da Conta</span>
                    <span className="text-sm font-medium text-black dark:text-white capitalize">{selectedStudent.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/5">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setStudentToEdit(selectedStudent);
                  setEditStatus(selectedStudent.status);
                  setSelectedStudent(null);
                }}
                className="px-6 py-2 bg-[#10B981] hover:bg-[#047857] text-black rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Editar Aluno
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {studentToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 w-full max-w-md overflow-hidden flex flex-col shadow-2xl rounded-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-xl font-semibold text-black dark:text-white">Editar Aluno</h2>
              <button
                onClick={() => setStudentToEdit(null)}
                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Nome</label>
                <input
                  type="text"
                  defaultValue={studentToEdit.profiles?.name ?? ''}
                  disabled
                  className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={studentToEdit.profiles?.email ?? ''}
                  disabled
                  className="w-full bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</label>
                <div className="relative">
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg pl-4 pr-10 py-2.5 focus:ring-1 focus:ring-[#10B981] outline-none text-sm text-black dark:text-white font-medium appearance-none cursor-pointer"
                  >
                    <option value="active">Ativo</option>
                    <option value="suspended">Bloqueado</option>
                    <option value="inactive">Inativo</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/5">
              <button
                onClick={() => setStudentToEdit(null)}
                className="px-6 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-[#10B981] hover:bg-[#047857] text-black rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Options Modal */}
      {studentOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 w-full max-w-sm overflow-hidden flex flex-col shadow-2xl rounded-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-lg font-semibold text-black dark:text-white">Opções da Conta</h2>
              <button
                onClick={() => setStudentOptions(null)}
                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={() => setStudentOptions(null)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium text-black dark:text-white transition-colors"
              >
                Resetar Senha
              </button>
              <button
                onClick={async () => { await updateStudent(studentOptions.id, { status: 'suspended' }); setStudentOptions(null); }}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 transition-colors"
              >
                Suspender Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE STUDENT MODAL ─────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/[0.10] w-full max-w-md shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] shrink-0">
              <div>
                <h2 className="text-base font-black text-black dark:text-white">Novo Aluno</h2>
                <p className="text-xs text-gray-400 mt-0.5">Crie manualmente uma conta de aluno</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 transition-all">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nome completo *</label>
                  <input
                    required
                    value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome do aluno"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email *</label>
                  <input
                    required
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    <Phone size={10} className="inline mr-1" />Telefone
                  </label>
                  <input
                    value={createForm.phone}
                    onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+55 (11) 99999-9999"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                  />
                </div>

                {/* Trader ID */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    <Hash size={10} className="inline mr-1" />ID de Trader
                  </label>
                  <input
                    value={createForm.traderId}
                    onChange={e => setCreateForm(f => ({ ...f, traderId: e.target.value }))}
                    placeholder="Ex: TRD-12345"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                  />
                </div>

                {/* Expert link */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Vincular a Expert</label>
                  <select
                    value={createForm.expertId}
                    onChange={e => setCreateForm(f => ({ ...f, expertId: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/30 appearance-none"
                  >
                    <option value="">— Sem expert vinculado —</option>
                    {experts.filter(e => e.profiles?.role === 'expert').map(e => (
                      <option key={e.id} value={e.id}>{e.profiles?.name ?? e.brand_name}</option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Senha *</label>
                  <input
                    required
                    type="password"
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mín. 6 caracteres"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                  />
                </div>

                {createError && (
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{createError}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-black text-sm font-bold rounded-xl transition-all"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {creating ? 'Criando...' : 'Criar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
