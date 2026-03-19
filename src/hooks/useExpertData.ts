import { useState, useEffect, useCallback } from 'react';
import { supabase, Expert, Student, Campaign, Transaction } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/* ── current expert profile ──────────────────────────────── */
export function useExpertProfile() {
  const { user } = useAuth();
  const [expert, setExpert]   = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('experts')
        .select('*, profiles(*)')
        .eq('user_id', user.id)
        .single();
      setExpert(data ?? null);
      setLoading(false);
    })();
  }, [user]);

  const updateExpert = async (updates: Partial<Expert>) => {
    if (!expert) return { error: 'No expert loaded' };
    const { data, error } = await supabase
      .from('experts')
      .update(updates)
      .eq('id', expert.id)
      .select()
      .single();
    if (!error && data) setExpert(data);
    return { data, error };
  };

  return { expert, loading, updateExpert };
}

/* ── expert's students ───────────────────────────────────── */
export function useExpertStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: expertRow } = await supabase
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!expertRow) { setLoading(false); return; }

    const { data } = await supabase
      .from('students')
      .select('*, profiles(*)')
      .eq('expert_id', expertRow.id)
      .order('created_at', { ascending: false });

    setStudents(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const addStudent = async (profileId: string) => {
    const { data: expertRow } = await supabase
      .from('experts')
      .select('id')
      .eq('user_id', user?.id ?? '')
      .single();

    if (!expertRow) return { error: 'Expert not found' };

    const { data, error } = await supabase
      .from('students')
      .insert({ user_id: profileId, expert_id: expertRow.id })
      .select('*, profiles(*)')
      .single();

    if (!error && data) setStudents(prev => [data, ...prev]);
    return { data, error };
  };

  const createStudent = async (studentData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    traderId?: string;
    initialBalance?: number;
  }) => {
    // Get the expert record first
    const { data: expertRow } = await supabase
      .from('experts')
      .select('id')
      .eq('user_id', user?.id ?? '')
      .single();
    if (!expertRow) return { error: { message: 'Expert não encontrado' } as any };

    // Use the server-side RPC to create the user (avoids 429 rate limit and session loss)
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_with_role', {
      p_email:        studentData.email,
      p_password:     studentData.password,
      p_name:         studentData.name,
      p_role:         'student',
      p_phone:        studentData.phone ?? '',
      p_affiliate_id: '',
      p_trader_id:    studentData.traderId ?? '',
      p_permissions:  [],
    });

    if (rpcError) return { error: rpcError };
    if (rpcData?.error) return { error: { message: rpcData.error } as any };

    const userId = rpcData?.id;
    if (!userId) return { error: { message: 'Falha ao criar usuário' } as any };

    // Wait briefly for the trigger to run
    await new Promise(r => setTimeout(r, 500));

    // Upsert the student record — the RPC may have already created a row
    // without expert_id; here we set/update all fields including expert linkage
    const { data: stu, error: stuError } = await supabase
      .from('students')
      .upsert({
        user_id:         userId,
        expert_id:       expertRow.id,
        phone:           studentData.phone ?? '',
        trader_id:       studentData.traderId ?? '',
        initial_balance: studentData.initialBalance ?? 0,
        current_balance: studentData.initialBalance ?? 0,
      }, { onConflict: 'user_id' })
      .select('*, profiles(*)')
      .single();

    if (!stuError && stu) setStudents(prev => [stu, ...prev]);
    return { data: stu, error: stuError };
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select('*, profiles(*)')
      .single();
    if (!error && data) setStudents(prev => prev.map(s => s.id === id ? data : s));
    return { data, error };
  };

  const removeStudent = async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (!error) setStudents(prev => prev.filter(s => s.id !== id));
    return { error };
  };

  return { students, loading, addStudent, createStudent, updateStudent, removeStudent, refetch: fetch };
}

/* ── expert's campaigns ──────────────────────────────────── */
export function useExpertCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: expertRow } = await supabase
        .from('experts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!expertRow) { setLoading(false); return; }

      const { data } = await supabase
        .from('campaigns')
        .select('*, campaign_participants(id)')
        .eq('expert_id', expertRow.id)
        .order('created_at', { ascending: false });

      setCampaigns((data ?? []).map(c => ({ ...c, participant_count: (c.campaign_participants ?? []).length })));
      setLoading(false);
    })();
  }, [user]);

  const saveCampaign = async (campaign: Partial<Campaign> & { expert_id: string }) => {
    if (campaign.id) {
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaign)
        .eq('id', campaign.id)
        .select()
        .single();
      if (!error && data) setCampaigns(prev => prev.map(c => c.id === data.id ? { ...data, participant_count: c.participant_count } : c));
      return { data, error };
    } else {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
        .single();
      if (!error && data) setCampaigns(prev => [{ ...data, participant_count: 0 }, ...prev]);
      return { data, error };
    }
  };

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (!error) setCampaigns(prev => prev.filter(c => c.id !== id));
    return { error };
  };

  return { campaigns, loading, saveCampaign, deleteCampaign };
}

/* ── expert dashboard stats ──────────────────────────────── */
export function useExpertStats() {
  const { user } = useAuth();
  const [stats, setStats]   = useState({ totalStudents: 0, activeStudents: 0, totalVolume: 0, avgWinRate: 0 });
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [recentTx, setRecentTx]       = useState<Transaction[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const { data: expertRow } = await supabase
        .from('experts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!expertRow) { setLoading(false); return; }

      const { data: students } = await supabase
        .from('students')
        .select('id, current_balance, initial_balance, status, profiles(name)')
        .eq('expert_id', expertRow.id);

      const active = (students ?? []).filter(s => s.status === 'active');
      const totalVol = (students ?? []).reduce((acc, s) => acc + (s.current_balance ?? 0), 0);

      // Compute per-student win rates from transactions
      const studentIds = (students ?? []).map(s => s.id);
      let txByStudent: Record<string, Transaction[]> = {};

      if (studentIds.length > 0) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .in('student_id', studentIds)
          .in('type', ['win', 'loss']);

        (txs ?? []).forEach(tx => {
          if (!txByStudent[tx.student_id]) txByStudent[tx.student_id] = [];
          txByStudent[tx.student_id].push(tx);
        });
      }

      const studentsWithStats = (students ?? []).map(s => {
        const txs = txByStudent[s.id] ?? [];
        const wins = txs.filter(t => t.type === 'win').length;
        const total = txs.length;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
        const profit = (s.current_balance ?? 0) - (s.initial_balance ?? 0);
        const pct = s.initial_balance > 0 ? ((profit / s.initial_balance) * 100) : 0;
        return { ...s, winRate, profit, pct, displayName: (s as any).profiles?.name ?? 'Aluno' };
      }).sort((a, b) => b.current_balance - a.current_balance);

      const avgWinRate = studentsWithStats.length > 0
        ? Math.round(studentsWithStats.reduce((a, s) => a + s.winRate, 0) / studentsWithStats.length)
        : 0;

      setStats({ totalStudents: (students ?? []).length, activeStudents: active.length, totalVolume: totalVol, avgWinRate });
      setTopStudents(studentsWithStats.slice(0, 5));
      setLoading(false);
    })();
  }, [user]);

  return { stats, topStudents, recentTx, loading };
}
