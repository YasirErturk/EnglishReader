window.LAST_TRANSLATION_SOURCE = "";

function translationSourceLabel() {
    if (window.LAST_TRANSLATION_SOURCE === "gemini") return "Kaynak: Gemini (yapay zeka)";
    if (window.LAST_TRANSLATION_SOURCE === "memory") return "Kaynak: makine çevirisi";
    if (window.LAST_TRANSLATION_SOURCE === "dict") return "Kaynak: sözlük";
    return "";
}

function isGarbageTranslation(text) {
    const t = String(text || "").trim();
    if (!t) return true;
    if (t.length < 2) return true;
    if (/^[.,;:!?'"“”\-–—()]+$/.test(t)) return true;
    if (t === ".") return true;
    return false;
}

async function translateWithGemini(text, asWord) {
    const key = window.APP_CONFIG && APP_CONFIG.geminiApiKey;
    if (!key || String(key).indexOf("BURAYA") !== -1 || !String(key).trim()) return null;

    const prompt = asWord
        ? "Give the Turkish dictionary headword (lemma) for this English word. Use proper Turkish letters (çğıöşü). One short phrase only, no inflection like -i/-si. Example: depth -> derinlik\n\n" + text
        : "Translate this English sentence into natural Turkish. Use proper Turkish letters (çğıöşü). Reply with only the translation:\n\n" + text;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(key);
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
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

async function translateSentence(text, asWord) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return "";
    window.LAST_TRANSLATION_SOURCE = "";

    try {
        const ai = await translateWithGemini(clean, asWord);
        if (ai && !isGarbageTranslation(ai)) {
            window.LAST_TRANSLATION_SOURCE = "gemini";
            return ai;
        }
    } catch (err) {}

    try {
        const mt = await translateWithMemory(clean);
        if (mt && !isGarbageTranslation(mt)) {
            window.LAST_TRANSLATION_SOURCE = "memory";
            return mt;
        }
    } catch (err) {}

    return "Çeviri alınamadı.";
}
