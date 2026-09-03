function bookHref(book) {
    const file = book.file || ((book.slug || "") + ".txt");
    return "reader.html?book=" + encodeURIComponent(file);
}

function coverVisual(book, tall) {
    const img = book.cover_url || book.cover;
    const color = book.cover_color || "#1e3348";
    const h = tall ? "height:420px;" : "";
    if (img) {
        return '<div class="book-cover img" style="' + h + "background-image:url('" + img + "')\"></div>";
    }
    return '<div class="book-cover" style="' + h + "background:" + color + '">' + (book.title || "") + "</div>";
}

function coverHtml(book, extra) {
    const locked = typeof canReadFull === "function" && !canReadFull() && !isDemoBook(book.file || book.slug);
    return '<a class="card' + (locked ? " locked-card" : "") + '" href="' + bookHref(book) + '" style="text-decoration:none">' +
        coverVisual(book) +
        "<h3>" + (book.title || "") + "</h3>" +
        '<div class="book-meta">' + [book.author, book.year, extra].filter(Boolean).join(" · ") + "</div></a>";
}

function compactHtml(book, extra) {
    const img = book.cover_url || book.cover;
    const color = book.cover_color || "#1e3348";
    const thumb = img
        ? '<span class="mini-cover" style="background-image:url(\'' + img + "')\"></span>"
        : '<span class="mini-cover" style="background:' + color + '"></span>';
    return '<a class="compact-row" href="' + bookHref(book) + '">' +
        thumb +
        "<span><b>" + (book.title || "") + "</b><small>" +
        [book.author, extra].filter(Boolean).join(" · ") +
        "</small></span></a>";
}

function renderInto(id, list, extras) {
    const root = document.getElementById(id);
    if (!root) return;
    root.innerHTML = "";
    (list || []).forEach(function (book, i) {
        root.insertAdjacentHTML("beforeend", coverHtml(book, extras && extras[i]));
    });
}

function renderCompact(id, list, extras) {
    const root = document.getElementById(id);
    if (!root) return;
    root.innerHTML = "";
    (list || []).forEach(function (book, i) {
        root.insertAdjacentHTML("beforeend", compactHtml(book, extras && extras[i]));
    });
}

function renderRanks(id, list) {
    const root = document.getElementById(id);
    if (!root) return;
    root.innerHTML = "";
    (list || []).forEach(function (book, i) {
        const img = book.cover_url || book.cover;
        const color = book.cover_color || "#1e3348";
        const thumb = img
            ? '<span class="mini-cover" style="background-image:url(\'' + img + "')\"></span>"
            : '<span class="mini-cover" style="background:' + color + '"></span>';
        root.insertAdjacentHTML("beforeend",
            "<li><a href=\"" + bookHref(book) + "\">" +
            '<span class="n">' + (i + 1) + "</span>" +
            thumb +
            "<span><b>" + (book.title || "") + "</b><small>" + (book.author || "") + "</small></span>" +
            "</a></li>");
    });
}

function renderSpotlight(book, badge) {
    const root = document.getElementById("spotlight");
    if (!root || !book) {
        if (root) root.innerHTML = "";
        return;
    }
    root.innerHTML =
        '<a class="card spotlight-card" href="' + bookHref(book) + '">' +
        '<span class="badge">' + (badge || "Günün favorisi") + "</span>" +
        coverVisual(book, true) +
        '<div class="spotlight-copy">' +
        "<h3>" + (book.title || "") + "</h3>" +
        '<div class="book-meta">' + [book.author, book.year, book.genre].filter(Boolean).join(" · ") + "</div>" +
        "</div></a>";
}

function localBooks() {
    return (typeof LIBRARY !== "undefined" ? LIBRARY : []).map(function (b) {
        return {
            title: b.title,
            author: b.author,
            year: b.year,
            genre: b.genre,
            file: b.file,
            cover: b.cover,
            cover_url: b.cover,
            cover_color: b.cover_color,
            slug: String(b.file || "").replace(/\.txt$/i, "")
        };
    });
}

async function boot() {
    const loginBtns = document.querySelectorAll("#loginButton, #loginButton2");
    loginBtns.forEach(function (btn) {
        btn.addEventListener("click", function () { API.signInGoogle(); });
    });

    const logout = document.getElementById("logoutButton");
    if (logout) logout.addEventListener("click", API.signOut);

    let session = null;
    let mine = [];
    let stats = [];

    if (API.configured) {
        session = await API.getSession();
        if (session) {
            document.getElementById("loginButton").style.display = "none";
            const b2 = document.getElementById("loginButton2");
            if (b2) b2.style.display = "none";
            document.getElementById("logoutButton").style.display = "inline-flex";
            document.getElementById("panelLink").style.display = "inline-flex";
            document.getElementById("hero").style.display = "none";
            const how = document.getElementById("how");
            if (how) how.style.display = "none";
            mine = await API.myProgress();
        }
        stats = await API.bookStats();
    }

    const catalog = (stats && stats.length)
        ? stats.map(function (b) {
            return {
                title: b.title,
                author: b.author,
                year: b.year,
                genre: b.genre,
                slug: b.slug,
                file: b.slug + ".txt",
                cover_url: b.cover_url,
                cover_color: b.cover_color,
                seconds_1d: b.seconds_1d,
                seconds_7d: b.seconds_7d,
                seconds_all: b.seconds_all
            };
        })
        : localBooks();

    if (mine.length) {
        document.getElementById("continueBlock").style.display = "block";
        renderCompact("myBooks", mine.slice(0, 3).map(function (r) {
            const b = r.books || {};
            return {
                title: b.title,
                author: b.author,
                year: b.year,
                slug: b.slug,
                file: (b.slug || "") + ".txt",
                cover_url: b.cover_url,
                cover_color: b.cover_color
            };
        }), mine.slice(0, 3).map(function (r) {
            return Math.round(r.percent || 0) + "%";
        }));
    }

    const byDay = catalog.slice().sort(function (a, b) { return (b.seconds_1d || 0) - (a.seconds_1d || 0); });
    const byWeek = catalog.slice().sort(function (a, b) { return (b.seconds_7d || 0) - (a.seconds_7d || 0); });
    const byAll = catalog.slice().sort(function (a, b) { return (b.seconds_all || 0) - (a.seconds_all || 0); });

    renderSpotlight(byDay[0] || catalog[0], "Günün favorisi");
    renderCompact("weekFav", byWeek.slice(0, 1));
    renderRanks("top10", byAll.slice(0, 10));
    renderInto("publicBooks", catalog);

    if (session) {
        const started = {};
        mine.forEach(function (r) {
            if (r.books && r.books.slug) started[r.books.slug] = true;
        });
        const rec = catalog.filter(function (b) { return !started[b.slug]; }).slice(0, 4);
        if (rec.length) {
            document.getElementById("recSection").style.display = "block";
            renderInto("recommended", rec);
        }
    }
}

boot();
