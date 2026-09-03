# -*- coding: utf-8 -*-
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

WORDS = {
    "a": "bir", "an": "bir", "the": "-i/-ı (belirli artikel)", "and": "ve", "or": "veya",
    "but": "ama", "if": "eğer", "as": "olarak / gibi", "of": "-in/-ın", "to": "-e/-a / -mek",
    "in": "içinde", "on": "üzerinde", "at": "-de/-da", "by": "tarafından / yanında",
    "for": "için", "from": "-den/-dan", "with": "ile", "without": "olmadan",
    "about": "hakkında", "into": "içine", "over": "üzerinden", "under": "altında",
    "after": "sonra", "before": "önce", "between": "arasında", "through": "içinden",
    "up": "yukarı", "down": "aşağı", "out": "dışarı", "off": "kapalı / uzak",
    "i": "ben", "you": "sen / siz", "he": "o (erkek)", "she": "o (kadın)", "it": "o (nesne)",
    "we": "biz", "they": "onlar", "me": "beni / bana", "him": "onu / ona", "her": "onu / onun",
    "us": "bizi / bize", "them": "onları", "my": "benim", "your": "senin", "his": "onun",
    "its": "onun", "our": "bizim", "their": "onların", "this": "bu", "that": "şu / o",
    "these": "bunlar", "those": "şunlar", "who": "kim", "what": "ne", "which": "hangi",
    "when": "ne zaman", "where": "nerede", "why": "neden", "how": "nasıl",
    "all": "hepsi", "some": "bazı", "any": "herhangi", "no": "hayır / hiç", "not": "değil",
    "only": "sadece", "also": "ayrıca", "even": "hatta", "still": "hâlâ", "already": "çoktan",
    "again": "yine", "once": "bir kez", "twice": "iki kez", "never": "asla", "always": "her zaman",
    "often": "sık sık", "sometimes": "bazen", "usually": "genellikle", "suddenly": "aniden",
    "be": "olmak", "am": "olmak (ben)", "is": "olmak (o)", "are": "olmak (çoğul)",
    "was": "idi", "were": "idiler", "been": "olmuş", "being": "olma",
    "have": "sahip olmak", "has": "var", "had": "vardı", "do": "yapmak", "does": "yapar",
    "did": "yaptı", "done": "yapılmış", "will": "-ecek", "would": "-erdi", "can": "-ebilir",
    "could": "-ebilirdi", "may": "-ebilir", "might": "-ebilir ( ihtimal)", "must": "zorunda",
    "shall": "-ecek (resmi)", "should": "-meli", "go": "gitmek", "went": "gitti", "gone": "gitmiş",
    "come": "gelmek", "came": "geldi", "get": "almak / olmak", "got": "aldı", "make": "yapmak",
    "made": "yapıldı", "take": "almak", "took": "aldı", "taken": "alınmış", "give": "vermek",
    "gave": "verdi", "given": "verilmiş", "see": "görmek", "saw": "gördü", "seen": "görülmüş",
    "know": "bilmek", "knew": "biliyordu", "known": "bilinen", "think": "düşünmek",
    "thought": "düşünce / düşündü", "say": "söylemek", "said": "söyledi", "tell": "anlatmak",
    "told": "anlattı", "look": "bakmak", "looked": "baktı", "see": "görmek",
    "find": "bulmak", "found": "buldu", "want": "istemek", "need": "ihtiyaç duymak",
    "use": "kullanmak", "used": "kullandı / alışkın", "try": "denemek", "tried": "denedi",
    "call": "aramak / çağırmak", "ask": "sormak", "asked": "sordu", "work": "çalışmak / iş",
    "seem": "görünmek", "feel": "hissetmek", "felt": "hissetti", "leave": "ayrılmak",
    "left": "ayrıldı / sol", "keep": "tutmak", "kept": "tuttu", "let": "izin vermek",
    "begin": "başlamak", "began": "başladı", "beginning": "başlangıç", "start": "başlamak",
    "end": "son", "stop": "durmak", "run": "koşmak", "ran": "koştu", "walk": "yürümek",
    "sit": "oturmak", "sitting": "oturma", "stand": "ayakta durmak", "stood": "durdu",
    "hear": "duymak", "heard": "duydu", "listen": "dinlemek", "read": "okumak",
    "write": "yazmak", "wrote": "yazdı", "speak": "konuşmak", "talk": "konuşmak",
    "live": "yaşamak", "die": "ölmek", "open": "açmak", "close": "kapatmak",
    "put": "koymak", "set": "ayarlamak", "turn": "dönmek", "move": "hareket etmek",
    "bring": "getirmek", "brought": "getirdi", "show": "göstermek", "play": "oynamak",
    "wait": "beklemek", "watch": "izlemek", "follow": "takip etmek", "help": "yardım",
    "change": "değişmek", "become": "olmak (dönüşmek)", "became": "oldu",
    "grow": "büyümek", "grew": "büyüdü", "hold": "tutmak", "held": "tuttu",
    "pay": "ödemek", "meet": "tanışmak", "met": "tanıştı", "lose": "kaybetmek",
    "lost": "kayıp", "win": "kazanmak", "buy": "satın almak", "sell": "satmak",
    "eat": "yemek", "drink": "içmek", "sleep": "uyumak", "wake": "uyanmak",
    "dream": "rüya / düşlemek", "laugh": "gülmek", "cry": "ağlamak", "smile": "gülümsemek",
    "love": "sevmek", "like": "beğenmek / gibi", "hate": "nefret etmek",
    "good": "iyi", "bad": "kötü", "great": "harika / büyük", "little": "küçük / az",
    "small": "küçük", "big": "büyük", "large": "iri", "long": "uzun", "short": "kısa",
    "old": "eski / yaşlı", "new": "yeni", "young": "genç", "high": "yüksek", "low": "alçak",
    "early": "erken", "late": "geç", "first": "ilk", "last": "son", "next": "sonraki",
    "same": "aynı", "other": "diğer", "another": "başka bir", "own": "kendi",
    "right": "doğru / sağ", "left": "sol / ayrıldı", "true": "doğru", "false": "yanlış",
    "real": "gerçek", "full": "dolu", "empty": "boş", "open": "açık", "dark": "karanlık",
    "light": "ışık / hafif", "white": "beyaz", "black": "siyah", "red": "kırmızı",
    "blue": "mavi", "green": "yeşil", "yellow": "sarı", "pink": "pembe",
    "hot": "sıcak", "cold": "soğuk", "warm": "ılık", "cool": "serin",
    "hard": "zor / sert", "easy": "kolay", "soft": "yumuşak", "strong": "güçlü",
    "weak": "zayıf", "fast": "hızlı", "slow": "yavaş", "quiet": "sessiz", "loud": "gürültülü",
    "happy": "mutlu", "sad": "üzgün", "tired": "yorgun", "afraid": "korkmuş",
    "alone": "yalnız", "busy": "meşgul", "free": "özgür / ücretsiz", "ready": "hazır",
    "sure": "emin", "clear": "net", "possible": "mümkün", "important": "önemli",
    "different": "farklı", "beautiful": "güzel", "remarkable": "dikkate değer",
    "cold": "soğuk", "precise": "kesin", "perfect": "mükemmel", "whole": "bütün",
    "man": "adam", "woman": "kadın", "boy": "oğlan", "girl": "kız", "child": "çocuk",
    "children": "çocuklar", "people": "insanlar", "person": "kişi", "friend": "arkadaş",
    "family": "aile", "father": "baba", "mother": "anne", "sister": "kız kardeş",
    "brother": "erkek kardeş", "husband": "koca", "wife": "eş", "son": "oğul",
    "daughter": "kız evlat", "name": "ad", "life": "hayat", "world": "dünya",
    "time": "zaman", "day": "gün", "night": "gece", "morning": "sabah", "evening": "akşam",
    "year": "yıl", "week": "hafta", "hour": "saat", "minute": "dakika", "moment": "an",
    "home": "ev", "house": "ev (bina)", "room": "oda", "door": "kapı", "window": "pencere",
    "table": "masa", "bed": "yatak", "street": "sokak", "city": "şehir", "country": "ülke",
    "place": "yer", "way": "yol", "side": "yan", "water": "su", "air": "hava",
    "fire": "ateş", "earth": "yer", "sun": "güneş", "moon": "ay", "star": "yıldız",
    "tree": "ağaç", "flower": "çiçek", "book": "kitap", "letter": "mektup / harf",
    "word": "kelime", "story": "hikâye", "picture": "resim", "music": "müzik",
    "hand": "el", "eye": "göz", "eyes": "gözler", "face": "yüz", "head": "kafa",
    "heart": "kalp", "mind": "zihin", "voice": "ses", "body": "beden",
    "money": "para", "job": "iş", "school": "okul", "question": "soru", "answer": "cevap",
    "idea": "fikir", "thing": "şey", "part": "parça", "kind": "tür / nazik",
    "number": "sayı", "nothing": "hiçbir şey", "something": "bir şey",
    "everything": "her şey", "someone": "birisi", "everyone": "herkes",
    "one": "bir", "two": "iki", "three": "üç", "four": "dört", "five": "beş",
    "six": "altı", "seven": "yedi", "eight": "sekiz", "nine": "dokuz", "ten": "on",
    "many": "çok (sayı)", "much": "çok (miktar)", "more": "daha fazla", "most": "en çok",
    "very": "çok", "too": "çok / de", "so": "bu yüzden / çok", "just": "sadece / henüz",
    "than": "-den daha", "then": "sonra", "now": "şimdi", "here": "burada", "there": "orada",
    "yes": "evet", "well": "iyi / pekâlâ", "back": "geri", "away": "uzakta",
    "together": "birlikte", "almost": "neredeyse", "enough": "yeterli",
    "alice": "Alice", "rabbit": "tavşan", "white": "beyaz", "bank": "nehir kenarı / banka",
    "sister": "kız kardeş", "pictures": "resimler", "conversations": "konuşmalar",
    "pleasure": "keyif", "trouble": "zahmet / sorun", "daisies": "papatyalar",
    "daisy": "papatya", "chain": "zincir", "close": "yakın / kapatmak",
    "dear": "canım / sevgili", "shall": "-eceğim", "peeped": "göz attı",
    "considering": "düşünerek", "whether": "-ip -mediği", "worth": "değer",
    "getting": "alma / olma", "picking": "toplama", "ran": "koştu", "hear": "duymak",
    "itself": "kendisi", "nothing": "hiçbir şey", "remarkable": "olağanüstü",
    "nor": "ne de", "much": "çok", "out": "dışarı", "way": "yol",
    "sherlock": "Sherlock", "holmes": "Holmes", "woman": "kadın", "always": "her zaman",
    "seldom": "nadiren", "mention": "bahsetmek", "under": "altında", "other": "diğer",
    "eclipses": "gölgede bırakır", "predominates": "baskın gelir", "whole": "bütün",
    "sex": "cinsiyet", "felt": "hissetti", "emotion": "duygu", "emotions": "duygular",
    "akin": "benzer", "love": "aşk", "particularly": "özellikle", "abhorrent": "tiksinç",
    "cold": "soğuk", "precise": "kesin", "admirably": "takdire şayan",
    "balanced": "dengeli", "mind": "zihin", "perfect": "mükemmel",
    "reasoning": "muhakeme", "observing": "gözlemleyen", "machine": "makine",
    "world": "dünya", "seen": "görülmüş", "grit": "kum tanesi", "sensitive": "hassas",
    "instrument": "alet", "crack": "çatlak", "high": "yüksek", "power": "güç",
    "lenses": "mercekler", "disturbing": "rahatsız edici", "strong": "güçlü",
    "nature": "doğa / mizaç", "such": "böyle", "irene": "Irene", "adler": "Adler",
    "pride": "gurur", "prejudice": "önyargı", "truth": "gerçek", "universally": "evrensel olarak",
    "acknowledged": "kabul edilmiş", "single": "bekâr / tek", "fortune": "servet",
    "must": "zorunda", "want": "istemek", "wife": "eş", "however": "ancak",
    "little": "az / küçük", "known": "bilinen", "feelings": "duygular",
    "views": "görüşler", "entering": "girerken", "neighbourhood": "mahalle",
    "frank": "açık sözlü", "chaos": "kaos", "creature": "yaratık",
    "monster": "canavar", "science": "bilim", "secret": "sır", "fear": "korku",
    "night": "gece", "ship": "gemi", "sea": "deniz", "island": "ada",
    "treasure": "hazine", "map": "harita", "captain": "kaptan", "doctor": "doktor",
    "count": "kont", "castle": "kale", "blood": "kan", "letter": "mektup",
    "journal": "günce", "train": "tren", "time": "zaman", "machine": "makine",
    "future": "gelecek", "past": "geçmiş", "present": "şimdiki / hediye",
    "ghost": "hayalet", "christmas": "Noel", "miser": "cimri", "poor": "yoksul",
    "rich": "zengin", "spirit": "ruh", "portrait": "portre", "youth": "gençlik",
    "beauty": "güzellik", "art": "sanat", "soul": "ruh", "green": "yeşil",
    "light": "ışık", "valley": "vadi", "party": "parti", "hope": "umut",
    "dream": "rüya", "voice": "ses", "silence": "sessizlik", "shadow": "gölge",
    "window": "pencere", "door": "kapı", "road": "yol", "wind": "rüzgâr",
    "rain": "yağmur", "snow": "kar", "summer": "yaz", "winter": "kış",
    "spring": "ilkbahar", "autumn": "sonbahar", "once": "bir zamanlar",
    "upon": "üzerine", "ago": "önce", "far": "uzak", "near": "yakın",
    "across": "karşısından", "against": "karşı", "among": "arasında",
    "during": "sırasında", "until": "-e kadar", "while": "iken",
    "because": "çünkü", "although": "rağmen", "though": "gerçi",
    "since": "-den beri / çünkü", "unless": "olmazsa", "whether": "olup olmadığı",
    "yet": "henüz / yine de", "both": "her ikisi", "either": "ya ... ya",
    "neither": "ne ... ne", "each": "her biri", "every": "her", "few": "az sayıda",
    "several": "birkaç", "half": "yarım", "almost": "neredeyse",
    "perhaps": "belki", "probably": "muhtemelen", "certainly": "kesinlikle",
    "indeed": "gerçekten", "therefore": "bu yüzden", "however": "yine de",
    "instead": "yerine", "otherwise": "aksi halde", "meanwhile": "bu arada",
    "finally": "sonunda", "suddenly": "aniden", "slowly": "yavaşça",
    "quickly": "hızlıca", "quietly": "sessizce", "carefully": "dikkatle",
    "soon": "yakında", "later": "daha sonra", "today": "bugün", "tomorrow": "yarın",
    "yesterday": "dün", "please": "lütfen", "thank": "teşekkür etmek",
    "thanks": "teşekkürler", "sorry": "üzgünüm", "hello": "merhaba",
    "goodbye": "hoşça kal", "yes": "evet", "no": "hayır",
    "oh": "ah", "ah": "ah", "mr": "bay", "mrs": "bayan", "miss": "bayanın",
    "sir": "efendim", "lady": "hanım", "lord": "lord", "king": "kral",
    "queen": "kraliçe", "prince": "prens", "princess": "prenses",
    "adventure": "macera", "mystery": "gizem", "crime": "suç", "clue": "ipucu",
    "case": "dava", "police": "polis", "law": "yasa", "death": "ölüm",
    "war": "savaş", "peace": "barış", "power": "güç", "city": "şehir",
    "village": "köy", "forest": "orman", "river": "nehir", "mountain": "dağ",
    "garden": "bahçe", "field": "tarla", "bridge": "köprü", "wall": "duvar",
    "stone": "taş", "gold": "altın", "silver": "gümüş", "paper": "kâğıt",
    "pen": "kalem", "page": "sayfa", "chapter": "bölüm", "novel": "roman",
    "poem": "şiir", "song": "şarkı", "game": "oyun", "sport": "spor",
    "food": "yiyecek", "bread": "ekmek", "tea": "çay", "coffee": "kahve",
    "wine": "şarap", "milk": "süt", "apple": "elma", "horse": "at",
    "dog": "köpek", "cat": "kedi", "bird": "kuş", "fish": "balık",
    "mouse": "fare", "hat": "şapka", "coat": "palto", "dress": "elbise",
    "shoe": "ayakkabı", "bag": "çanta", "key": "anahtar", "clock": "saat",
    "watch": "saat / izlemek", "glass": "cam / bardak", "mirror": "ayna",
    "phone": "telefon", "car": "araba", "train": "tren", "boat": "tekne",
    "plane": "uçak", "ticket": "bilet", "station": "istasyon",
    "problem": "sorun", "reason": "neden", "result": "sonuç", "example": "örnek",
    "fact": "olgu", "news": "haber", "history": "tarih", "future": "gelecek",
    "memory": "hafıza", "hope": "umut", "fear": "korku", "anger": "öfke",
    "joy": "sevinç", "pain": "acı", "pleasure": "haz", "danger": "tehlike",
    "safety": "güvenlik", "health": "sağlık", "illness": "hastalık",
    "doctor": "doktor", "hospital": "hastane", "medicine": "ilaç",
    "teacher": "öğretmen", "student": "öğrenci", "lesson": "ders",
    "language": "dil", "english": "İngilizce", "turkish": "Türkçe",
    "meaning": "anlam", "translate": "çevirmek", "learn": "öğrenmek",
    "study": "çalışmak", "remember": "hatırlamak", "forget": "unutmak",
    "understand": "anlamak", "explain": "açıklamak", "believe": "inanmak",
    "decide": "karar vermek", "choose": "seçmek", "plan": "plan",
    "build": "inşa etmek", "break": "kırmak", "carry": "taşımak",
    "catch": "yakalamak", "throw": "atmak", "hit": "vurmak", "kill": "öldürmek",
    "save": "kurtarmak / kaydetmek", "send": "göndermek", "receive": "almak",
    "return": "dönmek", "arrive": "varmak", "enter": "girmek", "exit": "çıkmak",
    "pass": "geçmek", "remain": "kalmak", "stay": "kalmak", "visit": "ziyaret",
    "travel": "seyahat", "search": "aramak", "discover": "keşfetmek",
    "create": "yaratmak", "destroy": "yok etmek", "protect": "korumak",
    "fight": "savaşmak", "win": "kazanmak", "fail": "başarısız olmak",
    "succeed": "başarmak", "allow": "izin vermek", "refuse": "reddetmek",
    "accept": "kabul etmek", "offer": "teklif", "promise": "söz",
    "agree": "katılmak", "disagree": "katılmamak", "appear": "görünmek",
    "disappear": "kaybolmak", "happen": "olmak (meydana)", "continue": "devam etmek",
    "finish": "bitirmek", "complete": "tamamlamak", "prepare": "hazırlamak",
    "notice": "fark etmek", "observe": "gözlemlemek", "consider": "düşünmek",
    "imagine": "hayal etmek", "wonder": "merak etmek / harika",
    "expect": "beklemek (ummak)", "prefer": "tercih etmek", "enjoy": "zevk almak",
    "belong": "ait olmak", "include": "içermek", "contain": "barındırmak",
    "cover": "kaplamak", "fill": "doldurmak", "raise": "kaldırmak",
    "rise": "yükselmek", "fall": "düşmek", "drop": "bırakmak", "lift": "kaldırmak",
    "pull": "çekmek", "push": "itmek", "touch": "dokunmak", "point": "işaret / nokta",
    "sign": "işaret", "mark": "işaret", "line": "çizgi / hat", "circle": "daire",
    "square": "kare", "shape": "şekil", "color": "renk", "colour": "renk",
    "sound": "ses", "noise": "gürültü", "silence": "sessizlik",
    "tired": "yorgun", "sleepy": "uykulu", "hungry": "aç", "thirsty": "susuz",
    "ill": "hasta", "dead": "ölü", "alive": "canlı", "human": "insan",
    "natural": "doğal", "simple": "basit", "complex": "karmaşık",
    "strange": "garip", "ordinary": "sıradan", "special": "özel",
    "famous": "ünlü", "unknown": "bilinmeyen", "public": "kamuya açık",
    "private": "özel", "common": "yaygın", "rare": "nadir",
    "possible": "mümkün", "impossible": "imkânsız", "necessary": "gerekli",
    "available": "mevcut", "able": "yapabilir", "unable": "yapamaz",
    "glad": "memnun", "pleased": "memnun", "surprised": "şaşırmış",
    "interested": "ilgili", "bored": "sıkılmış", "excited": "heyecanlı",
    "calm": "sakin", "nervous": "gergin", "brave": "cesur", "clever": "zeki",
    "wise": "bilge", "foolish": "aptalca", "kind": "nazik", "cruel": "zalim",
    "honest": "dürüst", "secret": "gizli / sır", "quiet": "sessiz",
    "deep": "derin", "wide": "geniş", "narrow": "dar", "thick": "kalın",
    "thin": "ince", "heavy": "ağır", "light": "hafif / ışık", "sharp": "keskin",
    "clean": "temiz", "dirty": "kirli", "wet": "ıslak", "dry": "kuru",
    "fresh": "taze", "old": "eski", "ancient": "antik", "modern": "modern",
    "sudden": "ani", "final": "nihai", "main": "ana", "only": "tek / sadece",
    "several": "birkaç", "various": "çeşitli", "certain": "belirli / emin",
    "general": "genel", "particular": "belirli", "personal": "kişisel",
    "social": "sosyal", "political": "siyasi", "legal": "yasal",
    "local": "yerel", "national": "ulusal", "international": "uluslararası",
    "oh": "ah", "dear": "canım", "late": "geç", "bank": "nehir kenarı",
    "get": "almak", "very": "çok", "beginning": "başlangıç"
}

