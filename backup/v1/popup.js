class Popup {

    constructor() {

        this.popup = document.getElementById("popup");
        this.overlay = document.getElementById("overlay");

        this.word = document.getElementById("popupWord");
        this.meaning = document.getElementById("popupMeaning");

        this.overlay.addEventListener("click", () => {

            this.close();

        });

    }

    show(text) {

        // Ayarlar paneli açıksa kapat
        const settingsPanel = document.getElementById("settingsPanel");

        if (settingsPanel) {
            settingsPanel.classList.remove("show");
        }

        this.word.textContent = text;

        this.meaning.textContent = getMeaning(text);

        this.popup.classList.add("show");
        this.overlay.classList.add("show");

    }

    close() {

        this.popup.classList.remove("show");
        this.overlay.classList.remove("show");

        document
            .querySelectorAll(".word")
            .forEach(w => w.classList.remove("selected"));

        document.dispatchEvent(
            new Event("popupClosed")
        );

    }

}
