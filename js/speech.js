window.Speech = {

    lang: "en-US",
    rate: 0.95,
    pitch: 1,
    profile: "woman",
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
    _unit: null,
    _wordRaf: null,
    _wordStarted: 0,
    _wordPausedTotal: 0,
    _pauseAt: 0,
    _chunkOffset: 0,

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
            const saved = typeof readPrefs === "function" ? readPrefs() : JSON.parse(localStorage.getItem("readerSettings") || "{}");
            if (saved.speechRate) self.rate = Number(saved.speechRate);
            if (saved.voiceProfile) self.profile = saved.voiceProfile;
        } catch (err) {}
        self.pickVoice();
    },

    applyPrefs: function () {
        const p = typeof readPrefs === "function" ? readPrefs() : {};
        if (p.speechRate) this.setRate(p.speechRate);
        if (p.voiceProfile) this.profile = p.voiceProfile;
        this.pickVoice();
    },

    pickVoice: function () {
        if (!this.supported()) return;
        const voices = speechSynthesis.getVoices() || [];
        const en = voices.filter(function (v) {
            return String(v.lang || "").toLowerCase().indexOf("en") === 0;
        });
        const pool = en.length ? en : voices;
        const profile = this.profile || "woman";
        const female = /female|woman|samantha|zira|karen|moira|tessa|fiona|victoria|aria|jenny|salli|linda|hazel|susan|kate|serena|ava|allison/;
        const male = /male|man|david|daniel|mark|george|james|guy|fred|tom|alex(?!a)|daniel|rishi|aaron|arthur|brian/;
        const child = /child|kid|junior|boy|girl/;
        const score = function (v) {
            const n = (v.name || "").toLowerCase();
            let s = 0;
            if (profile === "child") s += child.test(n) ? 8 : 0;
            if (profile === "woman" || profile === "young") s += female.test(n) ? 6 : (male.test(n) ? -2 : 0);
            if (profile === "man" || profile === "old") s += male.test(n) ? 6 : (female.test(n) ? -2 : 0);
            if (/google|natural|neural|premium/.test(n)) s += 3;
            if ((v.lang || "").toLowerCase().indexOf("en-us") === 0) s += 2;
            return s;
        };
        pool.sort(function (a, b) { return score(b) - score(a); });
        this.voice = pool[0] || null;
        this.pitch = 1;
        if (profile === "woman") this.pitch = 1.05;
        if (profile === "man") this.pitch = 0.92;
        if (profile === "old") this.pitch = 0.78;
        if (profile === "young") this.pitch = 1.18;
        if (profile === "child") this.pitch = 1.4;
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
        document.querySelectorAll(".speaking-word").forEach(function (s) {
            s.classList.remove("speaking-word");
        });
        if (this._wrap && this._wrap.parentNode) {
            const p = this._wrap.parentNode;
            while (this._wrap.firstChild) p.insertBefore(this._wrap.firstChild, this._wrap);
            p.removeChild(this._wrap);
        }
        this._wrap = null;
        this.currentSpans = [];
    },

    highlight: function (spans) {
        this.clearHighlight();
        this.currentSpans = spans || [];
        if (!this.currentSpans.length) return;
        const first = this.currentSpans[0];
        const last = this.currentSpans[this.currentSpans.length - 1];
        if (!first || !first.parentNode) return;
        const wrap = document.createElement("span");
        wrap.className = "sentence-band";
        const parent = first.parentNode;
        const move = [];
        let node = first;
        while (node) {
            const next = node.nextSibling;
            move.push(node);
            if (node === last) {
                if (next && next.nodeType === 3) move.push(next);
                break;
            }
            node = next;
        }
        parent.insertBefore(wrap, first);
        move.forEach(function (n) { wrap.appendChild(n); });
        this._wrap = wrap;
        if (this.currentSpans[0].classList) this.currentSpans[0].classList.add("speaking-word");
        wrap.scrollIntoView({ block: "center", behavior: "smooth" });
    },

    markWordAt: function (charIndex) {
        const unit = this._unit;
        if (!unit || !unit.spans || !unit.spans.length) return;
        const text = unit.text || "";
        let pos = 0;
        let hit = unit.spans[0];
        for (let i = 0; i < unit.spans.length; i++) {
            const w = unit.spans[i].textContent || "";
            const at = text.indexOf(w, pos);
            if (at < 0) continue;
            if (charIndex < at + w.length) {
                hit = unit.spans[i];
                break;
            }
            pos = at + w.length;
            hit = unit.spans[i];
        }
        document.querySelectorAll(".speaking-word").forEach(function (s) {
            s.classList.remove("speaking-word");
        });
        if (hit) hit.classList.add("speaking-word");
    },

    _stopWordTick: function () {
        if (this._wordRaf) {
            cancelAnimationFrame(this._wordRaf);
            this._wordRaf = null;
        }
    },

    _charsPerMs: function () {
        const rate = this.rate || 0.95;
        return (14.5 * rate) / 1000;
    },

    _tickWords: function () {
        const self = this;
        this._stopWordTick();
        const step = function () {
            if (!self.speaking || !self._unit) {
                self._wordRaf = null;
                return;
            }
            if (!self.paused && self._wordStarted) {
                const elapsed = Date.now() - self._wordStarted - (self._wordPausedTotal || 0);
                const idx = self._chunkOffset + elapsed * self._charsPerMs();
                self.markWordAt(idx);
            }
            self._wordRaf = requestAnimationFrame(step);
        };
        this._wordRaf = requestAnimationFrame(step);
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
        u.rate = this.profile === "old" ? Math.max(0.6, this.rate * 0.88) : this.rate;
        u.pitch = this.pitch || 1;
        if (this.voice) u.voice = this.voice;

        const self = this;
        const prefix = this.queue.slice(0, this.index).join(" ");
        this._chunkOffset = prefix ? prefix.length + 1 : 0;

        u.onstart = function () {
            self._wordStarted = Date.now();
            self._wordPausedTotal = 0;
            self._pauseAt = 0;
            self._tickWords();
        };
        u.onboundary = function (evt) {
            if (!evt) return;
            const name = String(evt.name || "").toLowerCase();
            if (name && name !== "word") return;
            const idx = self._chunkOffset + (evt.charIndex || 0);
            const msPerChar = 1 / self._charsPerMs();
            self._wordStarted = Date.now() - idx * msPerChar - (self._wordPausedTotal || 0);
            self.markWordAt(idx);
        };
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
        this._unit = null;
        this.clearHighlight();
        return this.speak(t, { mode: "word" });
    },

    speakSentence: function (sentence, spans) {
        const t = String(sentence || "").replace(/\s+/g, " ").trim();
        if (!t) return false;
        this._unit = { text: t, spans: spans || [] };
        const ok = this.speak(t, { mode: "sentence" });
        if (spans && spans.length) this.highlight(spans);
        return ok;
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

    speakBook: function (container, from) {
        if (!this.supported()) return false;
        this.pickVoice();
        const units = this.collectSentences(container);
        if (!units.length) return false;
        this.stop(true);
        this._book = units;
        this._bookIndex = from === "start" ? 0 : this.indexFromViewport(units);
        this.mode = "book";
        this.speaking = true;
        this.emit();
        this._runBookUnit();
        return true;
    },

    indexFromViewport: function (units) {
        const scroller = document.getElementById("reader");
        const top = scroller && scroller.getBoundingClientRect
            ? scroller.getBoundingClientRect().top
            : 0;
        const line = top + 110;
        for (let i = 0; i < units.length; i++) {
            const span = units[i].spans && units[i].spans[0];
            if (!span || !span.getBoundingClientRect) continue;
            if (span.getBoundingClientRect().bottom > line) return i;
        }
        return Math.max(0, units.length - 1);
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
        this._unit = unit;
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
        this._stopWordTick();
        this._wordStarted = 0;
        this._pauseAt = 0;
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
        this._pauseAt = Date.now();
        try { speechSynthesis.pause(); } catch (err) {}
        this.emit();
    },

    resume: function () {
        if (!this.supported() || !this.paused) return;
        this.paused = false;
        if (this._pauseAt) {
            this._wordPausedTotal = (this._wordPausedTotal || 0) + (Date.now() - this._pauseAt);
            this._pauseAt = 0;
        }
        try { speechSynthesis.resume(); } catch (err) {}
        this.emit();
    }

};

Speech.init();
