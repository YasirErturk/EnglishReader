# Bu tur

1. **`js/config.js` üzerine yazma.**
2. Zip içeriğini klasöre kopyala.
3. Supabase SQL Editor → `supabase/06_update.sql` → Run.
   (Önceki turda `05_features.sql` çalışmadıysa onu da çalıştır.)

Silinen dosya yok.

## Kitap düzenleme

Yönetici → Kitaplar → satırdaki **Düzenle**. Kapak URL, yıl, metin, telif kutusu. Kaydet.

## Okuma

Kitap açılınca kapak + başlık + yazar/yıl durur. Ekrana tıklayınca akar. Devam et de aynı.

Sağ altta **− / +** hız. Tam ayar için `settings.html` (sonsuz “metin metin…”).

## Sözlüğe öner

Popup açıkken sağ alttaki yeşil/mavi butonlar gizleniyor; **Sözlüğe öner** tıklanabilir olmalı. Giriş şart. Günlük 10.

## Yapay zeka çeviri

Sözlükte yoksa veya cümleye basılı tutunca çeviri servisi çalışır.

Popup altında kaynak yazar:
- `Kaynak: Gemini (yapay zeka)` → `js/config.js` içine `geminiApiKey` eklediysen
- `Kaynak: makine çevirisi` → ücretsiz yedek servis (şu an varsayılan)

Gemini için [Google AI Studio](https://aistudio.google.com/apikey) anahtarı:

```js
geminiApiKey: "AI..."
```

`js/config.js` içine, diğer anahtarların yanına.
