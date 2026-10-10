import { STORY_SEED_COMMENTS } from '../data/storySeedComments';

// Same "no backend yet" pattern as storyLikes.js — comments are real and
// interactive (not just a decorative count), but per-visitor only: each
// person sees their own comments on a story, persisted in localStorage,
// not a shared/global comment thread. Good enough for the feature to
// feel real today; swapping in a real backend later only means changing
// where these two functions read/write, not how the UI calls them.
const KEY_PREFIX = 'story_comments_';
const MAX_TEXT_LENGTH = 300;

function readComments(storyId) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + storyId);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getComments(storyId) {
  return readComments(storyId);
}

export function addComment(storyId, text) {
  const trimmed = text.trim().slice(0, MAX_TEXT_LENGTH);
  if (!trimmed) return readComments(storyId);
  const next = [...readComments(storyId), { text: trimmed, ts: Date.now() }];
  try {
    localStorage.setItem(KEY_PREFIX + storyId, JSON.stringify(next));
  } catch {
    // Private browsing / storage disabled — the comment still shows for
    // this view, it just won't persist across reloads.
  }
  return next;
}

// ---------------------------------------------------------------------
// Decorative "seed" comments — same spirit as storyLikes.js's base like
// count (stable per story, no backend), but with real text instead of
// just a number: STORY_SEED_COMMENTS carries a few hand-written comments
// per story (written after actually watching/viewing that story's own
// media — see storySeedComments.js), topped up with a per-category pool
// of generic-but-on-topic reactions so every story always has a full,
// varied-feeling 5-35 comment list even for ones with no authored entry
// (e.g. every live Endirimlər tour, which has no fixed id to author
// against).
// ---------------------------------------------------------------------

const NAMES = [
  'Günel', 'Elvin', 'Aysel', 'Rəşad', 'Nərmin', 'Tural', 'Leyla', 'Orxan',
  'Səbinə', 'Murad', 'Aytac', 'Vüsal', 'Lamiyə', 'Kamran', 'Günay', 'Elnur',
  'Aygün', 'Fərid', 'Nigar', 'Samir', 'Ülviyyə', 'Anar', 'Zeynəb', 'Rauf',
  'Gülnar', 'İlkin', 'Könül', 'Ceyhun', 'Mehriban', 'Araz', 'Nazrin', 'Tahir',
  'Sevinc', 'Həsən', 'Xatirə',
];

