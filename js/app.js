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

    const home = document.getElementById("homeButton");
    if (home) home.href = "index.html";

    await loadLibrary();

    loadSettings();
    updateSpeedLabel();

    await reader.load();

}

document.addEventListener("popupClosed", () => {
    if (window.Speech && Speech.isBusy()) return;
    if (!reader.awaitingStart && !reader.gateOpen && !reader.finishedShown) reader.start();
});

if (settingsButton) settingsButton.addEventListener("click", (e) => {

    e.stopPropagation();

    popup.close();

    reader.stop();
    
    libraryPanel.classList.remove("show");
    
    settingsPanel.classList.toggle("show");

});

document.addEventListener("click",(e)=>{

    if(settingsPanel && settingsPanel.contains(e.target)) return;

    if(libraryPanel && libraryPanel.contains(e.target)) return;

    if(settingsButton && settingsButton.contains(e.target)) return;

    if(libraryButton && libraryButton.contains(e.target)) return;

    if (e.target.closest && e.target.closest("#speedNudge")) return;

    if (e.target.closest && e.target.closest("#listenBar")) return;

    closePanels();

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
    settings.speed = parseFloat(speedSlider.value);
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

const listenHere = document.getElementById("listenHere");
const listenStart = document.getElementById("listenStart");
const listenStop = document.getElementById("listenStop");

function syncListenBar() {
    const busy = window.Speech && Speech.isBusy();
    if (listenStop) listenStop.disabled = !busy;
    const bookOn = !!(window.Speech && Speech.mode === "book");
    if (listenHere) listenHere.disabled = bookOn;
    if (listenStart) listenStart.disabled = bookOn;
    document.body.classList.toggle("speech-on", !!busy);
}

function startBook(from) {
    popup.close();
    reader.stop();
    reader.hideTitle();
    Speech.speakBook(textContainer, from);
}

if (listenHere) listenHere.addEventListener("click", (e) => {
    e.stopPropagation();
    startBook("here");
});

if (listenStart) listenStart.addEventListener("click", (e) => {
    e.stopPropagation();
    startBook("start");
});

if (listenStop) listenStop.addEventListener("click", (e) => {
    e.stopPropagation();
    Speech.stop();
});

document.addEventListener("speechState", syncListenBar);
document.addEventListener("speechBookEnd", function () {
    syncListenBar();
});
syncListenBar();

function bumpSpeed(delta) {
    let v = parseFloat(speedSlider ? speedSlider.value : settings.speed) + delta;
    v = Math.round(v * 10) / 10;
    v = Math.max(0.2, Math.min(7, v));
    settings.speed = v;
    if (speedSlider) speedSlider.value = v;
    updateSpeedLabel();
    saveSettings();
}

function updateSpeedLabel() {
    if (speedValue) speedValue.textContent = Number(settings.speed).toFixed(1);
}

const speedUp = document.getElementById("speedUp");
const speedDown = document.getElementById("speedDown");
if (speedUp) speedUp.addEventListener("click", (e) => { e.stopPropagation(); bumpSpeed(0.1); });
if (speedDown) speedDown.addEventListener("click", (e) => { e.stopPropagation(); bumpSpeed(-0.1); });

function saveSettings() {

    writePrefs({
        speed: parseFloat(speedSlider ? speedSlider.value : settings.speed),
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

    if (speedSlider) speedSlider.value = data.speed;
    if (fontSlider) fontSlider.value = data.font;
    if (lineSlider) lineSlider.value = data.line;
    const dictStyle = document.getElementById("dictStyle");
    if (dictStyle && data.dictStyle) dictStyle.value = data.dictStyle;

    settings.speed = Number(data.speed);

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

const libraryButton = document.getElementById("libraryButton");
const libraryPanel = document.getElementById("libraryPanel");

if (libraryButton) libraryButton.addEventListener("click",(e)=>{

    e.stopPropagation();

    popup.close();

    reader.stop();

    settingsPanel.classList.remove("show");

    libraryPanel.classList.toggle("show");

});

function closePanels(){

    let closed = false;

    if(settingsPanel && settingsPanel.classList.contains("show")){

        settingsPanel.classList.remove("show");

        closed = true;

    }

    if(libraryPanel && libraryPanel.classList.contains("show")){

        libraryPanel.classList.remove("show");

        closed = true;

    }

    if(closed && !reader.awaitingStart && !(window.Speech && Speech.isBusy())){

        reader.start();

    }

}

async function loadLibrary(){

    const panel = document.getElementById("libraryPanel");
    if (!panel) return;

    panel.innerHTML = "<h2>📚 Kitaplık</h2>";

    let books = LIBRARY.slice();

    if (window.API && API.configured) {
        try {
            const remote = await API.listBooks();
            if (remote && remote.length) {
                books = remote.map(function (b) {
                    return {
                        title: b.title + (b.is_copyrighted ? " 🔒" : ""),
                        file: (b.slug || "book") + ".txt"
                    };
                });
            }
        } catch (err) {}
    }

    books.forEach(book=>{

        const div=document.createElement("div");

        div.className="book";

        const file = book.file;
        const locked = !canReadFull() && !isDemoBook(file);
        div.innerText = book.title + (locked ? " · üye" : "");
        if (locked) div.classList.add("locked");

        div.onclick=()=>{

            localStorage.setItem("currentBook", file);

            location.href = "reader.html?book=" + encodeURIComponent(file);

        };

        panel.appendChild(div);

    });

}
