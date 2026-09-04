class Popup {

    constructor() {

        this.popup = document.getElementById("popup");
        this.overlay = document.getElementById("overlay");

        this.kind = document.getElementById("popupKind");
        this.word = document.getElementById("popupWord");
        this.meaning = document.getElementById("popupMeaning");
        this.source = document.getElementById("popupSource");
        this.saveButton = document.getElementById("saveWordButton");
        this.suggestButton = document.getElementById("suggestWordButton");
        this.suggestBox = document.getElementById("suggestBox");
        this.suggestInput = document.getElementById("suggestMeaning");
        this.speakIcon = document.getElementById("speakIcon");

        this.currentText = "";
        this.currentMeaning = "";
        this.currentContext = "";
        this.mode = "word";

        if (this.overlay) {
            this.overlay.addEventListener("click", () => {
                this.close();
            });
        }

        if (this.saveButton) {
            this.saveButton.addEventListener("click", (e) => {
                e.stopPropagation();
                if (window.API && API.saveWord) {
                    API.saveWord(this.currentText, this.currentMeaning).then((ok) => {
                        this.setSaved(ok);
                    });
                } else {
                    this.setSaved(false);
                }
            });
        }

        if (this.suggestButton) {
            this.suggestButton.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const note = this.suggestInput ? this.suggestInput.value.trim() : "";
                if (!note) return;
                this.suggestButton.textContent = "Gönderildi";
                this.suggestButton.disabled = true;
                if (!(window.API && API.suggestWord)) return;
                API.suggestWord(this.currentText, note, this.currentContext);
            });
        }

        if (this.suggestInput) {
            this.suggestInput.addEventListener("input", () => this.syncSuggest());
            this.suggestInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    if (this.suggestButton && !this.suggestButton.disabled) this.suggestButton.click();
                }
            });
        }

        if (this.suggestBox) {
            this.suggestBox.addEventListener("click", function (e) {
                e.stopPropagation();
            });
        }

        if (this.speakIcon) {
            this.speakIcon.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.mode === "sentence") Speech.speakSentence(this.word.textContent);
                else Speech.speakWord(this.currentText);
            });
        }

    }

    setSaved(ok) {
        if (!this.saveButton) return;
        this.saveButton.classList.toggle("saved", !!ok);
        const label = this.saveButton.querySelector(".save-label");
        if (label) label.textContent = ok ? "Eklendi" : "Giriş";
        else this.saveButton.textContent = ok ? "Eklendi" : "Giriş gerekli";
    }

    setChrome(open) {
        document.body.classList.toggle("popup-open", open);
    }

    syncSuggest() {
        if (!this.suggestButton) return;
        const note = this.suggestInput ? this.suggestInput.value.trim() : "";
        this.suggestButton.disabled = !note;
    }

    resetSuggest() {
        if (this.suggestBox) {
            this.suggestBox.open = false;
            this.suggestBox.style.display = "none";
        }
        if (this.suggestInput) this.suggestInput.value = "";
        if (this.suggestButton) {
            this.suggestButton.textContent = "Gönder";
            this.suggestButton.disabled = true;
        }
    }

    show(text) {
        this.showWord(text);
    }

    async showWord(text) {

        this.mode = "word";
        this.openPanelsClosed();

        const display = (window.cleanWord ? cleanWord(text) : String(text || "").replace(/[^a-zA-Z']/g, "")) || String(text || "").trim();
        this.currentText = display;
        this.currentContext = "";

        if (this.kind) this.kind.textContent = "";
        this.word.textContent = display;
        this.meaning.textContent = "Bakılıyor…";
        if (this.source) this.source.textContent = "";

        if (this.speakIcon) this.speakIcon.style.display = "inline-flex";
        if (this.saveButton) {
            this.saveButton.style.display = "inline-flex";
            this.saveButton.classList.remove("saved");
            const label = this.saveButton.querySelector(".save-label");
            if (label) label.textContent = "Deftere";
            else this.saveButton.textContent = "Deftere";
        }
        this.resetSuggest();
        if (this.suggestBox) this.suggestBox.style.display = "block";

        this.popup.classList.add("show");
        if (this.overlay) this.overlay.classList.add("show");
        this.setChrome(true);

        const local = getMeaning(display);
        if (local) {
            this.currentMeaning = local;
            this.meaning.textContent = local;
            if (this.source) this.source.textContent = "Kaynak: sözlük";
            return;
        }

        const translated = await translateSentence(display, true);
        this.currentMeaning = translated;
        this.meaning.textContent = translated;
        if (this.source) this.source.textContent = translationSourceLabel();

    }

    async showSentence(sentence, heldWord) {

        this.mode = "sentence";
        this.openPanelsClosed();

        this.currentText = window.cleanWord ? cleanWord(heldWord) : String(heldWord || "").trim();
        sentence = String(sentence || "").replace(/\s+/g, " ").trim();
        this.currentContext = sentence;

        if (this.kind) this.kind.textContent = "";
        this.word.textContent = sentence;
        this.meaning.textContent = "Çevriliyor…";
        if (this.source) this.source.textContent = "";

        if (this.saveButton) this.saveButton.style.display = "none";
        if (this.speakIcon) this.speakIcon.style.display = "inline-flex";
        this.resetSuggest();

        this.popup.classList.add("show");
        if (this.overlay) this.overlay.classList.add("show");
        this.setChrome(true);

        const translated = await translateSentence(sentence, false);
        this.meaning.textContent = translated;
        this.currentMeaning = translated;
        if (this.source) this.source.textContent = translationSourceLabel();

    }

    openPanelsClosed() {
        const settingsPanel = document.getElementById("settingsPanel");
        const libraryPanel = document.getElementById("libraryPanel");
        const homeMenu = document.getElementById("homeMenu");
        if (settingsPanel) settingsPanel.classList.remove("show");
        if (libraryPanel) libraryPanel.classList.remove("show");
        if (homeMenu) homeMenu.classList.remove("show");
    }

    close() {

        if (!this.popup) return;
        const wasOpen = this.popup.classList.contains("show");

        this.popup.classList.remove("show");
        if (this.overlay) this.overlay.classList.remove("show");
        this.setChrome(false);

        document.querySelectorAll(".word.selected").forEach(function (w) {
            w.classList.remove("selected");
            w.classList.add("place-mark");
            window.setTimeout(function () {
                w.classList.remove("place-mark");
            }, 2200);
        });

        if (wasOpen) {
            document.dispatchEvent(new Event("popupClosed"));
        }

    }

}