const CATEGORY_COMMENT_POOLS = {
  turistler: [
    'Vauu, nə gözəl yerdir 😍', 'Bu turu harda almaq olar?', 'Mən də getmək istəyirəm!!',
    'Qiyməti neçəyədir?', 'Harasıdır bu? Çox gözəl görünür', 'Növbəti dəfə mən də qoşulacam',
    'Neçə günlükdür bu tur?', 'Fotolar əla çəkilib 👏', 'Doğrudanmı bu qədər ucuzdur?',
    'Biletlər hələ var?', 'Uşaqlarla getmək olar?', 'Mən keçən il getmişdim, möhtəşəm idi',
    'Bu yerə uçuş neçə saatdır?', 'Vizaya ehtiyac var?', 'Rəngləri inanılmazdır 🔥',
    'Harada qalacaqsınız, otel daxildir?', 'Travellab ilə əla təcrübə oldu',
    'Bu qiymətə inanmıram, çox sərfəlidir', 'Dostumla birgə yazılmaq istəyirik',
    'Hansı aylarda ən yaxşı vaxtdır getmək üçün?', 'Bu tur hələ aktivdir?',
    'Mən artıq bilet aldım 🎉', 'Çox arzuladığım yer idi, nəhayət gedəcəm',
    'Bələdçi necədir, yaxşıdırmı?', 'Sizin başqa turlar da var?', 'Bələdçi dililə izah edir?',
    'Mən WhatsApp-dan yazdım, cavab gözləyirəm', 'Mənzərə inanılmazdır, təbrik edirəm',
    'Hava necə olur bu vaxt orda?', 'Cəmi neçə nəfərlik qrupdur?', 'Qrup halında endirim var?',
    'Bu qədər gözəl olduğunu bilmirdim', 'Siz hər il edirsiniz bu turu?',
    'Pasport müddətinin nə qədər qalması lazımdır?', 'Növbəti tur nə vaxtdır?',
    'Maraqlıdır, neçə nəfər gedib bu tura?', 'Budcəmə uyğundurmu bilmirəm, baxaq',
    'Doğrudanmı hər şey daxildir qiymətə?',
  ],
  viza: [
    'Viza müddəti neçə gündür?', 'Sənədləri necə təqdim edirsiniz?',
    'Mən müraciət etdim, nə vaxt cavab gələcək?', 'Qiyməti nə qədərdir vizanın?',
    'Rədd olunma halı çox olurmu?', 'Nə sənədlər lazımdır?', 'Bank çıxarışı tələb olunur?',
    'Təcili viza üçün əlavə ödəniş var?', 'Mən bu yolla çıxış vizası almışdım, əla işlədi',
    'Uşaq üçün ayrıca sənəd lazımdırmı?', 'Neçə gün ərzində nəticə gəlir?', 'Çox rahat oldu, təşəkkürlər',
    'Online müraciət etmək olar?', 'Səfirliyə getmək lazımdırmı?', 'Hansı ölkələr üçün xidmət göstərirsiniz?',
    'Mən artıq 2-ci dəfə sizinlə işləyirəm', 'Sığorta da daxildirmi qiymətə?',
    'Nə qədər əvvəldən müraciət etmək lazımdır?', 'Konsulluq müsahibəsi lazımdırmı?',
    'Bu qədər sürətli olacağını düşünmürdüm', 'Pasportun orijinalını göndərmək lazımdırmı?',
    'Çox professional yanaşma idi, təşəkkürlər', 'Əlaqə nömrəniz koddurmu?',
    'Bu xidmət hansı ölkə vətəndaşları üçündür?', 'Nəticəni necə bilərəm?',
    'Mən WhatsApp-a yazdım, gözləyirəm', 'Sağ olun, çox köməyiniz oldu 🙏', 'Tələbə endirimi varmı?',
    'Bu proses nə qədər çəkdi sizdə?', 'Rədd olunsa pul geri qaytarılır?', 'Çoxdəfəlik viza da olur?',
    'Fotoşəkil tələbləri nədir?', 'Təşəkkürlər, çox aydın izah etdiniz', 'Bu il bu ölkəyə viza açıqdır?',
  ],
  endirimler: [
    'Bu qiymət hələ keçərlidirmi?', 'Neçə yer qalıb?', 'Keşbek necə işləyir?', 'Tarix dəyişmək olar?',
    'Mən bu tura yazılmaq istəyirəm', 'Çox sərfəli təklifdir 🔥', 'Son günə qədər bu qiymətdədir?',
    'Uşaq üçün endirim var?', 'Otel neçə ulduzludur?', 'Bu qiymətə uçuş da daxildir?',
    'WhatsApp-dan yazdım, cavab gözləyirəm', 'Vauu, çox ucuzdur, inana bilmirəm',
    'Tək adam üçün də var bu tur?', 'Qrup halında gedəndə əlavə endirim olur?',
    'Bu tarixlərdə işim var, başqa tarix yoxdurmu?', 'Mən keçən dəfə bu qiymətə yazılmışdım, əla idi',
    'Pasport müddəti neçə ay qalmalıdır?', 'Cəmi nə daxildir qiymətə?', 'Ödənişi hissə-hissə etmək olar?',
    'Bu tur hər il təkrarlanır?', 'Mən dostlarıma da deyəcəm bu təklifi',
    'Son yerlər qalıb deyə narahatam, tez yazılmalıyam', 'Keşbeki harada istifadə edə bilərəm?',
    'Rezervasiya üçün beh lazımdır?', 'Bu tarix mənə uyğun gəlmir, təəssüf',
    'Bütün turlarınız belə sərfəli olur?', 'Mən bu dəqiqə zəng edirəm', 'Təşəkkürlər, dərhal yazıldım 🎉',
    'Qiymət aviabiletlə birlikdədir?', 'Neçə gecə-gündüzdür bu tur?', 'Mən artıq bu turu almışam, super idi',
    'Son anda belə endirimlər tez-tez olur?', 'Sualım var, zəng edə bilərəm?',
  ],
  bloggerler: [
    'Bu videonu kim çəkib, əladır 👏', 'Bloggerin adı kimdir?', 'Mən də belə bir tura getmək istəyirəm',
    'Bu hesabı harada izləyə bilərəm?', 'Çox professional montaj olub', 'Siz bloggerlərlə necə işləyirsiniz?',
    'Bu məkan harasıdır?', 'Mən də blogger kimi sizinlə işləmək istəyirəm', 'Vauu, rəngləri inanılmazdır',
    'Bu turu bu blogger kimlə birgə edib?', 'Instagram hesabını paylaşa bilərsiniz?',
    'Çox maraqlı məzmundur, davam edin', 'Bu cür əməkdaşlıq üçün necə müraciət edim?',
    'Siz hər turda blogger dəvət edirsiniz?', 'Super çəkiliş, operatorunuz kimdir?',
    'Bu səyahəti izləyəndə mən də getmək istədim', 'Bloggerlə işləmək şərtləriniz nədir?',
    'Çox təbii görünür, saxta deyil', 'Bu format çox xoşuma gəlir', 'Daha çox belə videolar paylaşın',
    'Mən sizin kanalınıza abunə oldum', 'Bu yerə gedən başqa bloggerlər də var?',
    'Çəkiliş nə qədər vaxt aparıb?', 'Dronla çəkilən kadrlar möhtəşəmdir', 'Bu əməkdaşlıq sponsorludur?',
    'Mən də müraciət etmək istəyirəm blogger kimi', 'Montajı kim edib, əladır',
    'Siz özünüz də gedirsiniz bu turlara?', 'Çox orijinal yanaşmadır', 'Bu hesaba necə yazmaq olar?',
    'Super enerji var videoda 🔥', 'Bu kadrlar hara aiddir dəqiq?', 'Çox bəyəndim, paylaşıram',
  ],
  'hediyye-karti': [
    'Hədiyyə kartını necə istifadə edirlər?', 'Son istifadə tarixi varmı?', 'Nağd pula çevirmək olar?',
    'Hansı məbləğlərdə olur?', 'Dostuma hədiyyə etmək istəyirəm, necə alaq?', 'Onlayn alıram, necə çatdırılır?',
    'Bütün turlarda istifadə etmək olar?', 'Çox gözəl ideyadır 🎁', 'Kartın etibarlılıq müddəti nə qədərdir?',
    'Doğum günü hədiyyəsi üçün əladır', 'Fiziki kart да var, yoxsa yalnız rəqəmsal?',
    'Mən bunu aldım, çox rahatdır', 'Qalıq balansı necə yoxlayıram?', 'Korporativ sifariş vermək olar?',
    'Hansı şəhərlərdə keçərlidir?', 'Bir neçə dəfə istifadə etmək olar?', 'Mən artıq istifadə etdim, super işlədi',
    'Pulsuz çatdırılma var?', 'Minimum məbləğ nə qədərdir?', 'Bu hədiyyə kartı ilə endirim də alına bilər?',
    'Çox praktik hədiyyədir, hər zaman uyğun gəlir', 'Kartı aktivləşdirmək üçün nə etməliyəm?',
    'Sifariş vaxtı nə qədər çəkir?', 'Mən anama hədiyyə etdim, çox sevindi', 'Bu kartı Shop-da da istifadə etmək olar?',
    'Son tarix keçəndə pul geri qayıdır?', 'Kart itərsə nə etmək lazımdır?',
    'Super fikir, mən də sifariş verəcəm', 'Hansı dizaynlarda olur kartlar?', 'Partnyor kimi işləmək olar sizinlə?',
    'Mən WhatsApp-dan sifariş verdim, asan oldu', 'Uşaq bayramı üçün uyğundur?',
    'Çox praktik və faydalı seçimdir', 'Kartı kimə hədiyyə edəcəyimi hələ düşünürəm',
  ],
  shop: [
    'Bu məhsul hələ stokdadır?', 'Qiyməti neçəyədir?', 'Çatdırılma neçə günə olur?', 'Rəngləri hansılardır?',
    'Ölçü cədvəli var?', 'Keyfiyyəti necədir, kiminsə təcrübəsi var?', 'Mən aldım, çox razıyam 👍',
    'Bu çamadan təyyarəyə yararlıdır?', 'Sifariş necə verilir?', 'Region daxilində pulsuz çatdırılma var?',
    'Materialı nədəndir?', 'Bu məhsulu hədiyyə kartı ilə ala bilərəm?', 'Zəmanəti neçə ildir?',
    'Başqa rəngdə də olacaq?', 'Çox praktikdir, səyahətə əladır', 'Qiymət/keyfiyyət nisbəti yaxşıdır',
    'Bu modeli tövsiyə edirsiniz?', 'Mən sifariş verdim, tez gəldi', 'Endirim kuponu işləyir bu məhsula?',
    'Neçə kq tutur çamadan?', 'Geri qaytarma şərtləriniz nədir?', 'Bu aksesuar dəstə kimi satılır?',
    'Rəsmi zəmanət kartı verilir?', 'Mən 2-ci dəfə sifariş edirəm, çox razıyam', 'Bu qiymətə başqa yerdə tapmaq olmur',
    'Çox keyfiyyətli görünür', 'Nağd ödəniş qəbul edirsiniz?', 'Bu məhsulu Bakıdan kənara göndərirsiniz?',
    'Super seçimdir səyahət üçün', 'Fotodakı kimi gəldi, çox razıyam', 'Mən hədiyyə üçün aldım, çox bəyəndilər',
    'Çəkisi nə qədərdir?', 'Satışda endirim nə vaxta qədərdir?', 'Çox funksionaldır, tövsiyə edirəm',
  ],
  labpoint: [
    'Labpoint necə qazanılır?', 'Xallarımı harada görə bilərəm?', 'Keşbek faizi nə qədərdir?',
    'Bu xallarla nə ala bilərəm?', 'Mən qeydiyyatdan keçdim, necə işləyir?', 'Xalların son istifadə tarixi var?',
    'Hər alışda xal yığılır?', 'Super sistemdir, çox razıyam', 'Dostumu dəvət etsəm bonus var?',
    'Xalları başqasına köçürmək olar?', 'Mən artıq istifadə etdim, çox rahatdır', 'Tətbiqdən izləmək olar xalları?',
    'Minimum nə qədər xal toplamaq lazımdır?', 'Bu proqram pulsuzdur?', 'Çox gözəl təşəbbüsdür',
    'Xallar nağd pula çevrilir?', 'Hər turdan eyni faiz keşbek var?', 'Mən bu sistemə görə sizi seçdim',
    'Qeydiyyat necə olur?', 'Bonus kampaniyaları olur?', 'Çox sadə və anlaşıqlıdır',
    'Səyahət edən hər kəsə tövsiyə edirəm', 'Xallarım niyə görünmür hesabımda?', 'Partnyor şirkətlər hansılardır?',
    'Super fikir, rəqabətə üstünlükdür', 'Mən artıq 2-ci turda istifadə etdim',
    'Bu kampaniya nə vaxta qədər davam edir?', 'Email-ə bildiriş gəlir xallar haqqında?',
    'Çox faydalı sistemdir, təşəkkürlər', 'Status səviyyələri də var?', 'Mən dostlarıma da tövsiyə etdim',
    'Bu proqram hamı üçün açıqdır?', 'Xallarımı necə xərcləyə bilərəm dəqiq?', 'Çox sevdim bu sistemi',
  ],
  // No "reyler" pool — comments are disabled entirely for that category
  // (reviews are already testimonial content; commenting on a review
  // reads as redundant) — see StoryViewer.jsx's commentsEnabled.
  tedbir: [
    'Bu tədbir nə vaxtdır?', 'Biletlər hələ var?', 'Qiyməti neçəyədir?', 'Harada keçiriləcək?',
    'Mən bu tədbirə getmək istəyirəm', 'Yaş həddi var bu tədbirə?', 'Çox gözəl təşkil olunub',
    'Biletimi necə ala bilərəm?', 'VIP yerlər də var?', 'Bu konsertə kim çıxış edəcək?',
    'Mən keçən il getmişdim, əla idi', 'Biletlər onlayn satılır?', 'Uşaqla getmək olar?',
    'Parkinq var tədbir yerində?', 'Neçə saat davam edəcək?', 'Super proqram olacaq görünür',
    'Mən bu dəqiqə bilet alıram', 'Qapılar neçədə açılır?', 'Qrup halında endirim var?',
    'Bu tədbirin təşkilatçısı sizsiniz?', 'Mən dostlarımla gedəcəm', 'Çox gözlədiyim tədbir idi',
    'Son bilet satışı nə vaxta qədərdir?', 'Bu tədbir hər il olur?', 'Geri qaytarma siyasəti var biletlər üçün?',
    'Mən artıq bilet aldım 🎉', 'Çıxış edən sənətçilər kimlərdir?', 'Bu tədbirə necə gedə bilərəm, nəqliyyat var?',
    'Super təşkilatdır, təbrik edirəm', 'Mən WhatsApp-dan sual yazdım', 'Biletin qiymətinə nə daxildir?',
    'Bu hadisəni qaçırmaq istəmirəm', 'Yerlər məhduddur?', 'Çox maraqlı bir tədbir kimi görünür',
    'Bilet geri satıla bilər?',
  ],
};

