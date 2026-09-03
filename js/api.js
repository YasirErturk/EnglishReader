window.API = {
    configured: false,
    client: null,
    session: null,
    profile: null
};

(function initAPI() {

    if (!window.isSupabaseConfigured || !isSupabaseConfigured()) return;
    if (!window.supabase) return;

    API.configured = true;
    API.client = window.supabase.createClient(
        APP_CONFIG.supabaseUrl,
        APP_CONFIG.supabaseAnonKey
    );

})();

API.getSession = async function () {
    if (!API.client) return null;
    const { data } = await API.client.auth.getSession();
    API.session = data.session || null;
    return API.session;
};

API.signInGoogle = async function () {
    if (!API.client) {
        alert("Supabase henüz bağlanmadı.\nKURULUM.md dosyasındaki adımları bitir, js/config.js içine anahtarları yapıştır.");
        return;
    }
    const { error } = await API.client.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: appBase() + "dashboard.html"
        }
    });
    if (error) alert(error.message);
};

API.signOut = async function () {
    if (!API.client) return;
    await API.client.auth.signOut();
    location.href = "index.html";
};

API.requireAuth = async function () {
    const session = await API.getSession();
    if (!session) {
        location.href = "index.html";
        return null;
    }
    return session;
};

API.getProfile = async function () {
    if (!API.client) return null;
    const session = API.session || await API.getSession();
    if (!session) return null;
    const { data } = await API.client
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
    API.profile = data;
    return data;
};

API.loadRemoteDictionary = async function () {
    if (!API.client) return null;
    const { data, error } = await API.client
        .from("dictionary")
        .select("word, meaning_tr");
    if (error || !data) return null;
    const map = {};
    data.forEach(function (row) {
        map[row.word] = row.meaning_tr;
    });
    return map;
};

API.saveWord = async function (word, meaning) {
    if (!API.client) return false;
    const session = API.session || await API.getSession();
    if (!session) return false;
    const { error } = await API.client.from("saved_words").upsert({
        user_id: session.user.id,
        word: String(word || "").trim(),
        meaning_tr: meaning || ""
    });
    return !error;
};

API.getBookBySlug = async function (file) {
    if (!API.client) return null;
    const slug = String(file || "").replace(/\.txt$/i, "");
    const { data } = await API.client
        .from("books")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
    return data || null;
};

API.listBooks = async function () {
    if (!API.client) return [];
    const { data, error } = await API.client
        .from("books")
        .select("id, slug, title, author, genre, description, cover_color, is_copyrighted, word_count")
        .eq("is_published", true)
        .order("title");
    if (error) return [];
    return data || [];
};

API.listAllBooksAdmin = async function () {
    if (!API.client) return [];
    const { data, error } = await API.client
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) return [];
    return data || [];
};

API.saveProgress = async function (bookFile, scrollTop, percent) {
    if (!API.client) return;
    const session = API.session || await API.getSession();
    if (!session) return;
    const book = await API.getBookBySlug(bookFile);
    if (!book) return;
    const status = percent >= 98 ? "finished" : "reading";
    const row = {
        user_id: session.user.id,
        book_id: book.id,
        scroll_top: scrollTop,
        percent: percent,
        status: status,
        last_read_at: new Date().toISOString()
    };
    if (status === "finished") row.finished_at = new Date().toISOString();
    await API.client.from("reading_progress").upsert(row);
};

API.loadProgress = async function (bookFile) {
    if (!API.client) return null;
    const session = API.session || await API.getSession();
    if (!session) return null;
    const book = await API.getBookBySlug(bookFile);
    if (!book) return null;
    const { data } = await API.client
        .from("reading_progress")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("book_id", book.id)
        .maybeSingle();
    return data || null;
};

API.addReadingTime = async function (bookFile, seconds) {
    if (!API.client || !seconds) return;
    const session = API.session || await API.getSession();
    if (!session) return;
    const book = await API.getBookBySlug(bookFile);
    if (!book) return;

    await API.client.from("reading_sessions").insert({
        user_id: session.user.id,
        book_id: book.id,
        duration_seconds: seconds,
        ended_at: new Date().toISOString()
    });

    const { data } = await API.client
        .from("reading_progress")
        .select("total_seconds")
        .eq("user_id", session.user.id)
        .eq("book_id", book.id)
        .maybeSingle();

    const total = (data && data.total_seconds ? data.total_seconds : 0) + seconds;

    await API.client.from("reading_progress").upsert({
        user_id: session.user.id,
        book_id: book.id,
        total_seconds: total,
        last_read_at: new Date().toISOString()
    });
};

API.myProgress = async function () {
    if (!API.client) return [];
    const session = API.session || await API.getSession();
    if (!session) return [];
    const { data } = await API.client
        .from("reading_progress")
        .select("*, books(title, author, genre, slug, cover_color)")
        .eq("user_id", session.user.id)
        .order("last_read_at", { ascending: false });
    return data || [];
};

API.myWords = async function () {
    if (!API.client) return [];
    const session = API.session || await API.getSession();
    if (!session) return [];
    const { data } = await API.client
        .from("saved_words")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
    return data || [];
};

API.addBook = async function (book) {
    if (!API.client) return { error: "no client" };
    return API.client.from("books").insert(book);
};
