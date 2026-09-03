class Reader {

    constructor(popup, settings) {

        this.reader = document.getElementById("reader");
        this.container = document.getElementById("textContainer");

        this.popup = popup;
        this.settings = settings;

        this.animation = null;
        this.saveTimer = null;
        this.isRunning = false;
        this.skipWordClick = false;
        this.currentBook = "alice.txt";
        this.sessionStartedAt = null;
        this.draggingProgress = false;

        this.reader.addEventListener("click", (e) => {

            if (e.target.classList.contains("word")) return;
            if (this.draggingProgress) return;

            if (this.isRunning) {
                this.stop();
            } else {
                this.start();
            }

        });

        this.reader.addEventListener("mousemove", (e) => {

            if (e.buttons === 1 && window.getSelection && window.getSelection().toString()) {
                this.stop();
            }

        });

        document.addEventListener("mouseup", () => {

            const sel = window.getSelection ? window.getSelection().toString().trim() : "";
            const parts = sel.split(/\s+/).filter(Boolean);

            if (parts.length >= 2) {
                this.skipWordClick = true;
                this.stop();
                this.popup.show(sel);
            }

        });

        this.bindProgressBar();

    }

    bindProgressBar() {

        const bar = document.getElementById("progressBar");

        if (!bar) return;

        const apply = (clientY) => {

            const rect = bar.getBoundingClientRect();
            let percent = (clientY - rect.top) / rect.height;
            percent = Math.max(0, Math.min(1, percent));

            const max = this.reader.scrollHeight - this.reader.clientHeight;

            if (max > 0) {
                this.reader.scrollTop = percent * max;
            }

            this.updateProgress();
            this.savePosition();

        };

        const startDrag = (e) => {

            e.preventDefault();
            e.stopPropagation();

            this.draggingProgress = true;
            this.wasRunningBeforeDrag = this.isRunning;
            this.stop();
            bar.classList.add("dragging");

            const y = e.touches ? e.touches[0].clientY : e.clientY;
            apply(y);

        };

        const moveDrag = (e) => {

            if (!this.draggingProgress) return;
            e.preventDefault();
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            apply(y);

        };

        const endDrag = (e) => {

            if (!this.draggingProgress) return;
            if (e) e.stopPropagation();
            this.draggingProgress = false;
            bar.classList.remove("dragging");
            this.savePosition();

        };

        bar.addEventListener("mousedown", startDrag);
        window.addEventListener("mousemove", moveDrag);
        window.addEventListener("mouseup", endDrag);

        bar.addEventListener("touchstart", startDrag, { passive: false });
        window.addEventListener("touchmove", moveDrag, { passive: false });
        window.addEventListener("touchend", endDrag);

        bar.addEventListener("click", (e) => e.stopPropagation());

    }

    async load() {

        const params = new URLSearchParams(location.search);
        this.currentBook =
            params.get("book") ||
            localStorage.getItem("currentBook") ||
            "alice.txt";

        localStorage.setItem("currentBook", this.currentBook);

        let book = LIBRARY.find(b => b.file === this.currentBook) || LIBRARY[0];

        if (window.API && API.configured) {
            try {
                const remote = await API.getBookBySlug(this.currentBook);
                if (remote && remote.content) {
                    book = {
                        file: this.currentBook,
                        title: remote.title,
                        text: remote.content
                    };
                }
            } catch (err) {}
        }

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

        window.addEventListener("beforeunload", () => {
            this.flushSession();
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

                    if (this.skipWordClick) {
                        this.skipWordClick = false;
                        return;
                    }

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
        this.sessionStartedAt = Date.now();

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

        this.flushSession();

    }

    positionKey() {
        return "readerPosition:" + this.currentBook;
    }

    savePosition() {

        const max =
            this.reader.scrollHeight -
            this.reader.clientHeight;

        const percent = max > 0 ? (this.reader.scrollTop / max) * 100 : 0;

        localStorage.setItem(this.positionKey(), this.reader.scrollTop);

        if (window.API && API.saveProgress) {
            API.saveProgress(this.currentBook, this.reader.scrollTop, percent);
        }

    }

    restorePosition() {

        const pos = localStorage.getItem(this.positionKey());

        if (pos !== null) {
            this.reader.scrollTop = Number(pos);
        }

        this.updateProgress();

        if (window.API && API.loadProgress) {
            API.loadProgress(this.currentBook).then((data) => {
                if (!data) return;
                this.reader.scrollTop = Number(data.scroll_top || 0);
                this.updateProgress();
            }).catch(function () {});
        }

    }

    flushSession() {

        if (!this.sessionStartedAt) return;

        const seconds = Math.round((Date.now() - this.sessionStartedAt) / 1000);
        this.sessionStartedAt = null;

        if (seconds < 2) return;

        if (window.API && API.addReadingTime) {
            API.addReadingTime(this.currentBook, seconds);
        }

    }

    updateProgress() {

        const progress = document.getElementById("progressFill");
        const thumb = document.getElementById("progressThumb");

        if (!progress) return;

        const max =
            this.reader.scrollHeight -
            this.reader.clientHeight;

        if (max <= 0) return;

        const percent =
            (this.reader.scrollTop / max) * 100;

        progress.style.height = percent + "%";

        if (thumb) {
            thumb.style.top = percent + "%";
        }

    }

}
