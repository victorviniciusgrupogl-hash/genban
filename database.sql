-- =============================================================
-- GERENCIADOR DE BANCA — Supabase SQL Schema
-- Execute este arquivo no SQL Editor do seu projeto Supabase
-- =============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- TABELAS
-- =============================================================

-- Perfis de usuários (espelha auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name          TEXT        NOT NULL DEFAULT '',
  email         TEXT        NOT NULL DEFAULT '',
  role          TEXT        NOT NULL DEFAULT 'student'
                              CHECK (role IN ('admin', 'expert', 'student')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Experts
CREATE TABLE IF NOT EXISTS public.experts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  bio             TEXT,
  specialties     TEXT[],

  -- Personalização da área do aluno
  layout_preset       TEXT DEFAULT 'tecnologico'
                        CHECK (layout_preset IN ('tecnologico', 'profissional', 'classico', 'moderno')),
  primary_color       TEXT DEFAULT '#10B981',
  secondary_color     TEXT DEFAULT '#059669',
  background_color    TEXT DEFAULT '#050505',
  sidebar_color       TEXT DEFAULT '#0d0d0d',
  card_color          TEXT DEFAULT '#111111',
  text_color          TEXT DEFAULT '#ffffff',
  logo_url            TEXT,
  brand_name          TEXT DEFAULT 'TradePro',
  custom_message      TEXT DEFAULT 'Bom dia! Fique atento ao gerenciamento.',

  -- Status
  status          TEXT DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Alunos
CREATE TABLE IF NOT EXISTS public.students (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  expert_id         UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  student_code      TEXT UNIQUE,
  initial_balance   DECIMAL(15,2) DEFAULT 0,
  current_balance   DECIMAL(15,2) DEFAULT 0,
  daily_goal        DECIMAL(15,2) DEFAULT 0,
  daily_loss_limit  DECIMAL(15,2) DEFAULT 0,
  weekly_goal       DECIMAL(15,2) DEFAULT 0,
  monthly_goal      DECIMAL(15,2) DEFAULT 0,
  status            TEXT DEFAULT 'active'
                      CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Operações / Transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'win', 'loss')),
  asset         TEXT,
  entry_value   DECIMAL(15,2),
  result_value  DECIMAL(15,2) NOT NULL,
  description   TEXT,
  operated_at   DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Campanhas
CREATE TABLE IF NOT EXISTS public.campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id        UUID REFERENCES public.experts(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  banner_url       TEXT,
  prize            TEXT,
  start_date       DATE,
  end_date         DATE,
  is_featured      BOOLEAN DEFAULT FALSE,
  max_participants INT,
  status           TEXT DEFAULT 'active'
                     CHECK (status IN ('active', 'inactive', 'draft')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Participantes de Campanha
CREATE TABLE IF NOT EXISTS public.campaign_participants (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id  UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  student_id   UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, student_id)
);

-- Eventos de Calendário
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id    UUID REFERENCES public.experts(id) ON DELETE CASCADE,
  student_id   UUID REFERENCES public.students(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  event_date   DATE NOT NULL,
  event_time   TIME,
  type         TEXT DEFAULT 'event'
                 CHECK (type IN ('event', 'signal', 'trade', 'meeting', 'news')),
  is_public    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT,
  type       TEXT DEFAULT 'info'
               CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;

-- ---- Profiles ----
DROP POLICY IF EXISTS "Usuário vê o próprio perfil" ON public.profiles;
CREATE POLICY "Usuário vê o próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuário atualiza o próprio perfil" ON public.profiles;
CREATE POLICY "Usuário atualiza o próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin gerencia todos os perfis" ON public.profiles;
CREATE POLICY "Admin gerencia todos os perfis" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ---- Experts ----
DROP POLICY IF EXISTS "Autenticados veem experts ativos" ON public.experts;
CREATE POLICY "Autenticados veem experts ativos" ON public.experts
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Expert atualiza próprio registro" ON public.experts;
CREATE POLICY "Expert atualiza próprio registro" ON public.experts
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin gerencia experts" ON public.experts;
CREATE POLICY "Admin gerencia experts" ON public.experts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---- Students ----
DROP POLICY IF EXISTS "Aluno vê próprio registro" ON public.students;
CREATE POLICY "Aluno vê próprio registro" ON public.students
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Expert vê seus alunos" ON public.students;
CREATE POLICY "Expert vê seus alunos" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.experts e
      WHERE e.id = students.expert_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Expert atualiza seus alunos" ON public.students;
CREATE POLICY "Expert atualiza seus alunos" ON public.students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.experts e
      WHERE e.id = students.expert_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin gerencia todos os alunos" ON public.students;
CREATE POLICY "Admin gerencia todos os alunos" ON public.students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---- Transactions ----
DROP POLICY IF EXISTS "Aluno gerencia próprias operações" ON public.transactions;
CREATE POLICY "Aluno gerencia próprias operações" ON public.transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = transactions.student_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Expert vê operações de seus alunos" ON public.transactions;
CREATE POLICY "Expert vê operações de seus alunos" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.experts e ON e.id = s.expert_id
      WHERE s.id = transactions.student_id AND e.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin vê todas as operações" ON public.transactions;
CREATE POLICY "Admin vê todas as operações" ON public.transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---- Campaigns ----
DROP POLICY IF EXISTS "Autenticados veem campanhas ativas" ON public.campaigns;
CREATE POLICY "Autenticados veem campanhas ativas" ON public.campaigns
  FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

DROP POLICY IF EXISTS "Expert gerencia próprias campanhas" ON public.campaigns;
CREATE POLICY "Expert gerencia próprias campanhas" ON public.campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = campaigns.expert_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin gerencia todas as campanhas" ON public.campaigns;
CREATE POLICY "Admin gerencia todas as campanhas" ON public.campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ---- Campaign Participants ----
DROP POLICY IF EXISTS "Aluno gerencia próprias participações" ON public.campaign_participants;
CREATE POLICY "Aluno gerencia próprias participações" ON public.campaign_participants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.students WHERE id = campaign_participants.student_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Expert vê participantes" ON public.campaign_participants;
CREATE POLICY "Expert vê participantes" ON public.campaign_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      JOIN public.experts e ON e.id = c.expert_id
      WHERE c.id = campaign_participants.campaign_id AND e.user_id = auth.uid()
    )
  );

-- ---- Calendar Events ----
DROP POLICY IF EXISTS "Autenticados veem eventos públicos" ON public.calendar_events;
CREATE POLICY "Autenticados veem eventos públicos" ON public.calendar_events
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      is_public = TRUE
      OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
      OR expert_id IN (SELECT id FROM public.experts WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Expert gerencia próprios eventos" ON public.calendar_events;
CREATE POLICY "Expert gerencia próprios eventos" ON public.calendar_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.experts WHERE id = calendar_events.expert_id AND user_id = auth.uid())
  );

