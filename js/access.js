window.DEMO_BOOK = "alice.txt";
window.DEMO_WORDS = 420;

function isDemoBook(file) {
    const slug = String(file || "").replace(/\.txt$/i, "").toLowerCase();
    return slug === "alice";
}

function canReadFull() {
    if (location.protocol === "file:") return true;
    if (window.API && API.session) return true;
    if (window.API && API.profile && API.profile.is_admin) return true;
    return false;
}

function excerptText(text, limit) {
    limit = limit || window.DEMO_WORDS || 420;
    const tokens = String(text || "").split(/(\s+)/);
    let words = 0;
    let out = "";
    for (let i = 0; i < tokens.length; i++) {
        if (/\S/.test(tokens[i])) {
            words += 1;
            if (words > limit) break;
        }
        out += tokens[i];
    }
    return out.trim();
}
