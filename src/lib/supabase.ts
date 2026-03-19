import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] ⚠️  Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env\n' +
    'Crie um arquivo .env na raiz do projeto com:\n' +
    '  VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui'
  );
}

export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder'
);

/* ─── Database types ──────────────────────────────────────── */

export interface Profile {
  id:          string;
  name:        string;
  email:       string;
  role:        'admin' | 'expert' | 'student';
  phone:       string | null;
  avatar_url:  string | null;
  permissions: string[];
  created_at:  string;
  updated_at:  string;
}

export interface Expert {
  id:               string;
  user_id:          string;
  bio:              string | null;
  specialties:      string[] | null;
  phone:            string | null;
  affiliate_id:     string | null;
  layout_preset:    'tecnologico' | 'profissional' | 'classico' | 'moderno';
  primary_color:    string;
  secondary_color:  string;
  background_color: string;
  sidebar_color:    string;
  card_color:       string;
  text_color:       string;
  logo_url:         string | null;
  brand_name:       string;
  custom_message:   string | null;
  status:           'active' | 'inactive' | 'suspended';
  created_at:       string;
  updated_at:       string;
  // joined via profiles
  profiles?:        Profile;
}

export interface Student {
  id:               string;
  user_id:          string;
  expert_id:        string | null;
  student_code:     string | null;
  phone:            string | null;
  trader_id:        string | null;
  initial_balance:  number;
  current_balance:  number;
  daily_goal:       number;
  daily_loss_limit: number;
  weekly_goal:      number;
  monthly_goal:     number;
  status:           'active' | 'inactive' | 'suspended';
  created_at:       string;
  updated_at:       string;
  // joined
  profiles?:        Profile;
  experts?:         Expert;
}

export interface Transaction {
  id:           string;
  student_id:   string;
  type:         'deposit' | 'withdrawal' | 'win' | 'loss';
  asset:        string | null;
  entry_value:  number | null;
  result_value: number;
  description:  string | null;
  operated_at:  string;
  created_at:   string;
}

export interface Campaign {
  id:               string;
  expert_id:        string;
  title:            string;
  description:      string | null;
  banner_url:       string | null;
  prize:            string | null;
  start_date:       string | null;
  end_date:         string | null;
  is_featured:      boolean;
  max_participants: number | null;
  status:           'active' | 'inactive' | 'draft';
  created_at:       string;
  updated_at:       string;
  // aggregated
  participant_count?: number;
}

export interface CalendarEvent {
  id:          string;
  expert_id:   string | null;
  student_id:  string | null;
  title:       string;
  description: string | null;
  event_date:  string;
  event_time:  string | null;
  type:        'event' | 'signal' | 'trade' | 'meeting' | 'news';
  is_public:   boolean;
  created_at:  string;
}
