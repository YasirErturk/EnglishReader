let dictionary = {};

function loadDictionary() {

    dictionary = typeof DICTIONARY !== "undefined" ? DICTIONARY : {};

    console.log("Sözlük yüklendi:", Object.keys(dictionary).length, "kelime");

}

function getMeaning(word) {

    const clean = word
        .toLowerCase()
        .replace(/[^a-z']/g, "");

    if (dictionary[clean]) {
        return dictionary[clean];
    }

    // İlk harfi büyük yazılmış kelimeler için
    const firstUpper =
        clean.charAt(0).toUpperCase() + clean.slice(1);

    if (dictionary[firstUpper]) {
        return dictionary[firstUpper];
    }

    return "❌ Sözlükte bulunamadı.";
}
