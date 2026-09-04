window.PREFS_KEY = "readerSettings";

window.defaultPrefs = {
    speed: 0.6,
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
        return Object.assign({}, window.defaultPrefs, JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"));
    } catch (err) {
        return Object.assign({}, window.defaultPrefs);
    }
}

function writePrefs(partial) {
    const next = Object.assign(readPrefs(), partial || {});
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    return next;
}

function applyPaper(name) {
    const allowed = { cream: 1, paper: 1, sage: 1, night: 1 };
    const paper = allowed[name] ? name : "cream";
    document.body.setAttribute("data-paper", paper);
    document.querySelectorAll(".swatches [data-paper]").forEach(function (btn) {
        btn.classList.toggle("on", btn.getAttribute("data-paper") === paper);
    });
    return paper;
}
