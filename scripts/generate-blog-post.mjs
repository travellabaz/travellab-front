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
// .cat-n/.cat-m in global.css) — the model has to pick one of these exact
// Azerbaijani names, not invent a new category with no matching style.
const CATEGORIES = {
  'Məsləhətlər': 'cat-a',
  'Bələdçi': 'cat-t',
  'Xəbərlər': 'cat-n',
  'Macəra': 'cat-m',
};

// Rotate through our own already-licensed hero photos instead of hotlinking
// external images (no image API/budget, and no copyright risk).
const COVER_IMAGES = [
  '/images/hero/aurora.jpg',
  '/images/hero/balloons.jpg',
  '/images/hero/plane-wing.jpg',
  '/images/hero/mosque.jpg',
];

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

function existingSlugsAndTitles() {
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(postsDir, f), 'utf-8')))
    .map((p) => ({ slug: p.slug, title: p.title }));
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

function buildPrompt(existing) {
  const categoryList = Object.keys(CATEGORIES).join(', ');
  const avoidList = existing.length
    ? `Bu mövzular artıq işlənib, onları TƏKRARLAMA:\n${existing.map((p) => `- ${p.title}`).join('\n')}`
    : '';

  return `Sən Travellab (Azərbaycanda fəaliyyət göstərən bir səyahət/turizm platforması) üçün SEO üzrə ekspert bloq yazıçısısan. Məqsəd — Google-da yaxşı sıralanan, oxucuya real dəyər verən, DƏRİN və ƏTRAFLI bir bloq yazısı yazmaqdır. Səthi, ümumi cümlələrlə dolu qısa mətnlər yazma.

Azərbaycan dilində, səyahət və turizm mövzusunda, TƏXMİNƏN 1400-2000 SÖZ uzunluğunda, konkret və dərin faydalı bir bloq yazısı yaz. Struktur belə olmalıdır:
- Giriş abzası (mövzunu təqdim edir, oxucuya faydasını izah edir, əsas açar sözü ilk 1-2 cümlədə keçir)
- 7-10 alt başlıqlı (h2) bölmə, hər biri 2-4 dolğun abzasdan ibarət, konkret nümunə/addım/tövsiyə ilə izah edilir
- Yekun bölməsi ("Nəticə" və ya "Yekun olaraq" başlıqlı h2), qısa xülasə və oxucunu hərəkətə çağırış ilə

Mövzu nümunələri: büdcə səyahəti, konkret istiqamət bələdçisi, bagaj/sənəd məsləhətləri, mövsümi tövsiyələr, ailəvi səyahət, ucuz bilet tapmaq üsulları, uçuşda rahatlıq, otel seçimi, səyahət sığortası, solo səyahət, iş səyahəti və s. Faktiki səhv ehtimalı olan konkret rəqəm/qanun iddiaları (məsələn dəqiq vizasız ölkə siyahısı) YAZMA — ümumi, həmişə doğru olan, praktiki məsləhətlərə üstünlük ver.

SEO tələbləri:
- Bir əsas açar söz ifadəsi seç (məsələn "ucuz bilet tapmaq", "ailəvi səyahət məsləhətləri") və onu başlıqda, girişdə, ən azı iki alt başlıqda və excerpt-də təbii şəkildə istifadə et.
- title 45-65 simvol arası, cəlbedici və açar sözlü olsun.
- excerpt 140-160 simvol arası, açar sözlü, Google axtarış nəticəsində göstəriləcək qədər cəlbedici olsun (bu sahə həm də meta description kimi istifadə olunur).
- Mətn daxilində münasib yerlərdə Travellab-ın xidmətlərinə (uçuş/otel axtarışı, turlar, LabPoint bal proqramı) 1-2 dəfə təbii keçid ver, amma reklam kimi səslənməsin.
- Boş, ümumi cümlələr əvəzinə konkret nümunələr, siyahılar və praktiki addımlar istifadə et.

${avoidList}

Kateqoriya YALNIZ bunlardan biri olmalıdır: ${categoryList}.

Cavabı YALNIZ aşağıdakı JSON formatında ver, başqa heç nə yazma (izah, markdown fence və ya əlavə mətn olmasın):

{
  "title": "45-65 simvol, açar sözlü, cəlbedici başlıq",
  "category": "yuxarıdakı siyahıdan biri",
  "excerpt": "140-160 simvollu, açar sözlü, cəlbedici təsvir",
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
  if (!CATEGORIES[post.category]) throw new Error(`Unknown category: ${post.category}`);
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

async function main() {
  const existing = existingSlugsAndTitles();
  const raw = await callModel(buildPrompt(existing));
  const draft = extractJson(raw);
  validate(draft);

  let slug = slugify(draft.title);
  const existingSlugs = new Set(existing.map((p) => p.slug));
  if (existingSlugs.has(slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date(today).getUTCDate();

  const post = {
    slug,
    title: draft.title,
    excerpt: draft.excerpt,
    category: draft.category,
    categoryClass: CATEGORIES[draft.category],
    date: today,
    coverImage: COVER_IMAGES[dayIndex % COVER_IMAGES.length],
    body: draft.body,
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