ALICE = """Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do.

Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?"

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!"

But when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it.

Burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.

In another moment down went Alice after it, never once considering how in the world she was to get out again.

The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well."""

SHERLOCK = """To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler.

All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position.

He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer—excellent for drawing the veil from men's motives and actions. But for the trained reasoner to admit such intrusions into his own delicate and finely adjusted temperament was to introduce a distracting factor which might throw a doubt upon all his mental results.

Grit in a sensitive instrument, or a crack in one of his own high-power lenses, would not be more disturbing than a strong emotion in a nature such as his.

And yet there was but one woman to him, and that woman was the late Irene Adler, of dubious and questionable memory.

I had seen little of Holmes lately. My marriage had drifted us away from each other. My own complete happiness, and the home-centred interests which rise up around the man who first turns aside from the lonely road of bachelorhood, were sufficient to absorb all my attention."""

PRIDE = """It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.

"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"

Mr. Bennet replied that he had not.

"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."

Mr. Bennet made no answer.

"Do you not want to know who has taken it?" cried his wife impatiently.

"You want to tell me, and I have no objection to hearing it."

This was invitation enough.

"Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it, that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week."

"What is his name?"

"Bingley."

"Is he married or single?"

"Oh! Single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!\""""

FRANKENSTEIN = """You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking.

I am already far north of London, and as I walk in the streets of Petersburgh, I feel a cold northern breeze play upon my cheeks, which braces my nerves and fills me with delight. Do you understand this feeling? This breeze, which has travelled from the regions towards which I am advancing, gives me a foretaste of those icy climes.

Inspirited by this wind of promise, my daydreams become more fervent and vivid. I try in vain to be persuaded that the pole is the seat of frost and desolation; it ever presents itself to my imagination as the region of beauty and delight.

There, Margaret, the sun is for ever visible, its broad disk just skirting the horizon and diffusing a perpetual splendour. There—for with your leave, my sister, I will put some trust in preceding navigators—there snow and frost are banished; and, sailing over a calm sea, we may be wafted to a land surpassing in wonders and in beauty every region hitherto discovered on the habitable globe."""

