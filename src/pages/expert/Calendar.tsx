import { useState, useEffect } from 'react';
import {
  ChevronDown, Plus, Calendar as CalendarIcon, X,
  TrendingUp, Users, Megaphone, Coffee, Globe,
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useExpertProfile } from '@/hooks/useExpertData';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const EVENT_TYPES = [
  { value: 'signal',  label: 'Sinal',    icon: TrendingUp,  color: 'text-[#10B981]',  bg: 'bg-[#10B981]/10',  border: 'border-[#10B981]/20' },
  { value: 'trade',   label: 'Trade',    icon: TrendingUp,  color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  { value: 'meeting', label: 'Reunião',  icon: Users,       color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  { value: 'news',    label: 'Notícia',  icon: Globe,       color: 'text-amber-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  { value: 'event',   label: 'Evento',   icon: Coffee,      color: 'text-pink-500',   bg: 'bg-pink-500/10',   border: 'border-pink-500/20' },
];

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  type: string;
  is_public: boolean;
}

export default function ExpertCalendar() {
  const { expert, loading: expertLoading } = useExpertProfile();
  const [events, setEvents]       = useState<CalendarEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  // New event form
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    event_time: '',
    type: 'signal',
    is_public: true,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!expert) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('expert_id', expert.id)
        .order('event_date', { ascending: true });
      setEvents(data ?? []);
      setLoading(false);
    })();
  }, [expert]);

  const getDayEvents = (date: Date) =>
    events.filter(e => isSameDay(new Date(e.event_date + 'T12:00:00'), date));

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

  const selectedDayEvents = selectedDay ? getDayEvents(selectedDay) : [];

  const openAddEvent = () => {
    setForm({
      title: '',
      description: '',
      event_date: selectedDay ? format(selectedDay, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      event_time: '',
      type: 'signal',
      is_public: true,
    });
    setFormError('');
    setShowModal(true);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) { setFormError('Título é obrigatório.'); return; }
    if (!expert) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        expert_id:   expert.id,
        title:       form.title.trim(),
        description: form.description.trim() || null,
        event_date:  form.event_date,
        event_time:  form.event_time || null,
        type:        form.type,
        is_public:   form.is_public,
      })
      .select()
      .single();
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    if (data) setEvents(prev => [...prev, data].sort((a, b) => a.event_date.localeCompare(b.event_date)));
    setShowModal(false);
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('calendar_events').delete().eq('id', id);
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const getTypeMeta = (type: string) => EVENT_TYPES.find(t => t.value === type) ?? EVENT_TYPES[4];

  if (expertLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-black dark:text-white">Calendário</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Gerencie sinais, eventos e reuniões para seus alunos
          </p>
        </div>
        <button
          onClick={openAddEvent}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#10B981]/20 transition-all"
        >
          <Plus size={14} /> Novo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5">
          {/* Month nav */}
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

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {allDays.map((day, idx) => {
              const inMonth  = isSameMonth(day, currentDate);
              const dayEvts  = getDayEvents(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'relative aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-bold',
                    !inMonth && 'opacity-25',
                    isSelected   && 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/30',
                    !isSelected  && isCurrentDay && 'ring-1 ring-[#10B981]/40 text-[#10B981]',
                    !isSelected  && dayEvts.length > 0 && !isCurrentDay && 'text-black dark:text-white',
                    !isSelected  && dayEvts.length === 0 && !isCurrentDay && 'text-gray-500 dark:text-gray-400',
                    !isSelected  && 'hover:bg-gray-100 dark:hover:bg-white/[0.04]'
                  )}
                >
                  <span>{format(day, 'd')}</span>
                  {dayEvts.length > 0 && !isSelected && (
                    <div className="flex gap-0.5 flex-wrap justify-center">
                      {dayEvts.slice(0, 3).map(e => {
                        const meta = getTypeMeta(e.type);
                        return (
                          <span key={e.id} className={cn('w-1.5 h-1.5 rounded-full', meta.bg.replace('/10', ''), 'bg-opacity-100')}
                            style={{ background: e.type === 'signal' ? '#10B981' : e.type === 'trade' ? '#3b82f6' : e.type === 'meeting' ? '#8b5cf6' : e.type === 'news' ? '#f59e0b' : '#ec4899' }}
                          />
                        );
                      })}
                    </div>
                  )}
                  {dayEvts.length > 0 && isSelected && (
                    <span className="text-[8px] font-black text-white/70">{dayEvts.length}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: selected day or upcoming */}
        <div className="bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/[0.06] rounded-2xl p-5 overflow-y-auto" style={{ maxHeight: 480 }}>
          {selectedDay ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-black dark:text-white capitalize">
                    {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {selectedDayEvents.length} evento{selectedDayEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={openAddEvent} className="w-8 h-8 rounded-xl bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 flex items-center justify-center transition-all">
                  <Plus size={14} />
                </button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarIcon size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">Nenhum evento neste dia</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map(evt => {
                    const meta = getTypeMeta(evt.type);
                    return (
                      <div key={evt.id} className={cn('rounded-xl p-3 border', meta.bg, meta.border)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <meta.icon size={11} className={meta.color} />
                              <span className={cn('text-[9px] font-black uppercase tracking-wider', meta.color)}>{meta.label}</span>
                              {evt.is_public && <span className="text-[8px] font-bold text-gray-400 bg-gray-100 dark:bg-white/[0.05] px-1 py-0.5 rounded">público</span>}
                            </div>
                            <p className="text-xs font-bold text-black dark:text-white truncate">{evt.title}</p>
                            {evt.description && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{evt.description}</p>}
                            {evt.event_time && <p className="text-[10px] font-mono text-gray-400 mt-1">{evt.event_time}</p>}
                          </div>
                          <button
                            onClick={() => deleteEvent(evt.id)}
                            className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center transition-all shrink-0"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xs font-black text-black dark:text-white mb-3 uppercase tracking-wider">Próximos Eventos</h3>
              {events.filter(e => new Date(e.event_date + 'T12:00:00') >= new Date()).slice(0, 8).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CalendarIcon size={24} className="text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">Nenhum evento futuro</p>
                  <button onClick={openAddEvent} className="mt-3 text-[10px] text-[#10B981] font-bold hover:underline">+ Criar evento</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {events
                    .filter(e => new Date(e.event_date + 'T12:00:00') >= new Date())
                    .slice(0, 8)
                    .map(evt => {
                      const meta = getTypeMeta(evt.type);
                      return (
                        <div key={evt.id} className={cn('rounded-xl p-3 border', meta.bg, meta.border)}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <meta.icon size={10} className={meta.color} />
                            <span className={cn('text-[9px] font-black uppercase tracking-wider', meta.color)}>{meta.label}</span>
                          </div>
                          <p className="text-[11px] font-bold text-black dark:text-white">{evt.title}</p>
                          <p className="text-[9px] font-mono text-gray-400 mt-0.5">
                            {format(new Date(evt.event_date + 'T12:00:00'), "d 'de' MMM", { locale: ptBR })}
                            {evt.event_time && ` • ${evt.event_time}`}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {EVENT_TYPES.map(t => (
          <div key={t.value} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: t.value === 'signal' ? '#10B981' : t.value === 'trade' ? '#3b82f6' : t.value === 'meeting' ? '#8b5cf6' : t.value === 'news' ? '#f59e0b' : '#ec4899' }} />
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-black dark:text-white">Novo Evento</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/[0.05] text-gray-400 hover:text-gray-600 dark:hover:text-white flex items-center justify-center">
                <X size={14} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-4 py-2.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">{formError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Sinal EUR/USD"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Data *</label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-black dark:text-white focus:outline-none focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Hora</label>
                  <input
                    type="time"
                    value={form.event_time}
                    onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-black dark:text-white focus:outline-none focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Tipo</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {EVENT_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      className={cn(
                        'px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all',
                        form.type === t.value ? `${t.bg} ${t.color} ${t.border} border` : 'bg-gray-100 dark:bg-white/[0.05] text-gray-400 border border-transparent'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhes do evento (opcional)"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#10B981]/40 focus:ring-1 focus:ring-[#10B981]/20 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
                  className={cn(
                    'w-9 h-5 rounded-full transition-all relative shrink-0',
                    form.is_public ? 'bg-[#10B981]' : 'bg-gray-200 dark:bg-white/[0.10]'
                  )}
                >
                  <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all', form.is_public ? 'left-4' : 'left-0.5')} />
                </button>
                <span className="text-xs text-gray-600 dark:text-gray-400">Visível para alunos</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={saveEvent}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-[#10B981]/20 transition-all"
              >
                {saving ? 'Salvando...' : 'Salvar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
