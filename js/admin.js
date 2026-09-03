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

async function renderBooks() {
    const books = await API.listAllBooksAdmin();
    const tbody = document.querySelector("#bookTable tbody");
    tbody.innerHTML = "";
    books.forEach(function (b) {
        const tr = document.createElement("tr");
        tr.innerHTML =
            "<td>" + b.title + "<div class='book-meta'>" + (b.author || "") + "</div></td>" +
            "<td>" + (b.genre || "") + "</td>" +
            "<td>" + (b.is_copyrighted ? "<span class='lock'>kilitli</span>" : "kamu malı") + "</td>" +
            "<td><a class='btn btn-ghost btn-sm' href='reader.html?book=" + encodeURIComponent(b.slug + ".txt") + "'>Oku</a></td>";
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

async function renderSuggestions() {
    const rows = await API.listSuggestions();
    const tbody = document.querySelector("#suggestTable tbody");
    tbody.innerHTML = "";
    rows.forEach(function (s) {
        const who = s.profiles ? (s.profiles.email || s.profiles.display_name) : "";
        const tr = document.createElement("tr");
        let actions = s.status;
        if (s.status === "pending") {
            actions = '<button class="btn btn-blue btn-sm" data-act="approved" data-id="' + s.id + '">Onayla</button> ' +
                '<button class="btn btn-danger btn-sm" data-act="rejected" data-id="' + s.id + '">Reddet</button>';
        }
        tr.innerHTML =
            "<td>" + s.word + "</td>" +
            "<td>" + (s.meaning_tr || "") + "</td>" +
            "<td>" + (who || "") + "</td>" +
            "<td>" + s.status + "</td>" +
            "<td>" + actions + "</td>";
        if (s.status === "pending") {
            tr.querySelectorAll("button").forEach(function (btn) {
                btn.addEventListener("click", async function () {
                    await API.reviewSuggestion(s.id, btn.getAttribute("data-act"), s.word, s.meaning_tr);
                    await renderSuggestions();
                });
            });
        }
        tbody.appendChild(tr);
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

    await Promise.all([renderBooks(), renderMembers(), renderLogs(), renderSuggestions()]);

    document.getElementById("saveBook").addEventListener("click", async function () {
        const title = document.getElementById("title").value.trim();
        const slug = document.getElementById("slug").value.trim().toLowerCase().replace(/\s+/g, "-");
        const content = document.getElementById("content").value;
        if (!title || !slug || !content) {
            document.getElementById("saveMsg").textContent = "Başlık, slug ve metin gerekli.";
            return;
        }
        const words = content.split(/\s+/).filter(Boolean).length;
        const { error } = await API.addBook({
            title: title,
            author: document.getElementById("author").value.trim(),
            genre: document.getElementById("genre").value.trim(),
            slug: slug,
            cover_color: document.getElementById("cover").value.trim() || "#1e3348",
            is_copyrighted: document.getElementById("copyrighted").checked,
            is_published: true,
            content: content,
            word_count: words
        });
        document.getElementById("saveMsg").textContent = error ? error.message : "Kaydedildi.";
        if (!error) await renderBooks();
    });
}

boot();
