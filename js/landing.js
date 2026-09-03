const covers = ["#3b2a1a", "#1e3348", "#2a3b22", "#412434", "#243044", "#3a3118", "#1b2e2a", "#33221c"];

function renderBooks(list) {
    const root = document.getElementById("publicBooks");
    if (!root) return;
    root.innerHTML = "";
    list.forEach(function (book, i) {
        const a = document.createElement("a");
        a.className = "card";
        a.href = "reader.html?book=" + encodeURIComponent(book.file || (book.slug + ".txt"));
        a.style.textDecoration = "none";
        const color = book.cover_color || covers[i % covers.length];
        a.innerHTML =
            '<div class="book-cover" style="background:' + color + '">' + book.title + "</div>" +
            '<div class="book-meta">' + (book.author || "") + (book.genre ? " · " + book.genre : "") + "</div>";
        root.appendChild(a);
    });
}

async function boot() {
    document.querySelectorAll("#loginButton, #loginButton2").forEach(function (btn) {
        btn.addEventListener("click", function () {
            API.signInGoogle();
        });
    });

    if (API.configured) {
        const session = await API.getSession();
        if (session) {
            location.href = "dashboard.html";
            return;
        }
        const remote = await API.listBooks();
        const publicBooks = (remote || []).filter(function (b) { return !b.is_copyrighted; });
        if (publicBooks.length) {
            renderBooks(publicBooks.map(function (b) {
                return {
                    title: b.title,
                    author: b.author,
                    genre: b.genre,
                    file: b.slug + ".txt",
                    cover_color: b.cover_color
                };
            }));
            return;
        }
    }

    renderBooks(typeof LIBRARY !== "undefined" ? LIBRARY : []);
}

boot();
