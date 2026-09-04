(function () {
    let catalog = [];
    let tab = "reading";
    const emptyCopy = {
        reading: "Henüz bir kitaba başlamadın. Kütüphaneden bir klasik seç.",
        favorites: "Favorin yok. Kütüphanede yıldızladığın kitaplar burada durur.",
        wishlist: "Okuma listen boş. ‘Okuyacağım’ dediğin kitaplar bu rafa gelir."
    };

    function findBook(file) {
        return catalog.find(function (b) { return bookFileOf(b) === file; }) || { title: file, file: file };
    }

    function filesForTab() {
        const shelf = readShelf();
        if (tab === "favorites") return shelf.favorites || [];
        if (tab === "wishlist") return shelf.wishlist || [];
        return localReadFiles();
    }

    function render() {
        document.querySelectorAll("#shelfTabs .tab").forEach(function (btn) {
            btn.classList.toggle("active", btn.getAttribute("data-tab") === tab);
        });

        const files = filesForTab();
        const empty = document.getElementById("shelfEmpty");
        const list = document.getElementById("shelfList");
        list.innerHTML = "";

        if (!files.length) {
            empty.style.display = "block";
            empty.innerHTML = "<p>" + emptyCopy[tab] + '</p><p><a class="btn btn-blue" href="library.html">Kütüphaneye git</a></p>';
            return;
        }
        empty.style.display = "none";

        const shelf = readShelf();
        files.forEach(function (file) {
            const book = findBook(file);
            const note = (shelf.notes && shelf.notes[file]) || "";
            const fav = (shelf.favorites || []).indexOf(file) >= 0;
            const wanted = (shelf.wishlist || []).indexOf(file) >= 0;
            const card = document.createElement("article");
            card.className = "card shelf-card";
            card.innerHTML =
                '<div class="shelf-cover">' + coverBlock(book) + "</div>" +
                '<div class="shelf-body">' +
                    "<h3>" + (book.title || file) + "</h3>" +
                    '<div class="book-meta">' + [book.author, book.year, book.genre].filter(Boolean).join(" · ") + "</div>" +
                    '<label class="note-label">Notun<textarea class="note-box" rows="3" placeholder="Bu kitapta durduğun yer, sevdiğin cümle, hatırlatma…"></textarea></label>' +
                    '<div class="lib-actions">' +
                        '<a class="btn btn-blue btn-sm" href="' + bookHref(book) + '">Oku</a>' +
                        '<button class="btn btn-ghost btn-sm fav-btn" type="button">' + (fav ? "Favoride" : "Favori") + "</button>" +
                        '<button class="btn btn-ghost btn-sm want-btn" type="button">' + (wanted ? "Listemde" : "Okuyacağım") + "</button>" +
                    "</div>" +
                "</div>";
            const area = card.querySelector(".note-box");
            area.value = note;
            area.addEventListener("change", function () { setShelfNote(file, area.value); });
            area.addEventListener("blur", function () { setShelfNote(file, area.value); });
            card.querySelector(".fav-btn").addEventListener("click", function () {
                toggleShelfList("favorites", file);
                render();
            });
            card.querySelector(".want-btn").addEventListener("click", function () {
                toggleShelfList("wishlist", file);
                render();
            });
            list.appendChild(card);
        });
    }

    document.getElementById("shelfTabs").addEventListener("click", function (e) {
        const btn = e.target.closest("[data-tab]");
        if (!btn) return;
        tab = btn.getAttribute("data-tab");
        render();
    });

    (async function boot() {
        await bindSiteNav();
        catalog = await loadCatalog();
        if (window.API && API.configured && API.session) {
            try {
                const rows = await API.myProgress();
                (rows || []).forEach(function (r) {
                    const file = r.books && r.books.slug ? r.books.slug + ".txt" : "";
                    if (!file) return;
                    if (localReadFiles().indexOf(file) < 0) {
                        try { localStorage.setItem("readerPosition:" + file, String(r.scroll_top || 0)); } catch (err) {}
                    }
                });
            } catch (err) {}
        }
        render();
    })();
})();
