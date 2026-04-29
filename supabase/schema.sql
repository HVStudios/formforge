-- FormForge Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ─── plans ───────────────────────────────────────────────────────────────────
create table if not exists plans (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  data        jsonb       not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table plans enable row level security;

create policy "plans: own rows only"
  on plans for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── workout_logs ─────────────────────────────────────────────────────────────
create table if not exists workout_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  data        jsonb       not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table workout_logs enable row level security;

create policy "workout_logs: own rows only"
  on workout_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── user_meta ────────────────────────────────────────────────────────────────
-- Key-value store for: active, bodyweight, steps, customExercises, nutrition, gamification
create table if not exists user_meta (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  key         text        not null,
  data        jsonb       not null default '{}',
  updated_at  timestamptz not null default now(),
  primary key (user_id, key)
);

alter table user_meta enable row level security;

create policy "user_meta: own rows only"
  on user_meta for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists plans_user_id_idx       on plans(user_id);
create index if not exists workout_logs_user_id_idx on workout_logs(user_id);
