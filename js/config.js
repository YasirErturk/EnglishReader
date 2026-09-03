/* Supabase anahtarlarını KURULUM.md adımlarına göre yapıştır. */
window.APP_CONFIG = {
    supabaseUrl: "https://zkncxrgychvgtlswsjss.supabase.co",
    supabaseAnonKey: "sb_publishable_VZkHt3t4FOhaO3D8dqGX2Q_F8tItsio",
    adminEmail: "copkutuma@gmail.com"
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
