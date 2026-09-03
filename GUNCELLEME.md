# Bu turda ne yapacaksın

1. **`js/config.js` dosyasını üzerine yazma.** Supabase anahtarların orada.
2. Zip’teki diğer dosyaları kopyala / GitHub’a yükle.
3. Supabase → SQL Editor → `supabase/05_features.sql` dosyasının hepsini yapıştır → **Run**.

Bundan sonra yönetici panelinde sekmeler görünür: Üyeler, Giriş/çıkış, Kelime önerileri, Kitaplar.

## Çeviri

- Kısa tık: tek kelime (sözlük)
- Basılı tut (~0.5 sn): cümlenin çevirisi
- Metin sürükleyerek seçim kapalı

Cümle çevirisi varsayılan olarak ücretsiz çeviri servisi kullanır. İstersen `js/config.js` içine ekle:

```js
geminiApiKey: "AI..."
```

Google AI Studio’dan ücretsiz Gemini anahtarı alınır.
