class Reader {

    constructor(popup, settings) {

        this.reader = document.getElementById("reader");
        this.container = document.getElementById("textContainer");
        this.titleCard = document.getElementById("titleCard");
        this.gateCard = document.getElementById("gateCard");
        this.finishCard = document.getElementById("finishCard");

        this.popup = popup;
        this.settings = settings;

        this.animation = null;
        this.saveTimer = null;
        this.isRunning = false;
        this.awaitingStart = true;
        this.currentBook = "alice.txt";
        this.currentMeta = null;
        this.sessionStartedAt = null;
        this.draggingProgress = false;
        this.longPressFired = false;
        this.pressTimer = null;
        this.demoMode = false;
        this.finishedShown = false;
        this.gateOpen = false;

        this.reader.addEventListener("click", (e) => {

            if (e.target.classList.contains("word")) return;
            if (this.draggingProgress) return;
            if (this.gateOpen) return;
            if (this.finishedShown) return;
            if (e.target.closest && e.target.closest("#speedNudge")) return;

            if (this.awaitingStart) {
                this.hideTitle();
                this.start();
                return;
            }

            if (this.isRunning) {
                this.stop();
            } else {
                this.start();
            }

        });

        if (this.titleCard) {
            this.titleCard.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.gateOpen) return;
                this.hideTitle();
                this.start();
            });
        }

        this.bindGate();
        this.bindFinish();

        this.reader.addEventListener("selectstart", (e) => e.preventDefault());
        this.reader.addEventListener("dragstart", (e) => e.preventDefault());

        this.bindProgressBar();

    }

    bindGate() {
        const login = document.getElementById("gateLogin");
        const plans = document.getElementById("gatePlans");
        const demo = document.getElementById("gateDemo");
        if (login) login.addEventListener("click", function (e) {
            e.stopPropagation();
            if (window.API) API.signInGoogle(location.href);
        });
        if (plans) plans.addEventListener("click", function (e) {
            e.stopPropagation();
            location.href = "index.html";
        });
        if (demo) demo.addEventListener("click", function (e) {
            e.stopPropagation();
            location.href = "reader.html?book=alice.txt";
        });
    }

    bindFinish() {
        const home = document.getElementById("finishHome");
        const next = document.getElementById("finishNext");
        const again = document.getElementById("finishAgain");
        if (home) home.addEventListener("click", function (e) {
            e.stopPropagation();
            location.href = "index.html";
        });
        if (next) next.addEventListener("click", function (e) {
            e.stopPropagation();
            location.href = "index.html#katalog";
        });
        if (again) again.addEventListener("click", (e) => {
            e.stopPropagation();
            this.hideFinish();
            this.reader.scrollTop = 0;
            this.start();
        });
        const join = document.getElementById("finishJoin");
        if (join) join.addEventListener("click", function (e) {
            e.stopPropagation();
            if (window.API) API.signInGoogle(appBase() + "index.html");
            else location.href = "index.html";
        });
    }

    showTitle(book) {
        if (!this.titleCard) return;
        const img = document.getElementById("titleCover");
        const name = document.getElementById("titleName");
        const meta = document.getElementById("titleMeta");
        const cover = book.cover_url || book.cover || "";
        if (img) {
            if (cover) {
                img.src = cover;
                img.style.display = "block";
            } else {
                img.removeAttribute("src");
                img.style.display = "none";
            }
        }
        if (name) name.textContent = book.title || "";
        if (meta) {
            const bits = [book.author, book.year, book.genre].filter(Boolean);
            if (this.demoMode) bits.push("önizleme");
            meta.textContent = bits.join(" · ");
        }
        this.titleCard.classList.add("show");
        this.awaitingStart = true;
    }

    hideTitle() {
        this.awaitingStart = false;
        if (this.titleCard) this.titleCard.classList.remove("show");
    }

    showGate(kind) {
        this.gateOpen = true;
        this.awaitingStart = true;
        this.stop();
        if (this.titleCard) this.titleCard.classList.remove("show");
        const card = this.gateCard;
        if (!card) return;
        const title = document.getElementById("gateTitle");
        const text = document.getElementById("gateText");
        const demo = document.getElementById("gateDemo");
        if (kind === "locked") {
            if (title) title.textContent = "Bu kitap üyelere açık";
            if (text) text.textContent = "Katalog Google üyeliğiyle açılır. Üye olmadan Alice’ten birkaç sayfa okuyabilirsin.";
            if (demo) demo.style.display = "inline-flex";
        } else {
            if (title) title.textContent = "Önizleme bitti";
            if (text) text.textContent = "Alice’in ilk sayfalarını okudun. Devamı ve diğer kitaplar üyelikle açılır.";
            if (demo) demo.style.display = "none";
        }
        card.classList.add("show");
    }

    showFinish() {
        this.finishedShown = true;
        this.stop();
        if (this.demoMode && !canReadFull()) {
            this.showGate("preview");
            return;
        }
        const card = this.finishCard;
        if (!card) return;
        const name = document.getElementById("finishName");
        if (name && this.currentMeta) name.textContent = this.currentMeta.title || "";
        const join = document.getElementById("finishJoin");
        if (join) join.style.display = canReadFull() ? "none" : "inline-flex";
        card.classList.add("show");
        if (window.API && API.saveProgress) {
            API.saveProgress(this.currentBook, this.reader.scrollTop, 100);
        }
    }

    hideFinish() {
        this.finishedShown = false;
        if (this.finishCard) this.finishCard.classList.remove("show");
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
            this.checkFinish();

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

        const fullOk = canReadFull();
        const demo = isDemoBook(this.currentBook);
        this.demoMode = demo && !fullOk;

        if (!fullOk && !demo) {
            this.showGate("locked");
            if (this.container) this.container.innerHTML = "";
            return;
        }

        let book = LIBRARY.find(b => b.file === this.currentBook) || LIBRARY[0] || {};

        if (window.API && API.configured) {
            try {
                const remote = await API.getBookBySlug(this.currentBook);
                if (remote && remote.content) {
                    book = {
                        file: this.currentBook,
                        title: remote.title,
                        author: remote.author,
                        year: remote.year,
                        genre: remote.genre,
                        cover: remote.cover_url || book.cover,
                        cover_url: remote.cover_url || book.cover,
                        text: remote.content
                    };
                }
            } catch (err) {}
        }

        let text = book.text || "";
        if (this.demoMode) text = excerptText(text);

        this.currentMeta = book;
        this.create(text);
        this.showTitle(book);
        if (!this.demoMode) this.restorePosition();

        this.reader.addEventListener("scroll", () => {

            clearTimeout(this.saveTimer);

            this.saveTimer = setTimeout(() => {

                this.savePosition();

                this.updateProgress();

                this.checkFinish();

            }, 100);

        });

        window.addEventListener("beforeunload", () => {
            this.flushSession();
        });

        requestAnimationFrame(() => this.updateProgress());

    }

    create(text) {

        this.container.innerHTML = "";

        if (this.currentMeta && this.currentMeta.title) {
            const h = document.createElement("h1");
            h.className = "bookHeading";
            h.textContent = this.currentMeta.title;
            this.container.append(h);
        }

        String(text || "").split("\n").forEach(paragraph => {

            const p = document.createElement("p");

            paragraph.split(" ").forEach(token => {

                if (!token.trim()) return;

                const parts = splitToken(token);

                if (parts.lead) p.append(parts.lead);

                if (parts.word) {
                    const span = document.createElement("span");
                    span.className = "word";
                    span.textContent = parts.word;
                    this.bindWord(span);
                    p.append(span);
                }

                if (parts.trail) p.append(parts.trail);

                p.append(" ");

            });

            this.container.append(p);

        });

        const end = document.createElement("div");
        end.id = "endSentinel";
        end.className = "endSentinel";
        end.textContent = this.demoMode ? "Önizlemenin sonu" : "Son";
        this.container.append(end);

    }

    bindWord(span) {

        const clearPress = () => {
            if (this.pressTimer) {
                clearTimeout(this.pressTimer);
                this.pressTimer = null;
            }
        };

        const startPress = (e) => {
            if (e.button && e.button !== 0) return;
            if (this.awaitingStart || this.gateOpen || this.finishedShown) return;
            this.longPressFired = false;
            clearPress();
            this.pressTimer = setTimeout(() => {
                this.longPressFired = true;
                this.stop();
                document.querySelectorAll(".word").forEach(w => w.classList.remove("selected"));
                span.classList.add("selected");
                const sentence = sentenceOf(span);
                this.popup.showSentence(sentence, span.textContent);
            }, 520);
        };

        span.addEventListener("pointerdown", startPress);
        span.addEventListener("pointerup", clearPress);
        span.addEventListener("pointerleave", clearPress);
        span.addEventListener("pointercancel", clearPress);

        span.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        span.addEventListener("click", (e) => {

            e.stopPropagation();

            if (this.awaitingStart) {
                this.hideTitle();
                this.start();
                return;
            }

            if (this.longPressFired) {
                this.longPressFired = false;
                return;
            }

            this.stop();

            document.querySelectorAll(".word").forEach(w => w.classList.remove("selected"));
            span.classList.add("selected");
            this.popup.showWord(span.textContent);

        });

    }

    start() {

        if (this.awaitingStart || this.gateOpen || this.finishedShown) return;
        if (this.isRunning) return;

        this.isRunning = true;
        this.sessionStartedAt = Date.now();

        const animate = () => {

            if (!this.isRunning) return;

            this.reader.scrollTop += this.settings.speed;

            this.updateProgress();
            this.checkFinish();

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

        if (this.demoMode || this.gateOpen) return;

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
                if (!data || this.demoMode) return;
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

    checkFinish() {
        if (this.awaitingStart || this.gateOpen || this.finishedShown) return;
        const max = this.reader.scrollHeight - this.reader.clientHeight;
        if (max <= 40) return;
        if (this.reader.scrollTop >= max - 12) {
            this.showFinish();
        }
    }

    updateProgress() {

        const progress = document.getElementById("progressFill");
        const thumb = document.getElementById("progressThumb");

        if (!progress) return;

        const max =
            this.reader.scrollHeight -
            this.reader.clientHeight;

        if (max <= 0) {
            progress.style.height = "0%";
            if (thumb) thumb.style.top = "0%";
            return;
        }

        const percent = Math.max(0, Math.min(100, (this.reader.scrollTop / max) * 100));

        progress.style.height = percent + "%";

        if (thumb) {
            thumb.style.top = percent + "%";
        }

    }

}
