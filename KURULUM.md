# English Reader — kurulum

Bu dosyayı sırayla uygula. Veri girişi yok: SQL dosyalarını yapıştır-çalıştır. Anahtarları `js/config.js` içine yapıştır.

Google giriş **file://** ile çalışmaz. Okuyucu (kaydırma, sözlük, çubuk) `index.html` olmadan `reader.html` ile hâlâ Ctrl+F5’te açılır. Üye paneli için GitHub Pages gerekir.

---

## 0. Bu pakette ne var

| Dosya | Ne işe yarar |
| --- | --- |
| `index.html` | Ana sayfa / giriş |
| `reader.html` | Okuyucu |
| `dashboard.html` | Üye paneli |
| `admin.html` | Telifli kitaplar (yalnız sen) |
| `js/config.js` | Supabase URL + anon key |
| `supabase/01_schema.sql` | Tablolar + güvenlik |
| `supabase/02_seed_dictionary.sql` | ~790 kelimelik sözlük |
| `supabase/03_seed_books.sql` | 10 kamu malı kitap |
| `supabase/04_make_admin.sql` | Seni yönetici yapar |
| `backup/v1/` | Çubuk sürüklemeden önceki okuyucu |

Sağdaki mavi çubuğu sürükleyerek atlamak istemezsen `backup/v1` dosyalarını geri kopyala.

---

## 1. Supabase projesi (New project)

1. https://supabase.com adresine gir, GitHub ile oturum aç.
2. **New Project** / **New project**.
3. Organization seç (yoksa oluştur).
4. Doldur:
   - **Name:** `english-reader`
   - **Database password:** güçlü bir şifre (kaydet)
   - **Region:** `Frankfurt` (avrupa, sana yakın)
5. **Create new project** — 1–2 dakika bekle, yeşil olsun.

### 1b. Anahtarlar

1. Sol menü **Project Settings** (dişli).
2. **API** (bazı arayüzlerde **Data API**).
3. Kopyala:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public** key (uzun JWT)

`js/config.js` dosyasını aç, yapıştır:

```js
window.APP_CONFIG = {
    supabaseUrl: "https://xxxx.supabase.co",
    supabaseAnonKey: "eyJhbGciOi...",
    adminEmail: "seninadres@gmail.com"
};
```

---

## 2. SQL — sırayla çalıştır

Sol menü **SQL Editor** → **New query**.

Her dosyanın **tüm** içeriğini yapıştır → **Run**.

Sıra zorunlu:

1. `supabase/01_schema.sql`
2. `supabase/02_seed_dictionary.sql`
3. `supabase/03_seed_books.sql`

Site zaten açıksa yalnız şunu çalıştır:

4. `supabase/05_features.sql`  (üyeler, giriş logu, kelime önerisi)
5. `supabase/06_update.sql`    (kapak, yıl, top 10 istatistik)
6. `supabase/07_update.sql`    (hesap silme, öneri bağlamı, depth/width)

Hata olursa ekran görüntüsünü at.

`04_make_admin.sql` henüz değil. Önce Google ile bir kez giriş yapacaksın.

---

## 3. Google Cloud (Gmail ile giriş)

1. https://console.cloud.google.com
2. Üstten proje seç → **New Project**
   - Ad: `English Reader`
   - **Create**
3. Sol menü **APIs & Services** → **OAuth consent screen**
   (yeni arayüzde **Google Auth platform** / **Branding** + **Audience**)
4. **User type / Audience:** External
5. Uygulama adı: `English Reader`
   Destek e-postası: senin Gmail
6. **Authorized domains** içine ekle:
   - `supabase.co`
   - sonra GitHub Pages açılınca `github.io`
7. Scopes / Data access: `email`, `profile`, `openid` yeter.
8. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**
9. Application type: **Web application**
10. Name: `English Reader Web`
11. **Authorized JavaScript origins:**
    - `https://xxxx.supabase.co`
    - `http://localhost:8080`
    - GitHub sonrası: `https://yasirerturk.github.io`
