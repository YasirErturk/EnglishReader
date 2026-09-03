function formatDuration(total) {
    total = Number(total || 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    if (h <= 0) return m + " dk";
    return h + " sa " + m + " dk";
}

function formatTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("tr-TR");
}

function showTab(id) {
    document.querySelectorAll(".tab").forEach(function (t) {
        t.classList.toggle("active", t.getAttribute("data-tab") === id);
    });
    document.querySelectorAll(".panel").forEach(function (p) {
        p.classList.toggle("active", p.id === "panel-" + id);
    });
}

let catalogCache = [];

function fillBookForm(b) {
    document.getElementById("bookId").value = b.id || "";
    document.getElementById("title").value = b.title || "";
    document.getElementById("author").value = b.author || "";
    document.getElementById("year").value = b.year || "";
    document.getElementById("genre").value = b.genre || "";
    document.getElementById("slug").value = b.slug || "";
    document.getElementById("coverUrl").value = b.cover_url || "";
    document.getElementById("cover").value = b.cover_color || "#1e3348";
    document.getElementById("copyrighted").checked = !!b.is_copyrighted;
    document.getElementById("content").value = b.content || "";
    document.getElementById("bookFormTitle").textContent = b.id ? "Kitabı düzenle" : "Kitap ekle";
    showTab("books");
}

function clearBookForm() {
    fillBookForm({});
}

function collectBook() {
    const content = document.getElementById("content").value;
    return {
        title: document.getElementById("title").value.trim(),
        author: document.getElementById("author").value.trim(),
        year: parseInt(document.getElementById("year").value, 10) || null,
        genre: document.getElementById("genre").value.trim(),
        slug: document.getElementById("slug").value.trim().toLowerCase().replace(/\s+/g, "-"),
        cover_url: document.getElementById("coverUrl").value.trim(),
        cover_color: document.getElementById("cover").value.trim() || "#1e3348",
        is_copyrighted: document.getElementById("copyrighted").checked,
        is_published: true,
        content: content,
        word_count: content.split(/\s+/).filter(Boolean).length
    };
}

async function renderBooks() {
    const books = await API.listAllBooksAdmin();
    catalogCache = books;
    const tbody = document.querySelector("#bookTable tbody");
    tbody.innerHTML = "";
    books.forEach(function (b) {
        const tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + b.title + "<div class='book-meta'>" + (b.author || "") + " " + (b.year || "") + "</div></td>" +
            "<td>" + (b.genre || "") + "</td>" +
            "<td>" + (b.is_copyrighted ? "<span class='lock'>kilitli</span>" : "kamu malı") + "</td>" +
            "<td><button class='btn btn-ghost btn-sm' type='button'>Düzenle</button> " +
            "<a class='btn btn-ghost btn-sm' href='reader.html?book=" + encodeURIComponent(b.slug + ".txt") + "'>Oku</a></td>";
        tr.querySelector("button").addEventListener("click", function () { fillBookForm(b); });
        tbody.appendChild(tr);
    });
}

async function renderMembers() {
    const [members, progress] = await Promise.all([
        API.listMembers(),
        API.listAllProgress()
    ]);

    const byUser = {};
    (progress || []).forEach(function (row) {
        const id = row.user_id;
        if (!byUser[id]) byUser[id] = { seconds: 0, books: 0, finished: 0 };
        byUser[id].seconds += row.total_seconds || 0;
        byUser[id].books += 1;
        if (row.status === "finished") byUser[id].finished += 1;
    });

    const tbody = document.querySelector("#memberTable tbody");
    tbody.innerHTML = "";
    members.forEach(function (m) {
        const st = byUser[m.id] || { seconds: 0, books: 0, finished: 0 };
        const tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + (m.display_name || "—") + "<div class='book-meta'>" + (m.email || "") + "</div></td>" +
            "<td>" + (m.is_admin ? "yönetici" : "üye") + "</td>" +
            "<td>" + st.finished + " / " + st.books + "</td>" +
            "<td>" + formatDuration(st.seconds) + "</td>" +
            "<td>" + formatTime(m.created_at) + "</td>";
        tbody.appendChild(tr);
    });
}

async function renderLogs() {
    const events = await API.listAuthEvents();
    const tbody = document.querySelector("#logTable tbody");
    tbody.innerHTML = "";
    events.forEach(function (e) {
        const tr = document.createElement("tr");
        const label = e.event === "login" ? "<span class='ok'>giriş</span>" : "<span class='no'>çıkış</span>";
        tr.innerHTML =
            "<td>" + formatTime(e.created_at) + "</td>" +
            "<td>" + label + "</td>" +
            "<td>" + (e.email || "") + "</td>";
        tbody.appendChild(tr);
    });
}

