/* Supabase anahtarlarını KURULUM.md adımlarına göre yapıştır. */
window.APP_CONFIG = {
    supabaseUrl: "BURAYA_SUPABASE_URL",
    supabaseAnonKey: "BURAYA_SUPABASE_ANON_KEY",
    adminEmail: "BURAYA_GMAIL"
};

window.appBase = function () {
    return location.origin + location.pathname.replace(/\/[^/]*$/, "/");
};

window.isSupabaseConfigured = function () {
    const c = window.APP_CONFIG || {};
    return !!(
        c.supabaseUrl &&
        c.supabaseAnonKey &&
        c.supabaseUrl.indexOf("BURAYA") === -1 &&
        c.supabaseAnonKey.indexOf("BURAYA") === -1
    );
};
