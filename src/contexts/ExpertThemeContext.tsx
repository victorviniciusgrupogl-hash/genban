import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type LayoutPreset = 'tecnologico' | 'profissional' | 'classico' | 'moderno';

export interface ExpertTheme {
  layoutPreset:    LayoutPreset;
  primaryColor:    string;
  secondaryColor:  string;
  backgroundColor: string;
  sidebarColor:    string;
  cardColor:       string;
  textColor:       string;
  brandName:       string;
  logoUrl:         string;
  customMessage:   string;
}

export const defaults: ExpertTheme = {
  layoutPreset:    'tecnologico',
  primaryColor:    '#10B981',
  secondaryColor:  '#059669',
  backgroundColor: '#050505',
  sidebarColor:    '#0a0a0a',
  cardColor:       '#0d0d0d',
  textColor:       '#ffffff',
  brandName:       'TradePro',
  logoUrl:         '',
  customMessage:   'Fique atento ao gerenciamento de banca!',
};

function expertRowToTheme(row: any): ExpertTheme {
  return {
    layoutPreset:    row.layout_preset    ?? defaults.layoutPreset,
    primaryColor:    row.primary_color    ?? defaults.primaryColor,
    secondaryColor:  row.secondary_color  ?? defaults.secondaryColor,
    backgroundColor: row.background_color ?? defaults.backgroundColor,
    sidebarColor:    row.sidebar_color    ?? defaults.sidebarColor,
    cardColor:       row.card_color       ?? defaults.cardColor,
    textColor:       row.text_color       ?? defaults.textColor,
    brandName:       row.brand_name       ?? defaults.brandName,
    logoUrl:         row.logo_url         ?? '',
    customMessage:   row.custom_message   ?? defaults.customMessage,
  };
}

interface ExpertThemeCtx {
  theme:   ExpertTheme;
  loading: boolean;
  setTheme: (t: ExpertTheme) => void;
}

const Ctx = createContext<ExpertThemeCtx>({ theme: defaults, loading: false, setTheme: () => {} });

const THEME_FIELDS = 'layout_preset,primary_color,secondary_color,background_color,sidebar_color,card_color,text_color,logo_url,brand_name,custom_message';

export function ExpertThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ExpertTheme>(() => {
    try {
      const saved = localStorage.getItem('expertTheme');
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
      return defaults;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadFromDB = async () => {
      setLoading(true);

      // ── Priority 1: URL param expertId (iframe / unauthenticated preview) ──
      // Works with anon role after running database_patch3.sql
      const urlParams = new URLSearchParams(window.location.search);
      const expertIdParam = urlParams.get('expertId');

      if (expertIdParam) {
        // Try by affiliate_id first, then by UUID
        const { data: byAffiliate } = await supabase
          .from('experts')
          .select(THEME_FIELDS)
          .eq('affiliate_id', expertIdParam)
          .maybeSingle();

        const expertRow = byAffiliate ?? await supabase
          .from('experts')
          .select(THEME_FIELDS)
          .eq('id', expertIdParam)
          .maybeSingle()
          .then(r => r.data);

        if (expertRow && !cancelled) {
          setThemeState(expertRowToTheme(expertRow));
          setLoading(false);
          return; // theme loaded from URL param — done
        }
      }

      // ── Priority 2: authenticated user (student or expert) ──
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || cancelled) { setLoading(false); return; }

      if (profile.role === 'student') {
        const { data: studentRow } = await supabase
          .from('students')
          .select('expert_id')
          .eq('user_id', user.id)
          .single();

        if (studentRow?.expert_id && !cancelled) {
          const { data: expertRow } = await supabase
            .from('experts')
            .select(THEME_FIELDS)
            .eq('id', studentRow.expert_id)
            .single();

          if (expertRow && !cancelled) {
            setThemeState(expertRowToTheme(expertRow));
          }
        }
      } else if (profile.role === 'expert') {
        const { data: expertRow } = await supabase
          .from('experts')
          .select(THEME_FIELDS)
          .eq('user_id', user.id)
          .single();

        if (expertRow && !cancelled) {
          const dbTheme = expertRowToTheme(expertRow);
          setThemeState(dbTheme);
          localStorage.setItem('expertTheme', JSON.stringify(dbTheme));
        }
      }

      if (!cancelled) setLoading(false);
    };

    loadFromDB();
    return () => { cancelled = true; };
  }, []);

  /** Saves theme locally AND persists to Supabase experts table */
  const setTheme = async (t: ExpertTheme) => {
    setThemeState(t);
    localStorage.setItem('expertTheme', JSON.stringify(t));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: expertRow } = await supabase
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (expertRow) {
      await supabase.from('experts').update({
        layout_preset:    t.layoutPreset,
        primary_color:    t.primaryColor,
        secondary_color:  t.secondaryColor,
        background_color: t.backgroundColor,
        sidebar_color:    t.sidebarColor,
        card_color:       t.cardColor,
        text_color:       t.textColor,
        logo_url:         t.logoUrl || null,
        brand_name:       t.brandName,
        custom_message:   t.customMessage,
      }).eq('id', expertRow.id);
    }
  };

  return (
    <Ctx.Provider value={{ theme, loading, setTheme }}>
      {children}
    </Ctx.Provider>
  );
}

export const useExpertTheme = () => useContext(Ctx);
