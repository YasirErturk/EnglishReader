# Bu tur

1. **`js/config.js` üzerine yazma.** Zip’te yok.
2. Zip içeriğini `D:/Programlar/EnglishReader` üzerine kopyala (replace all).
3. Supabase SQL Editor, sırayla (daha önce çalıştıysa atla):
   - `supabase/05_features.sql` (hiç çalışmadıysa)
   - `supabase/06_update.sql`
   - `supabase/07_update.sql`  ← bu tur zorunlu (hesap silme + öneri bağlamı + depth/width)

Silinen dosya yok.

## Okuyucu

- Ana sayfa butonu logo + “Ana sayfa”.
- Hız sağda dikey: **+** üstte (daha hızlı), değer, **−**.
- Kitap metni ortalanmış, biraz büyük başlık ve üst boşlukla başlar.
- “Kısa tık / basılı tut” yazısı yok.
- Basılı tutunca **yalnız o cümle** çevrilir (paragraf değil).
- Sözlük görünümü (ayarlar): sadece Türkçe / tür+anlam / ayrıntılı.
- `width` → genişlik (nokta değil). `depth` → derinlik (derinliği değil).

## Sözlüğe öner

Popup’ta isteğe bağlı anlam kutusu var. Tıklayınca her zaman **Gönderildi** yazar. Günlük 10 sınırı sessiz çalışır.

Yönetici: mevcut sözlük + önerilen anlam. Olduğu gibi onayla, düzenleyip onayla, reddet.

## Panel

Tehlikeli alan: **Profilimi sıfırla** ve **Profilimi sil**. Yönetici kendi hesabını silemez.

## Laboratuvar

`settings.html` sonsuz “metin” ekler; kaydırma sıfırlanmaz.

## Ana sayfa

Günün favorisi büyük, yanında kaldığın yer / bu hafta / top 10. Katalog ayrı rafta.

## Yapay zeka çeviri

`js/config.js` içine (yerel dosyan, zip’te yok):

```js
geminiApiKey: "AI..."
```