DRACULA = """3 May. Bistritz.—Left Munich at 8:35 P.M., on 1st May, arriving at Vienna early next morning; should have arrived at 6:46, but train was an hour late. Buda-Pesth seems a wonderful place, from the glimpse which I got of it from the train and the little I could walk through the streets. I feared to go very far from the station, as we had arrived late and would start as near the correct time as possible.

The impression I had was that we were leaving the West and entering the East; the most western of splendid bridges over the Danube, which is here of noble width and depth, took us among the traditions of Turkish rule.

We left in pretty good time, and came after nightfall to Klausenburgh. Here I stopped for the night at the Hotel Royale. I had for dinner, or rather supper, a chicken done up some way with red pepper, which was very good but thirsty. (Mem., get recipe for Mina.) I asked the waiter, and he said it was called "paprika hendl," and that, as it was a national dish, I should be able to get it anywhere along the Carpathians.

I read that every known superstition in the world is gathered into the horseshoe of the Carpathians, as if it were the centre of some sort of imaginative whirlpool; if so my stay may be very interesting. (Mem., I must ask the Count all about them.)"""

TREASURE = """Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island, and that only because there is still treasure not yet lifted, I take up my pen in the year of grace 17—, and go back to the time when my father kept the Admiral Benbow inn and the brown old seaman with the sabre cut first took up his lodging under our roof.

I remember him as if it were yesterday, as he came plodding to the inn door, his sea-chest following behind him in a hand-barrow—a tall, strong, heavy, nut-brown man, his tarry pigtail falling over the shoulder of his soiled blue coat, his hands ragged and scarred, with black, broken nails, and the sabre cut across one cheek, a dirty, livid white.

I remember him looking round the cover and whistling to himself as he did so, and then breaking out in that old sea-song that he sang so often afterwards:

"Fifteen men on the dead man's chest—Yo-ho-ho, and a bottle of rum!"

Then he rapped on the door with a bit of stick like a handspike that he carried, and when my father appeared, called roughly for a glass of rum. This, when it was brought to him, he drank slowly, like a connoisseur, lingering on the taste and still looking about him at the cliffs and up at our signboard."""

