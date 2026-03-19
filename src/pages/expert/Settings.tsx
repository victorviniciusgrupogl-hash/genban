import { useState, ChangeEvent } from 'react';
import {
  Save, Palette, Code, Bell, AlertTriangle, Image as ImageIcon,
  Check, Copy, Eye, Layers, LayoutDashboard, Monitor,
  Cpu, Briefcase, BookOpen, Zap, ChevronRight, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpertTheme, ExpertTheme, LayoutPreset, defaults } from '@/contexts/ExpertThemeContext';
import { useExpertProfile } from '@/hooks/useExpertData';

/* ─── helpers ──────────────────────────────────────────────── */
const inputCls = 'w-full bg-[#111] border border-white/[0.08] text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-[#10B981]/30 focus:border-[#10B981]/60 outline-none text-sm transition-all placeholder:text-gray-700';
const labelCls = 'block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5';

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.07] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
          <Icon size={14} className="text-[#10B981]" />
        </div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ColorPicker({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-2.5">
        {/* Swatch with checkerboard for transparent detection */}
        <div
          className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10"
          style={{ backgroundImage: 'repeating-conic-gradient(#222 0% 25%, #333 0% 50%)', backgroundSize: '8px 8px' }}
        >
          <input
            type="color"
            name={name}
            value={value}
            onChange={onChange}
            className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0 opacity-0 z-10"
          />
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" style={{ backgroundColor: value }} />
        </div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className={cn(inputCls, 'font-mono text-[#10B981] flex-1')}
          maxLength={7}
        />
      </div>
    </div>
  );
}

/* Layout preset cards */
const LAYOUT_PRESETS: { id: LayoutPreset; label: string; icon: React.ElementType; desc: string; preview: string }[] = [
  {
    id: 'tecnologico', label: 'Tecnológico', icon: Cpu, desc: 'Dark, neon, sidebar compacta',
    preview: 'bg-[#050505] border-[#10B981]/30',
  },
  {
    id: 'profissional', label: 'Profissional', icon: Briefcase, desc: 'Corporativo, sidebar larga',
    preview: 'bg-[#0d0d0d] border-blue-500/30',
  },
  {
    id: 'classico', label: 'Clássico', icon: BookOpen, desc: 'Menu superior horizontal',
    preview: 'bg-[#111] border-purple-500/30',
  },
  {
    id: 'moderno', label: 'Moderno', icon: Zap, desc: 'Glassmorphism, ícones, flutuante',
    preview: 'bg-[#080808] border-pink-500/30',
  },
];

