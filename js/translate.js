async function translateWithGemini(text) {
    const key = window.APP_CONFIG && APP_CONFIG.geminiApiKey;
    if (!key) return null;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(key);
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: "Translate this English sentence into natural Turkish. Reply with only the translation, no quotes, no extra words:\n\n" + text
                }]
            }]
        })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const out = data && data.candidates && data.candidates[0] &&
        data.candidates[0].content && data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    return out ? String(out).trim() : null;
}

async function translateWithMemory(text) {
    const url = "https://api.mymemory.translated.net/get?langpair=en|tr&q=" + encodeURIComponent(text);
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const out = data && data.responseData && data.responseData.translatedText;
    return out ? String(out).trim() : null;
}

async function translateSentence(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return "";

    try {
        const ai = await translateWithGemini(clean);
        if (ai) return ai;
    } catch (err) {}

    try {
        const mt = await translateWithMemory(clean);
        if (mt) return mt;
    } catch (err) {}

    return "Çeviri alınamadı. İnternet bağlantını kontrol et.";
}
