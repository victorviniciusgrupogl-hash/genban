import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, CheckCircle2, XCircle, ShieldAlert,
  Edit, X, Users, TrendingUp, Activity,
  Shield, AlertCircle, Loader2, LogIn,
  Phone, Hash, Tag, Lock, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, KeyRound, Trash2, UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAdminExperts } from '@/hooks/useAdminData';
import { useAuth } from '@/contexts/AuthContext';

/* ── Permission definitions ──────────────────────────────── */
const ALL_PERMISSIONS = [
  { key: 'view_experts',      label: 'Ver Experts',         group: 'Experts' },
  { key: 'create_expert',     label: 'Criar Expert',        group: 'Experts' },
  { key: 'delete_expert',     label: 'Excluir Expert',      group: 'Experts' },
  { key: 'view_students',     label: 'Ver Alunos',          group: 'Alunos' },
  { key: 'create_student',    label: 'Criar Aluno',         group: 'Alunos' },
  { key: 'delete_student',    label: 'Excluir Aluno',       group: 'Alunos' },
  { key: 'create_admin',      label: 'Criar Admin',         group: 'Admins' },
  { key: 'delete_admin',      label: 'Excluir Admin',       group: 'Admins' },
  { key: 'manage_campaigns',  label: 'Gerenciar Campanhas', group: 'Sistema' },
  { key: 'manage_settings',   label: 'Config. do Sistema',  group: 'Sistema' },
];
const PERM_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

