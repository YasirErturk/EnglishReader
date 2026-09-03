-- Öneri bağlamı, hesap silme, sözlük düzeltmeleri
-- SQL Editor'de bir kez çalıştır.

alter table public.word_suggestions add column if not exists context text;

insert into public.dictionary (word, meaning_tr) values
    ('depth', 'derinlik'),
    ('width', 'genişlik'),
    ('height', 'yükseklik'),
    ('length', 'uzunluk'),
    ('coke', 'kola'),
    ('milk', 'süt'),
    ('water', 'su'),
    ('drink', 'içmek / içecek'),
    ('want', 'istemek')
on conflict (word) do update set meaning_tr = excluded.meaning_tr;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    isadm boolean;
begin
    if uid is null then
        raise exception 'Giriş gerekli';
    end if;

    select coalesce(is_admin, false) into isadm
    from public.profiles
    where id = uid;

    if isadm then
        raise exception 'Yönetici kendi hesabını silemez';
    end if;

    delete from public.reading_sessions where user_id = uid;
    delete from public.reading_progress where user_id = uid;
    delete from public.saved_words where user_id = uid;
    delete from public.word_suggestions where user_id = uid;
    delete from public.auth_events where user_id = uid;
    delete from public.profiles where id = uid;
    delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
