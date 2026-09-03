class Popup {

    constructor() {

        this.popup = document.getElementById("popup");
        this.overlay = document.getElementById("overlay");

        this.kind = document.getElementById("popupKind");
        this.word = document.getElementById("popupWord");
        this.meaning = document.getElementById("popupMeaning");
        this.hint = document.getElementById("popupHint");
        this.saveButton = document.getElementById("saveWordButton");
        this.suggestButton = document.getElementById("suggestWordButton");

        this.currentText = "";
        this.currentMeaning = "";
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
                }
            });
        }

        if (this.suggestButton) {
            this.suggestButton.addEventListener("click", (e) => {
                e.stopPropagation();
                if (!(window.API && API.suggestWord)) return;
                API.suggestWord(this.currentText, this.currentMeaning).then(function (result) {
                    const btn = document.getElementById("suggestWordButton");
                    if (!btn) return;
                    btn.textContent = result.message;
                });
            });
        }

    }

    show(text) {
        this.showWord(text);
    }

    showWord(text) {

        this.mode = "word";
        this.openPanelsClosed();

        this.currentText = String(text || "").trim();
        this.currentMeaning = getMeaning(this.currentText);

        if (this.kind) this.kind.textContent = "Kelime";
        this.word.textContent = this.currentText;
        this.meaning.textContent = this.currentMeaning;
        if (this.hint) this.hint.textContent = "Basılı tutarak cümlenin çevirisini gör.";

        if (this.saveButton) {
            this.saveButton.style.display = "block";
            this.saveButton.textContent = "Kelime defterine ekle";
        }
        if (this.suggestButton) {
            this.suggestButton.style.display = "block";
            this.suggestButton.textContent = "Sözlüğe öner";
        }

        this.popup.classList.add("show");
        this.overlay.classList.add("show");

    }

    async showSentence(sentence, heldWord) {

        this.mode = "sentence";
        this.openPanelsClosed();

        this.currentText = String(heldWord || "").trim();
        sentence = String(sentence || "").replace(/\s+/g, " ").trim();

        if (this.kind) this.kind.textContent = "Cümle çevirisi";
        this.word.textContent = sentence;
        this.meaning.textContent = "Çevriliyor…";
        if (this.hint) this.hint.textContent = "Kelimeye kısa tık: tek kelime. Basılı tut: cümle.";

        if (this.saveButton) this.saveButton.style.display = "none";
        if (this.suggestButton) this.suggestButton.style.display = "none";

        this.popup.classList.add("show");
        this.overlay.classList.add("show");

        const translated = await translateSentence(sentence);
        this.meaning.textContent = translated;
        this.currentMeaning = translated;

        if (this.suggestButton && this.currentText) {
            this.suggestButton.style.display = "block";
            this.suggestButton.textContent = "Bu kelimeyi sözlüğe öner";
        }

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

        document
            .querySelectorAll(".word")
            .forEach(w => w.classList.remove("selected"));

        if (wasOpen) {
            document.dispatchEvent(new Event("popupClosed"));
        }

    }

}
