const settings = new Settings();
const popup = new Popup();
const reader = new Reader(popup, settings);

const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");

const speedSlider = document.getElementById("speedSlider");
const fontSlider = document.getElementById("fontSlider");
const lineSlider = document.getElementById("lineSlider");
const speedValue = document.getElementById("speedValue");

const textContainer = document.getElementById("textContainer");

init();

async function init(){

    loadDictionary();

    if (window.API && API.configured) {
        await API.getSession();
        await API.getProfile();
    }

    bindHomeMenu();
    bindListenIdle();

    loadSettings();
    updateSpeedLabel();

    await reader.load();

}

function maybeResumeScroll() {
    if (window.Speech && Speech.isBusy()) return;
    if (!reader.resumeAfterPopup) return;
    if (reader.awaitingStart || reader.gateOpen || reader.finishedShown) {
        reader.resumeAfterPopup = false;
        return;
    }
    reader.resumeAfterPopup = false;
    reader.start();
}

document.addEventListener("popupClosed", maybeResumeScroll);
document.addEventListener("speechState", maybeResumeScroll);

if (settingsButton) settingsButton.addEventListener("click", (e) => {

    e.stopPropagation();

    popup.close();

    reader.stop();

    const libraryPanel = document.getElementById("libraryPanel");
    if (libraryPanel) libraryPanel.classList.remove("show");

    settingsPanel.classList.toggle("show");

});

document.addEventListener("click",(e)=>{

    if(settingsPanel && settingsPanel.contains(e.target)) return;

    if(settingsButton && settingsButton.contains(e.target)) return;

    if (e.target.closest && e.target.closest("#speedNudge")) return;

    if (e.target.closest && e.target.closest("#listenBar")) return;

    if (e.target.closest && e.target.closest("#homeMenuWrap")) return;

    closePanels();
    closeHomeMenu();

});

if (fontSlider) fontSlider.addEventListener("input", () => {
    textContainer.style.fontSize = fontSlider.value + "px";
    saveSettings();
});

if (lineSlider) lineSlider.addEventListener("input", () => {
    textContainer.style.lineHeight = lineSlider.value;
    saveSettings();
});

if (speedSlider) speedSlider.addEventListener("input", () => {
    const i = parseInt(speedSlider.value, 10);
    settings.speed = SPEED_STEPS[i] != null ? SPEED_STEPS[i] : snapSpeed(speedSlider.value);
    updateSpeedLabel();
    saveSettings();
});

const dictStyleEl = document.getElementById("dictStyle");
if (dictStyleEl) dictStyleEl.addEventListener("change", saveSettings);

const speechRateEl = document.getElementById("speechRate");
if (speechRateEl) speechRateEl.addEventListener("input", () => {
    if (window.Speech) Speech.setRate(speechRateEl.value);
    saveSettings();
});

const voiceProfileEl = document.getElementById("voiceProfile");
if (voiceProfileEl) voiceProfileEl.addEventListener("change", () => {
    if (window.Speech) {
        Speech.profile = voiceProfileEl.value;
        Speech.pickVoice();
    }
    saveSettings();
});

const autoSpeakEl = document.getElementById("autoSpeak");
if (autoSpeakEl) autoSpeakEl.addEventListener("change", saveSettings);

const listenPlay = document.getElementById("listenPlay");
const listenPause = document.getElementById("listenPause");
const listenStop = document.getElementById("listenStop");
const listenBar = document.getElementById("listenBar");

function syncListenBar() {
    const busy = window.Speech && Speech.isBusy();
    const paused = !!(window.Speech && Speech.paused);
    const speaking = !!(window.Speech && Speech.speaking && !paused);
    if (listenStop) listenStop.disabled = !busy;
    if (listenPause) listenPause.disabled = !speaking;
    if (listenPlay) listenPlay.disabled = speaking;
    document.body.classList.toggle("speech-on", !!busy);
}

function startBook(from) {
    popup.close();
    reader.stop();
    reader.hideTitle();
    requestAnimationFrame(function () {
        Speech.speakBook(textContainer, from, document.getElementById("reader"));
    });
}

if (listenPlay) listenPlay.addEventListener("click", (e) => {
    e.stopPropagation();
    pokeListen();
    if (window.Speech && Speech.paused) {
        Speech.resume();
        return;
    }
    startBook("here");
});

if (listenPause) listenPause.addEventListener("click", (e) => {
    e.stopPropagation();
    pokeListen();
    Speech.pause();
});

