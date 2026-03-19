import { useState } from 'react';
import {
  Target, Plus, Search, Filter, MoreVertical, X, Calendar, Trophy,
  Users, TrendingUp, Star, ChevronDown, Edit, Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpertCampaigns } from '@/hooks/useExpertData';
import { useExpertProfile } from '@/hooks/useExpertData';
import type { Campaign } from '@/lib/supabase';

type CampaignType = 'goal' | 'ranking';

const inputCls = 'w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-black dark:text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981] outline-none text-sm transition-all';
const labelCls = 'block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2';

export default function ExpertCampaigns() {
  const { campaigns, loading, saveCampaign, deleteCampaign } = useExpertCampaigns();
  const { expert } = useExpertProfile();

  const [searchTerm, setSearchTerm]             = useState('');
  const [statusFilter, setStatusFilter]         = useState('all');
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [campaignOptions, setCampaignOptions]   = useState<typeof campaigns[0] | null>(null);
  const [viewingRanking, setViewingRanking]     = useState<typeof campaigns[0] | null>(null);
  const [newCampaignType, setNewCampaignType]   = useState<CampaignType>('goal');

  // Add form state
  const [formTitle, setFormTitle]           = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrize, setFormPrize]           = useState('');
  const [formStartDate, setFormStartDate]   = useState('');
  const [formEndDate, setFormEndDate]       = useState('');
  const [formSaving, setFormSaving]         = useState(false);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  const filtered = campaigns.filter(c => {
    const q = searchTerm.toLowerCase();
    return c.title.toLowerCase().includes(q) && (statusFilter === 'all' || c.status === statusFilter);
  });

  const handleToggleFeatured = async (id: string) => {
    const c = campaigns.find(x => x.id === id);
    if (!c) return;
    await saveCampaign({ id, expert_id: c.expert_id, is_featured: !c.is_featured } as any);
    setCampaignOptions(null);
  };

  const handleDelete = async (id: string) => {
    await deleteCampaign(id);
    setCampaignOptions(null);
  };

  const handleCreate = async () => {
    if (!expert || !formTitle) return;
    setFormSaving(true);
    await saveCampaign({
      expert_id: expert.id,
      title: formTitle,
      description: formDescription || null,
      prize: formPrize || null,
      start_date: formStartDate || null,
      end_date: formEndDate || null,
      is_featured: false,
      status: 'active',
      max_participants: null,
      banner_url: null,
    } as any);
    setFormSaving(false);
    setIsAddingCampaign(false);
    setFormTitle(''); setFormDescription(''); setFormPrize(''); setFormStartDate(''); setFormEndDate('');
  };

  const activeCampaigns   = campaigns.filter(c => c.status === 'active').length;
  const totalParticipants = campaigns.reduce((a, c) => a + (c.participant_count ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">Campanhas e Desafios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Crie e gerencie campanhas para motivar seus alunos.</p>
        </div>
        <button
          onClick={() => setIsAddingCampaign(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-black text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm shadow-[#10B981]/30 whitespace-nowrap"
        >
          <Plus size={15} strokeWidth={2.5} /> Nova Campanha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total de Campanhas',  value: campaigns.length.toString(),          icon: Target,     color: 'text-[#10B981]',    bg: 'bg-[#10B981]/10' },
          { label: 'Campanhas Ativas',    value: activeCampaigns.toString(),            icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Total Participantes', value: totalParticipants.toLocaleString('pt-BR'), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] p-5 hover:border-gray-200 dark:hover:border-white/[0.12] transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.bg)}>
                <card.icon size={18} className={card.color} />
              </div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
            </div>
            <p className="text-xl font-bold text-black dark:text-white font-mono tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar campanha..."
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
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
            <option value="draft">Rascunho</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden hover:border-[#10B981]/40 dark:hover:border-[#10B981]/30 transition-all group flex flex-col">
            {/* Banner */}
            <div className="relative h-36 overflow-hidden">
              {c.banner_url ? (
                <img src={c.banner_url} alt={c.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#10B981]/20 to-emerald-900/40 flex items-center justify-center">
                  <Target size={32} className="text-[#10B981]/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* badges */}
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className={cn(
                  'px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                  c.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-200/90 text-gray-700'
                )}>
                  {c.status === 'active' ? 'Ativa' : c.status === 'draft' ? 'Rascunho' : 'Inativa'}
                </span>
                {c.is_featured && (
                  <span className="flex items-center gap-1 bg-[#10B981] text-black px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    <Star size={9} className="fill-black" /> Destaque
                  </span>
                )}
              </div>
              {/* options */}
              <button
                onClick={() => setCampaignOptions(c)}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur-sm transition-all"
              >
                <MoreVertical size={14} />
              </button>
              <h3 className="absolute bottom-3 left-4 right-4 text-sm font-bold text-white leading-snug drop-shadow">{c.title}</h3>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col gap-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{c.description ?? 'Sem descrição.'}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Trophy,   label: 'Prêmio',        value: c.prize ?? '—' },
                  { icon: Calendar, label: 'Encerra',        value: c.end_date ? new Date(c.end_date).toLocaleDateString('pt-BR') : '—' },
                  { icon: Users,    label: 'Participantes',  value: `${c.participant_count ?? 0}` },
                  { icon: TrendingUp, label: 'Status',       value: c.status === 'active' ? 'Ativa' : c.status === 'draft' ? 'Rascunho' : 'Inativa' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-gray-50 dark:bg-white/[0.03] rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon size={11} className="text-[#10B981]" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                    </div>
                    <p className="text-xs font-semibold text-black dark:text-white truncate">{value}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setViewingRanking(c)}
                className="mt-auto w-full py-2 text-xs font-bold text-[#10B981] border border-[#10B981]/30 hover:border-[#10B981]/60 hover:bg-[#10B981]/5 rounded-xl transition-all"
              >
                Ver Participantes
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07]">
            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <Target size={18} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhuma campanha encontrada</p>
          </div>
        )}
      </div>

      {/* ── Add Campaign Modal ── */}
      {isAddingCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-md border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Nova Campanha</h3>
                <p className="text-xs text-gray-400 mt-0.5">Configure os detalhes da campanha</p>
              </div>
              <button onClick={() => setIsAddingCampaign(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div><label className={labelCls}>Título</label><input type="text" placeholder="Ex: Desafio 10k" value={formTitle} onChange={e => setFormTitle(e.target.value)} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={newCampaignType} onChange={e => setNewCampaignType(e.target.value as CampaignType)} className={inputCls}>
                  <option value="goal">Meta Fixa (Ex: Bater R$ 10.000)</option>
                  <option value="ranking">Competição / Ranking</option>
                </select>
              </div>
              <div><label className={labelCls}>Descrição</label><textarea placeholder="Regras e detalhes..." rows={3} value={formDescription} onChange={e => setFormDescription(e.target.value)} className={cn(inputCls, 'resize-none')} /></div>
              <div>
                <label className={labelCls}>Prêmio</label>
                <input type="text" placeholder="Ex: Mentoria + R$ 500" value={formPrize} onChange={e => setFormPrize(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Início</label><input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Término</label><input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} className={inputCls} /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/[0.07] flex justify-end gap-2">
              <button onClick={() => setIsAddingCampaign(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">Cancelar</button>
              <button onClick={handleCreate} disabled={formSaving || !formTitle} className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-black rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm shadow-[#10B981]/20">
                {formSaving ? 'Salvando...' : 'Criar Campanha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Options Modal ── */}
      {campaignOptions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-sm border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Opções</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{campaignOptions.title}</p>
              </div>
              <button onClick={() => setCampaignOptions(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-2">
              <button onClick={() => { handleToggleFeatured(campaignOptions.id); }} className="w-full flex items-center gap-3 px-4 py-3 bg-[#10B981]/5 hover:bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl text-sm font-semibold text-[#10B981] transition-all">
                <Star size={15} /> {campaignOptions.is_featured ? 'Remover Destaque' : 'Marcar como Destaque'}
              </button>
              <button onClick={() => setCampaignOptions(null)} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-white/[0.07] rounded-xl text-sm font-semibold text-black dark:text-white transition-all">
                <Edit size={15} className="text-gray-400" /> Editar Campanha
              </button>
              <button onClick={() => handleDelete(campaignOptions.id)} className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 transition-all">
                <Trash2 size={15} /> Excluir Campanha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ranking Modal ── */}
      {viewingRanking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-lg border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">Participantes</h3>
                <p className="text-xs text-gray-400 mt-0.5">{viewingRanking.title}</p>
              </div>
              <button onClick={() => setViewingRanking(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="py-12 text-center">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
                  <Users size={18} className="text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {(viewingRanking.participant_count ?? 0) > 0
                    ? `${viewingRanking.participant_count} participante(s) inscrito(s)`
                    : 'Nenhum participante ainda'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
