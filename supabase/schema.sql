-- Esquema de base de datos para Presupuesto Sin Miedo (Supabase / Postgres).
-- Ejecuta este script en: Supabase Dashboard > SQL Editor.

-- ---------------------------------------------------------------------------
-- Tabla de perfiles (1:1 con auth.users). Guarda el estado de suscripción.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  stripe_customer_id text unique,
  -- 'free' | 'active' | 'trialing' | 'past_due' | 'canceled'
  subscription_status text not null default 'free',
  current_period_end timestamptz,
  -- datos para los indicadores de salud financiera
  liquid_savings numeric not null default 0,
  monthly_debt_payments numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Columnas de contexto (idempotente para proyectos ya creados).
alter table public.profiles
  add column if not exists liquid_savings numeric not null default 0;
alter table public.profiles
  add column if not exists monthly_debt_payments numeric not null default 0;

alter table public.profiles enable row level security;

-- Cada usuario solo ve y edita su propio perfil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Crea el perfil automáticamente cuando se registra un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Registro de uso de la IA (para el límite del plan gratuito).
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

drop policy if exists "ai_usage_select_own" on public.ai_usage;
create policy "ai_usage_select_own" on public.ai_usage
  for select using (auth.uid() = user_id);

drop policy if exists "ai_usage_insert_own" on public.ai_usage;
create policy "ai_usage_insert_own" on public.ai_usage
  for insert with check (auth.uid() = user_id);

create index if not exists ai_usage_user_created_idx
  on public.ai_usage (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Movimientos (ingresos/gastos) del usuario.
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null,
  description text not null,
  amount numeric not null,
  type text not null check (type in ('ingreso', 'gasto')),
  category text,
  bucket text,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

create index if not exists transactions_user_idx
  on public.transactions (user_id);

-- Nota: el webhook de Stripe usa la clave service_role (SUPABASE_SERVICE_ROLE_KEY),
-- que omite RLS, para actualizar public.profiles por stripe_customer_id.
