-- Google ile BİR KEZ giriş yaptıktan sonra çalıştır.
-- E-postayı kendi Gmail adresinle değiştir.

update public.profiles
set is_admin = true
where email = 'BURAYA_GMAIL';
