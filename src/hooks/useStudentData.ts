import { useState, useEffect } from 'react';
import { supabase, Student, Transaction, Campaign, CalendarEvent } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/* ── student profile ─────────────────────────────────────── */
export function useStudentProfile() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*, profiles(*), experts(*)')
        .eq('user_id', user.id)
        .single();
      if (error) setError(error.message);
      else setStudent(data);
      setLoading(false);
    })();
  }, [user]);

  return { student, loading, error };
}

/* ── transactions ────────────────────────────────────────── */
export function useTransactions(studentId?: string, limit = 50) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('student_id', studentId)
        .order('operated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      setTransactions(data ?? []);
      setLoading(false);
    })();
  }, [studentId, limit]);

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('transactions').insert(tx).select().single();
    if (!error && data) {
      setTransactions(prev => [data, ...prev]);
      // update student balance
      if (tx.type === 'win' || tx.type === 'deposit') {
        await supabase.rpc('increment_balance', { p_student_id: tx.student_id, p_amount: tx.result_value });
      } else if (tx.type === 'loss' || tx.type === 'withdrawal') {
        await supabase.rpc('decrement_balance', { p_student_id: tx.student_id, p_amount: tx.result_value });
      }
    }
    return { data, error };
  };

  return { transactions, loading, addTransaction, setTransactions };
}

/* ── campaigns (visible to student) ─────────────────────── */
export function useStudentCampaigns(expertId?: string) {
  const [campaigns, setCampaigns] = useState<(Campaign & { is_participant: boolean })[]>([]);
  const [loading, setLoading]     = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!expertId && !user) return;
    (async () => {
      setLoading(true);

      // Get campaigns
      let q = supabase
        .from('campaigns')
        .select('*, campaign_participants(id, student_id)')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (expertId) q = q.eq('expert_id', expertId);

      const { data: camps } = await q;

      // Get current student id
      const { data: studentRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id ?? '')
        .single();

      const result = (camps ?? []).map(c => ({
        ...c,
        participant_count: (c.campaign_participants ?? []).length,
        is_participant: (c.campaign_participants ?? []).some((p: any) => p.student_id === studentRow?.id),
      }));

      setCampaigns(result);
      setLoading(false);
    })();
  }, [expertId, user]);

  const joinCampaign = async (campaignId: string, studentId: string) => {
    const { error } = await supabase
      .from('campaign_participants')
      .insert({ campaign_id: campaignId, student_id: studentId });
    if (!error) {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, is_participant: true, participant_count: (c.participant_count ?? 0) + 1 } : c));
    }
    return { error };
  };

  return { campaigns, loading, joinCampaign };
}

/* ── calendar events ─────────────────────────────────────── */
export function useCalendarEvents(expertId?: string) {
  const [events, setEvents]   = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (expertId) q = q.eq('expert_id', expertId);
      else {
        // student: get their expert's events
        const { data: st } = await supabase
          .from('students')
          .select('expert_id')
          .eq('user_id', user?.id ?? '')
          .single();
        if (st?.expert_id) q = q.eq('expert_id', st.expert_id).eq('is_public', true);
      }

      const { data } = await q;
      setEvents(data ?? []);
      setLoading(false);
    })();
  }, [expertId, user]);

  const addEvent = async (ev: Omit<CalendarEvent, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('calendar_events').insert(ev).select().single();
    if (!error && data) setEvents(prev => [...prev, data]);
    return { data, error };
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (!error) setEvents(prev => prev.filter(e => e.id !== id));
    return { error };
  };

  return { events, loading, addEvent, deleteEvent, setEvents };
}
