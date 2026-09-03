window.Speech = {

    lang: "en-US",
    rate: 0.95,
    voice: null,
    mode: null,
    speaking: false,
    paused: false,
    queue: [],
    index: 0,
    currentSpans: [],
    _book: null,
    _bookIndex: 0,
    _timer: null,
    _opts: null,

    supported: function () {
        return typeof window !== "undefined" && "speechSynthesis" in window;
    },

    init: function () {
        if (!this.supported()) return;
        const self = this;
        const pick = function () { self.pickVoice(); };
        pick();
        speechSynthesis.addEventListener("voiceschanged", pick);
        try {
            const saved = JSON.parse(localStorage.getItem("readerSettings") || "{}");
            if (saved.speechRate) self.rate = Number(saved.speechRate);
        } catch (err) {}
    },

    pickVoice: function () {
        if (!this.supported()) return;
        const voices = speechSynthesis.getVoices() || [];
        const en = voices.filter(function (v) {
            return String(v.lang || "").toLowerCase().indexOf("en") === 0;
        });
        const score = function (v) {
            const n = (v.name || "").toLowerCase();
            const lang = (v.lang || "").toLowerCase();
            let s = 0;
            if (lang.indexOf("en-us") === 0) s += 3;
            if (lang.indexOf("en-gb") === 0) s += 2;
            if (/google|natural|neural|premium|samantha|daniel|aria/.test(n)) s += 4;
            if (v.localService) s += 1;
            return s;
        };
        en.sort(function (a, b) { return score(b) - score(a); });
        this.voice = en[0] || voices[0] || null;
    },

    setRate: function (n) {
        this.rate = Math.max(0.6, Math.min(1.4, Number(n) || 0.95));
    },

    isBusy: function () {
        return this.speaking || this.paused;
    },

    emit: function () {
        document.dispatchEvent(new CustomEvent("speechState", { detail: this.snapshot() }));
    },

    snapshot: function () {
        return {
            speaking: this.speaking,
            paused: this.paused,
            mode: this.mode,
            supported: this.supported()
        };
    },

    clearHighlight: function () {
        this.currentSpans.forEach(function (s) {
            s.classList.remove("speaking");
        });
        this.currentSpans = [];
    },

    highlight: function (spans) {
        this.clearHighlight();
        this.currentSpans = spans || [];
        this.currentSpans.forEach(function (s) {
            s.classList.add("speaking");
        });
        if (this.currentSpans[0] && this.currentSpans[0].scrollIntoView) {
            this.currentSpans[0].scrollIntoView({ block: "center", behavior: "smooth" });
        }
    },

    chunk: function (text) {
        const clean = String(text || "").replace(/\s+/g, " ").trim();
        if (!clean) return [];
        if (clean.length < 180) return [clean];
        const parts = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
        const out = [];
        parts.forEach(function (p) {
            const t = p.trim();
            if (!t) return;
            if (t.length < 220) {
                out.push(t);
                return;
            }
            let buf = "";
            t.split(/,\s+/).forEach(function (b) {
                if ((buf + b).length > 200 && buf) {
                    out.push(buf.trim());
                    buf = b + ", ";
                } else buf += b + ", ";
            });
            if (buf.trim()) out.push(buf.trim());
        });
        return out;
    },

    _cancelEngine: function () {
        if (!this.supported()) return;
        try { speechSynthesis.cancel(); } catch (err) {}
    },

    _playQueue: function () {
        const self = this;
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        this._cancelEngine();
        this.speaking = true;
        this.paused = false;
        this.emit();
        this._timer = setTimeout(function () {
            self._timer = null;
            self._next();
        }, 50);
    },

    _next: function () {
        if (!this.speaking || this.paused) return;
        if (this.index >= this.queue.length) {
            if (this.mode === "book") {
                this._bookIndex += 1;
                this._runBookUnit();
                return;
            }
            const opts = this._opts || {};
            this.speaking = false;
            this.mode = null;
            this.clearHighlight();
            this.emit();
            if (typeof opts.onEnd === "function") opts.onEnd();
            return;
        }

        const text = this.queue[this.index];
        const u = new SpeechSynthesisUtterance(text);
        u.lang = this.lang;
        u.rate = this.rate;
        u.pitch = 1;
        if (this.voice) u.voice = this.voice;

        const self = this;
        const step = function () {
            if (!self.speaking) return;
            self.index += 1;
            self._next();
        };
        u.onend = step;
        u.onerror = step;
        this._utterance = u;
        speechSynthesis.speak(u);
    },

    speak: function (text, opts) {
        opts = opts || {};
        if (!this.supported()) return false;
        this.pickVoice();
        const pieces = this.chunk(text);
        if (!pieces.length) return false;
        this.stop(true);
        this._book = null;
        this.queue = pieces;
        this.index = 0;
        this.mode = opts.mode || "text";
        this._opts = opts;
        this._playQueue();
        return true;
    },

    speakWord: function (word) {
        const t = String(word || "").trim();
        if (!t) return false;
        this.clearHighlight();
        return this.speak(t, { mode: "word" });
    },

    speakSentence: function (sentence, spans) {
        const t = String(sentence || "").replace(/\s+/g, " ").trim();
        if (!t) return false;
        if (spans && spans.length) this.highlight(spans);
        return this.speak(t, { mode: "sentence" });
    },

    collectSentences: function (container) {
        const units = [];
        if (!container) return units;
        container.querySelectorAll("p").forEach(function (p) {
            let spans = [];
            let text = "";
            function flush() {
                const t = text.replace(/\s+/g, " ").trim();
                if (t) units.push({ text: t, spans: spans.slice() });
                spans = [];
                text = "";
            }
            p.childNodes.forEach(function (node) {
                if (node.nodeType === 1 && node.classList && node.classList.contains("word")) {
                    spans.push(node);
                    text += (text && !/\s$/.test(text) ? " " : "") + node.textContent;
                    return;
                }
                const bit = node.textContent || "";
                text += bit;
                if (/[.!?]/.test(bit)) flush();
            });
            flush();
        });
        return units;
    },

    spansForSentence: function (span) {
        const sentence = window.sentenceOf ? sentenceOf(span) : (span.textContent || "");
        const p = span.parentElement;
        if (!p) return { text: sentence, spans: [span] };
        const units = [];
        let group = [];
        let text = "";
        function flush() {
            const t = text.replace(/\s+/g, " ").trim();
            if (t) units.push({ text: t, spans: group.slice() });
            group = [];
            text = "";
        }
        p.childNodes.forEach(function (node) {
            if (node.nodeType === 1 && node.classList && node.classList.contains("word")) {
                group.push(node);
                text += (text && !/\s$/.test(text) ? " " : "") + node.textContent;
                return;
            }
            const bit = node.textContent || "";
            text += bit;
            if (/[.!?]/.test(bit)) flush();
        });
        flush();
        for (let i = 0; i < units.length; i++) {
            if (units[i].spans.indexOf(span) !== -1) return units[i];
        }
        return { text: sentence, spans: [span] };
    },

    speakBook: function (container) {
        if (!this.supported()) return false;
        this.pickVoice();
        const units = this.collectSentences(container);
        if (!units.length) return false;
        this.stop(true);
        this._book = units;
        this._bookIndex = 0;
        this.mode = "book";
        this.speaking = true;
        this.emit();
        this._runBookUnit();
        return true;
    },

    _runBookUnit: function () {
        if (!this.speaking || this.mode !== "book" || !this._book) return;
        if (this._bookIndex >= this._book.length) {
            this.speaking = false;
            this.mode = null;
            this._book = null;
            this.clearHighlight();
            this.emit();
            document.dispatchEvent(new Event("speechBookEnd"));
            return;
        }
        const unit = this._book[this._bookIndex];
        this.highlight(unit.spans);
        this.queue = this.chunk(unit.text);
        this.index = 0;
        this.mode = "book";
        this._opts = null;
        this._playQueue();
    },

    stop: function (silent) {
        this.speaking = false;
        this.paused = false;
        this.queue = [];
        this.index = 0;
        this.mode = null;
        this._book = null;
        this._opts = null;
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
        this.clearHighlight();
        this._cancelEngine();
        if (!silent) this.emit();
    },

    pause: function () {
        if (!this.supported() || !this.speaking) return;
        this.paused = true;
        try { speechSynthesis.pause(); } catch (err) {}
        this.emit();
    },

    resume: function () {
        if (!this.supported() || !this.paused) return;
        this.paused = false;
        try { speechSynthesis.resume(); } catch (err) {}
        this.emit();
    }

};

Speech.init();
