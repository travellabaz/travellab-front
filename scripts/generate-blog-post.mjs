// Generates one new blog post JSON file under src/data/blog/posts and
// writes it to disk. Run by .github/workflows/daily-blog.yml on a
// schedule; the workflow commits+pushes whatever this script writes.
//
// Uses the Google Gemini API (free tier via Google AI Studio) — needs a
// GEMINI_API_KEY repo secret (get one at https://aistudio.google.com/apikey).
// Previously used GitHub Models, which is being retired (scheduled
// "retirement brownout" 410s as of 2026-07-31); switched to Gemini for
// both stability and noticeably better Azerbaijani-language output than
// the free Llama/Gemma models on other free providers (e.g. Groq).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, '../src/data/blog/posts');

// "-latest" alias instead of a pinned version: Gemini model versions get
// retired from new-key access surprisingly fast (gemini-2.5-flash 404'd
// within the same year), and this alias is Google's own mechanism for
// scripts like this one to keep pointing at whatever flash-tier model is
// currently available without needing a code change each time.
const MODEL = 'gemini-flash-latest';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// CSS only has these four category pill colors defined (see .cat-a/.cat-t/
// .cat-n/.cat-m in global.css) — has to be one of these exact Azerbaijani
// names, not something the model invents with no matching style.
//
// The category is picked by pickCategory() below, not left to the model —
// left to itself, Gemini defaulted to "Məsləhətlər" for every single post.
// Each entry also carries its own topic guidance so the prompt steers
// toward genuinely different kinds of posts per category, not just a
// different label on the same "tips" article.
const CATEGORIES = {
  'Məsləhətlər': {
    class: 'cat-a',
    guidance:
      'Praktiki səyahət məsləhətləri: büdcə səyahəti, bagaj/sənəd hazırlığı, səyahət sığortası, ailəvi səyahət, uçuşda rahatlıq, pul qənaəti üsulları, aviabilet axtarışı.',
  },
  'Bələdçi': {
    class: 'cat-t',
    guidance:
      'Konkret bir şəhər/ölkə/bölgə bələdçisi (məs. İstanbul, Dubay, Tbilisi, Antalya, Bakı ətrafı gəzinti yerləri). Nə görməli, neçə gün kifayətdir, yerli nəqliyyat necədir, hansı məhəllələr maraqlıdır, yemək mədəniyyəti. Dəqiq qiymət/viza rəqəmləri YAZMA — bunlar tez köhnəlir.',
  },
  'Xəbərlər': {
    class: 'cat-n',
    guidance:
      'Turizm sənayesində ümumi, HƏMİŞƏ DOĞRU olan tendensiyalar və dəyişikliklər: rəqəmsal check-in, mövsümi tələb dəyişiklikləri, dayanıqlı/məsuliyyətli turizm, hava limanı prosesləri necə asanlaşır. KONKRET tarix, statistika və ya "bu gün elan edildi" tipli iddialar YAZMA (bunlar uydurma olardı) — ümumi trend təsviri ver.',
  },
  'Macəra': {
    class: 'cat-m',
    guidance:
      'Aktiv/macəra səyahəti: dağ trekkinqi, kempinq, su idmanları, solo macəra səyahəti, az tanınan təbiət istiqamətləri, ekstremal və ya qeyri-adi təcrübələr.',
  },
  'Vizasız Ölkələr': {
    class: 'cat-q',
    guidance:
      'Azərbaycan vətəndaşlarının vizasız və ya qapıda viza (viza on arrival) ilə gedə biləcəyi ölkələr: hansı ölkələr, nə qədər müddətə qalmaq olar, hansı sənədlər lazımdır (adətən yalnız pasport). Konkret gün sayı və şərtlər ölkədən ölkəyə dəyişə bilər deyə "adətən", "ümumi qayda olaraq" kimi ehtiyatlı ifadələr istifadə et, tarixlə bağlı iddialar YAZMA.',
  },
  'Tibbi Turizm': {
    class: 'cat-o',
    guidance:
      'Tibbi turizm: xaricdə müalicə/estetik prosedurlar üçün səyahət planlaması, hansı ölkələr məşhurdur (Türkiyə, Cənubi Koreya və s.), tibbi turizmdə nələrə diqqət etmək lazımdır, səyahət+müalicə əlaqələndirilməsi. Konkret klinika adı, qiymət və ya tibbi tövsiyə YAZMA — bu, həkim səlahiyyətidir, yalnız səyahət təşkilatı perspektivindən yaz.',
  },
};

