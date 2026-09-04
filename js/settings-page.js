const SAMPLE = [
    "Reading a book in English is a quiet kind of travel. Each page asks you to listen, to notice a new word, and to stay with a sentence until it opens.",
    "When you read slowly, meaning arrives like morning light. You do not force it. You let the story teach you how it wants to be heard.",
    "A good book keeps you company. It does not hurry. It offers the same line again until your ear recognizes it as music.",
    "To learn a language is to make a home in someone else's words. Keep reading. The path is made of pages, and every page is a small door."
];

const box = document.getElementById("previewText");
const scroller = document.getElementById("previewRead");
const book = document.getElementById("previewBook");
const speedSlider = document.getElementById("speedSlider");
const fontSlider = document.getElementById("fontSlider");
const lineSlider = document.getElementById("lineSlider");
const dictStyle = document.getElementById("dictStyle");
const speechRate = document.getElementById("speechRate");
const voiceProfile = document.getElementById("voiceProfile");
const autoSpeak = document.getElementById("autoSpeak");
const speedLabel = document.getElementById("speedLabel");
const saveBtn = document.getElementById("saveBtn");
const settings = new Settings();
const popup = new Popup();

let previewRunning = true;
let resumeAfterPopup = false;
let longPressFired = false;
let pressTimer = null;

if (typeof loadDictionary === "function") loadDictionary();

function bindWord(span) {
    const clearPress = function () {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    };

    span.addEventListener("pointerdown", function (e) {
        if (e.button && e.button !== 0) return;
        longPressFired = false;
        clearPress();
        pressTimer = setTimeout(function () {
            longPressFired = true;
            resumeAfterPopup = previewRunning;
            previewRunning = false;
            document.querySelectorAll("#previewText .word").forEach(function (w) {
                w.classList.remove("selected", "place-mark");
            });
            span.classList.add("selected");
            const unit = Speech.spansForSentence(span);
            if (autoSpeak.checked) Speech.speakSentence(unit.text, unit.spans);
            popup.showSentence(unit.text, span.textContent);
        }, 520);
    });
    span.addEventListener("pointerup", clearPress);
    span.addEventListener("pointerleave", clearPress);
    span.addEventListener("pointercancel", clearPress);
    span.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    span.addEventListener("click", function (e) {
        e.stopPropagation();
        if (longPressFired) {
            longPressFired = false;
            return;
        }
        resumeAfterPopup = previewRunning;
        previewRunning = false;
        document.querySelectorAll("#previewText .word").forEach(function (w) {
            w.classList.remove("selected", "place-mark");
        });
        span.classList.add("selected");
        if (autoSpeak.checked) Speech.speakWord(span.textContent);
        popup.showWord(span.textContent);
    });
}

function fillOnce() {
    SAMPLE.forEach(function (paragraph) {
        const p = document.createElement("p");
        paragraph.split(" ").forEach(function (token) {
            if (!token.trim()) return;
            const parts = splitToken(token);
            if (parts.lead) p.append(parts.lead);
            if (parts.word) {
                const span = document.createElement("span");
                span.className = "word";
                span.textContent = parts.word;
                bindWord(span);
                p.append(span);
            }
            if (parts.trail) p.append(parts.trail);
            p.append(" ");
        });
        box.appendChild(p);
    });
}

fillOnce();
fillOnce();

function apply() {
    const i = parseInt(speedSlider.value, 10);
    settings.speed = SPEED_STEPS[i] != null ? SPEED_STEPS[i] : snapSpeed(speedSlider.value);
    book.style.setProperty("--book-font", fontSlider.value + "px");
    book.style.setProperty("--book-line", String(lineSlider.value));
    box.style.fontSize = fontSlider.value + "px";
    box.style.lineHeight = lineSlider.value;
    box.querySelectorAll("p").forEach(function (p) {
        p.style.lineHeight = lineSlider.value;
        p.style.fontSize = fontSlider.value + "px";
    });
    speedLabel.textContent = formatSpeed(settings.speed);
}

