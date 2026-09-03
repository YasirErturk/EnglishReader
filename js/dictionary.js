let dictionary = {};

function getDictStyle() {
    try {
        const saved = JSON.parse(localStorage.getItem("readerSettings") || "{}");
        return saved.dictStyle || "simple";
    } catch (err) {
        return "simple";
    }
}

function cleanWord(word) {
    return String(word || "")
        .toLowerCase()
        .replace(/[^a-z']/g, "");
}

function guessPos(word) {
    if (/ly$/.test(word)) return "zf.";
    if (/(tion|sion|ness|ment|ity|ism|hood|ship|age|ence|ance|depth|width|length|height)$/.test(word)) return "i.";
    if (/(ous|ful|less|ive|able|ible|al|ic|ish|ent|ant)$/.test(word)) return "s.";
    if (/(ing|ed|ize|ise|ate)$/.test(word)) return "f.";
    return "i.";
}

function rawMeaning(entry) {
    if (!entry) return "";
    if (typeof entry === "string") return entry;
    return entry.tr || entry.simple || "";
}

function formatEntry(word, entry) {
    if (!entry) return "";
    const style = getDictStyle();
    const tr = rawMeaning(entry);
    if (!tr) return "";

    if (typeof entry === "object") {
        if (style === "redhouse") {
            return entry.redhouse || (word + "  " + (entry.pos || "i.") + "  1) " + tr + (entry.extra ? "  2) " + entry.extra : ""));
        }
        if (style === "detail") {
            return (entry.pos || guessPos(word)) + "  " + tr + (entry.extra ? "\n" + entry.extra : "");
        }
        return tr;
    }

    if (style === "redhouse") {
        return word + "  " + guessPos(word) + "  1) " + tr;
    }
    if (style === "detail") {
        return guessPos(word) + "  " + tr;
    }
    return tr;
}

function lookupEntry(word) {
    const clean = cleanWord(word);
    if (!clean) return null;

    const keys = [
        clean,
        clean.charAt(0).toUpperCase() + clean.slice(1)
    ];
    if (clean.endsWith("s")) keys.push(clean.slice(0, -1));
    if (clean.endsWith("es")) keys.push(clean.slice(0, -2));
    if (clean.endsWith("ed")) keys.push(clean.slice(0, -2), clean.slice(0, -1));
    if (clean.endsWith("ing")) keys.push(clean.slice(0, -3), clean.slice(0, -3) + "e");

    for (let i = 0; i < keys.length; i++) {
        if (dictionary[keys[i]]) return { word: keys[i], entry: dictionary[keys[i]] };
    }
    return null;
}

function lookupOne(word) {
    const hit = lookupEntry(word);
    if (!hit) return "";
    return formatEntry(cleanWord(word), hit.entry);
}

function loadDictionary() {

    dictionary = typeof DICTIONARY !== "undefined" ? Object.assign({}, DICTIONARY) : {};

    if (window.DICT_EXTRA) {
        Object.keys(DICT_EXTRA).forEach(function (k) {
            if (!dictionary[k]) dictionary[k] = DICT_EXTRA[k];
        });
    }

    if (window.DICT_FIXES) {
        Object.keys(DICT_FIXES).forEach(function (k) {
            dictionary[k] = DICT_FIXES[k];
        });
    }

    console.log("Sözlük yüklendi:", Object.keys(dictionary).length, "kelime");

    if (window.API && API.loadRemoteDictionary) {
        API.loadRemoteDictionary().then(function (extra) {
            if (!extra) return;
            Object.keys(extra).forEach(function (key) {
                dictionary[key] = extra[key];
            });
            if (window.DICT_FIXES) {
                Object.keys(DICT_FIXES).forEach(function (k) {
                    dictionary[k] = DICT_FIXES[k];
                });
            }
            console.log("Uzak sözlük birleştirildi:", Object.keys(dictionary).length, "kelime");
        }).catch(function () {});
    }

}

function getMeaning(text) {
    const raw = String(text || "").trim();
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length <= 1) return lookupOne(raw);
    const phrase = cleanWord(raw.replace(/\s+/g, " "));
    if (dictionary[phrase]) return formatEntry(phrase, dictionary[phrase]);
    return "";
}

function splitToken(token) {
    const m = String(token).match(/^([^A-Za-z']*)([A-Za-z']+)([^A-Za-z']*)$/);
    if (!m) {
        return { lead: "", word: token, trail: "" };
    }
    return { lead: m[1], word: m[2], trail: m[3] };
}

function sentenceOf(span) {
    const p = span.parentElement;
    if (!p) return span.textContent;
    const full = p.innerText || "";
    const target = span.textContent;
    const idx = full.indexOf(target);
    if (idx < 0) return target;

    let start = 0;
    for (let i = idx - 1; i >= 0; i--) {
        if (".!?".indexOf(full[i]) !== -1) {
            start = i + 1;
            break;
        }
    }
    let end = full.length;
    for (let i = idx + target.length; i < full.length; i++) {
        if (".!?".indexOf(full[i]) !== -1) {
            end = i + 1;
            break;
        }
    }
    return full.slice(start, end).replace(/\s+/g, " ").trim();
}
