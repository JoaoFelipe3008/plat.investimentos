-- Lastro — esquema Supabase/PostgreSQL
-- Toda tabela de usuário tem RLS: cada pessoa só lê e escreve as próprias linhas.
-- Execute no SQL Editor do Supabase.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  data jsonb not null,                       -- respostas do onboarding (perfil EDUCACIONAL)
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  symbol text not null check (char_length(symbol) <= 24),
  created_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  lesson_key text not null,
  score numeric not null check (score between 0 and 1),
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_key)
);

create table if not exists public.transactions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  symbol text not null,
  type text not null check (type in ('compra', 'venda')),
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price >= 0),
  fees numeric not null default 0 check (fees >= 0),
  date date not null,
  note text check (char_length(note) <= 280),
  example boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_idx on public.transactions (user_id, date);

create table if not exists public.incomes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  symbol text not null,
  kind text not null check (kind in ('dividendo', 'jcp', 'rendimento')),
  amount numeric not null check (amount > 0),
  date date not null,
  example boolean not null default false
);

create table if not exists public.alerts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  kind text not null check (kind in ('preco_acima', 'preco_abaixo', 'variacao', 'noticia', 'selic')),
  symbol text,
  threshold numeric,
  channels jsonb not null default '{"app": true, "push": false, "email": false}',
  frequency text not null check (frequency in ('uma_vez', 'diario', 'sempre')),
  quiet_start time,
  quiet_end time,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_triggered_at timestamptz
);
create index if not exists alerts_active_idx on public.alerts (active, kind);

-- Registro de disparos (escrito pelo job de avaliação no servidor, com service role).
create table if not exists public.alert_events (
  id bigint generated always as identity primary key,
  alert_id uuid not null references public.alerts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  triggered_at timestamptz not null default now(),
  value numeric,
  detail text,
  channel text not null check (channel in ('app', 'push', 'email')),
  delivered boolean not null default false,
  -- Evita disparos duplicados do mesmo alerta, no mesmo canal, na mesma janela de tempo.
  dedupe_key text not null,
  unique (alert_id, channel, dedupe_key)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Inscrições de Web Push (somente após permissão explícita do navegador).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['profiles','favorites','lesson_progress','transactions','incomes','alerts','alert_events','notifications','push_subscriptions']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own_select" on public.%I', t);
    execute format('drop policy if exists "own_write" on public.%I', t);
    execute format('create policy "own_select" on public.%I for select using (auth.uid() = user_id)', t);
  end loop;
  -- Escrita pelo próprio usuário (alert_events é escrito apenas pelo servidor via service role).
  foreach t in array array['profiles','favorites','lesson_progress','transactions','incomes','alerts','notifications','push_subscriptions']
  loop
    execute format('create policy "own_write" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;