TIME_MACHINE = """The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burned brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.

Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon, and there was that luxurious after-dinner atmosphere when thought runs gracefully free. At these times, when the fire glowed, and we spread ourselves in easy chairs, and he told us such odd things, we always listened.

"You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception."

"Is not that rather a large thing to expect us to begin upon?" said Filby, an argumentative person with red hair.

"I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness NIL, has no real existence. They taught you that? Neither has a mathematical plane. These things are mere abstractions."

"That is all right," said the Psychologist.

"Nor, having only length, breadth, and thickness, can a cube have a real existence."

"There I object," said Filby. "Of course a solid body may exist. All real things—"

"So most people think. But wait a moment. Can an instantaneous cube exist?"
"Don't follow you," said Filby.
"Can a cube that does not last for any time at all, have a real existence?"
Filby became pensive. "Clearly," the Time Traveller proceeded, "any real body must have extension in four directions: it must have Length, Breadth, Thickness, and—Duration.\""""

CAROL = """Marley was dead: to begin with. There is no doubt whatever about that. The register of his burial was signed by the clergyman, the clerk, the undertaker, and the chief mourner. Scrooge signed it: and Scrooge's name was good upon 'Change, for anything he chose to put his hand to. Old Marley was as dead as a door-nail.

Mind! I don't mean to say that I know, of my own knowledge, what there is particularly dead about a door-nail. I might have been inclined, myself, to regard a coffin-nail as the deadest piece of ironmongery in the trade. But the wisdom of our ancestors is in the simile; and my unhallowed hands shall not disturb it, or the Country's done for. You will therefore permit me to repeat, emphatically, that Marley was as dead as a door-nail.

Scrooge knew he was dead? Of course he did. How could it be otherwise? Scrooge and he were partners for I don't know how many years. Scrooge was his sole executor, his sole administrator, his sole assign, his sole residuary legatee, his sole friend, and sole mourner. And even Scrooge was not so dreadfully cut up by the sad event, but that he was an excellent man of business on the very day of the funeral, and solemnised it with an undoubted bargain.

The mention of Marley's funeral brings me back to the point I started from. There is no doubt that Marley was dead. This must be distinctly understood, or nothing wonderful can come of the story I am going to relate."""