function currentDictMeaning(word) {
    const key = String(word || "").toLowerCase().replace(/[^a-z']/g, "");
    if (window.DICT_FIXES && DICT_FIXES[key]) {
        const e = DICT_FIXES[key];
        return typeof e === "string" ? e : (e.tr || "");
    }
    if (typeof DICTIONARY !== "undefined" && DICTIONARY[key]) return DICTIONARY[key];
    if (window.REMOTE_DICT && REMOTE_DICT[key]) return REMOTE_DICT[key];
    return "—";
}

function escapeHtml(s) {
    return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

async function renderSuggestions() {
    const rows = await API.listSuggestions();
    const root = document.getElementById("suggestList");
    root.innerHTML = "";
    if (!rows.length) {
        root.innerHTML = "<p class='book-meta'>Bekleyen öneri yok.</p>";
        return;
    }
    rows.forEach(function (s) {
        const who = s.profiles ? (s.profiles.email || s.profiles.display_name) : "";
        const current = currentDictMeaning(s.word);
        const card = document.createElement("div");
        card.className = "card suggest-card";
        const pending = s.status === "pending";
        card.innerHTML =
            "<h3>" + escapeHtml(s.word) + "</h3>" +
            "<p class='book-meta'>" + escapeHtml(who) + " · " + escapeHtml(s.status) + "</p>" +
            "<p><b>Sözlükte şimdi:</b> " + escapeHtml(current) + "</p>" +
            (s.context ? "<p class='book-meta'>Bağlam: " + escapeHtml(s.context) + "</p>" : "") +
            "<label>Önerilen anlam</label>" +
            "<textarea rows='2'" + (pending ? "" : " disabled") + ">" + escapeHtml(s.meaning_tr) + "</textarea>" +
            (pending
                ? '<div class="suggest-actions">' +
                    '<button class="btn btn-blue btn-sm" data-act="as-is" type="button">Olduğu gibi onayla</button>' +
                    '<button class="btn btn-blue btn-sm" data-act="edit" type="button">Düzenleyip onayla</button>' +
                    '<button class="btn btn-danger btn-sm" data-act="rejected" type="button">Reddet</button>' +
                  "</div>"
                : "");
        if (pending) {
            const ta = card.querySelector("textarea");
            card.querySelectorAll("button").forEach(function (btn) {
                btn.addEventListener("click", async function () {
                    const act = btn.getAttribute("data-act");
                    if (act === "rejected") {
                        await API.reviewSuggestion(s.id, "rejected", s.word, s.meaning_tr);
                    } else if (act === "as-is") {
                        await API.reviewSuggestion(s.id, "approved", s.word, s.meaning_tr);
                    } else {
                        await API.reviewSuggestion(s.id, "approved", s.word, ta.value.trim() || s.meaning_tr);
                    }
                    await renderSuggestions();
                });
            });
        }
        root.appendChild(card);
    });
}

async function boot() {
    document.getElementById("logoutButton").addEventListener("click", API.signOut);

    document.getElementById("tabs").addEventListener("click", function (e) {
        const tab = e.target.closest(".tab");
        if (!tab) return;
        showTab(tab.getAttribute("data-tab"));
    });

    if (!API.configured) {
        alert("Supabase bağlı değil");
        location.href = "index.html";
        return;
    }

    const session = await API.requireAuth();
    if (!session) return;
    const profile = await API.getProfile();
    if (!profile || !profile.is_admin) {
        alert("Bu sayfa yalnız yönetici için.");
        location.href = "dashboard.html";
        return;
    }

    if (API.loadRemoteDictionary) {
        try {
            window.REMOTE_DICT = await API.loadRemoteDictionary() || {};
        } catch (err) {
            window.REMOTE_DICT = {};
        }
    }

    await Promise.all([renderBooks(), renderMembers(), renderLogs(), renderSuggestions()]);

    document.getElementById("newBook").addEventListener("click", clearBookForm);

    document.getElementById("saveBook").addEventListener("click", async function () {
        const book = collectBook();
        if (!book.title || !book.slug || !book.content) {
            document.getElementById("saveMsg").textContent = "Başlık, slug ve metin gerekli.";
            return;
        }
        const id = document.getElementById("bookId").value;
        const res = id ? await API.updateBook(id, book) : await API.addBook(book);
        document.getElementById("saveMsg").textContent = res.error ? res.error.message : "Kaydedildi.";
        if (!res.error) {
            await renderBooks();
            if (!id) clearBookForm();
        }
    });
}

boot();
