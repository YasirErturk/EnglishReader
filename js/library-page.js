(function () {
    let catalog = [];
    let genre = "";
    let author = "";
    let era = "";

    function eraOf(year) {
        const y = Number(year);
        if (!y) return "";
        const start = Math.floor(y / 10) * 10;
        return start + "’ler";
    }

    function filtered() {
        return catalog.filter(function (b) {
            if (genre && b.genre !== genre) return false;
            if (author && b.author !== author) return false;
            if (era && eraOf(b.year) !== era) return false;
            return true;
        });
    }

    function renderChips(id, values, current, onPick, allLabel) {
        const root = document.getElementById(id);
        root.innerHTML = "";
        const all = document.createElement("button");
        all.type = "button";
        all.className = "chip" + (!current ? " on" : "");
        all.textContent = allLabel || "Tümü";
        all.addEventListener("click", function () { onPick(""); });
        root.appendChild(all);
        values.forEach(function (v) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "chip" + (current === v ? " on" : "");
            btn.textContent = v;
            btn.addEventListener("click", function () { onPick(v); });
            root.appendChild(btn);
        });
    }

    function fillSelect(id, values, current) {
        const el = document.getElementById(id);
        const keep = el.options[0];
        el.innerHTML = "";
        el.appendChild(keep);
        values.forEach(function (v) {
            const o = document.createElement("option");
            o.value = v;
            o.textContent = v;
            if (v === current) o.selected = true;
            el.appendChild(o);
        });
    }

    function render() {
        const list = filtered();
        renderChips("genreChips", uniqueSorted(catalog.map(function (b) { return b.genre; })), genre, function (v) {
            genre = v;
            render();
        });
        fillSelect("authorFilter", uniqueSorted(catalog.map(function (b) { return b.author; })), author);
        fillSelect("eraFilter", uniqueSorted(catalog.map(function (b) { return eraOf(b.year); })), era);

        const count = document.getElementById("resultCount");
        count.textContent = list.length + " kitap";

        const grid = document.getElementById("bookGrid");
        grid.innerHTML = "";
        const shelf = readShelf();
        list.forEach(function (book) {
            const file = bookFileOf(book);
            const locked = typeof canReadFull === "function" && !canReadFull() && !isDemoBook(file);
            const wanted = (shelf.wishlist || []).indexOf(file) >= 0;
            const fav = (shelf.favorites || []).indexOf(file) >= 0;
            const card = document.createElement("article");
            card.className = "card lib-card" + (locked ? " locked-card" : "");
            card.innerHTML =
                '<a class="lib-cover" href="' + bookHref(book) + '">' + coverBlock(book) + "</a>" +
                "<h3>" + (book.title || "") + "</h3>" +
                '<div class="book-meta">' + [book.author, book.year, book.genre].filter(Boolean).join(" · ") + "</div>" +
                '<div class="lib-actions">' +
                    '<a class="btn btn-blue btn-sm" href="' + bookHref(book) + '">Oku</a>' +
                    '<button class="btn btn-ghost btn-sm fav-btn" type="button">' + (fav ? "Favoride" : "Favori") + "</button>" +
                    '<button class="btn btn-ghost btn-sm want-btn" type="button">' + (wanted ? "Listemde" : "Okuyacağım") + "</button>" +
                "</div>";
            card.querySelector(".fav-btn").addEventListener("click", function () {
                toggleShelfList("favorites", file);
                render();
            });
            card.querySelector(".want-btn").addEventListener("click", function () {
                toggleShelfList("wishlist", file);
                render();
            });
            grid.appendChild(card);
        });
    }

    document.getElementById("authorFilter").addEventListener("change", function () {
        author = this.value;
        render();
    });
    document.getElementById("eraFilter").addEventListener("change", function () {
        era = this.value;
        render();
    });

    (async function boot() {
        await bindSiteNav();
        catalog = await loadCatalog();
        render();
    })();
})();
