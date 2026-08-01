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

function buildPrompt(existing, category) {
  const avoidList = existing.length
    ? `Bu mövzular artıq işlənib, onları TƏKRARLAMA:\n${existing.map((p) => `- ${p.title}`).join('\n')}`
    : '';

  return `Sən Travellab (Azərbaycanda fəaliyyət göstərən bir səyahət/turizm platforması) üçün SEO üzrə ekspert bloq yazıçısısan. Məqsəd — Google-da yaxşı sıralanan, oxucuya real dəyər verən, DƏRİN və ƏTRAFLI bir bloq yazısı yazmaqdır. Səthi, ümumi cümlələrlə dolu qısa mətnlər yazma.

Azərbaycan dilində, TƏXMİNƏN 1400-2000 SÖZ uzunluğunda, konkret və dərin faydalı bir bloq yazısı yaz. Struktur TƏQRIBƏN belə olmalıdır (dəqiq bənd sayını özün seç, hər yazıda eyni qəlibi TƏKRARLAMA):
- Giriş abzası (mövzunu təqdim edir, oxucuya faydasını izah edir, əsas açar sözü ilk 1-2 cümlədə keçir)
- 6-10 alt başlıqlı (h2) bölmə (yazıdan yazıya say dəyişsin), hər biri 2-4 dolğun abzasdan ibarət, konkret nümunə/addım/tövsiyə ilə izah edilir
- Yekun bir bölmə — başlığını sən seç (hər dəfə "Nəticə" yazma, fərqli formalaşdır), qısa xülasə və oxucunu hərəkətə çağırış ilə

Yazı canlı və fərdi səslənsin, şablon kimi deyil: cümlə uzunluğunu dəyişdir, hər yazıda eyni keçid ifadələrini ("İlk növbədə", "Bundan əlavə" və s.) təkrarlama, mümkün olduqca Azərbaycan reallıqlarına bağla (AZN valyutası, Bakı Heydər Əliyev Beynəlxalq Hava Limanı (GYD), yerli mövsüm/iqlim, azərbaycanlı səyahətçinin perspektivi) — bu həm oxucuya daha faydalı olur, həm də yazını generic olmaqdan çıxarır.

Bu yazının kateqoriyası MÜTLƏQ **${category}**dir — mövzunu bu kateqoriyaya uyğun seç: ${CATEGORIES[category].guidance}

SEO tələbləri:
- Bir əsas açar söz ifadəsi seç (məsələn "ucuz bilet tapmaq", "ailəvi səyahət məsləhətləri") və onu başlıqda, girişdə, ən azı iki alt başlıqda və excerpt-də təbii şəkildə istifadə et.
- title 45-65 simvol arası, cəlbedici və açar sözlü olsun.
- excerpt 140-160 simvol arası, açar sözlü, Google axtarış nəticəsində göstəriləcək qədər cəlbedici olsun (bu sahə həm də meta description kimi istifadə olunur).
- Mətn daxilində münasib yerlərdə Travellab-ın xidmətlərinə (uçuş/otel axtarışı, turlar, LabPoint bal proqramı) 1-2 dəfə təbii keçid ver, amma reklam kimi səslənməsin.
- Boş, ümumi cümlələr əvəzinə konkret nümunələr, siyahılar və praktiki addımlar istifadə et.

${avoidList}

Bundan əlavə, yazının mövzusuna uyğun stok fotoları tapmaq üçün 2-3 sadə İNGİLİSCƏ axtarış ifadəsi ver (məsələn mövzu "ucuz bilet tapmaq" olarsa: "airport departure board", "backpacker with suitcase", "budget flight booking laptop"). Hər ifadə konkret, vizual şəkildə təsvir edilə bilən bir səhnə olmalıdır — mövzunun ümumi adı yox (məs. "cheap flights" YOX, "airport check-in counter" BƏLİ).

Cavabı YALNIZ aşağıdakı JSON formatında ver, başqa heç nə yazma (izah, markdown fence və ya əlavə mətn olmasın):

{
  "title": "45-65 simvol, açar sözlü, cəlbedici başlıq",
  "excerpt": "140-160 simvollu, açar sözlü, cəlbedici təsvir",
  "imageQueries": ["specific visual scene 1", "specific visual scene 2", "specific visual scene 3"],
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

async function main() {
  const existing = existingPosts();
  const category = pickCategory(existing);
  const raw = await callModel(buildPrompt(existing, category));
  const draft = extractJson(raw);
  validate(draft);

  let slug = slugify(draft.title);
  const existingSlugs = new Set(existing.map((p) => p.slug));
  if (existingSlugs.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date(today).getUTCDate();

  const queries = Array.isArray(draft.imageQueries) ? draft.imageQueries.slice(0, 3) : [];
  const photos = [];
  for (const query of queries) {
    const [photo] = await fetchPexelsPhotos(query, 1);
    if (photo) photos.push(photo);
  }
  const [coverPhoto, ...inlinePhotos] = photos;

  const post = {
    slug,
    title: draft.title,
    excerpt: draft.excerpt,
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
