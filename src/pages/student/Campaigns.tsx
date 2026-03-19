import { useState } from 'react';
import {
  Target, Trophy, Calendar, Users, X, Medal, Crown,
  ArrowRight, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudentProfile } from '@/hooks/useStudentData';
import { useStudentCampaigns } from '@/hooks/useStudentData';

const TABS = [
  { id: 'available', label: 'Disponíveis' },
  { id: 'active',    label: 'Minhas Campanhas' },
  { id: 'completed', label: 'Concluídas' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function StudentCampaigns() {
  const { student, loading: studentLoading } = useStudentProfile();
  const { campaigns, loading: campaignsLoading, joinCampaign } = useStudentCampaigns(student?.expert_id ?? undefined);

  const [activeTab, setActiveTab]           = useState<TabId>('available');
  const [selectedCampaign, setSelectedCampaign] = useState<typeof campaigns[0] | null>(null);

  const loading = studentLoading || campaignsLoading;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  const filtered = campaigns.filter((c) => {
    if (activeTab === 'available')  return c.status === 'active' && !c.is_participant;
    if (activeTab === 'active')     return c.status === 'active' && c.is_participant;
    if (activeTab === 'completed')  return c.status === 'inactive';
    return false;
  });

  const handleJoin = async (campaignId: string) => {
    if (!student) return;
    await joinCampaign(campaignId, student.id);
  };

  const featured = campaigns.find(c => c.is_featured && !c.is_participant && c.status === 'active');

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-black dark:text-white tracking-tight">Campanhas e Desafios</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Participe dos desafios do seu expert e concorra a prêmios.
        </p>
      </div>

      {/* Featured Banner */}
      {featured && activeTab === 'available' && (
        <div className="relative rounded-2xl overflow-hidden border border-[#10B981]/20 group cursor-pointer" onClick={() => handleJoin(featured.id)}>
          {featured.banner_url ? (
            <img
              src={featured.banner_url}
              alt={featured.title}
              className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-[#10B981]/20 to-emerald-900/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            <span className="bg-[#10B981] text-black text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest mb-3 inline-flex items-center gap-1.5 w-fit">
              <Crown size={10} /> Campanha em Destaque
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">{featured.title}</h2>
            <p className="text-gray-300 text-sm mb-5 max-w-xl line-clamp-2">{featured.description ?? ''}</p>
            <div className="flex items-center gap-4">
              <button
                className="bg-[#10B981] hover:bg-[#059669] text-black px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-[#10B981]/30 flex items-center gap-2"
              >
                Participar Agora <ArrowRight size={14} />
              </button>
              <span className="text-xs text-gray-300 font-mono">{featured.participant_count ?? 0} participantes</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.06] p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-lg transition-all',
              activeTab === tab.id
                ? 'bg-white dark:bg-[#0d0d0d] text-black dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaign Cards */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07]">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <Target size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhuma campanha encontrada</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'available' ? 'Não há novas campanhas disponíveis no momento.'
              : activeTab === 'active' ? 'Você não está participando de nenhuma campanha ativa.'
              : 'Você não possui campanhas concluídas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const isParticipant = c.is_participant;

            return (
              <div
                key={c.id}
                className="bg-white dark:bg-[#0d0d0d] rounded-2xl border border-gray-100 dark:border-white/[0.07] overflow-hidden flex flex-col hover:border-[#10B981]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#10B981]/5"
              >
                {/* Image */}
                <div className="relative h-36 overflow-hidden">
                  {c.banner_url ? (
                    <img src={c.banner_url} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#10B981]/20 to-emerald-900/40 flex items-center justify-center">
                      <Target size={28} className="text-[#10B981]/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {c.is_featured && (
                    <span className="absolute top-3 left-3 bg-[#10B981] text-black text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                      Destaque
                    </span>
                  )}
                  {isParticipant && c.status === 'inactive' && (
                    <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={9} /> Concluído
                    </span>
                  )}
                  <h3 className="absolute bottom-3 left-4 right-4 text-sm font-bold text-white leading-tight">
                    {c.title}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col gap-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {c.description ?? ''}
                  </p>

                  {/* Details */}
                  <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Trophy size={12} className="text-[#10B981] shrink-0" />
                      <span className="text-gray-500 shrink-0">Prêmio:</span>
                      <span className="font-semibold text-black dark:text-white truncate">{c.prize ?? '—'}</span>
                    </div>
                    {c.end_date && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar size={12} className="text-[#10B981] shrink-0" />
                        <span className="text-gray-500 shrink-0">Até:</span>
                        <span className="font-semibold text-black dark:text-white font-mono">
                          {new Date(c.end_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      <Users size={12} className="text-[#10B981] shrink-0" />
                      <span className="text-gray-500 shrink-0">Participantes:</span>
                      <span className="font-semibold text-black dark:text-white font-mono">
                        {c.participant_count ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto flex gap-2">
                    {isParticipant ? (
                      <button
                        onClick={() => setSelectedCampaign(c)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] rounded-xl text-xs font-bold transition-all"
                      >
                        <Trophy size={13} /> Ver Detalhes
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(c.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-black rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-[#10B981]/20"
                      >
                        Participar <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0d0d0d] w-full max-w-lg border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/20 rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">{selectedCampaign.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Detalhes da Campanha</p>
              </div>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-black dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Info */}
              <div className="bg-gray-50 dark:bg-white/[0.03] rounded-2xl p-4 border border-gray-100 dark:border-white/[0.07] space-y-3">
                {[
                  { label: 'Prêmio',         value: selectedCampaign.prize ?? '—' },
                  { label: 'Participantes',   value: `${selectedCampaign.participant_count ?? 0}` },
                  { label: 'Encerra',         value: selectedCampaign.end_date ? new Date(selectedCampaign.end_date).toLocaleDateString('pt-BR') : '—' },
                  { label: 'Status',          value: selectedCampaign.status === 'active' ? 'Ativa' : 'Inativa' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-400">{row.label}</span>
                    <span className="text-sm font-semibold text-black dark:text-white">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Leaderboard placeholder */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-[#10B981]" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ranking de Participantes</p>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">
                  Para manter a privacidade, o ranking exibe apenas o ID do aluno.
                </p>
                <div className="py-8 text-center bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/[0.07]">
                  <Medal size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Ranking disponível em breve</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