DORIAN = """The studio was filled with the rich odour of roses, and when the light summer wind stirred amidst the trees of the garden, there came through the open door the heavy scent of the lilac, or the more delicate perfume of the pink-flowering thorn.

From the corner of the divan of Persian saddle-bags on which he was lying, smoking, as was his custom, innumerable cigarettes, Lord Henry Wotton could just catch the gleam of the honey-sweet and honey-coloured blossoms of a laburnum, whose tremulous branches seemed hardly able to bear the burden of a beauty so flamelike as theirs; and now and then the fantastic shadows of birds in flight flitted across the long tussore-silk curtains that were stretched in front of the huge window, producing a kind of momentary Japanese effect, and making him think of those pallid, jade-faced painters of Tokyo who, through the medium of an art that is necessarily immobile, seek to convey the sense of swiftness and motion.

The sullen murmur of the bees shouldering their way through the long unmown grass, or circling with monotonous insistence round the dusty gilt horns of the straggling woodbine, seemed to make the stillness more oppressive. The dim roar of London was like the bourdon note of a distant organ.

In the centre of the room, clamped to an upright easel, stood the full-length portrait of a young man of extraordinary personal beauty, and in front of it, some little distance away, was sitting the artist himself, Basil Hallward, whose sudden disappearance some years ago caused, at the time, such public excitement and gave rise to so many strange conjectures."""

