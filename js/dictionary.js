let dictionary = {};

function cleanWord(word) {
    return String(word || "")
        .toLowerCase()
        .replace(/[^a-z']/g, "");
}

function lookupOne(word) {

    const clean = cleanWord(word);

    if (!clean) return "";

    if (dictionary[clean]) {
        return dictionary[clean];
    }

    const firstUpper =
        clean.charAt(0).toUpperCase() + clean.slice(1);

    if (dictionary[firstUpper]) {
        return dictionary[firstUpper];
    }

    if (clean.endsWith("s") && dictionary[clean.slice(0, -1)]) {
        return dictionary[clean.slice(0, -1)];
    }

    if (clean.endsWith("ed") && dictionary[clean.slice(0, -2)]) {
        return dictionary[clean.slice(0, -2)];
    }

    if (clean.endsWith("ing") && dictionary[clean.slice(0, -3)]) {
        return dictionary[clean.slice(0, -3)];
    }

    return "❌ Sözlükte bulunamadı.";
}

function loadDictionary() {

    dictionary = typeof DICTIONARY !== "undefined" ? DICTIONARY : {};

    console.log("Sözlük yüklendi:", Object.keys(dictionary).length, "kelime");

    if (window.API && API.loadRemoteDictionary) {
        API.loadRemoteDictionary().then(function (extra) {
            if (!extra) return;
            Object.keys(extra).forEach(function (key) {
                dictionary[key] = extra[key];
            });
            console.log("Uzak sözlük birleştirildi:", Object.keys(dictionary).length, "kelime");
        }).catch(function () {});
    }

}

function getMeaning(text) {

    const raw = String(text || "").trim();
    const words = raw.split(/\s+/).filter(Boolean);

    if (words.length <= 1) {
        return lookupOne(raw);
    }

    const phrase = cleanWord(raw.replace(/\s+/g, " "));

    if (dictionary[phrase]) {
        return dictionary[phrase];
    }

    return words.map(function (w) {
        const c = cleanWord(w);
        if (!c) return "";
        return c + " — " + lookupOne(w);
    }).filter(Boolean).join("\n");

}
