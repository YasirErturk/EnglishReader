-- Üyeler, giriş logu, kelime önerisi
-- SQL Editor'de bir kez çalıştır.

create table if not exists public.auth_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    email text,
    event text not null check (event in ('login', 'logout')),
    user_agent text,
    created_at timestamptz not null default now()
);

create index if not exists auth_events_created_idx on public.auth_events (created_at desc);
create index if not exists auth_events_user_idx on public.auth_events (user_id, created_at desc);

create table if not exists public.word_suggestions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    word text not null,
    meaning_tr text,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz not null default now(),
    reviewed_at timestamptz
);

create index if not exists word_suggestions_status_idx on public.word_suggestions (status, created_at desc);

alter table public.auth_events enable row level security;
alter table public.word_suggestions enable row level security;

drop policy if exists "auth_events_insert_own" on public.auth_events;
create policy "auth_events_insert_own" on public.auth_events
    for insert to authenticated
    with check (user_id = auth.uid());

drop policy if exists "auth_events_select" on public.auth_events;
create policy "auth_events_select" on public.auth_events
    for select to authenticated
    using (user_id = auth.uid() or public.is_admin());

drop policy if exists "progress_admin_read" on public.reading_progress;
create policy "progress_admin_read" on public.reading_progress
    for select to authenticated
    using (public.is_admin());

drop policy if exists "sessions_admin_read" on public.reading_sessions;
create policy "sessions_admin_read" on public.reading_sessions
    for select to authenticated
    using (public.is_admin());

drop policy if exists "suggestions_insert_own" on public.word_suggestions;
create policy "suggestions_insert_own" on public.word_suggestions
    for insert to authenticated
    with check (user_id = auth.uid());

drop policy if exists "suggestions_select" on public.word_suggestions;
create policy "suggestions_select" on public.word_suggestions
    for select to authenticated
    using (user_id = auth.uid() or public.is_admin());

drop policy if exists "suggestions_admin_update" on public.word_suggestions;
create policy "suggestions_admin_update" on public.word_suggestions
    for update to authenticated
    using (public.is_admin())
    with check (public.is_admin());

create or replace function public.enforce_suggestion_daily_limit()
returns trigger
language plpgsql
as $$
declare
    c int;
begin
    select count(*) into c
    from public.word_suggestions
    where user_id = new.user_id
      and (created_at at time zone 'Europe/Istanbul')::date
          = (now() at time zone 'Europe/Istanbul')::date;

    if c >= 10 then
        raise exception 'Günlük 10 kelime önerisi sınırına ulaşıldı';
    end if;

    return new;
end;
$$;

drop trigger if exists suggestion_daily_limit on public.word_suggestions;
create trigger suggestion_daily_limit
    before insert on public.word_suggestions
    for each row execute function public.enforce_suggestion_daily_limit();

grant select, insert on public.auth_events to authenticated;
grant select, insert, update on public.word_suggestions to authenticated;