GATSBY = """In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since.

"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven't had the advantages that you've had."

He didn't say any more, but we've always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I'm inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.

The abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person, and so it came about that in college I was unjustly accused of being a politician, because I was privy to the secret griefs of wild, unknown men. Most of the confidences were unsought—frequently I have feigned sleep, preoccupation, or a hostile levity when I realized by some unmistakable sign that an intimate revelation was quivering on the horizon.

The intimate revelations of young men, or at least the terms in which they express them, are usually plagiaristic and marred by obvious suppressions. Reserving judgments is a matter of infinite hope. I am still a little afraid of missing something if I forget that, as my father snobbishly suggested, and I snobbishly repeat, a sense of the fundamental decencies is parcelled out unequally at birth."""

BOOKS = [
    {
        "slug": "alice",
        "title": "Alice in Wonderland",
        "author": "Lewis Carroll",
        "genre": "Masal",
        "cover_color": "#3b2a1a",
        "description": "Tavşanın peşinden düşen Alice.",
        "content": ALICE,
        "is_copyrighted": False,
    },
    {
        "slug": "sherlock",
        "title": "A Scandal in Bohemia",
        "author": "Arthur Conan Doyle",
        "genre": "Polisiye",
        "cover_color": "#1e3348",
        "description": "Holmes ve Irene Adler.",
        "content": SHERLOCK,
        "is_copyrighted": False,
    },
    {
        "slug": "pride",
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "genre": "Klasik",
        "cover_color": "#412434",
        "description": "Bennet ailesi ve evlilik meseleleri.",
        "content": PRIDE,
        "is_copyrighted": False,
    },
    {
        "slug": "frankenstein",
        "title": "Frankenstein",
        "author": "Mary Shelley",
        "genre": "Gotik",
        "cover_color": "#2a3b22",
        "description": "Kuzeyden gelen mektuplar.",
        "content": FRANKENSTEIN,
        "is_copyrighted": False,
    },
    {
        "slug": "dracula",
        "title": "Dracula",
        "author": "Bram Stoker",
        "genre": "Gotik",
        "cover_color": "#243044",
        "description": "Jonathan Harker'ın güncesi.",
        "content": DRACULA,
        "is_copyrighted": False,
    },
    {
        "slug": "treasure",
        "title": "Treasure Island",
        "author": "Robert Louis Stevenson",
        "genre": "Macera",
        "cover_color": "#3a3118",
        "description": "Admiral Benbow hanı.",
        "content": TREASURE,
        "is_copyrighted": False,
    },
    {
        "slug": "timemachine",
        "title": "The Time Machine",
        "author": "H. G. Wells",
        "genre": "Bilim kurgu",
        "cover_color": "#1b2e2a",
        "description": "Dördüncü boyut üzerine.",
        "content": TIME_MACHINE,
        "is_copyrighted": False,
    },
    {
        "slug": "carol",
        "title": "A Christmas Carol",
        "author": "Charles Dickens",
        "genre": "Klasik",
        "cover_color": "#33221c",
        "description": "Marley ölmüştü.",
        "content": CAROL,
        "is_copyrighted": False,
    },
    {
        "slug": "dorian",
        "title": "The Picture of Dorian Gray",
        "author": "Oscar Wilde",
        "genre": "Klasik",
        "cover_color": "#2c2438",
        "description": "Atölyedeki portre.",
        "content": DORIAN,
        "is_copyrighted": False,
    },
    {
        "slug": "gatsby",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "genre": "Roman",
        "cover_color": "#16324a",
        "description": "ABD'de kamu malı (1925).",
        "content": GATSBY,
        "is_copyrighted": False,
    },
]


