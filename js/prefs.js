window.PREFS_KEY = "readerSettings";
window.SHELF_KEY = "readerShelf";

window.SPEED_STEPS = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 6];

window.defaultPrefs = {
    speed: 0.75,
    font: 34,
    line: 2.2,
    dictStyle: "simple",
    paper: "cream",
    speechRate: 0.95,
    autoSpeak: false,
    voiceProfile: "woman"
};

function readPrefs() {
    try {
        const data = Object.assign({}, window.defaultPrefs, JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"));
        data.speed = snapSpeed(data.speed);
        return data;
    } catch (err) {
        return Object.assign({}, window.defaultPrefs);
    }
}

function writePrefs(partial) {
    const next = Object.assign(readPrefs(), partial || {});
    next.speed = snapSpeed(next.speed);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    return next;
}

function snapSpeed(v) {
    v = Number(v);
    if (!isFinite(v)) v = window.defaultPrefs.speed;
    let best = SPEED_STEPS[0];
    let dist = Infinity;
    SPEED_STEPS.forEach(function (s) {
        const d = Math.abs(s - v);
        if (d < dist) {
            dist = d;
            best = s;
        }
    });
    return best;
}

function speedIndex(v) {
    const i = SPEED_STEPS.indexOf(snapSpeed(v));
    return i < 0 ? SPEED_STEPS.indexOf(0.75) : i;
}

function formatSpeed(v) {
    v = snapSpeed(v);
    if (v === 0) return "0";
    if (Number.isInteger(v)) return String(v);
    return String(v);
}

function applyPaper(name) {
    const allowed = { cream: 1, paper: 1, sage: 1, night: 1 };
    const paper = allowed[name] ? name : "cream";
    document.documentElement.setAttribute("data-paper", paper);
    if (document.body) document.body.setAttribute("data-paper", paper);
    document.querySelectorAll("[data-paper-surface]").forEach(function (el) {
        el.setAttribute("data-paper", paper);
    });
    document.querySelectorAll(".swatches [data-paper]").forEach(function (btn) {
        btn.classList.toggle("on", btn.getAttribute("data-paper") === paper);
    });
    return paper;
}

function readShelf() {
    try {
        return Object.assign(
            { favorites: [], wishlist: [], notes: {} },
            JSON.parse(localStorage.getItem(SHELF_KEY) || "{}")
        );
    } catch (err) {
        return { favorites: [], wishlist: [], notes: {} };
    }
}

function writeShelf(data) {
    const next = Object.assign({ favorites: [], wishlist: [], notes: {} }, data || {});
    localStorage.setItem(SHELF_KEY, JSON.stringify(next));
    return next;
}

function toggleShelfList(list, file) {
    const shelf = readShelf();
    const arr = shelf[list] || [];
    const i = arr.indexOf(file);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(file);
    shelf[list] = arr;
    writeShelf(shelf);
    return arr.indexOf(file) >= 0;
}

function setShelfNote(file, text) {
    const shelf = readShelf();
    shelf.notes = shelf.notes || {};
    shelf.notes[file] = String(text || "");
    writeShelf(shelf);
}

function bookFileOf(book) {
    if (!book) return "";
    if (book.file) return book.file;
    if (book.slug) return String(book.slug).replace(/\.txt$/i, "") + ".txt";
    return "";
}
