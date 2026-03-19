import { useState, useEffect, useCallback } from 'react';
import { supabase, Expert, Student, Profile } from '@/lib/supabase';

/* ── all experts ─────────────────────────────────────────── */
export function useAdminExperts() {
  const [experts, setExperts] = useState<(Expert & { profiles: Profile; student_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: exps } = await supabase
      .from('experts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false });

    if (!exps) { setLoading(false); return; }

    const ids = exps.map(e => e.id);
    const { data: counts } = await supabase
      .from('students')
      .select('expert_id')
      .in('expert_id', ids);

    const countMap: Record<string, number> = {};
    (counts ?? []).forEach(r => {
      countMap[r.expert_id] = (countMap[r.expert_id] ?? 0) + 1;
    });

    setExperts(exps.map(e => ({
      ...e,
      profiles: e.profiles as Profile,
      student_count: countMap[e.id] ?? 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  /**
   * Cria usuário expert ou admin via função RPC privilegiada (SECURITY DEFINER)
   * Isso evita o problema de 429 (rate limit de email) e perda de sessão admin.
   */
  const createUser = async (profileData: {
    name: string;
    email: string;
    password: string;
    role: 'expert' | 'admin';
    phone?: string;
    affiliateId?: string;
    permissions?: string[];
  }) => {
    const { data, error } = await supabase.rpc('create_user_with_role', {
      p_email:        profileData.email,
      p_password:     profileData.password,
      p_name:         profileData.name,
      p_role:         profileData.role,
      p_phone:        profileData.phone ?? '',
      p_affiliate_id: profileData.affiliateId ?? '',
      p_trader_id:    '',
      p_permissions:  profileData.permissions ?? [],
    });

    if (error) return { error };

    // A função retorna { error: "..." } em caso de falha lógica
    if (data?.error) return { error: { message: data.error } };

    // Recarrega a lista de experts se criou um expert
    if (profileData.role === 'expert') {
      await fetch();
    }

    return { data, error: null };
  };

  const createExpert = (d: { name: string; email: string; password: string }) =>
    createUser({ ...d, role: 'expert' });

  const updateExpert = async (id: string, updates: Partial<Expert>) => {
    const { data, error } = await supabase
      .from('experts')
      .update(updates)
      .eq('id', id)
      .select('*, profiles(*)')
      .single();
    if (!error && data) {
      setExperts(prev => prev.map(e =>
        e.id === id
          ? { ...data, profiles: data.profiles as Profile, student_count: e.student_count }
          : e
      ));
    }
    return { data, error };
  };

  const deleteExpert = async (id: string) => {
    const { error } = await supabase.from('experts').delete().eq('id', id);
    if (!error) setExperts(prev => prev.filter(e => e.id !== id));
    return { error };
  };

  return { experts, loading, createUser, createExpert, updateExpert, deleteExpert, refetch: fetch };
}

/* ── all students ────────────────────────────────────────── */
export function useAdminStudents() {
  const [students, setStudents] = useState<(Student & { profiles: Profile; expert_name?: string })[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('*, profiles(*), experts(id, brand_name, profiles(name))')
      .order('created_at', { ascending: false });

    setStudents((data ?? []).map(s => ({
      ...s,
      profiles:     s.profiles as Profile,
      expert_name:  (s.experts as any)?.profiles?.name ?? (s.experts as any)?.brand_name ?? '—',
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  /**
   * Cria aluno via RPC (campos extras: phone, trader_id)
   */
  const createStudent = async (studentData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    traderId?: string;
    expertId?: string;
  }) => {
    const { data, error } = await supabase.rpc('create_user_with_role', {
      p_email:        studentData.email,
      p_password:     studentData.password,
      p_name:         studentData.name,
      p_role:         'student',
      p_phone:        studentData.phone ?? '',
      p_affiliate_id: '',
      p_trader_id:    studentData.traderId ?? '',
      p_permissions:  [],
    });

    if (error) return { error };
    if (data?.error) return { error: { message: data.error } };

    // Se tiver expert_id, associa o aluno ao expert
    if (studentData.expertId && data?.id) {
      // Busca o student_id recém-criado
      await new Promise(r => setTimeout(r, 500));
      const { data: stuRow } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', data.id)
        .single();
      if (stuRow?.id) {
        await supabase
          .from('students')
          .update({ expert_id: studentData.expertId, phone: studentData.phone ?? '', trader_id: studentData.traderId ?? '' })
          .eq('id', stuRow.id);
      }
    }

    await fetch();
    return { data, error: null };
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select('*, profiles(*), experts(id, brand_name, profiles(name))')
      .single();
    if (!error && data) {
      setStudents(prev => prev.map(s =>
        s.id === id
          ? { ...data, profiles: data.profiles as Profile, expert_name: (data.experts as any)?.profiles?.name ?? '—' }
          : s
      ));
    }
    return { data, error };
  };

  return { students, loading, createStudent, updateStudent, refetch: fetch };
}

/* ── admin dashboard stats ───────────────────────────────── */
export function useAdminStats() {
  const [stats, setStats]   = useState({ experts: 0, students: 0, activeStudents: 0, totalVolume: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ count: expCount }, { count: stuCount }, { data: balances }] = await Promise.all([
        supabase.from('experts').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('students').select('current_balance, status'),
      ]);

      const active = (balances ?? []).filter(s => s.status === 'active').length;
      const vol    = (balances ?? []).reduce((a, s) => a + (s.current_balance ?? 0), 0);

      setStats({ experts: expCount ?? 0, students: stuCount ?? 0, activeStudents: active, totalVolume: vol });
      setLoading(false);
    })();
  }, []);

  return { stats, loading };
}