// Least-used category first (ties broken deterministically by post count)
// so the four categories stay roughly balanced over time instead of
// drifting toward whichever one the model likes best.
function pickCategory(existing) {
  const counts = Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, 0]));
  for (const p of existing) {
    if (counts[p.category] !== undefined) counts[p.category]++;
  }
  const minCount = Math.min(...Object.values(counts));
  const candidates = Object.keys(CATEGORIES).filter((c) => counts[c] === minCount);
  return candidates[existing.length % candidates.length];
}

// Fallback only — used if the Pexels lookup below fails (no key, rate
// limit, no results) so a post never fails to publish for lack of a photo.
const COVER_IMAGES = [
  '/images/hero/aurora.jpg',
  '/images/hero/balloons.jpg',
  '/images/hero/plane-wing.jpg',
  '/images/hero/mosque.jpg',
];

// Topic photos: Gemini picks an English search phrase for the post's actual
// subject (Pexels' search doesn't work well in Azerbaijani), then this hits
// the free Pexels API for real matching photos — one cover + a couple
// inline. Needs a PEXELS_API_KEY repo secret (free at pexels.com/api).
async function fetchPexelsPhotos(query, count) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    console.error(`Pexels request failed: ${res.status} ${await res.text()}`);
    return [];
  }
  const data = await res.json();
  return (data.photos || []).map((p) => ({
    src: p.src.large2x,
    alt: p.alt || query,
    credit: p.photographer,
    creditUrl: p.url,
  }));
}

function slugify(title) {
  const map = { ə: 'e', ı: 'i', ğ: 'g', ş: 's', ç: 'c', ö: 'o', ü: 'u', Ə: 'e', İ: 'i', Ğ: 'g', Ş: 's', Ç: 'c', Ö: 'o', Ü: 'u' };
  return title
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function existingPosts() {
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(postsDir, f), 'utf-8')))
    .map((p) => ({ slug: p.slug, title: p.title, category: p.category }));
}

async function callModel(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        // A 1400-2000 word Azerbaijani article plus JSON structure
        // overhead runs well past 4096 tokens — that limit truncated the
        // response mid-string and broke JSON.parse downstream.
        // Generous headroom: some Gemini models spend part of this budget
        // on hidden internal reasoning before the visible output, on top
        // of the ~1400-2000 word article the prompt asks for.
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Model request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`No text in model response: ${JSON.stringify(data)}`);
  if (candidate.finishReason === 'MAX_TOKENS') {
    throw new Error(`Response truncated by maxOutputTokens (finishReason=MAX_TOKENS)`);
  }
  return text;
}

// Paths the model is allowed to link to from inside a post's body text (see
// the "Daxili linkləmə" prompt section below) — a fixed, real list rather
// than letting the model invent URLs, so every in-body link actually
// resolves to a real page.
const INTERNAL_LINK_PATHS = [
  '/search — aviabilet axtarışı',
  '/hotels — otel axtarışı və bron',
  '/tours — hazır tur paketləri (bütün kateqoriyalar)',
  '/tours?category=Türkiyə — Türkiyə turları',
  '/tours?category=Avropa — Avropa turları',
  '/tours?category=Ekzotik — ekzotik/uzaq turlar',
  '/tours?category=Qrup%20Turları — qrup turları',
  '/viza — viza xidməti (bütün ölkələr)',
  '/labpoint — Labpoint bonus proqramı',
  '/events — tədbir və konsert biletləri',
  '/about — Travellab haqqında',
];