/* Mini preview of student layout */
function LayoutPreview({ theme }: { theme: ExpertTheme }) {
  const p = theme.primaryColor;
  const navIcons = [LayoutDashboard, null, null, null, null];

  const renderSidebar = () => (
    <div className="flex flex-col w-14 shrink-0 border-r py-2 gap-1.5 items-center" style={{ background: theme.sidebarColor, borderColor: `${p}20` }}>
      <div className="w-6 h-6 rounded-md flex items-center justify-center mb-1" style={{ background: `${p}30` }}>
        <div className="w-2 h-2 rounded-sm" style={{ background: p }} />
      </div>
      {[0,1,2,3,4].map(i => (
        <div key={i} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: i===0 ? `${p}20` : 'rgba(255,255,255,0.03)', border: i===0 ? `1px solid ${p}40` : '1px solid transparent' }}>
          <div className="w-2 h-2 rounded-sm" style={{ background: i===0 ? p : '#444' }} />
        </div>
      ))}
    </div>
  );

  const renderTopNav = () => (
    <div className="h-7 flex items-center px-3 gap-2 shrink-0 border-b" style={{ background: theme.sidebarColor, borderColor: `${p}20` }}>
      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: `${p}30` }}>
        <div className="w-1.5 h-1.5 rounded-sm" style={{ background: p }} />
      </div>
      {[0,1,2,3,4].map(i => (
        <div key={i} className="px-2 py-0.5 rounded text-[5px] font-bold" style={{ background: i===0 ? `${p}20` : 'transparent', color: i===0 ? p : '#666' }}>nav</div>
      ))}
    </div>
  );

  const renderIconSidebar = () => (
    <div className="flex flex-col w-9 shrink-0 border-r py-2 gap-1.5 items-center" style={{ background: `${theme.sidebarColor}cc`, borderColor: `${p}20` }}>
      <div className="w-5 h-5 rounded flex items-center justify-center mb-1" style={{ background: `${p}30` }}>
        <div className="w-1.5 h-1.5 rounded-sm" style={{ background: p }} />
      </div>
      {[0,1,2,3,4].map(i => (
        <div key={i} className="w-5 h-5 rounded flex items-center justify-center" style={{ background: i===0 ? `${p}25` : 'rgba(255,255,255,0.04)', border: i===0 ? `1px solid ${p}40` : '1px solid transparent' }}>
          <div className="w-1.5 h-1.5 rounded-sm" style={{ background: i===0 ? p : '#444' }} />
        </div>
      ))}
    </div>
  );

  const renderContent = () => (
    <div className="flex-1 p-2 overflow-hidden">
      <div className="grid grid-cols-3 gap-1 mb-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="h-5 rounded-md" style={{ background: theme.cardColor, border: `1px solid ${p}15` }}>
            <div className="m-1 h-1 rounded-sm" style={{ background: i===0 ? `${p}50` : '#333' }} />
          </div>
        ))}
      </div>
      <div className="h-10 rounded-md mb-1.5" style={{ background: theme.cardColor, border: `1px solid ${p}12` }}>
        <div className="m-2 h-1.5 rounded-sm w-3/4" style={{ background: `${p}30` }} />
        <div className="mx-2 h-1 rounded-sm w-1/2" style={{ background: '#333' }} />
      </div>
      <div className="h-8 rounded-md" style={{ background: theme.cardColor, border: `1px solid ${p}12` }}>
        <div className="m-1.5 h-1 rounded-sm" style={{ background: '#333' }} />
        <div className="mx-1.5 h-1 rounded-sm w-2/3" style={{ background: '#2a2a2a' }} />
      </div>
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 h-36" style={{ background: theme.backgroundColor }}>
      {/* Header bar */}
      <div className="h-5 flex items-center px-2 gap-1 border-b border-white/5" style={{ background: `${theme.sidebarColor}99` }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: p }} />
        <div className="flex-1 h-1 rounded-full bg-white/5" />
        <div className="text-[5px] text-gray-700 font-mono">{theme.brandName}</div>
      </div>

      <div className="flex h-[calc(100%-20px)]">
        {theme.layoutPreset === 'classico' && (
          <div className="flex flex-col flex-1">
            {renderTopNav()}
            {renderContent()}
          </div>
        )}
        {theme.layoutPreset === 'tecnologico' && <>{renderSidebar()}{renderContent()}</>}
        {theme.layoutPreset === 'profissional' && (
          <>
            <div className="flex flex-col w-16 shrink-0 border-r py-2 gap-1 px-1.5" style={{ background: theme.sidebarColor, borderColor: `${p}20` }}>
              <div className="w-full h-5 rounded flex items-center gap-1 px-1" style={{ background: `${p}20`, border: `1px solid ${p}30` }}>
                <div className="w-1.5 h-1.5 rounded-sm" style={{ background: p }} />
                <div className="h-1 flex-1 rounded-sm" style={{ background: `${p}50` }} />
              </div>
              {[1,2,3,4].map(i => (
                <div key={i} className="w-full h-5 rounded flex items-center gap-1 px-1" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-1.5 h-1.5 rounded-sm bg-gray-700" />
                  <div className="h-1 flex-1 rounded-sm bg-[#2a2a2a]" />
                </div>
              ))}
            </div>
            {renderContent()}
          </>
        )}
        {theme.layoutPreset === 'moderno' && <>{renderIconSidebar()}{renderContent()}</>}
      </div>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────── */