12. **Authorized redirect URIs:**
    - `https://xxxx.supabase.co/auth/v1/callback`
13. **Create** — **Client ID** ve **Client Secret** kopyala.

---

## 4. Supabase’te Google’ı aç

1. Supabase → **Authentication** → **Providers** (veya Sign in / Providers)
2. **Google** → Enable
3. Client ID ve Client Secret’i yapıştır → Save
4. Aynı sayfada **Callback URL** zaten `https://xxxx.supabase.co/auth/v1/callback` olmalı; Google’daki ile birebir aynı olsun.

### 4b. Yönlendirme adresleri

**Authentication** → **URL Configuration**

- **Site URL** (şimdilik): `http://localhost:8080`
- GitHub Pages açılınca Site URL’yi şuna çevir:
  `https://yasirerturk.github.io/EnglishReader`
- **Redirect URLs** (hepsini ekle):

```
http://localhost:8080/**
http://127.0.0.1:8080/**
https://yasirerturk.github.io/EnglishReader/**
https://yasirerturk.github.io/EnglishReader/dashboard.html
https://yasirerturk.github.io/EnglishReader/index.html
```

---

## 5. Yönetici (telifli kitaplar yalnız sende)

1. Ana sayfadan **Google ile giriş** yap (önce localhost veya GitHub).
2. Supabase → **Table Editor** → `profiles` — kendi satırın oluşmuş olmalı.
3. SQL Editor → `supabase/04_make_admin.sql` içindeki e-postayı kendi Gmail’inle değiştir → Run.
4. Çıkış yap, tekrar gir. Solda **Yönetici** görünür.
5. `admin.html` üzerinden telifli kitap ekle. Üyeler listelemez; sen **Oku** ile açarsın.

Telifli metin tohumda yok. Kamu malı 10 kitap yüklü. Telifliyi yalnız sen eklersin.

---

## 6. GitHub’a at + Pages

Repo: https://github.com/YasirErturk altına yeni repo.

1. https://github.com/new
2. Repository name: `EnglishReader`
3. **Public**
4. README ekleme (bizde var)
5. **Create repository**
6. Sayfadaki **uploading an existing file** ile zip’ten çıkan klasörün **içini** yükle
   (`index.html` kökte olmalı, bir iç klasör daha olmamalı)
7. Repo → **Settings** → **Pages**
8. Source: **Deploy from a branch**
9. Branch: `main` — folder: `/ (root)` → Save
10. 1 dakika sonra adres:

`https://yasirerturk.github.io/EnglishReader/`

11. Bu adresi 4b’deki Site URL ve Redirect URLs’e yaz (yazdıysan geç).
12. Google Cloud Authorized origins’e `https://yasirerturk.github.io` ekli olsun.

Google giriş ancak bu HTTPS adreste çalışır.

---

## 7. Yerelde denemek (isteğe bağlı)

`file://` üye girişi vermez. Klasörde:

```
python -m http.server 8080
```

Tarayıcı: `http://localhost:8080`

---

## Ürün notları

1. **İlerleme çubuğu:** sağdaki mavi dolgu tıklanır / sürüklenir. Eski hali `backup/v1`.
2. **Metin seçimi:** fareyle birden fazla kelime seçince çeviri açılır. Seçimi iptal etmek öğrenme işine ters; cümle/kalıp çevirisi asıl iş.
3. **Üye paneli:** kaldığın yer, biten kitap, toplam süre, ortalama bitirme günü, sevilen tür, kelime defteri.
4. **Sözlük:** yerelde `dictionary/tr.js`, giriş sonrası Supabase tablosu birleşir.
5. **Kitaplar:** tohum kamu malı. Telifli = yönetici.
6. **Veri:** okuma süresi, pozisyon, kayıtlı kelimeler Supabase’te, üye bazlı (RLS).

Anahtarları (`anon key`) sitede durur; bu normal. Korumayı SQL’deki RLS yapar. **service_role** key’i asla dosyaya koyma.