function buildPrompt(existing, category) {
  const avoidList = existing.length
    ? `Bu mövzular artıq işlənib, onları TƏKRARLAMA:\n${existing.map((p) => `- ${p.title}`).join('\n')}`
    : '';

  return `Sən Travellab (Azərbaycanda fəaliyyət göstərən bir səyahət agentliyi) üçün SEO üzrə ekspert bloq yazıçısısan. Travellab PLATFORMA yox, SƏYAHƏT AGENTLİYİDİR — bunu ton və mətndə əks etdir. Məqsəd — Google-da yaxşı sıralanan, oxucuya real dəyər verən, DƏRİN və ƏTRAFLI bir bloq yazısı yazmaqdır. Səthi, ümumi cümlələrlə dolu qısa mətnlər yazma.

Azərbaycan dilində, TƏXMİNƏN 1400-2000 SÖZ uzunluğunda, konkret və dərin faydalı bir bloq yazısı yaz. Struktur TƏQRIBƏN belə olmalıdır (dəqiq bənd sayını özün seç, hər yazıda eyni qəlibi TƏKRARLAMA):
- Giriş abzası (mövzunu təqdim edir, oxucuya faydasını izah edir, əsas açar sözü ilk 1-2 cümlədə keçir)
- 6-10 alt başlıqlı (h2) bölmə (yazıdan yazıya say dəyişsin), hər biri 2-4 dolğun abzasdan ibarət, konkret nümunə/addım/tövsiyə ilə izah edilir
- Yekun bir bölmə — başlığını sən seç (hər dəfə "Nəticə" yazma, fərqli formalaşdır), qısa xülasə və oxucunu hərəkətə çağırış ilə

Yazı canlı və fərdi səslənsin, şablon kimi deyil: cümlə uzunluğunu dəyişdir, hər yazıda eyni keçid ifadələrini ("İlk növbədə", "Bundan əlavə" və s.) təkrarlama, mümkün olduqca Azərbaycan reallıqlarına bağla (AZN valyutası, Bakı Heydər Əliyev Beynəlxalq Hava Limanı (GYD), yerli mövsüm/iqlim, azərbaycanlı səyahətçinin perspektivi) — bu həm oxucuya daha faydalı olur, həm də yazını generic olmaqdan çıxarır.

Bu yazının kateqoriyası MÜTLƏQ **${category}**dir — mövzunu bu kateqoriyaya uyğun seç: ${CATEGORIES[category].guidance}

SEO tələbləri:
- Bir əsas açar söz ifadəsi seç (məsələn "ucuz bilet tapmaq", "ailəvi səyahət məsləhətləri") və onu başlıqda, girişdə, ən azı iki alt başlıqda və excerpt-də təbii şəkildə istifadə et.
- title 45-65 simvol arası, cəlbedici və açar sözlü olsun.
- excerpt 140-160 simvol arası, məqalənin başında oxucuya görünən, cəlbedici bir giriş cümləsi olsun.
- metaDescription 150-160 simvol arası — excerpt-dən FƏRQLİ formalaşdırılmış, açar sözü önə çıxaran, Google axtarış nəticəsində göstəriləcək qısa təsvir (oxucu üçün deyil, axtarış motoru üçün yazılır).
- Boş, ümumi cümlələr əvəzinə konkret nümunələr, siyahılar və praktiki addımlar istifadə et.
- Açar söz sıxlığı: əsas açar söz ifadən mətnin təxminən 1-2%-i qədər təkrarlansın (250-400 sözə 3-6 dəfə kimi düşün, bütün 1400-2000 sözlük mətn üzrə mütənasib artır) — süni yığılma hiss olunmasın, çoxu yerdə açar sözün özü yox, sinonim/əlaqəli ifadələr (LSI) işlət (məs. "Budapeşt səyahət bələdçisi" əvəzinə növbə ilə "Budapeştə səyahət", "Macarıstan səyahəti", "bu şəhərə səfər" kimi variasiyalar).

Daxili linkləmə (ZƏRURİDİR): body massivində olan p bloklarının mətni daxilində, təbii cümlə axını içində, 2-4 dəfə aşağıdakı siyahıdan konkret bir səhifəyə keçid ver. Format MÜTLƏQ markdown link sintaksisi olmalıdır: [açar söz mətni](/yol) — link mətni HƏMİŞƏ mövzuya uyğun açar söz olmalıdır, "buraya klikləyin" və ya "bu linkə bax" kimi ifadələr YOX. Yalnız aşağıdakı siyahıdakı yolları istifadə et, başqa URL uydurma:
${INTERNAL_LINK_PATHS.map((p) => `- ${p}`).join('\n')}
Nümunə cümlə: "Ən sərfəli qiymətləri tapmaq üçün [aviabilet axtarışı](/search) bölməsindən müqayisə edə bilərsiniz." Bu linklər yalnız "p" tipli bloklarda, mövzuya uyğun düşən yerdə olsun — hər paraqrafda yox, süni doldurma olmasın.

${avoidList}

Bundan əlavə, yazının mövzusuna uyğun stok fotoları tapmaq üçün 2-3 sadə İNGİLİSCƏ axtarış ifadəsi ver (məsələn mövzu "ucuz bilet tapmaq" olarsa: "airport departure board", "backpacker with suitcase", "budget flight booking laptop"). Hər ifadə konkret, vizual şəkildə təsvir edilə bilən bir səhnə olmalıdır — mövzunun ümumi adı yox (məs. "cheap flights" YOX, "airport check-in counter" BƏLİ). Hər axtarış ifadəsi üçün, sonda o foto faktiki əlavə olunarsa istifadə ediləcək bir Azərbaycan dilində alt-mətn də yaz (şəkildə nəyin göründüyünü real təsvir edən, SEO üçün faydalı qısa cümlə — "şəkil", "foto" kimi sözlər olmadan).

Cavabı YALNIZ aşağıdakı JSON formatında ver, başqa heç nə yazma (izah, markdown fence və ya əlavə mətn olmasın):

{
  "title": "45-65 simvol, açar sözlü, cəlbedici başlıq",
  "excerpt": "140-160 simvollu, cəlbedici giriş cümləsi",
  "metaDescription": "150-160 simvollu, açar söz önə çıxan axtarış motoru təsviri",
  "imageQueries": ["specific visual scene 1", "specific visual scene 2", "specific visual scene 3"],
  "imageAltTexts": ["1-ci foto üçün Azərbaycan dilində alt-mətn", "2-ci foto üçün", "3-cü foto üçün"],
  "body": [
    { "type": "p", "text": "..." },
    { "type": "h2", "text": "..." },
    { "type": "p", "text": "..." }
  ]
}`;
}

