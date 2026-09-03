class Reader {

    constructor(popup, settings) {

        this.reader = document.getElementById("reader");
        this.container = document.getElementById("textContainer");

        this.popup = popup;
        this.settings = settings;

        this.animation = null;
        this.saveTimer = null;
        this.isRunning = false;
        
        this.reader.addEventListener("click", (e) => {
        
            if (e.target.classList.contains("word")) return;
        
            if (this.isRunning) {
                this.stop();
            } else {
                this.start();
            }
        
        });

    }

    load() {

        const currentBook =
        localStorage.getItem("currentBook") || "alice.txt";

        const book = LIBRARY.find(b => b.file === currentBook) || LIBRARY[0];

        this.create(book ? book.text : "");

        this.restorePosition();

        this.start();

        this.reader.addEventListener("scroll", () => {

            clearTimeout(this.saveTimer);

            this.saveTimer = setTimeout(() => {

                this.savePosition();

                this.updateProgress();

            }, 100);

        });

    }

    create(text) {

        this.container.innerHTML = "";

        text.split("\n").forEach(paragraph => {

            const p = document.createElement("p");

            paragraph.split(" ").forEach(word => {

                if (!word.trim()) return;

                const span = document.createElement("span");

                span.className = "word";
                span.textContent = word;

                span.addEventListener("click", (e) => {

                    e.stopPropagation();

                    this.stop();

                    document
                        .querySelectorAll(".word")
                        .forEach(w => w.classList.remove("selected"));

                    span.classList.add("selected");

                    this.popup.show(word);

                });

                p.append(span);
                p.append(" ");

            });

            this.container.append(p);

        });

    }

    start() {

        if (this.isRunning) return;
    
        this.isRunning = true;
    
        const animate = () => {
    
            if (!this.isRunning) return;
    
            this.reader.scrollTop += this.settings.speed;
    
            this.updateProgress();
    
            this.animation = requestAnimationFrame(animate);
    
        };
    
        animate();
    
    }

    stop() {

        this.isRunning = false;
    
        cancelAnimationFrame(this.animation);
    
    }

    savePosition() {

        localStorage.setItem(
            "readerPosition",
            this.reader.scrollTop
        );

    }

    restorePosition() {

        const pos = localStorage.getItem("readerPosition");

        if (pos !== null) {

            this.reader.scrollTop = Number(pos);

        }

    }

    updateProgress() {

        const progress = document.getElementById("progressFill");

        if (!progress) return;

        const max =
            this.reader.scrollHeight -
            this.reader.clientHeight;

        if (max <= 0) return;

        const percent =
            (this.reader.scrollTop / max) * 100;

        progress.style.height = percent + "%";

    }

}
