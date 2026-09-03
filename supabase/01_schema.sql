-- English Reader · şema
-- Supabase SQL Editor'de tek seferde çalıştır.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    display_name text,
    avatar_url text,
    is_admin boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.books (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    author text,
    genre text,
    description text,
    cover_color text default '#1e3348',
    content text not null default '',
    is_copyrighted boolean not null default false,
    is_published boolean not null default true,
    language text not null default 'en',
    word_count int not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.reading_progress (
    user_id uuid not null references public.profiles(id) on delete cascade,
    book_id uuid not null references public.books(id) on delete cascade,
    scroll_top double precision not null default 0,
    percent double precision not null default 0,
    status text not null default 'reading' check (status in ('reading', 'finished')),
    started_at timestamptz not null default now(),
    last_read_at timestamptz not null default now(),
    finished_at timestamptz,
    total_seconds int not null default 0,
    primary key (user_id, book_id)
);

create table if not exists public.reading_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    book_id uuid not null references public.books(id) on delete cascade,
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    duration_seconds int not null default 0
);

create table if not exists public.dictionary (
    id uuid primary key default gen_random_uuid(),
    word text not null unique,
    meaning_tr text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.saved_words (
    user_id uuid not null references public.profiles(id) on delete cascade,
    word text not null,
    meaning_tr text,
    created_at timestamptz not null default now(),
    primary key (user_id, word)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (select is_admin from public.profiles where id = auth.uid()),
        false
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, display_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            split_part(new.email, '@', 1)
        ),
        coalesce(
            new.raw_user_meta_data->>'avatar_url',
            new.raw_user_meta_data->>'picture'
        )
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.reading_progress enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.dictionary enable row level security;
alter table public.saved_words enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
    for select to authenticated
    using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
    for update to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());

drop policy if exists "books_select" on public.books;
create policy "books_select" on public.books
    for select
    using (
        is_published = true
        and (is_copyrighted = false or public.is_admin())
    );

drop policy if exists "books_admin_write" on public.books;
create policy "books_admin_write" on public.books
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "progress_own" on public.reading_progress;
create policy "progress_own" on public.reading_progress
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists "sessions_own" on public.reading_sessions;
create policy "sessions_own" on public.reading_sessions
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists "dictionary_read" on public.dictionary;
create policy "dictionary_read" on public.dictionary
    for select
    using (true);

drop policy if exists "dictionary_admin_write" on public.dictionary;
create policy "dictionary_admin_write" on public.dictionary
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "saved_words_own" on public.saved_words;
create policy "saved_words_own" on public.saved_words
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on public.books to anon, authenticated;
grant select on public.dictionary to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.reading_progress to authenticated;
grant select, insert, update, delete on public.reading_sessions to authenticated;
grant select, insert, update, delete on public.saved_words to authenticated;
grant select, insert, update, delete on public.books to authenticated;
grant select, insert, update, delete on public.dictionary to authenticated;
