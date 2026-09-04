function localCatalog() {
    return (typeof LIBRARY !== "undefined" ? LIBRARY : []).map(function (b) {
        return {
            title: b.title,
            author: b.author,
            year: b.year,
            genre: b.genre,
            file: b.file,
            slug: String(b.file || "").replace(/\.txt$/i, ""),
            cover: b.cover,
            cover_url: b.cover_url || b.cover,
            cover_color: b.cover_color
        };
    });
}

async function loadCatalog() {
    if (window.API && API.configured) {
        try {
            const remote = await API.listBooks();
            if (remote && remote.length) {
                return remote.map(function (b) {
                    return {
                        title: b.title,
                        author: b.author,
                        year: b.year,
                        genre: b.genre,
                        file: (b.slug || "book") + ".txt",
                        slug: b.slug,
                        cover: b.cover_url,
                        cover_url: b.cover_url,
                        cover_color: b.cover_color
                    };
                });
            }
        } catch (err) {}
    }
    return localCatalog();
}

function bookHref(book) {
    const file = bookFileOf(book);
    return "reader.html?book=" + encodeURIComponent(file);
}

function coverBlock(book, tall) {
    const img = book.cover_url || book.cover;
    const color = book.cover_color || "#1e3348";
    const h = tall ? "height:260px;" : "";
    if (img) {
        return '<div class="book-cover img" style="' + h + "background-image:url('" + img + "')\"></div>";
    }
    return '<div class="book-cover" style="' + h + "background:" + color + '">' + (book.title || "") + "</div>";
}

function uniqueSorted(list) {
    return list.filter(Boolean).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort();
}

function localReadFiles() {
    const files = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf("readerPosition:") === 0) {
                files.push(k.slice("readerPosition:".length));
            }
        }
        const cur = localStorage.getItem("currentBook");
        if (cur && files.indexOf(cur) < 0) files.push(cur);
    } catch (err) {}
    return files;
}

async function bindSiteNav() {
    const login = document.getElementById("loginButton");
    const logout = document.getElementById("logoutButton");
    const panel = document.getElementById("panelLink");
    if (login) login.addEventListener("click", function () { API.signInGoogle(); });
    if (logout) logout.addEventListener("click", API.signOut);
    if (!window.API || !API.configured) return;
    const session = await API.getSession();
    if (!session) return;
    if (login) login.style.display = "none";
    if (logout) logout.style.display = "inline-flex";
    if (panel) panel.style.display = "inline-flex";
}
