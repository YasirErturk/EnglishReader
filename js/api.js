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
            redirectTo: appBase() + "index.html"
        }
    });
    if (error) alert(error.message);
};

API.signOut = async function () {
    if (!API.client) return;
    try { await API.logAuth("logout"); } catch (err) {}
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
    const clean = (window.cleanWord ? cleanWord(word) : String(word || "").trim());
    const { error } = await API.client.from("saved_words").upsert({
        user_id: session.user.id,
        word: clean || String(word || "").trim(),
        meaning_tr: meaning || ""
    });
    return !error;
};

API.deleteWord = async function (word) {
    if (!API.client) return false;
    const session = API.session || await API.getSession();
    if (!session) return false;
    const { error } = await API.client
        .from("saved_words")
        .delete()
        .eq("user_id", session.user.id)
        .eq("word", word);
    return !error;
};

API.resetProfile = async function () {
    if (!API.client) return { error: "no client" };
    const session = API.session || await API.getSession();
    if (!session) return { error: "Giriş gerekli" };
    const uid = session.user.id;
    await API.client.from("reading_sessions").delete().eq("user_id", uid);
    await API.client.from("reading_progress").delete().eq("user_id", uid);
    await API.client.from("saved_words").delete().eq("user_id", uid);
    return { error: null };
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
        .select("id, slug, title, author, genre, description, cover_color, cover_url, year, is_copyrighted, word_count")
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

API.addBook = async function (book) {
    if (!API.client) return { error: "no client" };
    return API.client.from("books").insert(book);
};

API.updateBook = async function (id, book) {
    if (!API.client) return { error: "no client" };
    return API.client.from("books").update(book).eq("id", id);
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
        .select("*, books(title, author, genre, slug, cover_color, cover_url, year)")
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

API.logAuth = async function (event) {
    if (!API.client) return;
    const session = API.session || (await API.getSession());
    if (!session) return;
    if (event === "login") {
        const key = "auth_logged_" + session.user.id;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
    }
    await API.client.from("auth_events").insert({
        user_id: session.user.id,
        email: session.user.email || "",
        event: event,
        user_agent: navigator.userAgent || ""
    });
};

API.suggestWord = async function (word, meaning) {
    if (!API.client) return { ok: false, message: "Giriş gerekli" };
    const session = API.session || await API.getSession();
    if (!session) return { ok: false, message: "Giriş gerekli" };

    const clean = (window.cleanWord ? cleanWord(word) : String(word || "").replace(/[^a-zA-Z']/g, "")).trim();
    if (!clean) return { ok: false, message: "Kelime yok" };

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { count, error: countError } = await API.client
        .from("word_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .gte("created_at", start.toISOString());

    if (countError) return { ok: false, message: countError.message };
    if ((count || 0) >= 10) return { ok: false, message: "Günlük 10 öneri doldu" };

    const { error } = await API.client.from("word_suggestions").insert({
        user_id: session.user.id,
        word: clean,
        meaning_tr: meaning || "",
        status: "pending"
    });

    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "Öneri gönderildi (" + (10 - (count || 0) - 1) + " kaldı)" };
};

API.listMembers = async function () {
    if (!API.client) return [];
    const { data } = await API.client
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
    return data || [];
};

API.listAllProgress = async function () {
    if (!API.client) return [];
    const { data } = await API.client
        .from("reading_progress")
        .select("user_id, total_seconds, status, percent, last_read_at, books(title, genre)");
    return data || [];
};

API.listAuthEvents = async function () {
    if (!API.client) return [];
    const { data } = await API.client
        .from("auth_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
    return data || [];
};

API.listSuggestions = async function () {
    if (!API.client) return [];
    const { data } = await API.client
        .from("word_suggestions")
        .select("*, profiles(display_name, email)")
        .order("created_at", { ascending: false });
    return data || [];
};

API.reviewSuggestion = async function (id, status, word, meaning) {
    if (!API.client) return { error: "no client" };

    const { error } = await API.client
        .from("word_suggestions")
        .update({
            status: status,
            reviewed_at: new Date().toISOString()
        })
        .eq("id", id);

    if (error) return { error: error };

    if (status === "approved" && word) {
        const w = String(word).toLowerCase().replace(/[^a-z']/g, "");
        await API.client.from("dictionary").upsert({
            word: w,
            meaning_tr: meaning || ""
        }, { onConflict: "word" });
    }

    return { error: null };
};

API.bookStats = async function () {
    if (!API.client) return [];
    const { data, error } = await API.client.rpc("book_stats");
    if (!error && data) return data;
    return [];
};

(function bindAuthLog() {
    if (!API.client) return;
    API.client.auth.onAuthStateChange(function (event, session) {
        if (event === "SIGNED_IN" && session) {
            API.session = session;
            API.logAuth("login");
        }
    });
})();