function collect() {
    return {
        speed: settings.speed,
        font: parseInt(fontSlider.value, 10),
        line: parseFloat(lineSlider.value),
        dictStyle: dictStyle.value,
        speechRate: parseFloat(speechRate.value),
        voiceProfile: voiceProfile.value,
        autoSpeak: !!autoSpeak.checked,
        paper: (book.getAttribute("data-paper") || "cream")
    };
}

function markDirty() {
    saveBtn.textContent = "Kaydet";
}

function load() {
    const data = readPrefs();
    speedSlider.min = 0;
    speedSlider.max = SPEED_STEPS.length - 1;
    speedSlider.step = 1;
    speedSlider.value = speedIndex(data.speed);
    fontSlider.value = data.font;
    lineSlider.value = data.line;
    dictStyle.value = data.dictStyle;
    speechRate.value = data.speechRate;
    voiceProfile.value = data.voiceProfile || "woman";
    autoSpeak.checked = !!data.autoSpeak;
    applyPaper(data.paper || "cream");
    apply();
}

[speedSlider, fontSlider, lineSlider, speechRate].forEach(function (el) {
    el.addEventListener("input", function () {
        apply();
        if (el === speechRate && window.Speech) Speech.setRate(speechRate.value);
        markDirty();
    });
});
[dictStyle, voiceProfile, autoSpeak].forEach(function (el) {
    el.addEventListener("change", function () {
        if (el === voiceProfile && window.Speech) {
            Speech.profile = voiceProfile.value;
            Speech.pickVoice();
        }
        markDirty();
    });
});

document.querySelectorAll("#paperSwatches button").forEach(function (btn) {
    btn.addEventListener("click", function () {
        applyPaper(btn.getAttribute("data-paper"));
        markDirty();
    });
});

saveBtn.addEventListener("click", function () {
    writePrefs(collect());
    this.textContent = "Kaydedildi";
});

scroller.addEventListener("scroll", function () {
    if (scroller.scrollTop + scroller.clientHeight > scroller.scrollHeight - 400) fillOnce();
});

document.addEventListener("popupClosed", function () {
    if (window.Speech && Speech.isBusy()) return;
    if (resumeAfterPopup) {
        resumeAfterPopup = false;
        previewRunning = true;
    }
});

document.addEventListener("speechState", function () {
    if (window.Speech && Speech.isBusy()) return;
    if (resumeAfterPopup) {
        resumeAfterPopup = false;
        previewRunning = true;
    }
    syncPreviewListen();
});

function syncPreviewListen() {
    const busy = window.Speech && Speech.isBusy();
    const paused = !!(window.Speech && Speech.paused);
    const speaking = !!(window.Speech && Speech.speaking && !paused);
    const play = document.getElementById("previewPlay");
    const pause = document.getElementById("previewPause");
    const stop = document.getElementById("previewStop");
    if (stop) stop.disabled = !busy;
    if (pause) pause.disabled = !speaking;
    if (play) play.disabled = speaking;
}

document.getElementById("previewPlay").addEventListener("click", function (e) {
    e.stopPropagation();
    if (window.Speech && Speech.paused) {
        Speech.resume();
        return;
    }
    popup.close();
    previewRunning = false;
    Speech.speakBook(box, "here", scroller);
});
document.getElementById("previewPause").addEventListener("click", function (e) {
    e.stopPropagation();
    Speech.pause();
});
document.getElementById("previewStop").addEventListener("click", function (e) {
    e.stopPropagation();
    Speech.stop();
    previewRunning = settings.speed > 0;
});
syncPreviewListen();

load();

(function loop() {
    if (previewRunning && settings.speed) scroller.scrollTop += settings.speed;
    requestAnimationFrame(loop);
})();

(async function nav() {
    const login = document.getElementById("loginButton");
    const logout = document.getElementById("logoutButton");
    const panel = document.getElementById("panelLink");
    if (login) login.addEventListener("click", function () { API.signInGoogle(); });
    if (logout) logout.addEventListener("click", API.signOut);
    if (!API.configured) return;
    const session = await API.getSession();
    if (!session) return;
    if (login) login.style.display = "none";
    if (logout) logout.style.display = "inline-flex";
    if (panel) panel.style.display = "inline-flex";
})();