if (listenStop) listenStop.addEventListener("click", (e) => {
    e.stopPropagation();
    pokeListen();
    Speech.stop();
});

document.addEventListener("speechState", syncListenBar);
document.addEventListener("speechBookEnd", function () {
    syncListenBar();
});
syncListenBar();

function bumpSpeed(dir) {
    let i = speedIndex(settings.speed) + dir;
    i = Math.max(0, Math.min(SPEED_STEPS.length - 1, i));
    settings.speed = SPEED_STEPS[i];
    if (speedSlider) speedSlider.value = i;
    updateSpeedLabel();
    saveSettings();
}

function updateSpeedLabel() {
    if (speedValue) speedValue.textContent = formatSpeed(settings.speed);
}

const speedUp = document.getElementById("speedUp");
const speedDown = document.getElementById("speedDown");
if (speedUp) speedUp.addEventListener("click", (e) => { e.stopPropagation(); bumpSpeed(1); });
if (speedDown) speedDown.addEventListener("click", (e) => { e.stopPropagation(); bumpSpeed(-1); });

function saveSettings() {

    writePrefs({
        speed: settings.speed,
        font: parseInt(fontSlider ? fontSlider.value : 34, 10),
        line: parseFloat(lineSlider ? lineSlider.value : 2.2),
        dictStyle: (document.getElementById("dictStyle") || {}).value || "simple",
        paper: document.body.getAttribute("data-paper") || "cream",
        speechRate: parseFloat((document.getElementById("speechRate") || {}).value || (window.Speech && Speech.rate) || 0.95),
        autoSpeak: !!(document.getElementById("autoSpeak") && document.getElementById("autoSpeak").checked),
        voiceProfile: (document.getElementById("voiceProfile") || {}).value || "woman"
    });

}

function loadSettings() {

    const data = readPrefs();

    if (speedSlider) {
        speedSlider.min = 0;
        speedSlider.max = SPEED_STEPS.length - 1;
        speedSlider.step = 1;
        speedSlider.value = speedIndex(data.speed);
    }
    if (fontSlider) fontSlider.value = data.font;
    if (lineSlider) lineSlider.value = data.line;
    const dictStyle = document.getElementById("dictStyle");
    if (dictStyle && data.dictStyle) dictStyle.value = data.dictStyle;

    settings.speed = snapSpeed(data.speed);

    applyPaper(data.paper || "cream");
    if (window.Speech) Speech.applyPrefs();
    const sr = document.getElementById("speechRate");
    if (sr) sr.value = data.speechRate;
    const vp = document.getElementById("voiceProfile");
    if (vp && data.voiceProfile) vp.value = data.voiceProfile;
    const as = document.getElementById("autoSpeak");
    if (as) as.checked = !!data.autoSpeak;

    if (textContainer) {
        textContainer.style.fontSize = data.font + "px";
        textContainer.style.lineHeight = data.line;
    }

}

document.querySelectorAll("#paperSwatches button").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
        e.stopPropagation();
        applyPaper(btn.getAttribute("data-paper"));
        saveSettings();
    });
});

function closePanels(){

    let closed = false;

    if(settingsPanel && settingsPanel.classList.contains("show")){

        settingsPanel.classList.remove("show");

        closed = true;

    }

    if(closed && !reader.awaitingStart && !(window.Speech && Speech.isBusy())){

        reader.start();

    }

}

function bindHomeMenu() {
    const btn = document.getElementById("homeButton");
    const menu = document.getElementById("homeMenu");
    if (!btn || !menu) return;
    btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        menu.classList.toggle("show");
        btn.setAttribute("aria-expanded", menu.classList.contains("show") ? "true" : "false");
    });
}

function closeHomeMenu() {
    const menu = document.getElementById("homeMenu");
    const btn = document.getElementById("homeButton");
    if (menu) menu.classList.remove("show");
    if (btn) btn.setAttribute("aria-expanded", "false");
}

let listenIdleTimer = null;

function pokeListen() {
    if (!listenBar) return;
    listenBar.classList.remove("dim");
    clearTimeout(listenIdleTimer);
    listenIdleTimer = setTimeout(function () {
        if (listenBar) listenBar.classList.add("dim");
    }, 3800);
}

function bindListenIdle() {
    if (!listenBar) return;
    ["pointerdown", "pointerenter", "focusin"].forEach(function (ev) {
        listenBar.addEventListener(ev, pokeListen);
    });
    pokeListen();
}