def sql_str(s):
    return "'" + s.replace("'", "''") + "'"


def main():
    words = {k.lower(): v for k, v in WORDS.items()}

    dict_js = "const DICTIONARY = " + json.dumps(words, ensure_ascii=False, indent=4) + ";\n"
    with open(os.path.join(ROOT, "dictionary", "tr.js"), "w", encoding="utf-8") as f:
        f.write(dict_js)

    rows = []
    for w, m in sorted(words.items()):
        rows.append("    ({}, {})".format(sql_str(w), sql_str(m)))
    dict_sql = (
        "-- İngilizce-Türkçe sözlük tohumu\n"
        "insert into public.dictionary (word, meaning_tr) values\n"
        + ",\n".join(rows)
        + "\non conflict (word) do update set meaning_tr = excluded.meaning_tr;\n"
    )
    with open(os.path.join(ROOT, "supabase", "02_seed_dictionary.sql"), "w", encoding="utf-8") as f:
        f.write(dict_sql)

    book_sql = ["-- Kamu malı kitap tohumu\n"]
    lib = []
    for b in BOOKS:
        wc = len(b["content"].split())
        book_sql.append(
            "insert into public.books (slug, title, author, genre, description, cover_color, content, is_copyrighted, is_published, word_count)\n"
            "values ({slug}, {title}, {author}, {genre}, {desc}, {color}, {content}, false, true, {wc})\n"
            "on conflict (slug) do update set title = excluded.title, content = excluded.content, word_count = excluded.word_count;\n".format(
                slug=sql_str(b["slug"]),
                title=sql_str(b["title"]),
                author=sql_str(b["author"]),
                genre=sql_str(b["genre"]),
                desc=sql_str(b["description"]),
                color=sql_str(b["cover_color"]),
                content=sql_str(b["content"]),
                wc=wc,
            )
        )
        lib.append({
            "title": b["title"],
            "author": b["author"],
            "genre": b["genre"],
            "file": b["slug"] + ".txt",
            "cover_color": b["cover_color"],
            "text": b["content"],
        })
        txt_path = os.path.join(ROOT, "books", b["slug"] + ".txt")
        with open(txt_path, "w", encoding="utf-8") as tf:
            tf.write(b["content"].strip() + "\n")

    with open(os.path.join(ROOT, "supabase", "03_seed_books.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(book_sql))

    with open(os.path.join(ROOT, "books", "library.js"), "w", encoding="utf-8") as f:
        f.write("const LIBRARY = " + json.dumps(lib, ensure_ascii=False, indent=4) + ";\n")

    books_json = [{"title": b["title"], "file": b["slug"] + ".txt"} for b in BOOKS]
    with open(os.path.join(ROOT, "books", "books.json"), "w", encoding="utf-8") as f:
        json.dump(books_json, f, ensure_ascii=False, indent=4)
        f.write("\n")

    print("words", len(words), "books", len(BOOKS))


if __name__ == "__main__":
    main()