export default function ExpertSettings() {
  const { theme, setTheme } = useExpertTheme();
  const { expert } = useExpertProfile();
  const [saved, setSaved]   = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Local draft of theme (only committed on Save)
  const [draft, setDraft] = useState<ExpertTheme>(() => ({ ...theme }));

  const handleField = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDraft(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setTheme(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetTheme = () => {
    setDraft({ ...defaults });
  };

  const handleViewAsStudent = () => {
    // Open the branded login page with expertId — the theme loads from URL param
    window.open(loginUrl, '_blank');
  };

  // Use affiliate_id if set, otherwise fall back to expert UUID
  const expertIdentifier = expert?.affiliate_id || expert?.id || 'EXP-0000';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const loginUrl = `${baseUrl}/login?expertId=${expertIdentifier}`;
  const embedCode = `<iframe\n  src="${loginUrl}"\n  width="100%"\n  height="800"\n  style="border:none;border-radius:16px"\n  allow="fullscreen"\n  title="${draft.brandName} — Área do Aluno"\n></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Configurações do Expert</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Personalize a experiência dos seus alunos em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl transition-all border',
              showPreview
                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            )}
          >
            <Eye size={15} /> Prévia
          </button>
          <button
            onClick={handleSave}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-xl transition-all active:scale-95 shadow-sm whitespace-nowrap',
              saved
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:from-[#059669] hover:to-[#047857] shadow-[#10B981]/20'
            )}
          >
            {saved ? <Check size={15} strokeWidth={2.5} /> : <Save size={15} strokeWidth={2.5} />}
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className={cn('grid gap-6', showPreview ? 'lg:grid-cols-[1fr_360px]' : 'grid-cols-1')}>
        {/* Left column — settings */}
        <div className="space-y-5">

          {/* Layout Preset */}
          <SectionCard title="Layout do Aluno" icon={Layers}>
            <p className="text-xs text-gray-500 mb-4">Escolha o estilo de interface que seus alunos vão ver.</p>
            <div className="grid grid-cols-2 gap-3">
              {LAYOUT_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, layoutPreset: preset.id }))}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
                    draft.layoutPreset === preset.id
                      ? 'border-[#10B981]/50 bg-[#10B981]/[0.08]'
                      : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    draft.layoutPreset === preset.id ? 'bg-[#10B981]/20' : 'bg-white/5'
                  )}>
                    <preset.icon size={16} className={draft.layoutPreset === preset.id ? 'text-[#10B981]' : 'text-gray-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-bold', draft.layoutPreset === preset.id ? 'text-[#10B981]' : 'text-gray-300')}>
                      {preset.label}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{preset.desc}</p>
                  </div>
                  {draft.layoutPreset === preset.id && (
                    <Check size={13} className="text-[#10B981] shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Colors */}
          <SectionCard title="Paleta de Cores" icon={Palette}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorPicker label="Cor Principal / Destaque" name="primaryColor" value={draft.primaryColor} onChange={handleField} />
              <ColorPicker label="Cor Secundária" name="secondaryColor" value={draft.secondaryColor} onChange={handleField} />
              <ColorPicker label="Fundo Geral" name="backgroundColor" value={draft.backgroundColor} onChange={handleField} />
              <ColorPicker label="Fundo Sidebar / Header" name="sidebarColor" value={draft.sidebarColor} onChange={handleField} />
              <ColorPicker label="Fundo dos Cards" name="cardColor" value={draft.cardColor} onChange={handleField} />
              <ColorPicker label="Cor do Texto" name="textColor" value={draft.textColor} onChange={handleField} />
            </div>

            {/* Quick presets */}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className={labelCls}>Temas Rápidos</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Verde Neon', colors: { primaryColor: '#10B981', secondaryColor: '#059669', backgroundColor: '#050505', sidebarColor: '#090909', cardColor: '#0d0d0d', textColor: '#ffffff' } },
                  { label: 'Azul Cyber', colors: { primaryColor: '#3B82F6', secondaryColor: '#2563EB', backgroundColor: '#030712', sidebarColor: '#07101f', cardColor: '#0f172a', textColor: '#f1f5f9' } },
                  { label: 'Roxo Elite', colors: { primaryColor: '#8B5CF6', secondaryColor: '#7C3AED', backgroundColor: '#05030a', sidebarColor: '#0d0814', cardColor: '#110d1a', textColor: '#f5f3ff' } },
                  { label: 'Dourado Pro', colors: { primaryColor: '#F59E0B', secondaryColor: '#D97706', backgroundColor: '#050401', sidebarColor: '#0a0803', cardColor: '#111005', textColor: '#fef3c7' } },
                  { label: 'Vermelho',   colors: { primaryColor: '#EF4444', secondaryColor: '#DC2626', backgroundColor: '#040202', sidebarColor: '#0a0505', cardColor: '#100606', textColor: '#fef2f2' } },
                ].map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setDraft(prev => ({ ...prev, ...preset.colors }))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/[0.07] transition-all"
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: preset.colors.primaryColor }} />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Brand */}
          <SectionCard title="Marca e Identidade" icon={ImageIcon}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nome da Plataforma</label>
                  <input type="text" name="brandName" value={draft.brandName} onChange={handleField} placeholder="TradePro" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Logo URL</label>
                  <input type="url" name="logoUrl" value={draft.logoUrl} onChange={handleField} placeholder="https://..." className={inputCls} />
                  <p className="text-[10px] text-gray-700 mt-1">Aparece no topo do menu dos alunos</p>
                </div>
              </div>
              {draft.logoUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <img src={draft.logoUrl} alt="Logo preview" className="w-10 h-10 rounded-xl object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div>
                    <p className="text-xs font-semibold text-gray-300">Prévia do logo</p>
                    <p className="text-[10px] text-gray-600 truncate max-w-[200px]">{draft.logoUrl}</p>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Aviso */}
          <SectionCard title="Aviso para Alunos" icon={Bell}>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Mensagem no Header</label>
                <p className="text-[10px] text-gray-600 mb-2">Aparece no topo de todas as telas dos alunos.</p>
                <textarea
                  name="customMessage"
                  value={draft.customMessage}
                  onChange={handleField}
                  rows={2}
                  placeholder="Bom dia! Mercado abre em 30min. Cuidado com a volatilidade!"
                  className={cn(inputCls, 'resize-none')}
                />
              </div>
              <div className="bg-red-500/[0.06] rounded-xl border border-red-500/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} className="text-red-400" />
                  <label className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Limite de Loss Global</label>
                </div>
                <p className="text-[10px] text-gray-600 mb-3">Alunos receberão alerta ao atingir este valor de perda diária.</p>
                <div className="relative max-w-xs">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-400/50 text-sm font-mono">R$</span>
                  <input
                    type="number"
                    name="recommendedLossLimit"
                    placeholder="50"
                    className="w-full bg-[#0d0d0d] border border-red-500/30 text-red-400 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none font-mono font-semibold text-sm transition-all"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Embed */}
          <SectionCard title="Link & Integração HTML" icon={Code}>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Link direto para seus alunos</label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={loginUrl}
                    className={cn(inputCls, 'text-[#10B981] font-mono text-xs flex-1')}
                  />
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(loginUrl); }}
                    className="px-3 py-2.5 bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/20 text-[#10B981] rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Código HTML para incorporar</label>
                <p className="text-[10px] text-gray-600 mb-2">Cole no seu site ou landing page.</p>
                <div className="relative bg-[#050505] rounded-xl border border-white/[0.08] overflow-hidden">
                  <pre className="text-[#10B981] font-mono text-xs leading-relaxed overflow-x-auto p-4">{embedCode}</pre>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={cn(
                      'absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                      copied ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/15 text-white'
                    )}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right column — Live Preview */}
        {showPreview && (
          <div className="lg:sticky lg:top-0 lg:self-start space-y-4">
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.07] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                    <Monitor size={14} className="text-[#10B981]" />
                  </div>
                  <h2 className="text-sm font-bold text-white">Prévia do Aluno</h2>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-lg border border-[#10B981]/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Tempo real
                </div>
              </div>
              <div className="p-4">
                <LayoutPreview theme={draft} />

                {/* Color palette display */}
                <div className="mt-4 grid grid-cols-6 gap-1.5">
                  {[
                    { label: 'Principal', value: draft.primaryColor },
                    { label: 'Secundária', value: draft.secondaryColor },
                    { label: 'Fundo', value: draft.backgroundColor },
                    { label: 'Sidebar', value: draft.sidebarColor },
                    { label: 'Card', value: draft.cardColor },
                    { label: 'Texto', value: draft.textColor },
                  ].map(c => (
                    <div key={c.label} className="text-center">
                      <div className="w-full aspect-square rounded-lg border border-white/10 mb-1 ring-1 ring-inset ring-white/10" style={{ background: c.value }} />
                      <p className="text-[8px] text-gray-700 leading-tight truncate">{c.label}</p>
                    </div>
                  ))}
                </div>

                {/* Active layout badge */}
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-[#10B981]/[0.06] border border-[#10B981]/15">
                  {LAYOUT_PRESETS.find(p => p.id === draft.layoutPreset) && (() => {
                    const preset = LAYOUT_PRESETS.find(p => p.id === draft.layoutPreset)!;
                    return (
                      <>
                        <preset.icon size={14} className="text-[#10B981] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#10B981]">{preset.label}</p>
                          <p className="text-[10px] text-gray-600">{preset.desc}</p>
                        </div>
                        <ChevronRight size={12} className="text-[#10B981]/40" />
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/[0.07] p-4 space-y-2">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Ações Rápidas</p>
              <button
                type="button"
                onClick={handleViewAsStudent}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] transition-all group"
              >
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">Ver como aluno</p>
                  <p className="text-[10px] text-gray-700">Abrir preview no modo aluno</p>
                </div>
                <ChevronRight size={13} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
              </button>
              <button
                type="button"
                onClick={handleResetTheme}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-red-500/[0.06] border border-white/[0.07] hover:border-red-500/20 transition-all group"
              >
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-300 group-hover:text-red-400 transition-colors">Resetar tema</p>
                  <p className="text-[10px] text-gray-700">Voltar configurações padrão</p>
                </div>
                <RotateCcw size={13} className="text-gray-700 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
