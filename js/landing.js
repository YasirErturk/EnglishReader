function coverHtml(book, extra) {
    const file = book.file || ((book.slug || "") + ".txt");
    const img = book.cover_url || book.cover;
    const color = book.cover_color || "#1e3348";
    const visual = img
        ? '<div class="book-cover img" style="background-image:url(\'' + img + '\')"></div>'
        : '<div class="book-cover" style="background:' + color + '">' + (book.title || "") + "</div>";
    return '<a class="card" href="reader.html?book=' + encodeURIComponent(file) + '" style="text-decoration:none">' +
        visual +
        "<h3>" + (book.title || "") + "</h3>" +
        '<div class="book-meta">' + [book.author, book.year, extra].filter(Boolean).join(" · ") + "</div></a>";
}

function renderInto(id, list, extras) {
    const root = document.getElementById(id);
    if (!root) return;
    root.innerHTML = "";
    (list || []).forEach(function (book, i) {
        root.insertAdjacentHTML("beforeend", coverHtml(book, extras && extras[i]));
    });
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
        document.getElementById("continueSection").style.display = "block";
        renderInto("myBooks", mine.map(function (r) {
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
        }));
    }

    const byDay = catalog.slice().sort(function (a, b) { return (b.seconds_1d || 0) - (a.seconds_1d || 0); });
    const byWeek = catalog.slice().sort(function (a, b) { return (b.seconds_7d || 0) - (a.seconds_7d || 0); });
    const byAll = catalog.slice().sort(function (a, b) { return (b.seconds_all || 0) - (a.seconds_all || 0); });

    renderInto("dayFav", byDay.slice(0, 1));
    renderInto("weekFav", byWeek.slice(0, 1));
    renderInto("top10", byAll.slice(0, 10));
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
