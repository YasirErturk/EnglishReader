-- Kapak, yıl, kitap düzenleme, istatistik
-- SQL Editor'de bir kez çalıştır.

alter table public.books add column if not exists year int;
alter table public.books add column if not exists cover_url text;

update public.books set year = 1865, cover_url = 'assets/covers/alice.jpg' where slug = 'alice';
update public.books set year = 1891, cover_url = 'assets/covers/sherlock.jpg' where slug = 'sherlock';
update public.books set year = 1813, cover_url = 'assets/covers/pride.jpg' where slug = 'pride';
update public.books set year = 1818, cover_url = 'assets/covers/frankenstein.jpg' where slug = 'frankenstein';
update public.books set year = 1897, cover_url = 'assets/covers/dracula.jpg' where slug = 'dracula';
update public.books set year = 1883, cover_url = 'assets/covers/treasure.jpg' where slug = 'treasure';
update public.books set year = 1895, cover_url = 'assets/covers/timemachine.jpg' where slug = 'timemachine';
update public.books set year = 1843, cover_url = 'assets/covers/carol.jpg' where slug = 'carol';
update public.books set year = 1890, cover_url = 'assets/covers/dorian.jpg' where slug = 'dorian';
update public.books set year = 1925, cover_url = 'assets/covers/gatsby.jpg' where slug = 'gatsby';

create or replace function public.book_stats()
returns table (
    book_id uuid,
    slug text,
    title text,
    author text,
    genre text,
    year int,
    cover_url text,
    cover_color text,
    readers bigint,
    seconds_1d bigint,
    seconds_7d bigint,
    seconds_all bigint
)
language sql
stable
security definer
set search_path = public
as $$
    select
        b.id,
        b.slug,
        b.title,
        b.author,
        b.genre,
        b.year,
        b.cover_url,
        b.cover_color,
        count(distinct r.user_id)::bigint,
        coalesce(sum(s.duration_seconds) filter (where s.ended_at > now() - interval '1 day'), 0)::bigint,
        coalesce(sum(s.duration_seconds) filter (where s.ended_at > now() - interval '7 days'), 0)::bigint,
        coalesce(sum(r.total_seconds), 0)::bigint
    from public.books b
    left join public.reading_progress r on r.book_id = b.id
    left join public.reading_sessions s on s.book_id = b.id
    where b.is_published = true
      and b.is_copyrighted = false
    group by b.id
$$;

grant execute on function public.book_stats() to anon, authenticated;

insert into public.dictionary (word, meaning_tr) values
    ('coke', 'kola'),
    ('milk', 'süt'),
    ('water', 'su'),
    ('drink', 'içmek / içecek'),
    ('want', 'istemek')
on conflict (word) do update set meaning_tr = excluded.meaning_tr;
