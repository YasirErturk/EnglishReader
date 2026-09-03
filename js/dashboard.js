function formatDuration(total) {
    total = Number(total || 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    if (h <= 0) return m + " dk";
    return h + " sa " + m + " dk";
}

function daysBetween(a, b) {
    if (!a || !b) return null;
    const ms = new Date(b) - new Date(a);
    if (ms < 0) return null;
    return Math.max(1, Math.round(ms / 86400000));
}

function statCard(label, value) {
    return '<div class="card stat"><span>' + label + "</span><b>" + value + "</b></div>";
}

async function boot() {
    document.getElementById("logoutButton").addEventListener("click", API.signOut);

    if (!API.configured) {
        document.getElementById("hello").textContent = "Supabase bağlı değil";
        document.querySelector(".sub").textContent = "js/config.js ve KURULUM.md adımlarını bitir.";
        return;
    }

    const session = await API.requireAuth();
    if (!session) return;

    const profile = await API.getProfile();
    const name = (profile && profile.display_name) || session.user.user_metadata.full_name || "okur";
    document.getElementById("hello").textContent = "Merhaba, " + name.split(" ")[0];

    const chip = document.getElementById("userChip");
    const avatar = session.user.user_metadata.avatar_url || "";
    chip.innerHTML =
        (avatar ? '<img src="' + avatar + '" alt="">' : "") +
        "<div><b>" + name + "</b><small>" + (session.user.email || "") + "</small></div>";

    if (profile && profile.is_admin) {
        document.getElementById("adminLink").style.display = "block";
    }

    const rows = await API.myProgress();
    const words = await API.myWords();

    if (rows[0] && rows[0].books) {
        const last = rows[0];
        document.getElementById("continueCard").style.display = "flex";
        document.getElementById("continueTitle").textContent = last.books.title;
        document.getElementById("continueMeta").textContent =
            Math.round(last.percent || 0) + "% · " + formatDuration(last.total_seconds);
        document.getElementById("continueButton").href =
            "reader.html?book=" + encodeURIComponent((last.books.slug || "") + ".txt");
    }

    const finished = rows.filter(function (r) { return r.status === "finished"; });
    const totalSeconds = rows.reduce(function (s, r) { return s + (r.total_seconds || 0); }, 0);

    const genreTime = {};
    rows.forEach(function (r) {
        const g = r.books && r.books.genre ? r.books.genre : "Genel";
        genreTime[g] = (genreTime[g] || 0) + (r.total_seconds || 0);
    });
    const favorite = Object.keys(genreTime).sort(function (a, b) {
        return genreTime[b] - genreTime[a];
    })[0] || "—";

    const finishDays = finished.map(function (r) {
        return daysBetween(r.started_at, r.finished_at);
    }).filter(Boolean);
    const avgDays = finishDays.length
        ? Math.round(finishDays.reduce(function (s, n) { return s + n; }, 0) / finishDays.length)
        : "—";

    document.getElementById("stats").innerHTML =
        statCard("Okunan kitap", rows.length) +
        statCard("Bitirilen", finished.length) +
        statCard("Toplam süre", formatDuration(totalSeconds)) +
        statCard("Ort. bitirme", avgDays === "—" ? "—" : avgDays + " gün") +
        statCard("Sevilen tür", favorite) +
        statCard("Kayıtlı kelime", words.length);

    const booksRoot = document.getElementById("myBooks");
    booksRoot.innerHTML = "";
    rows.forEach(function (r) {
        const b = r.books || {};
        const card = document.createElement("a");
        card.className = "card";
        card.href = "reader.html?book=" + encodeURIComponent((b.slug || "") + ".txt");
        card.style.textDecoration = "none";
        card.innerHTML =
            '<div class="book-cover" style="background:' + (b.cover_color || "#1e3348") + '">' + (b.title || "") + "</div>" +
            '<div class="book-meta">' + Math.round(r.percent || 0) + "% · " + formatDuration(r.total_seconds) +
            (r.status === "finished" ? " · bitti" : "") + "</div>";
        booksRoot.appendChild(card);
    });

    const tbody = document.querySelector("#wordsTable tbody");
    tbody.innerHTML = "";
    words.forEach(function (w) {
        const tr = document.createElement("tr");
        tr.innerHTML = "<td>" + w.word + "</td><td>" + (w.meaning_tr || "") + "</td>";
        tbody.appendChild(tr);
    });
}

boot();