-- ---- Notifications ----
DROP POLICY IF EXISTS "Usuário gerencia próprias notificações" ON public.notifications;
CREATE POLICY "Usuário gerencia próprias notificações" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- =============================================================
-- FUNÇÕES E TRIGGERS
-- =============================================================

-- Cria perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualiza campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at  ON public.profiles;
DROP TRIGGER IF EXISTS trg_experts_updated_at   ON public.experts;
DROP TRIGGER IF EXISTS trg_students_updated_at  ON public.students;
DROP TRIGGER IF EXISTS trg_campaigns_updated_at ON public.campaigns;

CREATE TRIGGER trg_profiles_updated_at  BEFORE UPDATE ON public.profiles  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_experts_updated_at   BEFORE UPDATE ON public.experts   FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_students_updated_at  BEFORE UPDATE ON public.students  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Gera código único para aluno
CREATE OR REPLACE FUNCTION public.generate_student_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_code IS NULL THEN
    NEW.student_code := 'TRD-' || UPPER(SUBSTRING(MD5(NEW.id::TEXT), 1, 4));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_code ON public.students;
CREATE TRIGGER trg_student_code
  BEFORE INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.generate_student_code();

-- =============================================================
-- USUÁRIO ADMINISTRADOR INICIAL
-- Email: bullexchatgpt@gmail.com
-- Senha: grupoGL2026
-- Com este login é possível criar outros usuários como admin
-- =============================================================

DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'bullexchatgpt@gmail.com';

  IF v_admin_id IS NULL THEN
    v_admin_id := uuid_generate_v4();

    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, aud, role,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'bullexchatgpt@gmail.com',
      crypt('grupoGL2026', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Administrador", "role": "admin"}',
      NOW(), NOW(), 'authenticated', 'authenticated',
      '', '', '', ''
    );
  END IF;

  -- Garante perfil admin
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (v_admin_id, 'Administrador', 'bullexchatgpt@gmail.com', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', name = 'Administrador';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Aviso: %', SQLERRM;
END;
$$;

-- =============================================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role          ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_experts_user_id         ON public.experts(user_id);
CREATE INDEX IF NOT EXISTS idx_students_expert_id      ON public.students(expert_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id        ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_student    ON public.transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON public.transactions(operated_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_expert        ON public.campaigns(expert_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_featured      ON public.campaigns(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_cal_events_date         ON public.calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON public.notifications(user_id, is_read);

-- =============================================================
-- FIM DO SCRIPT
-- =============================================================