// Simple deterministic PRNG seeded by a string (xmur3 + mulberry32-style
// mix) — same spirit as storyLikes.js's hash(), just needs to produce a
// repeatable SEQUENCE of numbers (a count, then N pool picks, then N name
// picks) instead of one single value.
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  }
  return function next() {
    h = (Math.imul(h ^ (h >>> 15), h | 1)) >>> 0;
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

// Decorative comment list for one story — stable across reloads/visitors
// (same "no accounts needed" pattern as storyLikes.js), 5-35 of them,
// always including every hand-authored one for this story (if any) and
// topping up with the category's generic pool. Pure display data; never
// written anywhere, never mixed into getComments()/addComment() above.
export function getSeedComments(storyId, categoryId) {
  const rand = seededRandom(storyId);
  const count = 5 + Math.floor(rand() * 31); // 5-35

  const authored = STORY_SEED_COMMENTS[storyId] || [];
  const pool = CATEGORY_COMMENT_POOLS[categoryId] || CATEGORY_COMMENT_POOLS.turistler;

  const texts = [...authored];
  while (texts.length < count) {
    texts.push(pool[Math.floor(rand() * pool.length)]);
  }

  return texts.slice(0, count).map((text) => ({
    name: NAMES[Math.floor(rand() * NAMES.length)],
    text,
  }));
}