function extractJson(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`No JSON object found in model output:\n${raw}`);
  return JSON.parse(raw.slice(start, end + 1));
}

function validate(post) {
  if (!post.title || typeof post.title !== 'string') throw new Error('Missing/invalid title');
  if (!post.excerpt || typeof post.excerpt !== 'string') throw new Error('Missing/invalid excerpt');
  if (!Array.isArray(post.body) || post.body.length === 0) throw new Error('Missing/empty body');
  for (const block of post.body) {
    if (!['p', 'h2'].includes(block.type) || typeof block.text !== 'string' || !block.text.trim()) {
      throw new Error(`Invalid body block: ${JSON.stringify(block)}`);
    }
  }
  const wordCount = post.body
    .filter((b) => b.type === 'p')
    .reduce((sum, b) => sum + b.text.trim().split(/\s+/).length, 0);
  if (wordCount < 900) throw new Error(`Body too short: ${wordCount} words (expected ~1400-2000)`);
}

// Spreads inline photos evenly through the p/h2 blocks (e.g. 2 photos in a
// 12-block body land after block ~4 and ~8) so they break up the article
// instead of clustering at one spot.
function insertInlinePhotos(body, photos) {
  if (!photos.length) return body;
  const result = [...body];
  const step = Math.floor(result.length / (photos.length + 1));
  photos.forEach((photo, i) => {
    const insertAt = step * (i + 1) + i;
    result.splice(insertAt, 0, {
      type: 'img',
      src: photo.src,
      alt: photo.alt,
      credit: photo.credit,
      creditUrl: photo.creditUrl,
    });
  });
  return result;
}

// Gemini doesn't always hit the 1400-2000 word target the prompt asks for
// (seen as low as 717) — that's a model-compliance miss, not a real error,
// so it's worth a couple of retries before giving up and failing the whole
// workflow (which means no post at all gets published that day).
async function generatePost(existing, category, maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await callModel(buildPrompt(existing, category));
      const draft = extractJson(raw);
      validate(draft);
      return draft;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
    }
  }
  throw lastError;
}

async function main() {
  const existing = existingPosts();
  const category = pickCategory(existing);
  const draft = await generatePost(existing, category);

  let slug = slugify(draft.title);
  const existingSlugs = new Set(existing.map((p) => p.slug));
  if (existingSlugs.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date(today).getUTCDate();

  const queries = Array.isArray(draft.imageQueries) ? draft.imageQueries.slice(0, 3) : [];
  // Model-written AZ alt text per query index — not just zipped 1:1 with
  // `photos` below, since a query can return zero Pexels results and get
  // skipped, which would otherwise shift every alt text after it out of sync.
  const altTexts = Array.isArray(draft.imageAltTexts) ? draft.imageAltTexts : [];
  const photos = [];
  for (let i = 0; i < queries.length; i++) {
    const [photo] = await fetchPexelsPhotos(queries[i], 1);
    if (photo) photos.push({ ...photo, alt: altTexts[i] || photo.alt });
  }
  const [coverPhoto, ...inlinePhotos] = photos;

  const post = {
    slug,
    title: draft.title,
    excerpt: draft.excerpt,
    // Falls back to excerpt if the model omits this — a slightly-too-long
    // meta description beats none at all.
    metaDescription: draft.metaDescription || draft.excerpt,
    category,
    categoryClass: CATEGORIES[category].class,
    // Shown on the article so it doesn't read as anonymous/unattributed —
    // transparency about it being editorial-team content, not a disguise.
    author: 'Travellab Komandası',
    date: today,
    coverImage: coverPhoto?.src || COVER_IMAGES[dayIndex % COVER_IMAGES.length],
    coverCredit: coverPhoto ? { name: coverPhoto.credit, url: coverPhoto.creditUrl } : null,
    body: insertInlinePhotos(draft.body, inlinePhotos),
  };

  const outPath = path.join(postsDir, `${slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(post, null, 2) + '\n');
  console.log(`wrote ${path.relative(process.cwd(), outPath)}`);

  // Exposes the path to the workflow step that commits it.
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `post_path=${outPath}\npost_title=${post.title}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
