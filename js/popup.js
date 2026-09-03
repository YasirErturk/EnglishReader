class Popup {

    constructor() {

        this.popup = document.getElementById("popup");
        this.overlay = document.getElementById("overlay");

        this.word = document.getElementById("popupWord");
        this.meaning = document.getElementById("popupMeaning");
        this.saveButton = document.getElementById("saveWordButton");

        this.currentText = "";
        this.currentMeaning = "";

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

    }

    show(text) {

        const settingsPanel = document.getElementById("settingsPanel");
        const libraryPanel = document.getElementById("libraryPanel");

        if (settingsPanel) settingsPanel.classList.remove("show");
        if (libraryPanel) libraryPanel.classList.remove("show");

        this.currentText = text;
        this.currentMeaning = getMeaning(text);

        this.word.textContent = text;
        this.meaning.textContent = this.currentMeaning;

        if (this.saveButton) {
            this.saveButton.textContent = "Kelime defterine ekle";
        }

        this.popup.classList.add("show");
        this.overlay.classList.add("show");

    }

    close() {

        const wasOpen = this.popup.classList.contains("show");

        this.popup.classList.remove("show");
        this.overlay.classList.remove("show");

        document
            .querySelectorAll(".word")
            .forEach(w => w.classList.remove("selected"));

        if (wasOpen) {
            document.dispatchEvent(
                new Event("popupClosed")
            );
        }

    }

}
