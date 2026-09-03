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

        this.currentText = "";
        this.currentMeaning = "";
        this.currentContext = "";
        this.mode = "word";

        this.overlay.addEventListener("click", () => {
            this.close();
        });

        if (this.saveButton) {
            this.saveButton.addEventListener("click", (e) => {
                e.stopPropagation();
                if (window.API && API.saveWord) {
                    API.saveWord(this.currentText, this.currentMeaning).then(function (ok) {
                        const btn = document.getElementById("saveWordButton");
                        if (!btn) return;
                        btn.textContent = ok ? "Kaydedildi" : "Giriş gerekli";
                    });
                } else {
                    this.saveButton.textContent = "Giriş gerekli";
                }
            });
        }

        if (this.suggestButton) {
            this.suggestButton.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const btn = this.suggestButton;
                const note = this.suggestInput ? this.suggestInput.value.trim() : "";
                const meaning = note || this.currentMeaning;
                btn.textContent = "Gönderildi";
                if (!(window.API && API.suggestWord)) return;
                API.suggestWord(this.currentText, meaning, this.currentContext);
            });
        }

        if (this.suggestBox) {
            this.suggestBox.addEventListener("click", function (e) {
                e.stopPropagation();
            });
        }

    }

    setChrome(open) {
        document.body.classList.toggle("popup-open", open);
    }

    resetSuggest() {
        if (this.suggestBox) {
            this.suggestBox.open = false;
            this.suggestBox.style.display = "none";
        }
        if (this.suggestInput) this.suggestInput.value = "";
        if (this.suggestButton) this.suggestButton.textContent = "Gönder";
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

        if (this.kind) this.kind.textContent = "Kelime";
        this.word.textContent = display;
        this.meaning.textContent = "Bakılıyor…";
        if (this.source) this.source.textContent = "";

        if (this.saveButton) {
            this.saveButton.style.display = "block";
            this.saveButton.textContent = "Kelime defterime ekle";
        }
        this.resetSuggest();
        if (this.suggestBox) this.suggestBox.style.display = "block";

        this.popup.classList.add("show");
        this.overlay.classList.add("show");
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

        if (this.kind) this.kind.textContent = "Cümle çevirisi";
        this.word.textContent = sentence;
        this.meaning.textContent = "Çevriliyor…";
        if (this.source) this.source.textContent = "";

        if (this.saveButton) this.saveButton.style.display = "none";
        this.resetSuggest();

        this.popup.classList.add("show");
        this.overlay.classList.add("show");
        this.setChrome(true);

        const translated = await translateSentence(sentence, false);
        this.meaning.textContent = translated;
        this.currentMeaning = translated;
        if (this.source) this.source.textContent = translationSourceLabel();

    }

    openPanelsClosed() {
        const settingsPanel = document.getElementById("settingsPanel");
        const libraryPanel = document.getElementById("libraryPanel");
        if (settingsPanel) settingsPanel.classList.remove("show");
        if (libraryPanel) libraryPanel.classList.remove("show");
    }

    close() {

        const wasOpen = this.popup.classList.contains("show");

        this.popup.classList.remove("show");
        this.overlay.classList.remove("show");
        this.setChrome(false);

        document
            .querySelectorAll(".word")
            .forEach(w => w.classList.remove("selected"));

        if (wasOpen) {
            document.dispatchEvent(new Event("popupClosed"));
        }

    }

}
