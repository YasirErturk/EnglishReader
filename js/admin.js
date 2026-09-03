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
            "<td><a class='btn btn-ghost' href='reader.html?book=" + encodeURIComponent(b.slug + ".txt") + "'>Oku</a></td>";
        tbody.appendChild(tr);
    });
}

async function boot() {
    document.getElementById("logoutButton").addEventListener("click", API.signOut);

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

    await renderBooks();

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