/* ── Helpers ─────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  if (status === 'active')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 size={10} /> Ativo
      </span>
    );
  if (status === 'blocked' || status === 'suspended')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
        <XCircle size={10} /> Bloqueado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400">
      <ShieldAlert size={10} /> Pendente
    </span>
  );
}

function RoleBadge({ role }: { role: 'expert' | 'admin' }) {
  if (role === 'admin')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400">
        <Shield size={9} /> Admin
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#10B981]/[0.08] border border-[#10B981]/20 text-[#10B981]">
      <UserCog size={9} /> Expert
    </span>
  );
}

/* ── Permissions toggle panel ────────────────────────────── */
function PermissionsPanel({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (perms: string[]) => void;
}) {
  const toggle = (key: string) => {
    if (selected.includes(key)) onChange(selected.filter(p => p !== key));
    else onChange([...selected, key]);
  };
  const selectAll = () => onChange(ALL_PERMISSIONS.map(p => p.key));
  const clearAll  = () => onChange([]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-white/[0.03] border-b border-gray-100 dark:border-white/[0.06]">
        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Permissões de acesso</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-[10px] font-bold text-[#10B981] hover:underline"
          >Todas</button>
          <span className="text-gray-300 dark:text-white/20">·</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-[10px] font-bold text-red-500 hover:underline"
          >Nenhuma</button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {PERM_GROUPS.map(group => (
          <div key={group}>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">{group}</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PERMISSIONS.filter(p => p.group === group).map(perm => {
                const on = selected.includes(perm.key);
                return (
                  <button
                    key={perm.key}
                    type="button"
                    onClick={() => toggle(perm.key)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all text-left',
                      on
                        ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                        : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06] text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {on
                      ? <ToggleRight size={14} className="shrink-0 text-[#10B981]" />
                      : <ToggleLeft  size={14} className="shrink-0 text-gray-400" />}
                    {perm.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function AdminExperts() {
  const navigate = useNavigate();
  const { profile: adminProfile, session: adminSession } = useAuth();
  const { experts, loading, createUser, updateExpert, deleteExpert } = useAdminExperts();

  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'expert' | 'admin'>('all');

  /* ── Create modal ── */
  const [showCreate, setShowCreate] = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [createError, setCreateError] = useState('');
  const [showPermissions, setShowPermissions] = useState(false);

  const defaultForm = {
    name: '', email: '', phone: '', affiliateId: '',
    password: '', confirmPassword: '',
    role: 'expert' as 'expert' | 'admin',
    permissions: [] as string[],
  };
  const [form, setForm] = useState(defaultForm);

  /* ── Edit modal ── */
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [saving, setSaving] = useState(false);

  /* ── Delete confirm ── */
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Impersonate ── */
  const [impersonating, setImpersonating] = useState<string | null>(null);

  /* filter */
  const filtered = experts.filter(e => {
    const matchSearch = [e.profiles?.name, e.profiles?.email, e.brand_name]
      .join(' ').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all'
      ? true
      : e.profiles?.role === roleFilter;
    return matchSearch && matchRole;
  });

  /* stats */
  const totalExperts = experts.filter(e => e.profiles?.role === 'expert').length;
  const totalAdmins  = experts.filter(e => e.profiles?.role === 'admin').length;
  const activeCount  = experts.filter(e => e.status === 'active').length;

  /* ── Create handler ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setCreateError('Nome, email e senha são obrigatórios.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setCreateError('As senhas não coincidem.');
      return;
    }
    if (form.password.length < 6) {
      setCreateError('Senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setCreating(true);
    const { error } = await createUser({
      name:        form.name.trim(),
      email:       form.email.trim().toLowerCase(),
      phone:       form.phone.trim(),
      affiliateId: form.affiliateId.trim(),
      password:    form.password,
      role:        form.role,
      permissions: form.role === 'admin' ? form.permissions : [],
    });

    setCreating(false);
    if (error) {
      setCreateError((error as any).message ?? 'Erro ao criar conta.');
      return;
    }
    setShowCreate(false);
    setForm(defaultForm);
  };

  /* ── Status update ── */
  const handleSaveStatus = async () => {
    if (!editTarget) return;
    setSaving(true);
    await updateExpert(editTarget, { status: editStatus });
    setSaving(false);
    setEditTarget(null);
  };

  /* ── Delete handler ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteExpert(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  /* ── Impersonate expert ── */
  const handleImpersonate = async (expertUserId: string, expertName: string) => {
    if (!adminSession) return;
    setImpersonating(expertUserId);

    // Save admin session backup to localStorage
    localStorage.setItem('admin_backup_session', JSON.stringify({
      access_token:  adminSession.access_token,
      refresh_token: adminSession.refresh_token,
      expert_name:   expertName,
    }));

    // Sign in as expert — we need to sign in using the admin backup approach
    // Since we can't get the expert's password, we use the admin session token
    // and navigate with a query param. The ExpertLayout will detect the backup.
    // A better approach: set session to a new sign-in... but we don't have the password.
    // Instead, just navigate to /expert and store the expert user_id for display only.
    localStorage.setItem('impersonate_expert_id', expertUserId);
    localStorage.setItem('impersonate_expert_name', expertName);

    // NOTE: Real impersonation requires Supabase service_role (server-side).
    // Here we navigate to the expert panel with an info banner for the admin.
    // The expert's data will load from Supabase based on the expertUserId query.
    navigate(`/expert?impersonate=${expertUserId}`);
    setImpersonating(null);
  };

  return (
    <div className="space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white tracking-tight">
            Gerenciar Contas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Experts e administradores do sistema
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError(''); setForm(defaultForm); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-black text-sm font-bold rounded-xl transition-all shadow-lg shadow-[#10B981]/20"
        >
          <Plus size={16} /> Nova Conta
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Experts', value: totalExperts, icon: UserCog,  color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
          { label: 'Total Admins',  value: totalAdmins,  icon: Shield,   color: 'text-violet-500', bg: 'bg-violet-500/10' },
          { label: 'Contas Ativas', value: activeCount,  icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-black text-black dark:text-white font-mono">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, email..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'expert', 'admin'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                'px-3 py-2 text-xs font-bold rounded-xl border transition-all',
                roleFilter === r
                  ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                  : 'bg-white dark:bg-[#0d0d0d] border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400'
              )}
            >
              {r === 'all' ? 'Todos' : r === 'expert' ? 'Experts' : 'Admins'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#10B981]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-semibold">Nenhuma conta encontrada</p>
            <p className="text-xs mt-1">Crie a primeira conta usando o botão acima</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                  {['Usuário', 'Tipo', 'Contato', 'Alunos', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {filtered.map(expert => (
                  <tr key={expert.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-black text-[#10B981]">
                            {(expert.profiles?.name ?? 'EX').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-black dark:text-white text-xs">{expert.profiles?.name ?? '—'}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{expert.profiles?.email ?? '—'}</p>
                          {expert.affiliate_id && (
                            <p className="text-[9px] text-[#10B981]/60 font-mono mt-0.5">
                              Afil: {expert.affiliate_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <RoleBadge role={(expert.profiles?.role as 'expert' | 'admin') ?? 'expert'} />
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {expert.phone || expert.profiles?.phone || '—'}
                      </p>
                    </td>

                    {/* Student count */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Users size={12} className="text-gray-400" />
                        {expert.student_count}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={expert.status ?? 'active'} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {/* Impersonate / Access */}
                        {expert.profiles?.role === 'expert' && (
                          <button
                            onClick={() => handleImpersonate(expert.user_id, expert.profiles?.name ?? 'Expert')}
                            disabled={impersonating === expert.user_id}
                            title="Acessar conta do Expert"
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 transition-all"
                          >
                            {impersonating === expert.user_id
                              ? <Loader2 size={12} className="animate-spin" />
                              : <LogIn size={12} />}
                          </button>
                        )}

                        {/* Edit status */}
                        <button
                          onClick={() => {
                            setEditTarget(expert.id);
                            setEditStatus((expert.status as any) ?? 'active');
                          }}
                          title="Editar status"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] text-gray-500 dark:text-gray-400 transition-all"
                        >
                          <Edit size={12} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget({ id: expert.id, name: expert.profiles?.name ?? '?' })}
                          title="Excluir conta"
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ─────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-xl border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-black text-black dark:text-white">Nova Conta</h3>
                <p className="text-xs text-gray-400 mt-0.5">Crie um Expert ou Administrador</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-4">

                {/* Role selector */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Tipo de conta
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['expert', 'admin'] as const).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, role: r }));
                          setShowPermissions(false);
                        }}
                        className={cn(
                          'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all',
                          form.role === r
                            ? r === 'expert'
                              ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]'
                              : 'bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/40 text-violet-600 dark:text-violet-400'
                            : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.08] text-gray-500'
                        )}
                      >
                        {r === 'expert' ? <UserCog size={15} /> : <Shield size={15} />}
                        {r === 'expert' ? 'Expert' : 'Administrador'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Nome completo *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome completo"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    <Phone size={10} className="inline mr-1" /> Telefone
                  </label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+55 (11) 99999-9999"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                  />
                </div>

                {/* Affiliate ID — only for experts */}
                {form.role === 'expert' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      <Tag size={10} className="inline mr-1" /> ID de Afiliado
                    </label>
                    <input
                      value={form.affiliateId}
                      onChange={e => setForm(f => ({ ...f, affiliateId: e.target.value }))}
                      placeholder="Ex: AFF-12345"
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                    />
                  </div>
                )}

                {/* Password */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      <Lock size={10} className="inline mr-1" /> Senha *
                    </label>
                    <input
                      required
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Mín. 6 caracteres"
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                      Confirmar senha *
                    </label>
                    <input
                      required
                      type="password"
                      value={form.confirmPassword}
                      onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="Repita a senha"
                      className={cn(
                        'w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-white/[0.04] border rounded-xl text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2',
                        form.confirmPassword && form.password !== form.confirmPassword
                          ? 'border-red-400 focus:ring-red-400/30'
                          : 'border-gray-200 dark:border-white/[0.08] focus:ring-[#10B981]/30'
                      )}
                    />
                  </div>
                </div>

                {/* Permissions — only for admins */}
                {form.role === 'admin' && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowPermissions(v => !v)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl text-sm font-bold text-violet-600 dark:text-violet-400 transition-all hover:bg-violet-100 dark:hover:bg-violet-500/20"
                    >
                      <Shield size={14} />
                      Permissões do Administrador
                      <span className="ml-auto text-[10px] font-bold opacity-60">
                        {form.permissions.length}/{ALL_PERMISSIONS.length}
                      </span>
                      {showPermissions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    {showPermissions && (
                      <div className="mt-2">
                        <PermissionsPanel
                          selected={form.permissions}
                          onChange={perms => setForm(f => ({ ...f, permissions: perms }))}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Error */}
                {createError && (
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{createError}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-black text-sm font-bold rounded-xl transition-all"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {creating ? 'Criando...' : `Criar ${form.role === 'expert' ? 'Expert' : 'Admin'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT STATUS MODAL ────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-sm border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center">
              <h3 className="text-base font-black text-black dark:text-white">Editar Status</h3>
              <button onClick={() => setEditTarget(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-400 transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {(['active', 'inactive', 'suspended'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setEditStatus(s)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all',
                    editStatus === s
                      ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
                      : 'border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full', s === 'active' ? 'bg-emerald-500' : s === 'inactive' ? 'bg-gray-400' : 'bg-red-500')} />
                  {s === 'active' ? 'Ativo' : s === 'inactive' ? 'Inativo' : 'Suspenso'}
                </button>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-3">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm text-gray-500 font-semibold">Cancelar</button>
              <button
                onClick={handleSaveStatus}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-black text-sm font-bold rounded-xl transition-all"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM ────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-sm border border-gray-200 dark:border-white/[0.10] shadow-2xl rounded-2xl overflow-hidden">
            <div className="px-6 py-5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="text-base font-black text-black dark:text-white mb-2">Excluir conta?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tem certeza que deseja excluir a conta de{' '}
                <span className="font-bold text-black dark:text-white">{deleteTarget.name}</span>?
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-500 font-semibold">Cancelar</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-all"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
