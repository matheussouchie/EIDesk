-- ============================================================
-- TICKET SYSTEM — Supabase Schema
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: profiles (espelho de auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: tickets
-- ============================================================
CREATE TABLE public.tickets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority     TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: ticket_messages
-- ============================================================
CREATE TABLE public.ticket_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tickets_created_by   ON public.tickets(created_by);
CREATE INDEX idx_tickets_status       ON public.tickets(status);
CREATE INDEX idx_tickets_created_at   ON public.tickets(created_at DESC);
CREATE INDEX idx_messages_ticket_id   ON public.ticket_messages(ticket_id);
CREATE INDEX idx_messages_created_at  ON public.ticket_messages(created_at ASC);

-- ============================================================
-- FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCTION: auto-criar profile ao registrar usuário
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles: leitura própria"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: atualização própria"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Agentes/admins podem ver todos os profiles
CREATE POLICY "profiles: agentes veem todos"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('agent', 'admin')
    )
  );

-- TICKETS: usuário vê apenas seus próprios tickets
CREATE POLICY "tickets: criador lê seus tickets"
  ON public.tickets FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "tickets: agentes leem todos"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('agent', 'admin')
    )
  );

CREATE POLICY "tickets: usuário cria ticket"
  ON public.tickets FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "tickets: agente atualiza qualquer ticket"
  ON public.tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('agent', 'admin')
    )
  );

CREATE POLICY "tickets: criador atualiza próprio ticket"
  ON public.tickets FOR UPDATE
  USING (created_by = auth.uid());

-- TICKET MESSAGES
CREATE POLICY "messages: vê mensagens do próprio ticket"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE id = ticket_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "messages: agentes veem todas"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('agent', 'admin')
    )
  );

CREATE POLICY "messages: usuário envia em seu ticket"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE id = ticket_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "messages: agente envia em qualquer ticket"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('agent', 'admin')
    )
  );
